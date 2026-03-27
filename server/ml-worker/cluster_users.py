import os
import uuid
import networkx as nx
from community import community_louvain
from sqlalchemy import create_engine, text
import json

DB_URL = os.getenv("DATABASE_URL")
engine = create_engine(DB_URL)

def get_graph_hash():
    """
    Compute a hash of the current friendship graph to detect changes.
    Returns tuple (num_edges, hash) for quick delta detection.
    """
    with engine.connect() as conn:
        edge_count = conn.execute(text("""
            SELECT COUNT(*) as count FROM "Friendship" WHERE status = 'ACCEPTED'
        """)).fetchone()[0]
        
        # Get a hash of the sorted edge list
        edges_result = conn.execute(text("""
            SELECT "requesterId", "receiverId" 
            FROM "Friendship" 
            WHERE status = 'ACCEPTED'
            ORDER BY "requesterId", "receiverId"
        """)).fetchall()
        
        edges_str = json.dumps(edges_result)
        import hashlib
        graph_hash = hashlib.md5(edges_str.encode()).hexdigest()
        
    return edge_count, graph_hash

def should_recalculate_clusters():
    """
    Check if the graph has changed significantly since last clustering.
    Only recalculate if edge count changed by >5% or hash is different.
    """
    try:
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT "value" FROM "SystemMetadata" 
                WHERE "key" = 'last_graph_state'
            """)).fetchone()
            
        if not result:
            return True  # First time
            
        last_state = json.loads(result[0])
        current_edges, current_hash = get_graph_hash()
        last_edges = last_state.get('edge_count', 0)
        
        # Trigger recalculation if edges changed by >5% or hash differs
        change_percent = abs(current_edges - last_edges) / max(last_edges, 1)
        should_recalc = change_percent > 0.05 or current_hash != last_state.get('hash')
        
        if should_recalc:
            print(f"[Clustering] Graph changed: edges {last_edges}->{current_edges} ({change_percent*100:.1f}%), recalculating...")
        else:
            print(f"[Clustering] Minimal change ({change_percent*100:.1f}%), skipping recalculation")
            
        return should_recalc
    except Exception as e:
        print(f"[Clustering] Error checking state: {e}, forcing recalculation")
        return True

def save_graph_state(edge_count: int, graph_hash: str):
    """Save the current graph state for delta detection."""
    state = {
        'edge_count': edge_count,
        'hash': graph_hash,
        'timestamp': str(uuid.uuid4())
    }
    
    with engine.begin() as conn:
        conn.execute(text("""
            INSERT INTO "SystemMetadata" ("key", "value") 
            VALUES ('last_graph_state', :value)
            ON CONFLICT ("key") DO UPDATE SET "value" = :value
        """), {"value": json.dumps(state)})

def run_community_detection():
    """
    Run Louvain community detection algorithm.
    Includes INCREMENTAL LOGIC: only recalculate when graph changes by >5%.
    """
    print("Checking if community clustering needs recalculation...")
    
    # Skip clustering if changes are minimal
    if not should_recalculate_clusters():
        print("[Clustering] Skipping clustering (no significant changes)")
        return
    
    print("Fetching social graph from database...")
    
    # --- 1. Fetch the Data ---
    with engine.connect() as conn:
        # Fetch all accepted friendships (Edges)
        edges_result = conn.execute(text("""
            SELECT "requesterId", "receiverId" 
            FROM "Friendship" 
            WHERE status = 'ACCEPTED'
        """)).fetchall()
        
        # Fetch all users (Nodes) to ensure even users with 0 friends are handled
        users_result = conn.execute(text('SELECT id FROM "User"')).fetchall()

    if not edges_result:
        print("[Clustering] Graph is empty. Skipping clustering.")
        return

    # --- 2. Build the Mathematical Graph ---
    print(f"[Clustering] Building NetworkX graph with {len(users_result)} users and {len(edges_result)} edges...")
    G = nx.Graph()
    
    # Add nodes (Users)
    user_ids = [row[0] for row in users_result]
    G.add_nodes_from(user_ids)
    
    # Add edges (Friendships)
    G.add_edges_from([(row[0], row[1]) for row in edges_result])

    # --- 3. Run Louvain Algorithm ---
    print("[Clustering] Running Louvain partitioning...")
    # This returns a dictionary mapping { 'user_uuid': cluster_integer }
    # Example: { 'user-1': 0, 'user-2': 0, 'user-3': 1 }
    partition = community_louvain.best_partition(G)

    # Group users by their new cluster ID
    clusters = {}
    for user_id, cluster_id in partition.items():
        if cluster_id not in clusters:
            clusters[cluster_id] = []
        clusters[cluster_id].append(user_id)

    print(f"Detected {len(clusters)} distinct communities.")

    # --- 4. Update PostgreSQL ---
    print("Saving communities to the database...")
    with engine.begin() as conn:
        # Clear old communities (optional: you could also update them to track history)
        conn.execute(text('UPDATE "User" SET "communityId" = NULL'))
        conn.execute(text('DELETE FROM "Community"'))

        for cluster_id, members in clusters.items():
            # Create a new Community record
            community_uuid = str(uuid.uuid4())
            
            # Generate a placeholder name (e.g., "Cluster 0"). 
            # In a production AI app, you could pass the users' common interests to an LLM to name it!
            community_name = f"Cluster {cluster_id}" 
            
            conn.execute(
                text("""
                    INSERT INTO "Community" (id, "clusterId", name) 
                    VALUES (:id, :cluster_id, :name)
                """),
                {"id": community_uuid, "cluster_id": cluster_id, "name": community_name}
            )

            # Assign the users to this community
            conn.execute(
                text("""
                    UPDATE "User" 
                    SET "communityId" = :community_id 
                    WHERE id = ANY(:user_ids)
                """),
                {"community_id": community_uuid, "user_ids": members}
            )

    # Save the current graph state for incremental clustering
    edge_count, graph_hash = get_graph_hash()
    save_graph_state(edge_count, graph_hash)
    
    print(f"[Clustering] Community detection completed successfully! Detected {len(clusters)} communities")

if __name__ == "__main__":
    run_community_detection()