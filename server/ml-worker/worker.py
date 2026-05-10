import os
import json
import uuid
import urllib.request
from redis import Redis
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from PIL import Image
import numpy as np
from cluster_users import run_community_detection

STREAM_NAME = "ml-stream"
GROUP_NAME = "ml-workers"
CONSUMER_NAME = f"worker-{uuid.uuid4()}"

# Define possible feed categories
CATEGORIES = ["Technology", "Sports", "Music", "Movies", "Gaming", "News", "Programming",
              "Food", "Fashion and beauty", "Business and finance", "Arts and culture",
              "Animal", "Funny", "Science", "Nature", "Politics", "Anime and manga"]

# 1. Initialize Models (Lazy-loaded on first use to save memory)
print("Loading ML Models...")
print("Loading Trust & Safety Models...")

# These are smaller and loaded immediately
toxicity_classifier = None
vision_classifier = None
embedding_model = None
content_classifier = None

def get_toxicity_classifier():
    global toxicity_classifier
    if toxicity_classifier is None:
        print("[Model] Loading toxicity classifier...")
        from transformers import pipeline
        toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert")
    return toxicity_classifier

def get_vision_classifier():
    global vision_classifier
    if vision_classifier is None:
        print("[Model] Loading vision classifier...")
        from transformers import pipeline
        vision_classifier = pipeline("image-classification", model="Falconsai/nsfw_image_detection")
    return vision_classifier

def get_embedding_model():
    global embedding_model
    if embedding_model is None:
        print("[Model] Loading embedding model...")
        from sentence_transformers import SentenceTransformer
        embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    return embedding_model

def get_content_classifier():
    global content_classifier
    if content_classifier is None:
        print("[Model] Loading content classifier (lightweight)...")
        from transformers import pipeline
        # Use a smaller, faster zero-shot model instead of bart-large-mnli
        # facebook/bart-large-mnli is 1.6GB, but we can use a smaller distilled version
        try:
            content_classifier = pipeline(
                "zero-shot-classification",
                model="cross-encoder/nli-distilroberta-base",
                device=-1  # CPU only, no GPU
            )
        except Exception as e:
            print(f"[Warning] Could not load distilroberta, falling back to simpler approach: {e}")
            # Fallback: just use labels directly without ML classification
            content_classifier = None
    return content_classifier

