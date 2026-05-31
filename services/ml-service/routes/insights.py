from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from services.insights_engine import InsightsEngine

logger = logging.getLogger(__name__)
router = APIRouter()

class PlayerData(BaseModel):
    name: str
    goals: int = 0
    assists: int = 0
    minutes: int = 0
    eloRating: float = 1500
    caps: int = 0
    yellowCards: int = 0
    redCards: int = 0

class InsightRequest(BaseModel):
    player: PlayerData

class MatchNarrativeRequest(BaseModel):
    prediction: Dict[str, float]
    homeTeam: Dict[str, Any]
    awayTeam: Dict[str, Any]

@router.post("/generate-insights")
async def generate_insights(request: InsightRequest) -> Dict[str, Any]:
    """
    Generate rule-based insights for a player (Insights Engine)
    """
    try:
        engine = InsightsEngine()

        # Convert player to dict
        player_data = request.player.dict()

        # Generate insights
        insights = engine.generate_player_insights(player_data)

        return {
            "status": "success",
            "insights": insights,
            "count": len(insights)
        }
    except Exception as e:
        logger.error(f"Error in generate-insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match-narrative")
async def match_narrative(request: MatchNarrativeRequest) -> Dict[str, Any]:
    """
    Generate narrative summary from match predictions (Insights Engine)
    """
    try:
        engine = InsightsEngine()

        # Generate narrative
        narrative = engine.generate_match_narrative(
            request.prediction,
            request.homeTeam,
            request.awayTeam
        )

        return {
            "status": "success",
            "narrative": narrative
        }
    except Exception as e:
        logger.error(f"Error in match-narrative: {e}")
        raise HTTPException(status_code=500, detail=str(e))
