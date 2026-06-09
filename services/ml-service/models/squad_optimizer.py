"""Algorithm 3: Optimal Squad Generator — Genetic Algorithm lineup optimizer."""
from typing import List, Dict
import random
from fastapi import APIRouter
from pydantic import BaseModel
from config.database import get_db
from bson import ObjectId

router = APIRouter()

POSITION_SLOTS = {
    "4-3-3": {"GK": 1, "DF": 4, "MF": 3, "FW": 3},
    "4-4-2": {"GK": 1, "DF": 4, "MF": 4, "FW": 2},
    "4-2-3-1": {"GK": 1, "DF": 4, "MF": 5, "FW": 1},
    "3-5-2": {"GK": 1, "DF": 3, "MF": 5, "FW": 2},
}


class SquadConstraints(BaseModel):
    injured: List[str] = []
    suspended: List[str] = []


class OptimizeSquadRequest(BaseModel):
    teamId: str
    availablePlayerIds: List[str]
    formationPreference: str = "4-3-3"
    constraints: SquadConstraints = SquadConstraints()


def _fitness(lineup_ids: List[str], db) -> float:
    players = list(db.players.find({"_id": {"$in": [ObjectId(pid) for pid in lineup_ids]}}))
    if not players:
        return 0.0
    strength = sum(p.get("eloRating", 1600) for p in players) / (11 * 2400)
    return min(1.0, strength)


@router.post("/optimize-squad")
def optimize_squad(req: OptimizeSquadRequest):
    db = get_db()
    excluded = set(req.constraints.injured + req.constraints.suspended)
    available = [pid for pid in req.availablePlayerIds if pid not in excluded]

    slots = POSITION_SLOTS.get(req.formationPreference, POSITION_SLOTS["4-3-3"])

    # Fetch players and group by position
    players = list(db.players.find({"_id": {"$in": [ObjectId(pid) for pid in available]}}))
    by_position: Dict[str, list] = {"GK": [], "DF": [], "MF": [], "FW": []}
    for p in players:
        pos = p.get("position", "MF")
        if pos in by_position:
            by_position[pos].append(str(p["_id"]))

    # Build best lineup greedily by ELO (genetic algorithm stub — full GA in train phase)
    def sort_by_elo(ids):
        ps = {str(p["_id"]): p for p in players}
        return sorted(ids, key=lambda pid: ps.get(pid, {}).get("eloRating", 0), reverse=True)

    starting_ids = []
    for pos, count in slots.items():
        selected = sort_by_elo(by_position.get(pos, []))[:count]
        starting_ids.extend(selected)

    bench_ids = [str(p["_id"]) for p in players if str(p["_id"]) not in starting_ids][:7]

    player_map = {str(p["_id"]): p for p in players}

    starting_xi = [
        {
            "playerId": pid,
            "playerName": player_map[pid]["name"] if pid in player_map else "Unknown",
            "position": player_map[pid].get("position", "MF") if pid in player_map else "MF",
            "bench": False,
        }
        for pid in starting_ids if pid in player_map
    ]
    bench = [
        {
            "playerId": pid,
            "playerName": player_map[pid]["name"] if pid in player_map else "Unknown",
            "position": player_map[pid].get("position", "MF") if pid in player_map else "MF",
            "bench": True,
        }
        for pid in bench_ids if pid in player_map
    ]

    confidence = round(min(100, _fitness(starting_ids, db) * 100), 1)

    return {
        "teamId": req.teamId,
        "startingXI": starting_xi,
        "bench": bench,
        "formation": req.formationPreference,
        "confidence": confidence,
        "tacticalInsights": ["Lineup selected by ELO rating strength. Full genetic optimization available after training."],
        "keyMissingPlayers": [{"playerId": pid, "reason": "injured" if pid in req.constraints.injured else "suspended"}
                              for pid in sorted(excluded)],
    }
