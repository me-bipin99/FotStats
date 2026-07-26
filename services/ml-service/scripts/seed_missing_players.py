"""Seed 15-20 players for any team that currently has fewer than 15 players.

Run this against an existing DB — it is purely additive and never drops data.

Usage:
    cd services/ml-service && source venv/bin/activate
    python scripts/seed_missing_players.py
"""
import os
import random
import sys
from datetime import datetime
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, str(Path(__file__).parent.parent))

from scripts.seed_db import (
    NEPALI_FIRST_NAMES_M,
    NEPALI_FIRST_NAMES_F,
    NEPALI_SURNAMES,
    INTL_NAMES,
    TARGET_SQUAD,
    POS_STATS,
    _POS_ROLE_MAP,
    _stats_from_role,
    _elo_from_stats,
    _clamp,
    _gen_name,
    impute_height,
    impute_weight,
    impute_preferred_foot,
    impute_market_value,
)
from config.model_loader import ModelLoader

_mv_model = ModelLoader().get("market_value_catboost")

MIN_PLAYERS = 15  # generate players if team has fewer than this


def get_db():
    uri = os.environ["MONGO_URI"]
    client = MongoClient(uri)
    db_name = uri.rstrip("/").split("/")[-1].split("?")[0] or "fotnep"
    return client[db_name]


def seed_team_players(db, team: dict, used_names: set) -> int:
    """Generate players for one team until it has at least 20. Returns count generated."""
    country = team.get("country", "Nepal")
    is_nepal = country == "Nepal"
    is_women = "Women" in team["name"]
    gender = "F" if is_women else "M"

    if is_nepal:
        first_names = NEPALI_FIRST_NAMES_F if is_women else NEPALI_FIRST_NAMES_M
        surnames = NEPALI_SURNAMES
        nationality = "Nepali"
        source = "nepali"
        quality_lo, quality_hi = (0.60, 0.85) if "National Team" in team["name"] else (0.35, 0.65)
    else:
        pool = INTL_NAMES.get(country, INTL_NAMES["India"])
        first_names = pool["F"] if is_women else pool["M"]
        surnames = pool["surnames"]
        nationality = country
        source = country.lower()  # e.g. 'india', 'bhutan', 'bangladesh', 'pakistan'
        quality_map = {
            "India": (0.55, 0.72),
            "Bangladesh": (0.45, 0.62),
            "Pakistan": (0.45, 0.62),
            "Bhutan": (0.28, 0.48),
        }
        quality_lo, quality_hi = quality_map.get(country, (0.40, 0.60))

    generated = []
    for pos, target in TARGET_SQUAD:
        existing = db.players.count_documents({"team": team["_id"], "position": pos})
        needed = max(0, target - existing)
        for _ in range(needed):
            name = _gen_name(first_names, surnames, used_names)
            quality = random.uniform(quality_lo, quality_hi)
            stats = _stats_from_role(_POS_ROLE_MAP[pos])
            mod = int((quality - 0.5) * 30)
            for k in stats:
                stats[k] = _clamp(stats[k] + mod + random.randint(-8, 8))

            age = random.randint(18, 32)
            apps = random.randint(5, 80)
            goals = random.randint(0, max(1, apps // 4) if pos == "FW" else max(1, apps // 10))
            assists = random.randint(0, max(1, apps // 6))

            _height = impute_height(nationality, pos)
            _weight = impute_weight(_height, pos)
            _foot = impute_preferred_foot(name, pos)
            _elo = _elo_from_stats(stats)
            _mv = impute_market_value(
                {"age": age, "position": pos, "eloRating": _elo,
                 "appearances": apps, "goals": goals, "assists": assists, **stats},
                _mv_model,
                source=source,
            )

            generated.append({
                "name": name,
                "position": pos,
                "nationality": nationality,
                "age": age,
                "gender": gender,
                "height": _height,
                "weight": _weight,
                "preferredFoot": _foot,
                "currentClub": team["name"],
                "marketValue": _mv,
                "stats": stats,
                "careerStats": {
                    "appearances": apps,
                    "goals": goals,
                    "assists": assists,
                    "yellowCards": random.randint(0, max(0, apps // 8)),
                    "redCards": random.randint(0, 2),
                },
                "eloRating": _elo_from_stats(stats),
                "source": source,
                "generated": True,
                "team": team["_id"],
                "createdAt": datetime.utcnow(),
            })

    if generated:
        db.players.insert_many(generated)
    return len(generated)


if __name__ == "__main__":
    random.seed(99)
    db = get_db()

    # Collect all names already in DB to avoid duplicates
    used_names: set = {p["name"] for p in db.players.find({}, {"name": 1})}

    total_added = 0
    teams = list(db.teams.find())
    print(f"Checking {len(teams)} teams for missing players (threshold: {MIN_PLAYERS})...\n")

    for team in teams:
        count = db.players.count_documents({"team": team["_id"]})
        if count < MIN_PLAYERS:
            added = seed_team_players(db, team, used_names)
            new_count = db.players.count_documents({"team": team["_id"]})
            print(f"  {team['name']:35s}  had {count:2d} → added {added:2d} → now {new_count}")
            total_added += added
        else:
            print(f"  {team['name']:35s}  {count:2d} players — OK")

    print(f"\nDone. Added {total_added} players total.")
    print(f"  ↳ Nepali       : {db.players.count_documents({'source': 'nepali'})}")
    print(f"  ↳ International: {db.players.count_documents({'source': 'international'})}")
    print(f"  ↳ European     : {db.players.count_documents({'source': 'european'})}")
