"""Algorithm 1: Crowd Consensus Prediction — reputation-weighted voting."""
from typing import List
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class Vote(BaseModel):
    userId: str
    outcome: str  # 'home_win' | 'draw' | 'away_win'
    reputation: float


class PredictMatchRequest(BaseModel):
    matchId: str
    votes: List[Vote]


@router.post("/predict-match")
def predict_match(req: PredictMatchRequest):
    if not req.votes:
        return {"error": "NO_VOTES", "message": "At least one vote is required"}

    total_rep = sum(v.reputation for v in req.votes)
    outcomes = ["home_win", "draw", "away_win"]

    probs = {
        outcome: sum(v.reputation for v in req.votes if v.outcome == outcome) / total_rep
        for outcome in outcomes
    }

    variance = float(np.var(list(probs.values())))
    confidence = max(0, min(100, round((1 - variance) * 100, 1)))

    return {
        "matchId": req.matchId,
        "prediction": {
            "homeWinProb": round(probs["home_win"], 4),
            "drawProb": round(probs["draw"], 4),
            "awayWinProb": round(probs["away_win"], 4),
        },
        "confidence": confidence,
        "voteBreakdown": {
            "homeWin": sum(1 for v in req.votes if v.outcome == "home_win"),
            "draw": sum(1 for v in req.votes if v.outcome == "draw"),
            "awayWin": sum(1 for v in req.votes if v.outcome == "away_win"),
        },
    }
