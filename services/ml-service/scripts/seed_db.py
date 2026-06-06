"""Seed MongoDB with demo data for development. Use only in development — not production."""
import os
import csv
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
NEPALI_CSV = DATA_DIR / "raw" / "nepali player stats with role and gender.csv"
EUROPEAN_CSV = DATA_DIR / "players_data-2025_2026.csv"


def get_db():
    uri = os.environ["MONGO_URI"]
    client = MongoClient(uri)
    return client["fotnep"]


def _elo_from_stats(stats: dict, base: int = 1600) -> int:
    avg = sum(stats.values()) / len(stats) if stats else 50
    return base + int((avg - 50) * 4)


def seed_players(db):
    db.players.drop()
    players = []

    # Nepali players
    if NEPALI_CSV.exists():
        with open(NEPALI_CSV, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                stats = {
                    "pace": int(row.get("pace", 50) or 50),
                    "shooting": int(row.get("shooting", 50) or 50),
                    "passing": int(row.get("passing", 50) or 50),
                    "dribbling": int(row.get("dribbling", 50) or 50),
                    "defending": int(row.get("defending", 50) or 50),
                    "physical": int(row.get("physical", 50) or 50),
                }
                players.append({
                    "name": row.get("name", "Unknown"),
                    "position": row.get("position", "MF"),
                    "nationality": "Nepali",
                    "age": int(row.get("age", 25) or 25),
                    "gender": row.get("gender", "M"),
                    "stats": stats,
                    "careerStats": {"appearances": 0, "goals": 0, "assists": 0, "yellowCards": 0, "redCards": 0},
                    "eloRating": _elo_from_stats(stats),
                    "source": "nepali",
                    "createdAt": datetime.utcnow(),
                })

    if players:
        db.players.insert_many(players)
        print(f"Inserted {len(players)} Nepali players")
    else:
        print(f"Warning: {NEPALI_CSV} not found — skipping Nepali players")


def seed_demo_users(db):
    db.users.drop()
    import bcrypt
    pw_hash = bcrypt.hashpw(b"fotnep2025", bcrypt.gensalt()).decode()
    db.users.insert_many([
        {"email": "admin@fotnep.com", "passwordHash": pw_hash, "name": "Admin",
         "reputation": 80, "predictionsCorrect": 0, "predictionsTotal": 0, "createdAt": datetime.utcnow()},
        {"email": "demo@fotnep.com", "passwordHash": pw_hash, "name": "Demo User",
         "reputation": 50, "predictionsCorrect": 0, "predictionsTotal": 0, "createdAt": datetime.utcnow()},
    ])
    print("Inserted demo users")


def seed_teams(db):
    db.teams.drop()
    db.teams.insert_many([
        {"name": "Nepal National Team", "country": "Nepal", "color": "#DC2626",
         "stadium": "Dashrath Rangasala", "coach": "Vincenzo Alberto Annese", "formation": "4-3-3", "players": []},
        {"name": "Machhindra FC", "country": "Nepal", "color": "#047857",
         "stadium": "Dashrath Rangasala", "coach": "Kishore Kumar", "formation": "4-4-2", "players": []},
        {"name": "Manang Marshyangdi MMC", "country": "Nepal", "color": "#1E3A8A",
         "stadium": "Halchowk Stadium", "coach": "Tope Ayodeji Fuja", "formation": "4-3-3", "players": []},
    ])
    print("Inserted demo teams")


def seed_matches(db):
    db.matches.drop()
    teams = {t["name"]: t["_id"] for t in db.teams.find()}
    nepal = teams.get("Nepal National Team")
    machhindra = teams.get("Machhindra FC")
    manang = teams.get("Manang Marshyangdi MMC")

    if nepal and machhindra:
        db.matches.insert_many([
            {"homeTeam": nepal, "awayTeam": machhindra, "date": datetime.utcnow() + timedelta(days=3),
             "competition": "A-Division League", "status": "upcoming", "venue": "Dashrath Rangasala",
             "homeLineup": [], "awayLineup": [], "homeFormation": "4-3-3", "awayFormation": "4-4-2"},
            {"homeTeam": manang, "awayTeam": nepal, "date": datetime.utcnow() - timedelta(days=5),
             "competition": "A-Division League", "status": "completed", "venue": "Halchowk Stadium",
             "homeLineup": [], "awayLineup": [], "homeFormation": "4-3-3", "awayFormation": "4-3-3",
             "result": {"homeScore": 2, "awayScore": 1}},
        ])
        print("Inserted demo matches")


if __name__ == "__main__":
    db = get_db()
    seed_teams(db)
    seed_players(db)
    seed_demo_users(db)
    seed_matches(db)
    print("Seeding complete.")
