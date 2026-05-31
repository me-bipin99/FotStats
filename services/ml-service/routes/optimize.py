from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import logging

from utils.model_loader import get_optimizer

logger = logging.getLogger(__name__)
router = APIRouter()

class PlayerData(BaseModel):
    playerId: str
    name: str
    position: str
    eloRating: float = 1500
    goals: int = 0
    assists: int = 0
    minutes: int = 0

class OptimizationRequest(BaseModel):
    players: List[PlayerData]
    formation: str = "4-3-3"

@router.post("/optimize-squad")
async def optimize_squad(request: OptimizationRequest) -> Dict[str, Any]:
    """
    Generate optimal squad using Genetic Algorithm (Algorithm #5)
    """
    try:
        optimizer = get_optimizer()

        # Convert Pydantic models to dicts
        players = [p.dict() for p in request.players]

        # Add rating field for fitness calculation (use ELO as proxy)
        for player in players:
            player["rating"] = player.get("eloRating", 7.0) / 250  # Scale to 0-10

        # Optimize squad using genetic algorithm
        result = optimizer.optimize(players)

        # Format response
        best_xi = result.get("bestXI", [])
        composition = result.get("composition", {})

        return {
            "status": "success",
            "bestXI": [
                {
                    "name": p.get("name", "Unknown"),
                    "position": p.get("position", "MID"),
                    "playerId": p.get("playerId", ""),
                    "eloRating": p.get("eloRating", 1500),
                }
                for p in best_xi
            ],
            "formation": request.formation,
            "fitness_score": result.get("fitness_score", 0),
            "composition": composition,
        }
    except Exception as e:
        logger.error(f"Error in optimize-squad: {e}")
        raise HTTPException(status_code=500, detail=str(e))
