"""
Player attribute imputation — Algorithm 4 (4a–4d).
Four pure functions callable by seed_db.py without FastAPI running,
plus a POST /impute-attributes endpoint for on-demand use.
"""
import hashlib
import random as _random

import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

# ─── Algorithm 4a: Height lookup ─────────────────────────────────────────────

HEIGHT_TABLE: dict[tuple[str, str], int] = {
    ("nepali",        "GK"): 178, ("nepali",        "DF"): 174, ("nepali",        "MF"): 171, ("nepali",        "FW"): 169,
    ("south_asian",   "GK"): 179, ("south_asian",   "DF"): 175, ("south_asian",   "MF"): 172, ("south_asian",   "FW"): 170,
    ("european",      "GK"): 188, ("european",      "DF"): 183, ("european",      "MF"): 179, ("european",      "FW"): 177,
    ("african",       "GK"): 187, ("african",       "DF"): 182, ("african",       "MF"): 178, ("african",       "FW"): 175,
    ("south_american","GK"): 185, ("south_american","DF"): 180, ("south_american","MF"): 176, ("south_american","FW"): 174,
    ("default",       "GK"): 185, ("default",       "DF"): 180, ("default",       "MF"): 176, ("default",       "FW"): 174,
}

_SOUTH_ASIAN   = {"indian", "bangladeshi", "sri lankan", "pakistani", "bhutanese", "maldivian", "nepali"}
_EUROPEAN      = {"eng", "fra", "ger", "esp", "ita", "por", "ned", "bel", "swe", "nor", "den", "sco",
                  "wal", "irl", "cro", "srb", "pol", "aut", "sui", "rus", "ukr", "gre", "tur", "cze",
                  "english", "french", "german", "spanish", "italian", "portuguese", "dutch", "belgian"}
_AFRICAN       = {"ngr", "gha", "sen", "civ", "cmr", "egy", "mar", "rsa", "zim", "uga", "tun",
                  "nigerian", "ghanaian", "senegalese", "ivorian", "cameroonian", "egyptian", "moroccan"}
_SOUTH_AMERICAN = {"bra", "arg", "col", "chi", "per", "uru", "ven", "ecu", "par", "bol",
                   "brazilian", "argentinian", "colombian", "chilean", "peruvian", "uruguayan"}


def _nat_group(nationality: str) -> str:
    tokens = set(nationality.lower().split())
    if "nepali" in tokens or "nepal" in nationality.lower():
        return "nepali"
    if tokens & _SOUTH_ASIAN:
        return "south_asian"
    if tokens & _EUROPEAN:
        return "european"
    if tokens & _AFRICAN:
        return "african"
    if tokens & _SOUTH_AMERICAN:
        return "south_american"
    return "default"


def _norm_pos(position: str) -> str:
    p = position[:2].upper() if position else "MF"
    return p if p in ("GK", "DF", "MF", "FW") else "MF"


def impute_height(nationality: str, position: str) -> int:
    """Algorithm 4a: Nationality + Position average height lookup. Deterministic."""
    return HEIGHT_TABLE[(
        _nat_group(nationality or ""),
        _norm_pos(position or ""),
    )]


# ─── Algorithm 4b: Weight from BMI ───────────────────────────────────────────

POSITION_BMI: dict[str, float] = {"GK": 24.0, "DF": 23.5, "MF": 22.5, "FW": 22.0}


def impute_weight(height_cm: int, position: str) -> int:
    """Algorithm 4b: BMI-based weight estimation. weight = round(bmi × (h/100)²)."""
    bmi = POSITION_BMI.get(_norm_pos(position or ""), 23.0)
    return round(bmi * (height_cm / 100.0) ** 2)


# ─── Algorithm 4c: Preferred foot ────────────────────────────────────────────

# (right_probability, left_probability)
FOOT_PROBS: dict[str, tuple[float, float]] = {
    "GK": (0.88, 0.12),
    "DF": (0.80, 0.20),
    "MF": (0.77, 0.23),
    "FW": (0.76, 0.24),
}


def impute_preferred_foot(player_name: str, position: str) -> str:
    """
    Algorithm 4c: Position-based probability distribution.
    Deterministic per player: seeded by MD5 of name so the same player always
    gets the same foot regardless of insertion order or random.seed() state.
    """
    right_prob, _ = FOOT_PROBS.get(_norm_pos(position or ""), (0.77, 0.23))
    seed_int = int(hashlib.md5((player_name or "").encode("utf-8")).hexdigest()[:8], 16)
    rng = _random.Random(seed_int)
    return "Right" if rng.random() < right_prob else "Left"


# ─── Algorithm 4d: Market value CatBoost regressor ───────────────────────────

POSITION_ENC: dict[str, int] = {"GK": 0, "DF": 1, "MF": 2, "FW": 3}
STAT_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"]


def impute_market_value(features: dict, model) -> int:
    """
    Algorithm 4d: CatBoost regression on 12 player features.
    Returns 0 gracefully when model is None (pkl not yet trained).
    """
    if model is None:
        return 0
    pos_enc = POSITION_ENC.get(_norm_pos(features.get("position", "MF")), 2)
    row = np.array([[
        features.get("age", 24),
        pos_enc,
        features.get("eloRating", 1600),
        features.get("appearances", 0),
        features.get("goals", 0),
        features.get("assists", 0),
        features.get("pace", 50),
        features.get("shooting", 50),
        features.get("passing", 50),
        features.get("dribbling", 50),
        features.get("defending", 50),
        features.get("physical", 50),
    ]], dtype=np.float32)
    pred = model.predict(row)[0]
    return max(0, int(round(float(pred))))


# ─── FastAPI router ───────────────────────────────────────────────────────────

router = APIRouter()


class ImputeRequest(BaseModel):
    name: str
    nationality: str
    position: str
    age: int = 24
    eloRating: float = 1600
    appearances: int = 0
    goals: int = 0
    assists: int = 0
    stats: dict = {}
    heightCm: int | None = None


@router.post("/impute-attributes")
def impute_attributes(req: ImputeRequest):
    """On-demand attribute imputation for a single player."""
    from config.model_loader import ModelLoader
    height = req.heightCm if req.heightCm else impute_height(req.nationality, req.position)
    weight = impute_weight(height, req.position)
    foot = impute_preferred_foot(req.name, req.position)
    mv_model = ModelLoader().get("market_value_catboost")
    features = {
        "age": req.age, "position": req.position,
        "eloRating": req.eloRating, "appearances": req.appearances,
        "goals": req.goals, "assists": req.assists,
        **req.stats,
    }
    market_value = impute_market_value(features, mv_model)
    return {
        "height": height,
        "weight": weight,
        "preferredFoot": foot,
        "marketValue": market_value,
    }
