from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorClient
import os

from utils.model_loader import get_predictor
from models.match_predictor import LineupPredictor

logger = logging.getLogger(__name__)
router = APIRouter()

class TeamStats(BaseModel):
    teamId: str
    name: str
    players: List[Dict[str, Any]] = []

class PredictionRequest(BaseModel):
    homeTeam: TeamStats
    awayTeam: TeamStats
    formation: str = "4-3-3"
    isNeutralVenue: bool = False

@router.post("/predict-match")
async def predict_match(request: PredictionRequest) -> Dict[str, Any]:
    """
    Predict match outcome using Naive Bayes (Algorithm #3) + ELO (Algorithm #4)
    """
    try:
        # Get predictor
        predictor = get_predictor()
        lineup_predictor = LineupPredictor()

        # Extract team stats
        home_team = {
            "name": request.homeTeam.name,
            "teamId": request.homeTeam.teamId,
        }
        away_team = {
            "name": request.awayTeam.name,
            "teamId": request.awayTeam.teamId,
        }

        # Get ELO ratings for players
        home_elo = {}
        away_elo = {}
        for p in request.homeTeam.players:
            home_elo[p.get("playerId")] = p.get("eloRating", 1500)
        for p in request.awayTeam.players:
            away_elo[p.get("playerId")] = p.get("eloRating", 1500)

        # Predict lineup using Bayesian scorer
        try:
            home_lineup = lineup_predictor.predict_lineup(
                request.homeTeam.players,
                request.formation,
                home_elo
            )
            away_lineup = lineup_predictor.predict_lineup(
                request.awayTeam.players,
                request.formation,
                away_elo
            )
        except Exception as e:
            logger.warning(f"Lineup prediction failed: {e}, using default selection")
            home_lineup = request.homeTeam.players[:11]
            away_lineup = request.awayTeam.players[:11]

        # Predict match outcome using Naive Bayes
        prediction = predictor.predict(home_team, away_team, request.isNeutralVenue)

        return {
            "status": "success",
            "lineup": {
                "home": [p.get("name", "Unknown") for p in home_lineup],
                "away": [p.get("name", "Unknown") for p in away_lineup],
                "formation": request.formation,
            },
            "prediction": {
                "homeWin": round(prediction.get("homeWin", 0.33), 3),
                "draw": round(prediction.get("draw", 0.33), 3),
                "awayWin": round(prediction.get("awayWin", 0.33), 3),
                "confidence": round(prediction.get("confidence", 0.5), 2),
            },
            "narrative": prediction.get("narrative", "Match prediction generated"),
        }
    except Exception as e:
        logger.error(f"Error in predict-match: {e}")
        raise HTTPException(status_code=500, detail=str(e))
