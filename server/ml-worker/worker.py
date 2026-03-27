import os
import json
import uuid
import urllib.request
from redis import Redis
from rq import Worker, Queue, Connection
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from PIL import Image
import numpy as np

# 1. Initialize Models (Load into RAM once on startup)
print("Loading ML Models...")
print("Loading Trust & Safety Models...")
# Highly optimized toxic comment classifier
toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert")
# Image NSFW classifier
vision_classifier = pipeline("image-classification", model="Falconsai/nsfw_image_detection")
# all-MiniLM-L6-v2 is extremely fast and generates 384-dimensional vectors
embedding_model = SentenceTransformer('all-MiniLM-L6-v2') 
# Zero-shot classifier for automatic categorization
content_classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

# Define possible feed categories
CATEGORIES = ["Technology", "Sports", "Music", "Movies", "Gaming", "News", "Programming",
              "Food", "Fashion and beauty", "Business and finance", "Arts and culture",
              "Animal", "Funny", "Science", "Nature", "Politics", "Anime and manga"]

# 2. Database & Redis Connections
DB_URL = os.getenv("DATABASE_URL")
engine = create_engine(DB_URL)
redis_conn = Redis(host='localhost', port=6379)

def process_new_post(post_id: str, content: str, image_urls: list):
    """
    This function is executed by the RQ worker every time NestJS pushes a job.
    It analyzes the post for safety. If safe, generates vectors and categorizes.
    """
    print(f"Processing Post: {post_id}")

    status = "PUBLISHED"
    reason = None

    # 1. Text Toxicity Check
    if content:
        tox_res = toxicity_classifier(content)[0]
        # 'toxic-bert' returns labels like 'toxic', 'severe_toxic', 'obscene', etc.
        if tox_res['score'] > 0.85 and tox_res['label'] != 'non-toxic':
            status = "REJECTED"
            reason = f"Flagged for {tox_res['label']} language."

    # 2. Image NSFW Check
    if status == "PUBLISHED" and image_urls:
        for url in image_urls:
            try:
                # Download image temporarily into RAM
                urllib.request.urlretrieve(url, "temp.jpg")
                img = Image.open("temp.jpg")
                vision_res = vision_classifier(img)
                
                # Check the top prediction
                if vision_res[0]['label'] == 'nsfw' and vision_res[0]['score'] > 0.80:
                    status = "REJECTED"
                    reason = "Flagged for explicit imagery."
                    break
            except Exception as e:
                print(f"Image moderation failed: {e}")


    # 3. Update PostgreSQL
    # We use raw SQL here to easily handle the pgvector syntax
    with engine.begin() as conn:
        if status == "REJECTED":
            conn.execute(
                text("""
                    UPDATE "Post"
                    SET status = 'REJECTED', "moderationReason" = :reason
                    WHERE id = :post_id
                """),
                {"reason": reason, "post_id": post_id}
            )
            print(f"Post {post_id} REJECTED: {reason}")
            return # Stop processing. Do not vectorize or push to feeds!
        
        # Generate the Embedding Vector
        # Converts the text into an array of 384 floating-point numbers
        vector = embedding_model.encode(content).tolist()
        
        # Zero-Shot Classification
        # The model guesses which category fits best
        classification = content_classifier(content, CATEGORIES)
        top_category = classification['labels'][0]
        confidence = classification['scores'][0]
        
        # Only assign a category if the model is confident
        assigned_category = top_category if confidence > 0.6 else None

        # 1. Update the Post's vector
        conn.execute(
            text("""
                UPDATE "Post" 
                SET status = 'PUBLISHED', "contentVector" = :vector::vector 
                WHERE id = :post_id
            """),
            {"vector": json.dumps(vector), "post_id": post_id}
        )
        
        # 2. If categorized, link it to the Category table
        if assigned_category:
            # Get or create category by name
            category_result = conn.execute(
                text('SELECT id FROM "Category" WHERE name = :name'),
                {"name": assigned_category},
            ).fetchone()
            
            if category_result:
                category_id = str(category_result[0])
            else:
                # Create new category if it doesn't exist
                category_id = str(uuid.uuid4())
                conn.execute(
                    text('INSERT INTO "Category" (id, name) VALUES (:id, :name)'),
                    {"id": category_id, "name": assigned_category},
                )
                print(f"[Category] Created new category: {assigned_category} ({category_id[:8]}...)")
            
            # Link post to category via join table
            # "_CategoryToPost" has: "A" = categoryId, "B" = postId
            conn.execute(
                text("""
                    INSERT INTO "_CategoryToPost" ("A", "B")
                    VALUES (:A, :B)
                    ON CONFLICT DO NOTHING
                """),
                {"A": category_id, "B": post_id},
            )
            
            print(f"[Category] Post {post_id} tagged as {assigned_category} ({confidence:.2f})")

    print(f"Successfully processed and vectorized post {post_id}")

