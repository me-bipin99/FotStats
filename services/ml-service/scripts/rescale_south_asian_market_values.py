"""
One-time rescale: apply SOUTH_ASIAN_VALUE_RATIO to already-seeded players whose
marketValue was imputed before the regional ratio existed.

NOT idempotent — running this twice will compound the ratio (1/3 then 1/9, etc).
Only run this once against a database seeded before the ratio was introduced.

Usage:
    cd services/ml-service && source venv/bin/activate
    python scripts/rescale_south_asian_market_values.py
"""
import os
import sys
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.attribute_imputer import SOUTH_ASIAN_SOURCES, SOUTH_ASIAN_VALUE_RATIO

uri = os.environ["MONGO_URI"]
client = MongoClient(uri)
db_name = uri.rstrip("/").split("/")[-1].split("?")[0] or "fotnep"
db = client[db_name]

print("Before:")
for row in db.players.aggregate([
    {"$group": {"_id": "$source", "count": {"$sum": 1}, "avgMV": {"$avg": "$marketValue"}}},
]):
    print(f"  {row['_id']:15s}  count={row['count']}  avgMV=€{row['avgMV']:,.0f}")

players = list(db.players.find(
    {"source": {"$in": sorted(SOUTH_ASIAN_SOURCES)}},
    {"_id": 1, "marketValue": 1},
))

updated = 0
for p in players:
    new_mv = max(0, int(round(p.get("marketValue", 0) * SOUTH_ASIAN_VALUE_RATIO)))
    db.players.update_one({"_id": p["_id"]}, {"$set": {"marketValue": new_mv}})
    updated += 1

print(f"\nRescaled {updated} players across sources {sorted(SOUTH_ASIAN_SOURCES)} by x{SOUTH_ASIAN_VALUE_RATIO:.4f}")

print("\nAfter:")
for row in db.players.aggregate([
    {"$group": {"_id": "$source", "count": {"$sum": 1}, "avgMV": {"$avg": "$marketValue"}}},
]):
    print(f"  {row['_id']:15s}  count={row['count']}  avgMV=€{row['avgMV']:,.0f}")
