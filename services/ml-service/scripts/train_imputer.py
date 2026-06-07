"""
Train CatBoost market value regressor on synthetic labels derived from player CSVs.

Run BEFORE seed_db.py (or whenever player CSV data changes significantly).
Output: trained_models/market_value_catboost.pkl

Usage:
    cd services/ml-service
    source venv/bin/activate
    python scripts/train_imputer.py
"""
import csv
import pickle
import sys
from pathlib import Path

# Allow imports from ml-service/ root
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
NEPALI_CSV = DATA_DIR / "raw" / "nepali player stats with role and gender.csv"
NEPALI_SQUAD_CSV = DATA_DIR / "raw" / "nepalisquad.csv"
EUROPEAN_CSV = DATA_DIR / "players_data-2025_2026.csv"

TRAINED_MODELS_DIR = Path(__file__).parent.parent / "trained_models"
MODEL_PATH = TRAINED_MODELS_DIR / "market_value_catboost.pkl"

POSITION_ENC = {"GK": 0, "DF": 1, "MF": 2, "FW": 3}
STAT_KEYS = ["pace", "shooting", "passing", "dribbling", "defending", "physical"]

# ─── Helpers (duplicated from seed_db.py to keep this script standalone) ──────

ROLE_STATS: dict[str, dict[str, int]] = {
    "Goalkeeper":         {"pace": 45, "shooting": 22, "passing": 56, "dribbling": 35, "defending": 73, "physical": 75},
    "Centre-Back":        {"pace": 54, "shooting": 36, "passing": 58, "dribbling": 44, "defending": 81, "physical": 77},
    "Centre Back":        {"pace": 54, "shooting": 36, "passing": 58, "dribbling": 44, "defending": 81, "physical": 77},
    "Defender":           {"pace": 60, "shooting": 38, "passing": 62, "dribbling": 50, "defending": 76, "physical": 70},
    "Left Back":          {"pace": 70, "shooting": 44, "passing": 65, "dribbling": 63, "defending": 70, "physical": 64},
    "Right Back":         {"pace": 70, "shooting": 44, "passing": 65, "dribbling": 63, "defending": 70, "physical": 64},
    "Defensive Midfield": {"pace": 60, "shooting": 48, "passing": 67, "dribbling": 58, "defending": 69, "physical": 69},
    "Central Midfield":   {"pace": 65, "shooting": 58, "passing": 72, "dribbling": 67, "defending": 58, "physical": 62},
    "Central Midfielder": {"pace": 65, "shooting": 58, "passing": 72, "dribbling": 67, "defending": 58, "physical": 62},
    "Midfielder":         {"pace": 65, "shooting": 55, "passing": 70, "dribbling": 64, "defending": 55, "physical": 60},
    "Attacking Midfield": {"pace": 70, "shooting": 66, "passing": 74, "dribbling": 73, "defending": 42, "physical": 58},
    "Left Winger":        {"pace": 82, "shooting": 66, "passing": 65, "dribbling": 80, "defending": 36, "physical": 56},
    "Right Winger":       {"pace": 82, "shooting": 66, "passing": 65, "dribbling": 80, "defending": 36, "physical": 56},
    "Winger":             {"pace": 80, "shooting": 64, "passing": 65, "dribbling": 78, "defending": 38, "physical": 56},
    "Centre-Forward":     {"pace": 74, "shooting": 78, "passing": 54, "dribbling": 68, "defending": 32, "physical": 66},
    "Forward":            {"pace": 76, "shooting": 73, "passing": 58, "dribbling": 70, "defending": 36, "physical": 62},
    "Striker":            {"pace": 74, "shooting": 77, "passing": 55, "dribbling": 68, "defending": 34, "physical": 64},
}
POS_STATS: dict[str, dict[str, int]] = {
    "GK": {"pace": 45, "shooting": 22, "passing": 56, "dribbling": 35, "defending": 73, "physical": 75},
    "DF": {"pace": 60, "shooting": 38, "passing": 62, "dribbling": 50, "defending": 76, "physical": 70},
    "MF": {"pace": 65, "shooting": 55, "passing": 70, "dribbling": 64, "defending": 55, "physical": 60},
    "FW": {"pace": 75, "shooting": 73, "passing": 58, "dribbling": 70, "defending": 35, "physical": 62},
}


def _safe_int(val, default: int = 0) -> int:
    try:
        return int(str(val).strip()) if str(val).strip() else default
    except (ValueError, TypeError):
        return default


def _clamp(val: int, lo: int = 25, hi: int = 95) -> int:
    return max(lo, min(hi, val))


def _stats_from_role(role: str, pos: str = "MF") -> dict[str, int]:
    if role in ROLE_STATS:
        return dict(ROLE_STATS[role])
    best_key = max((k for k in ROLE_STATS if k.lower() in role.lower()), key=len, default=None)
    if best_key:
        return dict(ROLE_STATS[best_key])
    return dict(POS_STATS.get(pos, POS_STATS["MF"]))


def _apply_performance_boost(stats: dict, goals: int, assists: int, appearances: int) -> dict:
    if appearances <= 0:
        return stats
    stats = dict(stats)
    goal_rate = goals / appearances
    assist_rate = assists / appearances
    stats["shooting"] = _clamp(stats["shooting"] + int(goal_rate * 25))
    stats["passing"]  = _clamp(stats["passing"]  + int(assist_rate * 20))
    return stats


