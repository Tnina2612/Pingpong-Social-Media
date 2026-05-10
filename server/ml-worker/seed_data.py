import os
import sys
import csv
import json
import uuid
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("SQLALCHEMY_DB_URL", "postgresql://user:password@localhost:5432/db")

# Paths
SEED_DATA_DIR = Path(__file__).parent.parent / "seed-data"
USER_CSV = SEED_DATA_DIR / "public-User-selection.csv"

# Initialize database engine
engine = create_engine(DATABASE_URL, echo=False)


def seed_users(csv_path):
    """
    Seed User table from CSV file.
    
    Expected CSV columns: id, avatar, bio, communityId, createdAt, email, 
    isActivated, lastSeen, password, refreshToken, role, selectedCategories, 
    updatedAt, username
    """
    print(f"Starting user seeding from {csv_path}...")
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return 0
    
    user_count = 0
    error_count = 0
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                try:
                    # Parse selectedCategories JSON array if present
                    selected_categories = []
                    if row.get('selectedCategories'):
                        try:
                            selected_categories = json.loads(row['selectedCategories'].replace("'", '"'))
                        except json.JSONDecodeError:
                            selected_categories = []
                    
                    # Prepare the insert query
                    query = text("""
                        INSERT INTO "User" 
                        (id, avatar, bio, "communityId", "createdAt", email, 
                         "isActivated", "lastSeen", password, "refreshToken", role, 
                         "selectedCategories", "updatedAt", username)
                        VALUES 
                        (:id, :avatar, :bio, :community_id, :created_at, :email, 
                         :is_activated, :last_seen, :password, :refresh_token, :role, 
                         :selected_categories, :updated_at, :username)
                        ON CONFLICT (id) DO NOTHING
                    """)
                    
                    with engine.connect() as conn:
                        conn.execute(query, {
                            'id': row['id'],
                            'avatar': row.get('avatar') or None,
                            'bio': row.get('bio') or None,
                            'community_id': row.get('communityId') or None,
                            'created_at': row['createdAt'],
                            'email': row['email'],
                            'is_activated': row.get('isActivated', 'true').lower() == 'true',
                            'last_seen': row.get('lastSeen', row['createdAt']),
                            'password': row['password'],
                            'refresh_token': row.get('refreshToken') or None,
                            'role': row.get('role', 'USER'),
                            'selected_categories': selected_categories,
                            'updated_at': row.get('updatedAt', row['createdAt']),
                            'username': row['username'],
                        })
                        conn.commit()
                    
                    user_count += 1
                    if user_count % 50 == 0:
                        print(f"  Inserted {user_count} users...")
                
                except (IntegrityError, SQLAlchemyError) as e:
                    error_count += 1
                    if error_count <= 5:  # Only print first 5 errors to avoid spam
                        print(f"  Error inserting user {row.get('id', 'unknown')}: {str(e)[:100]}")
                except Exception as e:
                    error_count += 1
                    if error_count <= 5:
                        print(f"  Unexpected error with user {row.get('id', 'unknown')}: {str(e)[:100]}")
    
    except Exception as e:
        print(f"Error reading CSV file: {e}")
        return 0
    
    print(f"User seeding completed: {user_count} inserted, {error_count} errors\n")
    return user_count


def seed_posts_from_file(csv_path):
    """
    Seed Post table from a single CSV file.
    
    Expected CSV columns: id, authorId, content, createdAt, 
    moderationReason, status, updatedAt
    """
    post_count = 0
    error_count = 0
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                try:
                    # Prepare the insert query
                    query = text("""
                        INSERT INTO "Post" 
                        (id, "authorId", content, "createdAt", 
                         "moderationReason", status, "updatedAt")
                        VALUES 
                        (:id, :author_id, :content, :created_at, 
                         :moderation_reason, :status, :updated_at)
                        ON CONFLICT (id) DO NOTHING
                    """)
                    
                    with engine.connect() as conn:
                        conn.execute(query, {
                            'id': row['id'],
                            'author_id': row['authorId'],
                            'content': row['content'],
                            'created_at': row['createdAt'],
                            'moderation_reason': row.get('moderationReason') or None,
                            'status': row.get('status', 'PENDING'),
                            'updated_at': row.get('updatedAt', row['createdAt']),
                        })
                        conn.commit()
                    
                    post_count += 1
                    if post_count % 100 == 0:
                        print(f"    {post_count} posts processed from {csv_path.name}...")
                
                except (IntegrityError, SQLAlchemyError) as e:
                    error_count += 1
                    if error_count <= 5:  # Only print first 5 errors to avoid spam
                        print(f"    Error inserting post {row.get('id', 'unknown')}: {str(e)[:100]}")
                except Exception as e:
                    error_count += 1
                    if error_count <= 5:
                        print(f"    Unexpected error with post {row.get('id', 'unknown')}: {str(e)[:100]}")
    
    except Exception as e:
        print(f"  Error reading CSV file {csv_path.name}: {e}")
        return 0
    
    return post_count, error_count


def seed_posts(seed_data_dir):
    """
    Seed Post table from all post CSV files in the seed-data directory.
    Processes: public-Post-selection.csv and public-Post-selection (1-4).csv
    """
    print(f"Starting post seeding from {seed_data_dir}...")
    
    total_posts = 0
    total_errors = 0
    
    # Define the order of post CSV files
    post_files = [
        "public-Post-selection.csv",
        "public-Post-selection (1).csv",
        "public-Post-selection (2).csv",
        "public-Post-selection (3).csv",
        "public-Post-selection (4).csv",
    ]
    
    for filename in post_files:
        csv_path = seed_data_dir / filename
        if csv_path.exists():
            print(f"  Processing {filename}...")
            count, errors = seed_posts_from_file(csv_path)
            total_posts += count
            total_errors += errors
            print(f"  Completed {filename}: {count} posts inserted")
        else:
            print(f"  ⚠ Skipping {filename} (not found)")
    
    print(f"Post seeding completed: {total_posts} inserted, {total_errors} errors\n")
    return total_posts


def main():
    """Main seeding function."""
    print("=" * 60)
    print("Starting database seeding process...")
    print("=" * 60)
    print(f"Database URL: {DATABASE_URL.replace(DATABASE_URL.split('@')[0].split('://')[1], '***')}")
    print(f"Seed data directory: {SEED_DATA_DIR}\n")
    
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✓ Database connection successful\n")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("Make sure DATABASE_URL is set correctly in .env file")
        return
    
    total_users = 0
    total_posts = 0
    
    # Seed users
    if USER_CSV.exists():
        total_users = seed_users(USER_CSV)
    else:
        print(f"⚠ User CSV file not found at {USER_CSV}\n")
    
    # Seed posts from all post CSV files
    total_posts = seed_posts(SEED_DATA_DIR)
    
    print("=" * 60)
    print("Seeding process completed!")
    print(f"Total users inserted: {total_users}")
    print(f"Total posts inserted: {total_posts}")
    print("=" * 60)


if __name__ == "__main__":
    main()
