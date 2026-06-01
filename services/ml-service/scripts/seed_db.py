"""
Seed script: populate MongoDB with Nepali players (with ELO + clusters), teams, matches, and admin user.
"""

import os
import sys
import csv
import bcrypt
from pathlib import Path
from datetime import datetime

# Load environment variables from .env.local (if it exists)
try:
    from dotenv import load_dotenv
    env_local = Path(__file__).parent.parent.parent.parent / ".env.local"
    if env_local.exists():
        load_dotenv(env_local)
    else:
        print("ℹ️  .env.local not found. Using environment variables or defaults.")
except ImportError:
    print("ℹ️  python-dotenv not installed. Reading from environment variables.")

# Add parent directories to path so we can import models
sys.path.insert(0, str(Path(__file__).parent.parent))

# Get the project root directory (navigate up from scripts/seed_db.py)
PROJECT_ROOT = Path(__file__).parent.parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"

import pymongo
from pymongo import MongoClient
import pandas as pd
from models.elo_rating import bootstrap_from_career_stats
from models.player_clusterer import PlayerClusterer

# MongoDB connection - get URI from environment or use default
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/fotnep")

print(f"📡 Connecting to MongoDB: {MONGODB_URI[:50]}...")
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    db = client.fotnep
    print("✓ Connected to MongoDB")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    print(f"   Make sure MONGODB_URI is set in .env.local or environment")
    sys.exit(1)

def read_nepali_squad():
    """Read 12 national squad players from nepalisquad.csv"""
    squad = []
    csv_path = DATA_DIR / "raw" / "nepalisquad.csv"
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            player_id = row["Player Name"].lower().replace(" ", "_")
            squad.append({
                "playerId": player_id,
                "name": row["Player Name"],
                "position": row["Position"],
                "age": int(row["Age"]),
                "caps": int(row["Caps"]),
                "goals": int(row["Goals"]),
                "yellowCards": int(row["Yellow Cards"]),
                "redCards": int(row["Red Cards"]),
                "minutes": int(row["Est. Minutes"].replace(",", "")),
                "marketValue": row["Market Value (€)"],
                "currentClub": row["Current Club"],
                "nslTeam": row["NSL Team"],
                "gender": "Male",  # Squad is male by default
            })
    return squad

def read_nepali_extended():
    """Read 101 extended Nepali players from CSV"""
    extended = []
    csv_path = DATA_DIR / "raw" / "nepali player stats with role and gender.csv"
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            player_id = row["Player Name"].lower().replace(" ", "_")
            extended.append({
                "playerId": player_id,
                "name": row["Player Name"],
                "position": row["Position"],
                "role": row["Role"],
                "gender": row["Gender"],
                "matchesPlayed": int(row["Matches Played"]),
                "goals": int(row["Goals"]),
                "assists": int(row["Assists"]),
                "minutes": int(row["Matches Played"]) * 45,  # estimate ~45 min per match
                "caps": int(row["Matches Played"]),
                "yellowCards": 0,  # not available
                "redCards": 0,     # not available
            })
    return extended

def deduplicate_players(squad, extended):
    """Remove extended players that already exist in squad by name"""
    squad_names = {p["name"].lower() for p in squad}
    unique_extended = [p for p in extended if p["name"].lower() not in squad_names]
    return unique_extended

def calculate_elo_ratings(all_players):
    """Use ELO bootstrap to assign ratings"""
    try:
        elo_dict = bootstrap_from_career_stats(all_players)
        for player in all_players:
            player_id = player["playerId"]
            player["eloRating"] = elo_dict.get(player_id, 1500)  # default 1500 if not found
    except Exception as e:
        print(f"⚠ ELO bootstrap failed: {e}. Using default 1500.")
        for player in all_players:
            player["eloRating"] = 1500

