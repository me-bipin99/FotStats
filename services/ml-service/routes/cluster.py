from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import logging

from utils.model_loader import get_clusterer

logger = logging.getLogger(__name__)
router = APIRouter()

# Cluster to role mapping
CLUSTER_LABELS = {
    0: "Elite Forward",
    1: "Defensive Midfielder",
    2: "Creative Winger",
    3: "Solid Defender",
    4: "Box-to-Box Midfielder",
    5: "Goalkeeper"
}

class PlayerStats(BaseModel):
    playerId: str
    name: str
    goals: int = 0
    assists: int = 0
    minutes: int = 0
    yellowCards: int = 0
    redCards: int = 0

class ClusterRequest(BaseModel):
    players: List[PlayerStats]

@router.post("/cluster-players")
async def cluster_players(request: ClusterRequest) -> Dict[str, Any]:
    """
    Classify players into roles using K-Means Algorithm #2
    """
    try:
        clusterer = get_clusterer()

        # Build feature vectors
        feature_vecs = []
        player_map = {}
        for i, player in enumerate(request.players):
            feature_vec = [
                float(player.goals),
                float(player.assists),
                float(player.minutes),
                float(player.yellowCards),
                float(player.redCards),
                float(player.minutes) / 90 if player.minutes > 0 else 0,  # defensive actions proxy
                0,  # ball recoveries (not available)
            ]
            feature_vecs.append(feature_vec)
            player_map[i] = player

        # Predict clusters
        clusters_list = clusterer.predict_multiple(feature_vecs)

        # Group players by cluster
        clusters = {}
        synergy_pairs = []
        for i, cluster_id in enumerate(clusters_list):
            cluster_id = int(cluster_id)
            if cluster_id not in clusters:
                clusters[cluster_id] = []
            player = player_map[i]
            clusters[cluster_id].append(player.name)

            # Find synergy pairs (same cluster)
            for j in range(i + 1, len(clusters_list)):
                if clusters_list[j] == cluster_id:
                    synergy_pairs.append([player.name, player_map[j].name])

        return {
            "status": "success",
            "clusters": {
                str(k): {
                    "role": CLUSTER_LABELS.get(k, "Midfielder"),
                    "players": v,
                    "count": len(v)
                }
                for k, v in sorted(clusters.items())
            },
            "synergy_pairs": synergy_pairs,
            "cluster_labels": CLUSTER_LABELS
        }
    except Exception as e:
        logger.error(f"Error in cluster-players: {e}")
        raise HTTPException(status_code=500, detail=str(e))
