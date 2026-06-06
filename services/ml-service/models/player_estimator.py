"""Algorithm 2: Player Performance Estimator — KNN-based comparison."""
from fastapi import APIRouter
from pydantic import BaseModel
from config.database import get_db
from config.model_loader import ModelLoader
from bson import ObjectId
import numpy as np

router = APIRouter()
STAT_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"]


class ComparePlayersRequest(BaseModel):
    playerAId: str
    playerBId: str


def _get_stats(player: dict) -> list[float]:
    s = player.get("stats", {})
    return [float(s.get(k, 50)) for k in STAT_KEYS]


def _cosine_similarity(a: list, b: list) -> float:
    va, vb = np.array(a), np.array(b)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / denom) if denom > 0 else 0.0


@router.post("/compare-players")
def compare_players(req: ComparePlayersRequest):
    db = get_db()
    player_a = db.players.find_one({"_id": ObjectId(req.playerAId)})
    player_b = db.players.find_one({"_id": ObjectId(req.playerBId)})

    if not player_a or not player_b:
        return {"error": "PLAYER_NOT_FOUND", "message": "One or both players not found"}

    stats_a = _get_stats(player_a)
    stats_b = _get_stats(player_b)

    similarity = round(_cosine_similarity(stats_a, stats_b) * 100, 1)
    attribute_comparison = {
        k: {"playerA": round(stats_a[i], 1), "playerB": round(stats_b[i], 1)}
        for i, k in enumerate(STAT_KEYS)
    }

    strengths_a = sorted(STAT_KEYS, key=lambda k: player_a["stats"].get(k, 0), reverse=True)[:2]
    strengths_b = sorted(STAT_KEYS, key=lambda k: player_b["stats"].get(k, 0), reverse=True)[:2]

    return {
        "playerA": {"id": req.playerAId, "name": player_a["name"], "stats": player_a.get("stats", {})},
        "playerB": {"id": req.playerBId, "name": player_b["name"], "stats": player_b.get("stats", {})},
        "similarityScore": similarity,
        "attributeComparison": attribute_comparison,
        "strengths": {"playerA": strengths_a, "playerB": strengths_b},
    }
