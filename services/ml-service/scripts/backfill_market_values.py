"""
One-time backfill: set marketValue for all players where marketValue == 0.
Safe to re-run — only touches documents that still have 0.

Usage:
    cd services/ml-service && source venv/bin/activate
    python scripts/backfill_market_values.py
"""
import os
import sys
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.attribute_imputer import impute_market_value
from config.model_loader import ModelLoader

_mv_model = ModelLoader().get("market_value_catboost")
if _mv_model is None:
    print("ERROR: market_value_catboost.pkl not found. Run train_imputer.py first.")
    sys.exit(1)

uri = os.environ["MONGO_URI"]
client = MongoClient(uri)
db_name = uri.rstrip("/").split("/")[-1].split("?")[0] or "fotnep"
db = client[db_name]

players = list(db.players.find({"marketValue": 0}, {
    "_id": 1, "age": 1, "position": 1, "eloRating": 1,
    "stats": 1,
    "careerStats": 1,
}))

print(f"Found {len(players)} players with marketValue=0. Backfilling...")

updated = 0
for p in players:
    stats = p.get("stats") or {}
    career = p.get("careerStats") or {}
    features = {
        "age":         p.get("age", 24),
        "position":    p.get("position", "MF"),
        "eloRating":   p.get("eloRating", 1600),
        "appearances": career.get("appearances", 0),
        "goals":       career.get("goals", 0),
        "assists":     career.get("assists", 0),
        "pace":        stats.get("pace", 50),
        "shooting":    stats.get("shooting", 50),
        "passing":     stats.get("passing", 50),
        "dribbling":   stats.get("dribbling", 50),
        "defending":   stats.get("defending", 50),
        "physical":    stats.get("physical", 50),
    }
    mv = impute_market_value(features, _mv_model)
    db.players.update_one({"_id": p["_id"]}, {"$set": {"marketValue": mv}})
    updated += 1

print(f"Done. Updated {updated} players.")

by_source = db.players.aggregate([
    {"$group": {"_id": "$source", "count": {"$sum": 1}, "avgMV": {"$avg": "$marketValue"}}},
])
for row in by_source:
    print(f"  {row['_id']:15s}  count={row['count']}  avgMV=€{row['avgMV']:,.0f}")