def _elo_from_stats(stats: dict, base: int = 1600) -> int:
    avg = sum(stats.values()) / len(stats) if stats else 50
    return base + int((avg - 50) * 4)


def _map_euro_pos(raw: str) -> str:
    p = raw.split(",")[0].strip().upper()
    return p if p in ("GK", "DF", "MF", "FW") else "MF"


# ─── Synthetic label formula ───────────────────────────────────────────────────

def _age_factor(age: int) -> float:
    if age <= 24:
        return 1.0
    elif age <= 32:
        return max(0.20, 1.0 - (age - 24) * 0.04)
    else:
        return max(0.20, 0.68 - (age - 32) * 0.06)


def _perf_factor(goals: int, assists: int, appearances: int) -> float:
    gpg = goals / max(appearances, 1)
    apg = assists / max(appearances, 1)
    return min(2.5, max(1.0, 1.0 + gpg * 0.30 + apg * 0.20))


def _synthetic_value(elo: int, age: int, goals: int, assists: int, appearances: int) -> float:
    base = max(0, (elo - 1400)) * 800
    val = base * _age_factor(age) * _perf_factor(goals, assists, appearances)
    return min(15_000_000.0, max(0.0, val))


# ─── Data loading ──────────────────────────────────────────────────────────────

def _load_rows() -> list[list[float]]:
    rows: list[list[float]] = []

    # Nepali players
    squad_lookup: dict[str, dict] = {}
    if NEPALI_SQUAD_CSV.exists():
        with open(NEPALI_SQUAD_CSV, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                name = r.get("Player Name", "").strip()
                if name:
                    squad_lookup[name.lower()] = r

    if NEPALI_CSV.exists():
        with open(NEPALI_CSV, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                name = r.get("Player Name", "Unknown").strip()
                position = r.get("Position", "MF").strip()
                role = r.get("Role", position).strip()
                appearances = _safe_int(r.get("Matches Played", 0))
                goals = _safe_int(r.get("Goals", 0))
                assists = _safe_int(r.get("Assists", 0))
                sq = squad_lookup.get(name.lower(), {})
                age = _safe_int(sq.get("Age", 24), 24) or 24

                stats = _stats_from_role(role, position)
                stats = _apply_performance_boost(stats, goals, assists, appearances)
                elo = _elo_from_stats(stats)
                pos_enc = POSITION_ENC.get(position, 2)
                label = _synthetic_value(elo, age, goals, assists, appearances)

                rows.append([
                    float(age), float(pos_enc), float(elo),
                    float(appearances), float(goals), float(assists),
                    *[float(stats.get(k, 50)) for k in STAT_KEYS],
                    label,
                ])

    # European players
    if EUROPEAN_CSV.exists():
        with open(EUROPEAN_CSV, newline="", encoding="utf-8", errors="replace") as f:
            for r in csv.DictReader(f):
                name = r.get("Player", "").strip()
                if not name:
                    continue
                position = _map_euro_pos(r.get("Pos", "MF"))
                age = _safe_int(r.get("Age", 25), 25) or 25
                appearances = _safe_int(r.get("MP", 0))
                goals = _safe_int(r.get("Gls", 0))
                assists = _safe_int(r.get("Ast", 0))

                stats = dict(POS_STATS.get(position, POS_STATS["MF"]))
                stats = _apply_performance_boost(stats, goals, assists, appearances)
                elo = _elo_from_stats(stats)
                pos_enc = POSITION_ENC.get(position, 2)
                label = _synthetic_value(elo, age, goals, assists, appearances)

                rows.append([
                    float(age), float(pos_enc), float(elo),
                    float(appearances), float(goals), float(assists),
                    *[float(stats.get(k, 50)) for k in STAT_KEYS],
                    label,
                ])

    return rows


# ─── Train & save ──────────────────────────────────────────────────────────────

def main():
    print("Loading player data from CSVs...")
    rows = _load_rows()
    if not rows:
        print("ERROR: No player data found. Check that CSV paths exist:")
        print(f"  {NEPALI_CSV}")
        print(f"  {EUROPEAN_CSV}")
        sys.exit(1)

    data = np.array(rows, dtype=np.float32)
    X, y = data[:, :-1], data[:, -1]
    print(f"  {len(rows)} players loaded. Label stats: "
          f"min={y.min():.0f}  mean={y.mean():.0f}  max={y.max():.0f}")

    try:
        from catboost import CatBoostRegressor
    except ImportError:
        print("ERROR: catboost not installed. Run: pip install catboost==1.2.5")
        sys.exit(1)

    print("Training CatBoost regressor...")
    model = CatBoostRegressor(
        iterations=500,
        learning_rate=0.05,
        depth=6,
        loss_function="RMSE",
        verbose=100,
        random_seed=42,
    )
    model.fit(X, y)

    TRAINED_MODELS_DIR.mkdir(exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    print(f"Saved → {MODEL_PATH}")
    print("Done. Now run: python scripts/seed_db.py")


if __name__ == "__main__":
    main()