def train_and_assign_clusters(all_players):
    """Train K-Means on European data and assign clusters to Nepali players"""
    try:
        # Load European CSV
        eur_csv_path = DATA_DIR / "players_data-2025_2026.csv"
        eur_df = pd.read_csv(eur_csv_path)

        # Feature columns mapping (handle missing columns gracefully)
        feature_mapping = {
            "Gls": "goals",
            "Ast": "assists",
            "Min": "minutes",
            "Sh": "defensiveActions",
            "SoT": "ballRecoveries",
            "CrdY": "yellowCards",
            "CrdR": "redCards",
        }

        # Build feature matrix for training
        features_for_training = []
        for idx, row in eur_df.iterrows():
            feature_vec = [
                float(row.get("Gls", 0) or 0),
                float(row.get("Ast", 0) or 0),
                float(row.get("Min", 0) or 0),
                float(row.get("Sh", 0) or 0),
                float(row.get("SoT", 0) or 0),
                float(row.get("CrdY", 0) or 0),
                float(row.get("CrdR", 0) or 0),
            ]
            features_for_training.append(feature_vec)

        # Train clusterer
        clusterer = PlayerClusterer()
        clusterer.train(features_for_training)

        # Assign clusters to Nepali players
        role_labels = {
            0: "Elite Forward",
            1: "Defensive Midfielder",
            2: "Creative Winger",
            3: "Solid Defender",
            4: "Box-to-Box Midfielder",
            5: "Goalkeeper"
        }

        for player in all_players:
            # Build feature vector for this player
            feature_vec = [
                float(player.get("goals", 0)),
                float(player.get("assists", 0)),
                float(player.get("minutes", 0)),
                float(player.get("yellowCards", 0)),
                float(player.get("redCards", 0)),
                float(player.get("minutes", 0)) / 90,  # defensive actions proxy
                0,  # ball recoveries (not available)
            ]

            # Predict cluster
            cluster = clusterer.predict([feature_vec])[0]
            player["roleClassification"] = {
                "cluster": int(cluster),
                "primaryRole": role_labels.get(int(cluster), "Midfielder")
            }

        print(f"✓ Trained K-Means on European data and assigned clusters")
    except Exception as e:
        print(f"⚠ K-Means clustering failed: {e}. Assigning roles by position.")
        # Map position to role
        position_to_role = {
            'goalkeeper': 'Goalkeeper',
            'gk': 'Goalkeeper',
            'defender': 'Defender',
            'centre-back': 'Defender',
            'centre back': 'Defender',
            'back': 'Defender',
            'fullback': 'Defender',
            'left-back': 'Defender',
            'right-back': 'Defender',
            'midfielder': 'Midfielder',
            'central midfield': 'Midfielder',
            'defensive midfield': 'Midfielder',
            'attacking midfield': 'Midfielder',
            'midfield': 'Midfielder',
            'winger': 'Winger',
            'forward': 'Forward',
            'striker': 'Forward',
            'centre-forward': 'Forward',
        }

        for player in all_players:
            pos = player.get("position", "").lower()
            # Find matching role
            role = "Midfielder"  # default
            for pos_key, role_val in position_to_role.items():
                if pos_key in pos:
                    role = role_val
                    break

            player["roleClassification"] = {
                "cluster": 1,
                "primaryRole": role
            }

def seed_players(all_players):
    """Upsert all players into MongoDB"""
    db.players.delete_many({})  # clear existing

    insert_count = 0
    for player in all_players:
        db.players.update_one(
            {"playerId": player["playerId"]},
            {"$set": player},
            upsert=True
        )
        insert_count += 1

    return insert_count

def seed_team(all_players):
    """Seed Male and Female Nepal National Teams with top performers"""
    db.teams.delete_many({})

    # Separate players by gender
    male_players = [p for p in all_players if p.get("gender", "Male").lower() == "male"]
    female_players = [p for p in all_players if p.get("gender", "Male").lower() == "female"]

    # Sort by performance: ELO > Goals > Caps
    def performance_score(p):
        return (
            p.get("eloRating", 1500) * 10 +
            p.get("goals", 0) * 100 +
            p.get("caps", 0) * 5
        )

    male_players_sorted = sorted(male_players, key=performance_score, reverse=True)
    female_players_sorted = sorted(female_players, key=performance_score, reverse=True)

    # Select top 11 performers from each team (Starting XI)
    male_top_11 = male_players_sorted[:11]
    female_top_11 = female_players_sorted[:11]

    male_active_ids = [p["playerId"] for p in male_top_11]
    female_active_ids = [p["playerId"] for p in female_top_11]

    # Calculate average ELO
    male_elo = sum(p["eloRating"] for p in male_top_11) / len(male_top_11) if male_top_11 else 1500
    female_elo = sum(p["eloRating"] for p in female_top_11) / len(female_top_11) if female_top_11 else 1500

    # Create Male National Team
    male_team = {
        "teamId": "nepal_male",
        "name": "Nepal Male National Team",
        "gender": "Male",
        "squad": male_active_ids,
        "averageElo": male_elo,
        "totalPlayers": len(male_players),
        "activeCount": len(male_active_ids),
        "formation": "4-3-3",
        "createdAt": datetime.utcnow(),
    }
    db.teams.insert_one(male_team)

    # Create Female National Team
    female_team = {
        "teamId": "nepal_female",
        "name": "Nepal Female National Team",
        "gender": "Female",
        "squad": female_active_ids,
        "averageElo": female_elo,
        "totalPlayers": len(female_players),
        "activeCount": len(female_active_ids),
        "formation": "4-2-3-1",
        "createdAt": datetime.utcnow(),
    }
    db.teams.insert_one(female_team)

    print(f"✓ Created Male Team with top 11 performers (avg ELO: {male_elo:.0f})")
    print(f"✓ Created Female Team with top 11 performers (avg ELO: {female_elo:.0f})")

    return 2

