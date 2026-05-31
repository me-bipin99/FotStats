from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import logging

from utils.model_loader import get_comparator

logger = logging.getLogger(__name__)
router = APIRouter()

class PlayerRequest(BaseModel):
    name: str
    position: str
    goals: int = 0
    assists: int = 0
    minutes: int = 0
    caps: int = 0
    yellowCards: int = 0
    redCards: int = 0

@router.post("/estimate-stats")
async def estimate_stats(request: PlayerRequest) -> Dict[str, Any]:
    """
    Estimate missing player statistics using KNN Algorithm #1
    Finds similar European players and estimates xG, xA, and other stats
    """
    try:
        # Get trained KNN comparator
        comparator = get_comparator()

        # Build player dict for KNN
        player_dict = {
            "Player Name": request.name,
            "Position": request.position,
            "Goals": request.goals,
            "Ast": request.assists,
            "Min": request.minutes,
            "Caps": request.caps,
            "CrdY": request.yellowCards,
            "CrdR": request.redCards,
        }

        # Find similar European players
        similar_players, estimated_stats = comparator.find_similar_players(player_dict)

        # Calculate xG and xA from estimated stats
        shots = estimated_stats.get("Sh", 1)
        g_per_sh = estimated_stats.get("G/Sh", 0.1)
        xG = g_per_sh * shots
        xA = estimated_stats.get("Ast", 0)

        # Format response
        return {
            "status": "success",
            "xG": round(xG, 2),
            "xA": round(xA, 2),
            "similar_players": [
                {
                    "name": p.get("Player", "Unknown"),
                    "position": p.get("Pos", "MF"),
                    "goals": int(p.get("Gls", 0) or 0),
                    "assists": int(p.get("Ast", 0) or 0),
                    "minutes": int(p.get("Min", 0) or 0),
                }
                for p in similar_players[:5]  # Top 5
            ],
            "estimated_stats": {
                "shots": int(estimated_stats.get("Sh", 0) or 0),
                "shotsOnTarget": int(estimated_stats.get("SoT", 0) or 0),
                "shotAccuracy": round(estimated_stats.get("SoT%", 0) or 0, 2),
                "goalsPerShot": round(estimated_stats.get("G/Sh", 0) or 0, 2),
            }
        }
    except Exception as e:
        logger.error(f"Error in estimate-stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