def initialize_user_vector(user_id: str, selected_topics: list):
    """
    Called when a user finishes onboarding and selects categories.
    """
    print(f"Initializing vector for user {user_id} with topics: {selected_topics}")
    
    # Combine topics into a descriptive sentence. 
    # Example: "User is interested in: Technology, Gaming, Music."
    interest_text = f"User is interested in: {', '.join(selected_topics)}."
    
    # Convert this text into a 384-dimensional mathematical vector
    vector = embedding_model.encode(interest_text).tolist()
    
    # Save it to the User's record
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE "User" 
                SET "interestVector" = :vector::vector 
                WHERE id = :user_id
            """),
            {"vector": json.dumps(vector), "user_id": user_id}
        )
    print(f"User {user_id} interest vector initialized successfully.")

def update_user_vector(user_id: str, post_id: str, interaction_weight: float):
    """
    Shifts the User's Interest Vector towards the Post's Vector based on interaction weight.
    
    Includes TEMPORAL DECAY: recent interactions influence the profile 5x more than
    month-old interactions. This prevents stale preferences from dominating modern taste.
    """
    print(f"Updating vector for User {user_id} based on Post {post_id} (Weight: {interaction_weight})")

    with engine.begin() as conn:
        # 1. Fetch both vectors and interaction timestamp
        result = conn.execute(
            text("""
                SELECT 
                    (SELECT "interestVector"::text FROM "User" WHERE id = :user_id),
                    (SELECT "contentVector"::text FROM "Post" WHERE id = :post_id),
                    (SELECT "createdAt" FROM "Post" WHERE id = :post_id),
                    NOW()
            """),
            {"user_id": user_id, "post_id": post_id}
        ).fetchone()

        user_vec_str, post_vec_str, post_created_at, now = result

        if not post_vec_str:
            print(f"[Vector] Post {post_id} hasn't been vectorized yet")
            return

        post_vec = np.array(json.loads(post_vec_str))
        
        # 2. Calculate temporal decay factor
        # Posts older than 30 days have minimal influence (e^(-1) ≈ 0.37)
        # Posts from today have full influence (e^0 = 1)
        days_old = (now - post_created_at).days
        temporal_decay = np.exp(-days_old / 30.0)  # Half-life of ~20 days
        
        # Apply decay to the interaction weight (5x boost to recent interactions)
        decayed_weight = interaction_weight * temporal_decay
        print(f"[Vector] Days old: {days_old}, Decay factor: {temporal_decay:.3f}, Decayed weight: {decayed_weight:.3f}")
        
        # If the user has no vector yet, initialize it directly to the post's vector
        if not user_vec_str:
            new_user_vec = post_vec
        else:
            user_vec = np.array(json.loads(user_vec_str))
            
            # --- THE ALGORITHM ---
            # Learning Rate controls how fast tastes change. 
            # 0.05 means a single interaction shifts their profile by max 5%.
            LEARNING_RATE = 0.05 
            
            # Calculate the movement with temporal decay applied
            movement = LEARNING_RATE * decayed_weight
            
            # Shift the vector: UserVec = UserVec + movement * (PostVec - UserVec)
            new_user_vec = user_vec + movement * (post_vec - user_vec)
            
            # Normalize the vector back to a length of 1 (required for cosine similarity)
            new_user_vec = new_user_vec / np.linalg.norm(new_user_vec)

        # 3. Save the new vector back to the database
        conn.execute(
            text("""
                UPDATE "User" 
                SET "interestVector" = :vector::vector 
                WHERE id = :user_id
            """),
            {"vector": json.dumps(new_user_vec.tolist()), "user_id": user_id}
        )
        
    print(f"User {user_id} vector successfully updated.")

# 3. Start the Worker loop
if __name__ == '__main__':
    print("Starting ML Worker...")
    with Connection(redis_conn):
        worker = Worker([Queue('post_processing')])
        worker.work()