def seed_match(home_team_id):
    """Seed Nepal vs India matches (Male and Female) with predictions"""
    db.matches.delete_many({})

    # Male Match: Nepal vs India
    male_match = {
        "matchId": "nepal_male_india_male_2025",
        "homeTeam": "nepal_male",
        "awayTeam": "india_male",
        "homeTeamName": "Nepal",
        "awayTeamName": "India",
        "gender": "Male",
        "status": "scheduled",
        "date": "2025-09-10",
        "venue": "Tribhuvan Army Stadium, Kathmandu",
        "formation": {
            "home": "4-3-3",
            "away": "4-2-3-1"
        },
        "prediction": {
            "homeWinProbability": 0.25,
            "drawProbability": 0.30,
            "awayWinProbability": 0.45,
            "expectedGoalsHome": 1.2,
            "expectedGoalsAway": 1.8,
            "predictedResult": "0-1"
        },
        "createdAt": datetime.utcnow(),
    }
    db.matches.insert_one(male_match)

    # Female Match: Nepal vs India
    female_match = {
        "matchId": "nepal_female_india_female_2025",
        "homeTeam": "nepal_female",
        "awayTeam": "india_female",
        "homeTeamName": "Nepal",
        "awayTeamName": "India",
        "gender": "Female",
        "status": "scheduled",
        "date": "2025-09-12",
        "venue": "Nepal Police Stadium, Kathmandu",
        "formation": {
            "home": "4-2-3-1",
            "away": "4-3-3"
        },
        "prediction": {
            "homeWinProbability": 0.20,
            "drawProbability": 0.25,
            "awayWinProbability": 0.55,
            "expectedGoalsHome": 0.9,
            "expectedGoalsAway": 2.1,
            "predictedResult": "0-2"
        },
        "createdAt": datetime.utcnow(),
    }
    db.matches.insert_one(female_match)

    print(f"✓ Created Male Match: Nepal vs India (09-10-2025)")
    print(f"✓ Created Female Match: Nepal vs India (09-12-2025)")

    return 2

def seed_user():
    """Seed admin user for authentication"""
    db.users.delete_many({"email": "admin@fotnep.com"})

    password_hash = bcrypt.hashpw(b"fotnep2025", bcrypt.gensalt())

    user_doc = {
        "email": "admin@fotnep.com",
        "passwordHash": password_hash,
        "name": "Admin",
        "role": "admin",
        "createdAt": datetime.utcnow(),
    }

    db.users.insert_one(user_doc)
    return 1

def main():
    print("🌱 FotNep Database Seed Script\n")

    print("1️⃣  Reading Nepali squad (12 players)...")
    squad = read_nepali_squad()
    print(f"   ✓ Loaded {len(squad)} squad players")

    print("2️⃣  Reading extended Nepali players (101 players)...")
    extended = read_nepali_extended()
    print(f"   ✓ Loaded {len(extended)} extended players")

    print("3️⃣  Deduplicating (removing squad players from extended)...")
    unique_extended = deduplicate_players(squad, extended)
    all_players = squad + unique_extended
    print(f"   ✓ Total unique players: {len(all_players)}")

    print("4️⃣  Calculating ELO ratings (bootstrap from career stats)...")
    calculate_elo_ratings(all_players)
    print(f"   ✓ ELO ratings assigned")

    print("5️⃣  Training K-Means and assigning clusters...")
    train_and_assign_clusters(all_players)
    print(f"   ✓ Clusters assigned")

    print("6️⃣  Seeding MongoDB...")
    player_count = seed_players(all_players)
    team_count = seed_team(all_players)
    match_count = seed_match("nepal_male")
    user_count = seed_user()

    print(f"   ✓ Seeded {player_count} players")
    print(f"   ✓ Seeded {team_count} teams")
    print(f"   ✓ Seeded {match_count} matches")
    print(f"   ✓ Seeded {user_count} admin user")

    print(f"\n✅ Database seeded successfully!")
    print(f"\nLogin with:")
    print(f"  Email: admin@fotnep.com")
    print(f"  Password: fotnep2025")

    # Verify
    player_count = db.players.count_documents({})
    team_count = db.teams.count_documents({})
    match_count = db.matches.count_documents({})
    user_count = db.users.count_documents({})

    print(f"\n📊 Database verification:")
    print(f"   Players: {player_count}")
    print(f"   Teams: {team_count}")
    print(f"   Matches: {match_count}")
    print(f"   Users: {user_count}")

if __name__ == "__main__":
    main()