# 2. Database & Redis Connections (initialized in main)
engine = None
redis_conn = None

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
        tox_classifier = get_toxicity_classifier()
        tox_res = tox_classifier(content)[0]
        # 'toxic-bert' returns labels like 'toxic', 'severe_toxic', 'obscene', etc.
        if tox_res['score'] > 0.85 and tox_res['label'] != 'non-toxic':
            status = "REJECTED"
            reason = f"Flagged for {tox_res['label']} language."

    # 2. Image NSFW Check
    if status == "PUBLISHED" and image_urls:
        vision_clf = get_vision_classifier()
        for url in image_urls:
            try:
                # Download image temporarily into RAM
                urllib.request.urlretrieve(url, "temp.jpg")
                img = Image.open("temp.jpg")
                vision_res = vision_clf(img)
                
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
        emb_model = get_embedding_model()
        vector = emb_model.encode(content).tolist()
        
        # Zero-Shot Classification
        # The model guesses which categories fit best and ranks them
        classifier = get_content_classifier()
        if classifier:
            classification = classifier(content, CATEGORIES)
            
            # Get ALL categories with confidence above threshold (not just top 1)
            # This allows posts to be tagged with multiple relevant categories
            CATEGORY_CONFIDENCE_THRESHOLD = 0.5
            assigned_categories = []
            
            for category, score in zip(classification['labels'], classification['scores']):
                if score >= CATEGORY_CONFIDENCE_THRESHOLD:
                    assigned_categories.append((category, score))
            
            # Sort by confidence descending for logging
            assigned_categories.sort(key=lambda x: x[1], reverse=True)
        else:
            print("[Warning] Content classifier unavailable, skipping categorization")
            assigned_categories = []

        # 1. Update the Post's vector
        conn.execute(
            text("""
                UPDATE "Post" 
                SET status = 'PUBLISHED', "contentVector" = CAST(:vector AS vector) 
                WHERE id = :post_id
            """),
            {"vector": json.dumps(vector), "post_id": post_id}
        )
        
        # 2. If categorized, link post to all matching categories
        if assigned_categories:
            category_links = []
            category_log = []
            
            for category_name, confidence in assigned_categories:
                # Get or create category by name
                category_result = conn.execute(
                    text('SELECT id FROM "Category" WHERE name = :name'),
                    {"name": category_name},
                ).fetchone()
                
                if category_result:
                    category_id = str(category_result[0])
                else:
                    # Create new category if it doesn't exist
                    category_id = str(uuid.uuid4())
                    conn.execute(
                        text('INSERT INTO "Category" (id, name) VALUES (:id, :name)'),
                        {"id": category_id, "name": category_name},
                    )
                    print(f"[Category] Created new category: {category_name} ({category_id[:8]}...)")
                
                # Track link to insert
                category_links.append({"A": category_id, "B": post_id})
                category_log.append(f"{category_name} ({confidence:.2f})")
            
            # Bulk insert all category links for this post
            if category_links:
                conn.execute(
                    text("""
                        INSERT INTO "_CategoryToPost" ("A", "B")
                        VALUES (:A, :B)
                        ON CONFLICT DO NOTHING
                    """),
                    category_links,
                )
            
            print(f"[Category] Post {post_id} tagged as: {', '.join(category_log)}")

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
    emb_model = get_embedding_model()
    vector = emb_model.encode(interest_text).tolist()
    
    # Save it to the User's record
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE "User" 
                SET "interestVector" = CAST(:vector AS vector)
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
                SET "interestVector" = CAST(:vector AS vector) 
                WHERE id = :user_id
            """),
            {"vector": json.dumps(new_user_vec.tolist()), "user_id": user_id}
        )
        
    print(f"User {user_id} vector successfully updated.")

def ensure_consumer_group():
    try:
        redis_conn.xgroup_create(STREAM_NAME, GROUP_NAME, id="0", mkstream=True)
        print(f"[Redis] Consumer group '{GROUP_NAME}' created")
    except Exception as e:
        if "BUSYGROUP" in str(e):
            print(f"[Redis] Consumer group already exists")
        else:
            print(f"[ERROR] Failed to create consumer group: {e}")
            raise

def handle_event(event_type, data):
    if event_type == "INIT_USER_VECTOR":
        initialize_user_vector(
            user_id=data["userId"],
            selected_topics=data["topics"]
        )
    elif event_type == "PROCESS_NEW_POST":
        process_new_post(
            post_id=data["postId"],
            content=data["content"],
            image_urls=data.get("imageUrls", [])
        )
    elif event_type == "UPDATE_USER_VECTOR":
        update_user_vector(
            user_id=data["userId"],
            post_id=data["postId"],
            interaction_weight=data["weight"]
        )
    elif event_type == "TRIGGER_COMMUNITY_CLUSTERING":
        run_community_detection()
        print("[Event] Community clustering triggered (placeholder)")
    else:
        print(f"[Warning] Unknown event type: {event_type}")

def start_stream_worker():
    print(f"[Worker] Starting Redis Stream consumer: {CONSUMER_NAME}")

    while True:
        try:
            messages = redis_conn.xreadgroup(
                groupname=GROUP_NAME,
                consumername=CONSUMER_NAME,
                streams={STREAM_NAME: ">"},
                count=10,
                block=5000  # 5 seconds
            )

            for stream, msgs in messages:
                for msg_id, fields in msgs:
                    try:
                        # With decode_responses=True, keys and values are already strings
                        event_type = fields["type"]
                        data = json.loads(fields["data"])

                        print(f"[Event] {event_type} received")

                        handle_event(event_type, data)

                        # Acknowledge message
                        redis_conn.xack(STREAM_NAME, GROUP_NAME, msg_id)

                    except Exception as e:
                        print(f"[Error] Failed processing message {msg_id}: {e}")

        except Exception as e:
            print(f"[Redis Error] {e}")

# 3. Start the Worker loop
if __name__ == '__main__':
    print("Starting ML Worker (Redis Streams)...")
    
    try:
        print("[Init] Loading environment variables...")
        load_dotenv(dotenv_path="../.env")
        
        db_url = os.getenv("SQLALCHEMY_DB_URL")
        if not db_url:
            print("[ERROR] SQLALCHEMY_DB_URL not set in .env file")
            exit(1)

        print("[Init] Connecting to PostgreSQL database...")
        engine = create_engine(db_url)
        print("[Init] Database engine created successfully")
        
        print("[Init] Connecting to Redis...")
        redis_conn = Redis(host='localhost', port=6379, decode_responses=True)
        redis_conn.ping()
        print("[Init] Redis connection successful")
        
        ensure_consumer_group()
        start_stream_worker()
    except KeyboardInterrupt:
        print("\n[Worker] Shutting down gracefully...")
    except Exception as e:
        print(f"[FATAL ERROR] {e}")
        import traceback
        traceback.print_exc()
        exit(1)
