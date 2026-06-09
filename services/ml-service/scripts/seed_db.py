"""Seed MongoDB with all available players and demo data. Development only — remove before production."""
import os
import re
import csv
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

random.seed(42)

# Allow imports from ml-service/ root (models/, config/)
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.attribute_imputer import (
    impute_height,
    impute_weight,
    impute_preferred_foot,
    impute_market_value,
)
from config.model_loader import ModelLoader

_mv_model = ModelLoader().get("market_value_catboost")
if _mv_model is None:
    print("  WARNING: market_value_catboost.pkl not found.")
    print("           Run: python scripts/train_imputer.py  then re-run seed_db.py.")
    print("           marketValue will use CSV data only (0 for players not in squad CSV).")

DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"
NEPALI_CSV = DATA_DIR / "raw" / "nepali player stats with role and gender.csv"
NEPALI_SQUAD_CSV = DATA_DIR / "raw" / "nepalisquad.csv"
EUROPEAN_CSV = DATA_DIR / "players_data-2025_2026.csv"

# ─── Stat templates per role ──────────────────────────────────────────────────

ROLE_STATS: dict[str, dict[str, int]] = {
    "Goalkeeper":         {"pace": 45, "shooting": 22, "passing": 56, "dribbling": 35, "defending": 73, "physical": 75},
    "Centre-Back":        {"pace": 54, "shooting": 36, "passing": 58, "dribbling": 44, "defending": 81, "physical": 77},
    "Centre Back":        {"pace": 54, "shooting": 36, "passing": 58, "dribbling": 44, "defending": 81, "physical": 77},
    "Defender":           {"pace": 60, "shooting": 38, "passing": 62, "dribbling": 50, "defending": 76, "physical": 70},
    "Left Back":          {"pace": 70, "shooting": 44, "passing": 65, "dribbling": 63, "defending": 70, "physical": 64},
    "Right Back":         {"pace": 70, "shooting": 44, "passing": 65, "dribbling": 63, "defending": 70, "physical": 64},
    "Left-Back":          {"pace": 70, "shooting": 44, "passing": 65, "dribbling": 63, "defending": 70, "physical": 64},
    "Right-Back":         {"pace": 70, "shooting": 44, "passing": 65, "dribbling": 63, "defending": 70, "physical": 64},
    "Defensive Midfield": {"pace": 60, "shooting": 48, "passing": 67, "dribbling": 58, "defending": 69, "physical": 69},
    "Central Midfield":   {"pace": 65, "shooting": 58, "passing": 72, "dribbling": 67, "defending": 58, "physical": 62},
    "Central Midfielder": {"pace": 65, "shooting": 58, "passing": 72, "dribbling": 67, "defending": 58, "physical": 62},
    "Midfielder":         {"pace": 65, "shooting": 55, "passing": 70, "dribbling": 64, "defending": 55, "physical": 60},
    "Attacking Midfield": {"pace": 70, "shooting": 66, "passing": 74, "dribbling": 73, "defending": 42, "physical": 58},
    "Left Winger":        {"pace": 82, "shooting": 66, "passing": 65, "dribbling": 80, "defending": 36, "physical": 56},
    "Right Winger":       {"pace": 82, "shooting": 66, "passing": 65, "dribbling": 80, "defending": 36, "physical": 56},
    "Left Winger / Forward": {"pace": 80, "shooting": 70, "passing": 62, "dribbling": 78, "defending": 35, "physical": 58},
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

# ─── Nepali name pools (for generated players) ───────────────────────────────

NEPALI_FIRST_NAMES_M = [
    "Bimal", "Rohit", "Anil", "Sujit", "Dipak", "Bikash", "Nabin", "Sujan",
    "Pradeep", "Nirajan", "Santosh", "Sunil", "Kamal", "Milan", "Anjan",
    "Dinesh", "Prabesh", "Manish", "Rajan", "Kiran", "Sushant", "Dilip",
    "Sabin", "Yubraj", "Hira", "Rajendra", "Krishna", "Arjun", "Suman",
    "Binod", "Raju", "Hari", "Subash", "Ramesh", "Ganesh", "Bijay",
    "Sanjiv", "Pawan", "Ashish", "Pramod", "Nischal", "Bishal", "Saroj",
    "Ujjwal", "Ayush", "Rabindra", "Lokendra", "Govinda", "Deepak", "Suresh",
    "Pratik", "Roshan", "Saurav", "Aakash", "Rupesh", "Santosh", "Bipin",
]

NEPALI_FIRST_NAMES_F = [
    "Sanju", "Anu", "Sabitra", "Puja", "Kopila", "Anjana", "Kamala",
    "Anita", "Rita", "Sarita", "Sunita", "Mina", "Sita", "Gita",
    "Bina", "Rekha", "Laxmi", "Manita", "Nita", "Smriti", "Renuka",
    "Pramila", "Sushmita", "Samiksha", "Alisha", "Priyanka", "Nisha",
    "Pooja", "Shristi", "Elina", "Menuka", "Prativa", "Sushila",
]

NEPALI_SURNAMES = [
    "Gurung", "Tamang", "Thapa", "Shrestha", "Lama", "Rai", "Magar",
    "Limbu", "Gharti", "Karki", "Bhandari", "Basnet", "Adhikari",
    "Regmi", "Poudel", "Chaudhary", "Khadka", "Bohara", "Shah",
    "Pariyar", "Kandel", "Bhattarai", "Koirala", "Oli", "Dahal",
    "Gautam", "Roka", "Chand", "Pandey", "Ale", "Gauchan",
    "Budathoki", "Bishwakarma", "Yonjan", "Giri", "Subedi", "Parajuli",
    "Joshi", "Acharya", "Nepali", "Kshetri", "Dhakal", "Baral",
]

_POS_ROLE_MAP = {
    "GK": "Goalkeeper",
    "DF": "Centre-Back",
    "MF": "Central Midfield",
    "FW": "Centre-Forward",
}

# Target squad composition per team (20 total: enough for ML to pick best XI + subs)
TARGET_SQUAD = [("GK", 3), ("DF", 6), ("MF", 6), ("FW", 5)]

# ─── International opponent name pools ───────────────────────────────────────

INTL_NAMES: dict[str, dict] = {
    "India": {
        "M": ["Sunil", "Gurpreet", "Sandesh", "Anirudh", "Liston", "Brandon",
               "Jeakson", "Manvir", "Lallianzuala", "Naorem", "Roshan", "Sahal",
               "Apuia", "Amarjit", "Rahul", "Anwar", "Akash", "Pronay", "Nikhil"],
        "F": ["Aditi", "Manisha", "Sangita", "Dangmei", "Bala", "Sanju",
               "Ratanbala", "Pyari", "Kamala", "Anju", "Renu", "Sweety"],
        "surnames": ["Singh", "Kumar", "Sharma", "Chhetri", "Das", "Roy", "Khan",
                     "Meitei", "Chhangte", "Haokip", "Apuia", "Yadav", "Verma"],
    },
    "Bhutan": {
        "M": ["Karma", "Tshering", "Dorji", "Kinley", "Pema", "Sonam", "Nima",
               "Ugyen", "Jigme", "Tenzin", "Namgay", "Dawa", "Sangay", "Kinga",
               "Penjor", "Duptho", "Chimi", "Thinley"],
        "F": ["Karma", "Pema", "Deki", "Yangchen", "Tshering", "Dechen", "Peldon"],
        "surnames": ["Wangchuk", "Dorji", "Tamang", "Gurung", "Gyeltshen",
                     "Rinzin", "Namgyel", "Phuntsho", "Chhetri"],
    },
    "Bangladesh": {
        "M": ["Jamal", "Topu", "Sufil", "Masuk", "Titu", "Biplu", "Yeasin",
               "Robiul", "Anisur", "Sohel", "Jibon", "Nabib", "Tariq", "Minhaj",
               "Rakib", "Nayan", "Pavel", "Shamim"],
        "F": ["Sirat", "Mosammat", "Shamsunnahar", "Masura", "Marzia", "Ritu",
               "Rupna", "Sanjida"],
        "surnames": ["Bhuiyan", "Hossain", "Islam", "Rahman", "Ahmed", "Khan",
                     "Akter", "Mia", "Uddin", "Sarkar"],
    },
    "Pakistan": {
        "M": ["Harun", "Kaleemullah", "Umar", "Haider", "Imran", "Adeel",
               "Shafiq", "Wahid", "Essa", "Numan", "Zesh", "Saddam",
               "Murad", "Abdullah", "Hassan", "Riaz"],
        "F": ["Hajra", "Nadia", "Afia", "Maria", "Kiran", "Sana", "Iram"],
        "surnames": ["Khan", "Ali", "Ahmed", "Hussain", "Malik", "Butt",
                     "Shafique", "Anwar", "Rehman", "Iqbal"],
    },
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_db():
    uri = os.environ["MONGO_URI"]
    client = MongoClient(uri)
    db_name = uri.rstrip("/").split("/")[-1].split("?")[0] or "fotnep"
    return client[db_name]


def _clamp(val: int, lo: int = 25, hi: int = 95) -> int:
    return max(lo, min(hi, val))


def _elo_from_stats(stats: dict, base: int = 1600) -> int:
    avg = sum(stats.values()) / len(stats) if stats else 50
    return base + int((avg - 50) * 4)


def _stats_from_role(role: str, pos: str = "MF") -> dict[str, int]:
    if role in ROLE_STATS:
        return dict(ROLE_STATS[role])
    matched = None
    for key in sorted(ROLE_STATS, key=len, reverse=True):
        if key.lower() in role.lower():
            matched = key
            break
    if matched:
        return dict(ROLE_STATS[matched])
    short = pos[:2].upper() if pos else "MF"
    return dict(POS_STATS.get(short, POS_STATS["MF"]))


def _apply_performance_boost(stats: dict, goals: int, assists: int, appearances: int) -> dict:
    if appearances <= 0:
        return stats
    goal_rate = goals / appearances
    assist_rate = assists / appearances
    stats["shooting"] = _clamp(stats["shooting"] + int(goal_rate * 25))
    stats["passing"] = _clamp(stats["passing"] + int(assist_rate * 20))
    return stats


def _build_team_lookup(db) -> dict:
    lookup: dict = {}
    for t in db.teams.find():
        name: str = t["name"]
        tid = t["_id"]
        lookup[name.lower()] = tid
        stripped = re.sub(r"\b(fc|sc|ac|club|team)\b", "", name.lower()).strip()
        if stripped and stripped != name.lower():
            lookup[stripped] = tid
    return lookup


_SKIP_CLUBS = {"free agent", "nepal", "—", "-", "", "n/a"}


def _find_team_id(club_name: str, team_lookup: dict):
    if not club_name:
        return None
    key = club_name.lower().strip()
    if key in _SKIP_CLUBS:
        return None
    if key in team_lookup:
        return team_lookup[key]
    for t_name, t_id in team_lookup.items():
        if t_name and (t_name in key or key in t_name):
            return t_id
    return None


def _distribute_unassigned_players(db):
    team_ids = [t["_id"] for t in db.teams.find({"country": "Nepal"})]
    if not team_ids:
        return
    for pos in ["GK", "DF", "MF", "FW"]:
        unassigned = list(
            db.players.find(
                {"source": "nepali", "position": pos, "team": {"$exists": False}},
            ).sort("eloRating", -1)
        )
        for i, player in enumerate(unassigned):
            team_id = team_ids[i % len(team_ids)]
            db.players.update_one({"_id": player["_id"]}, {"$set": {"team": team_id}})
    total_assigned = db.players.count_documents({"source": "nepali", "team": {"$exists": True}})
    print(f"  After distribution: {total_assigned} Nepali players have a team")


FORMATION_SLOTS = {
    "4-3-3":   {"GK": 1, "DF": 4, "MF": 3, "FW": 3},
    "4-4-2":   {"GK": 1, "DF": 4, "MF": 4, "FW": 2},
    "4-2-3-1": {"GK": 1, "DF": 4, "MF": 5, "FW": 1},
    "3-5-2":   {"GK": 1, "DF": 3, "MF": 5, "FW": 2},
}


def _build_lineup(db, team_id, formation: str) -> list[dict]:
    slots = FORMATION_SLOTS.get(formation, FORMATION_SLOTS["4-3-3"])
    lineup = []
    shirt = 1
    used_ids: set = set()
    team_doc = db.teams.find_one({"_id": team_id})
    is_nepal = team_doc and team_doc.get("country") == "Nepal"

    for pos, count in slots.items():
        selected = list(
            db.players.find({
                "team": team_id,
                "position": pos,
                "_id": {"$nin": list(used_ids)},
            }).sort("eloRating", -1).limit(count)
        )

        if len(selected) < count:
            remaining = count - len(selected)
            exclude = list(used_ids) + [p["_id"] for p in selected]
            if is_nepal:
                # Fill from any Nepali player pool (same position first)
                fill = list(db.players.find({
                    "source": "nepali", "position": pos,
                    "_id": {"$nin": exclude},
                }).sort("eloRating", -1).limit(remaining))
            else:
                # Fill from this team's own players (any position) — no cross-team borrowing
                fill = list(db.players.find({
                    "team": team_id,
                    "_id": {"$nin": exclude},
                }).sort("eloRating", -1).limit(remaining))
            selected += fill

        for p in selected:
            lineup.append({"playerId": p["_id"], "position": pos, "shirtNumber": shirt})
            used_ids.add(p["_id"])
            shirt += 1

    return lineup


def _map_euro_pos(raw: str) -> str:
    p = raw.upper()
    if "GK" in p:
        return "GK"
    if "DF" in p and "MF" not in p and "FW" not in p:
        return "DF"
    if "FW" in p and "MF" not in p:
        return "FW"
    return "MF"


def _safe_int(val, default: int = 0) -> int:
    try:
        return int(float(str(val).replace(",", "") or default))
    except (ValueError, TypeError):
        return default


# ─── Seeders ─────────────────────────────────────────────────────────────────

def seed_teams(db):
    db.teams.drop()
    _logo = "https://media.api-sports.io/football/teams/{}.png".format
    teams = [
        # ─── National teams ───────────────────────────────────────────────
        {"name": "Nepal National Team",        "country": "Nepal", "color": "#DC2626",
         "stadium": "Dashrath Rangasala",       "coach": "Vincenzo Alberto Annese",
         "formation": "4-3-3", "players": [],   "founded": 1951, "logo": _logo(1545)},
        {"name": "Nepal Women's National Team", "country": "Nepal", "color": "#BE185D",
         "stadium": "Dashrath Rangasala",        "coach": "Kumar Thapa",
         "formation": "4-4-2", "players": [],    "founded": 1980, "logo": _logo(17890)},

        # ─── A-Division clubs ─────────────────────────────────────────────
        {"name": "Machhindra FC",              "country": "Nepal", "color": "#047857",
         "stadium": "Dashrath Rangasala",      "coach": "Kishore Kumar",
         "formation": "4-4-2", "players": [],  "founded": 1966, "logo": _logo(12553)},
        {"name": "Manang Marshyangdi Club",    "country": "Nepal", "color": "#1E3A8A",
         "stadium": "Halchowk Stadium",        "coach": "Tope Ayodeji Fuja",
         "formation": "4-3-3", "players": [],  "founded": 1982, "logo": _logo(8033)},
        {"name": "Three Star Club",            "country": "Nepal", "color": "#B45309",
         "stadium": "Pokhara Stadium",         "coach": "Johnson Singh",
         "formation": "4-2-3-1", "players": [], "founded": 1975, "logo": _logo(8049)},
        {"name": "Tribhuvan Army Club",        "country": "Nepal", "color": "#15803D",
         "stadium": "Dashrath Rangasala",      "coach": "Hari Khadka",
         "formation": "4-3-3", "players": [],  "founded": 1957, "logo": _logo(12554)},
        {"name": "New Road Team",              "country": "Nepal", "color": "#7C3AED",
         "stadium": "ANFA Complex",            "coach": "Bikash Thapa",
         "formation": "4-4-2", "players": [],  "founded": 1956, "logo": _logo(12556)},
        {"name": "APF FC",                     "country": "Nepal", "color": "#0369A1",
         "stadium": "Police Ground",           "coach": "Nirajan Rayamajhi",
         "formation": "4-3-3", "players": [],  "founded": 1997, "logo": _logo(12547)},
        {"name": "Himalayan Sherpa Club",      "country": "Nepal", "color": "#DC4626",
         "stadium": "Dashrath Rangasala",      "coach": "Prem Thapa",
         "formation": "4-4-2", "players": [],  "founded": 2006, "logo": _logo(12551)},
        {"name": "Nepal Police Club",          "country": "Nepal", "color": "#1D4ED8",
         "stadium": "Police Ground",           "coach": "Suman Lama",
         "formation": "4-3-3", "players": [],  "founded": 1952, "logo": _logo(12555)},
        {"name": "Sankata Club",               "country": "Nepal", "color": "#9333EA",
         "stadium": "ANFA Complex",            "coach": "Rohit Shrestha",
         "formation": "4-4-2", "players": [],  "founded": 1954, "logo": _logo(12557)},
        {"name": "Friends Club",               "country": "Nepal", "color": "#F59E0B",
         "stadium": "Dashrath Rangasala",      "coach": "Niraj Basnet",
         "formation": "4-3-3", "players": [],  "founded": 1984, "logo": _logo(12550)},
        {"name": "Brigade Boys Club",          "country": "Nepal", "color": "#EF4444",
         "stadium": "Halchowk Stadium",        "coach": "Anil KC",
         "formation": "4-4-2", "players": [],  "founded": 1989, "logo": _logo(12548)},
        {"name": "Chyasal Youth Club",         "country": "Nepal", "color": "#10B981",
         "stadium": "ANFA Complex",            "coach": "Suresh Tamang",
         "formation": "4-3-3", "players": [],  "founded": 1990, "logo": _logo(12549)},

        # ─── International opponents (fixture placeholders) ───────────────
        {"name": "India",         "country": "India",      "color": "#FF9933",
         "stadium": "Salt Lake Stadium",         "coach": "Manolo Márquez",
         "formation": "4-2-3-1", "players": [],  "founded": 1937, "logo": _logo(1537)},
        {"name": "Bhutan",        "country": "Bhutan",     "color": "#FF8000",
         "stadium": "Changlimithang Stadium",    "coach": "Pema Dorji",
         "formation": "4-4-2", "players": [],    "founded": 1983, "logo": _logo(1540)},
        {"name": "Bangladesh",    "country": "Bangladesh", "color": "#006A4E",
         "stadium": "Bangabandhu National Stadium", "coach": "Javier Cabrera",
         "formation": "4-3-3", "players": [],    "founded": 1972, "logo": _logo(1560)},
        {"name": "Pakistan",      "country": "Pakistan",   "color": "#01411C",
         "stadium": "Jinnah Stadium",            "coach": "Stephen Constantine",
         "formation": "4-4-2", "players": [],    "founded": 1948, "logo": _logo(5535)},
        {"name": "India Women",   "country": "India",      "color": "#FF9933",
         "stadium": "Salt Lake Stadium",         "coach": "Suren Chettri",
         "formation": "4-3-3", "players": [],    "founded": 1979, "logo": _logo(16931)},
    ]
    db.teams.insert_many(teams)
    print(f"  Inserted {len(teams)} teams ({len(teams) - 5} Nepali + 5 international opponents)")


def seed_players(db, team_lookup: dict):
    db.players.drop()
    players = []

    nat_m_id = team_lookup.get("nepal national team")
    nat_f_id = team_lookup.get("nepal women's national team")

    squad_lookup: dict[str, dict] = {}
    if NEPALI_SQUAD_CSV.exists():
        with open(NEPALI_SQUAD_CSV, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                name = row.get("Player Name", "").strip()
                if name:
                    squad_lookup[name.lower()] = row
    print(f"  Squad lookup built: {len(squad_lookup)} entries")

    nepali_count = 0
    if NEPALI_CSV.exists():
        with open(NEPALI_CSV, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                name = row.get("Player Name", "Unknown").strip()
                position = row.get("Position", "MF").strip()
                role = row.get("Role", position).strip()
                gender_raw = row.get("Gender", "Male").strip()
                gender = "F" if gender_raw.lower() in ("female", "f") else "M"
                appearances = _safe_int(row.get("Matches Played", 0))
                goals = _safe_int(row.get("Goals", 0))
                assists = _safe_int(row.get("Assists", 0))

                stats = _stats_from_role(role, position)
                stats = _apply_performance_boost(stats, goals, assists, appearances)

                sq = squad_lookup.get(name.lower(), {})
                age = _safe_int(sq.get("Age", 24), 24) or 24
                caps = _safe_int(sq.get("Caps", appearances)) or appearances
                yellow_cards = _safe_int(sq.get("Yellow Cards", 0))
                red_cards = _safe_int(sq.get("Red Cards", 0))
                market_value = _safe_int(sq.get("Market Value (€)", 0))
                current_club = (sq.get("Current Club", "") or "").strip() or "Nepal"
                nsl_team = (sq.get("NSL Team", "") or "").strip() or None

                team_id = (
                    _find_team_id(nsl_team or "", team_lookup)
                    or _find_team_id(current_club, team_lookup)
                    or (nat_f_id if (gender == "F" and name.lower() in squad_lookup) else None)
                    or (nat_m_id if (gender == "M" and name.lower() in squad_lookup) else None)
                )

                _height = impute_height("Nepali", position)
                _weight = impute_weight(_height, position)
                _foot   = impute_preferred_foot(name, position)
                if market_value == 0 and _mv_model is not None:
                    market_value = impute_market_value(
                        {
                            "age": age, "position": position,
                            "eloRating": _elo_from_stats(stats),
                            "appearances": caps, "goals": goals, "assists": assists,
                            **stats,
                        },
                        _mv_model,
                    )

                doc: dict = {
                    "name": name,
                    "position": position,
                    "nationality": "Nepali",
                    "age": age,
                    "gender": gender,
                    "height": _height,
                    "weight": _weight,
                    "preferredFoot": _foot,
                    "currentClub": current_club,
                    "nslTeam": nsl_team,
                    "marketValue": market_value,
                    "stats": stats,
                    "careerStats": {
                        "appearances": caps,
                        "goals": goals,
                        "assists": assists,
                        "yellowCards": yellow_cards,
                        "redCards": red_cards,
                    },
                    "eloRating": _elo_from_stats(stats),
                    "source": "nepali",
                    "createdAt": datetime.utcnow(),
                }
                if team_id:
                    doc["team"] = team_id
                players.append(doc)
                nepali_count += 1
    else:
        print(f"  Warning: {NEPALI_CSV} not found")
    print(f"  Loaded {nepali_count} Nepali players")

    euro_count = 0
    if EUROPEAN_CSV.exists():
        with open(EUROPEAN_CSV, newline="", encoding="utf-8", errors="replace") as f:
            for row in csv.DictReader(f):
                name = row.get("Player", "").strip()
                if not name:
                    continue
                raw_pos = row.get("Pos", "MF").strip()
                position = _map_euro_pos(raw_pos)
                nation = row.get("Nation", "").strip()
                squad = row.get("Squad", "").strip()
                comp = row.get("Comp", "").strip()
                age = _safe_int(row.get("Age", 25), 25) or 25
                appearances = _safe_int(row.get("MP", 0))
                goals = _safe_int(row.get("Gls", 0))
                assists = _safe_int(row.get("Ast", 0))
                yellow_cards = _safe_int(row.get("CrdY", 0))
                red_cards = _safe_int(row.get("CrdR", 0))

                stats = dict(POS_STATS.get(position, POS_STATS["MF"]))
                stats = _apply_performance_boost(stats, goals, assists, appearances)
                for key in stats:
                    stats[key] = _clamp(stats[key] + random.randint(-6, 6))

                _height = impute_height(nation, position)
                _weight = impute_weight(_height, position)
                _foot   = impute_preferred_foot(name, position)
                _euro_mv = impute_market_value(
                    {
                        "age": age, "position": position,
                        "eloRating": _elo_from_stats(stats),
                        "appearances": appearances, "goals": goals, "assists": assists,
                        **stats,
                    },
                    _mv_model,
                )

                players.append({
                    "name": name,
                    "position": position,
                    "nationality": nation,
                    "age": age,
                    "gender": "M",
                    "height": _height,
                    "weight": _weight,
                    "preferredFoot": _foot,
                    "marketValue": _euro_mv,
                    "currentClub": squad,
                    "competition": comp,
                    "stats": stats,
                    "careerStats": {
                        "appearances": appearances,
                        "goals": goals,
                        "assists": assists,
                        "yellowCards": yellow_cards,
                        "redCards": red_cards,
                    },
                    "eloRating": _elo_from_stats(stats),
                    "source": "european",
                    "createdAt": datetime.utcnow(),
                })
                euro_count += 1
    else:
        print(f"  Warning: {EUROPEAN_CSV} not found")
    print(f"  Loaded {euro_count} European players")

    if players:
        db.players.insert_many(players)
        print(f"  Total: {len(players)} players inserted")
    else:
        print("  ERROR: no players inserted")


def _gen_name(first_names: list, surnames: list, used: set) -> str:
    for _ in range(60):
        name = f"{random.choice(first_names)} {random.choice(surnames)}"
        if name not in used:
            used.add(name)
            return name
    name = f"{random.choice(first_names)} {random.choice(surnames)} {random.randint(2, 9)}"
    used.add(name)
    return name


def seed_generated_players(db):
    """Generate all team players as dummy data (TARGET_SQUAD per team).
    Nepal clubs/national: Nepali names + source='nepali'.
    International opponents: country-specific names + source='international'.
    Primary player seeder — no CSV files required.
    """
    db.players.drop()
    used_names: set[str] = set()
    generated = []

    all_teams = list(db.teams.find())

    for team in all_teams:
        country = team.get("country", "Nepal")
        is_nepal_country = country == "Nepal"
        is_national = "National Team" in team["name"]
        is_women = "Women" in team["name"]
        gender = "F" if is_women else "M"

        if is_nepal_country:
            first_names = NEPALI_FIRST_NAMES_F if is_women else NEPALI_FIRST_NAMES_M
            surnames = NEPALI_SURNAMES
            nationality = "Nepali"
            quality_lo, quality_hi = (0.60, 0.85) if is_national else (0.35, 0.65)
        else:
            pool = INTL_NAMES.get(country, INTL_NAMES["India"])
            first_names = pool["F"] if is_women else pool["M"]
            surnames = pool["surnames"]
            nationality = country
            # India > Bangladesh/Pakistan > Bhutan in SAFF hierarchy
            quality_map = {"India": (0.55, 0.72), "Bangladesh": (0.45, 0.62),
                           "Pakistan": (0.45, 0.62), "Bhutan": (0.28, 0.48)}
            quality_lo, quality_hi = quality_map.get(country, (0.40, 0.60))

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
                    "eloRating": _elo,
                    "source": "nepali" if is_nepal_country else country.lower(),
                    "generated": True,
                    "team": team["_id"],
                    "createdAt": datetime.utcnow(),
                })

    if generated:
        db.players.insert_many(generated)
    print(f"  Generated {len(generated)} players to fill squad gaps")
    for team in all_teams:
        total = db.players.count_documents({"team": team["_id"]})
        print(f"    {team['name']}: {total} players")


# ─── European dummy players (Algorithm 2 comparison pool) ────────────────────

_EURO_NATIONS = [
    ("eng", "England",     ["Liam", "James", "Harry", "Jack", "Oliver", "George", "Mason", "Marcus", "Declan", "Bukayo"],
     ["Smith", "Jones", "Brown", "Wilson", "Taylor", "Davies", "Evans", "Walker", "Shaw", "Rice"]),
    ("ger", "Germany",     ["Lukas", "Thomas", "Manuel", "Leon", "Kai", "Joshua", "Toni", "Serge", "Florian", "Niklas"],
     ["Müller", "Schmidt", "Weber", "Wagner", "Fischer", "Becker", "Hoffmann", "Schneider", "Kroos", "Rüdiger"]),
    ("esp", "Spain",       ["Pablo", "Marcos", "Alejandro", "Sergio", "Jordi", "Pedri", "Gavi", "Carlos", "Antonio", "Rafael"],
     ["García", "Fernández", "Martínez", "López", "González", "Torres", "Alonso", "Busquets", "Alba", "Azpilicueta"]),
    ("fra", "France",      ["Antoine", "Hugo", "Kylian", "Raphaël", "Benjamin", "Paul", "Ousmane", "Theo", "Eduardo", "Jules"],
     ["Dupont", "Martin", "Bernard", "Dubois", "Giroud", "Pogba", "Griezmann", "Pavard", "Kounde", "Varane"]),
    ("ita", "Italy",       ["Marco", "Giorgio", "Leonardo", "Nicolo", "Federico", "Manuel", "Giacomo", "Lorenzo", "Davide", "Emerson"],
     ["Rossi", "Ferrari", "Esposito", "Bianchi", "Verratti", "Barella", "Jorginho", "Donnarumma", "Bonucci", "Chiellini"]),
    ("por", "Portugal",    ["Bernardo", "Joao", "Diogo", "Ruben", "Rafael", "Goncalo", "Nuno", "Bruno", "William", "Ricardo"],
     ["Silva", "Santos", "Fernandes", "Costa", "Dias", "Cancelo", "Neves", "Jota", "Guedes", "Pepe"]),
    ("ned", "Netherlands", ["Virgil", "Matthijs", "Frenkie", "Steven", "Memphis", "Quincy", "Ryan", "Davy", "Teun", "Denzel"],
     ["van Dijk", "de Ligt", "de Jong", "Bergwijn", "Depay", "Promes", "Gravenberch", "Klaasen", "Blind", "Dumfries"]),
    ("bra", "Brazil",      ["Gabriel", "Lucas", "Vinicius", "Rodrygo", "Endrick", "Raphael", "Matheus", "Thiago", "Casemiro", "Marquinhos"],
     ["Silva", "Santos", "Oliveira", "Costa", "Pereira", "Alves", "Neto", "Ferreira", "Souza", "Barbosa"]),
    ("arg", "Argentina",   ["Enzo", "Julian", "Rodrigo", "Alexis", "Thiago", "Emiliano", "Cristian", "Leandro", "Nicolas", "Paulo"],
     ["Fernandez", "Alvarez", "De Paul", "Mac Allister", "Paredes", "Martinez", "Romero", "Molina", "Acuna", "Dybala"]),
    ("bel", "Belgium",     ["Romelu", "Kevin", "Eden", "Youri", "Timothy", "Axel", "Leandro", "Thomas", "Toby", "Jan"],
     ["Lukaku", "De Bruyne", "Hazard", "Tielemans", "Castagne", "Witsel", "Dendoncker", "Meunier", "Alderweireld", "Vertonghen"]),
    ("hrv", "Croatia",     ["Luka", "Mateo", "Marcelo", "Ivan", "Ante", "Mario", "Vedran", "Dejan", "Bruno", "Josko"],
     ["Modrić", "Kovačić", "Brozović", "Perišić", "Rebić", "Mandžukić", "Ćorluka", "Lovren", "Budimir", "Gvardiol"]),
    ("dnk", "Denmark",     ["Christian", "Simon", "Pierre-Emile", "Kasper", "Joakim", "Daniel", "Mikkel", "Yussuf", "Andreas", "Jannik"],
     ["Eriksen", "Kjaer", "Hojbjerg", "Schmeichel", "Maehle", "Wass", "Damsgaard", "Poulsen", "Christensen", "Olsen"]),
]

_EURO_CLUB_NAMES = [
    "City FC", "United", "Athletic", "Sporting", "Atletico", "Dynamo", "Rapid",
    "Victoria", "Olympia", "Cosmos", "Stars", "Eagles", "Lions", "Rangers",
    "Rovers", "Wanderers", "Town", "Palace", "Borough", "Albion",
]


def seed_european_generated(db, count: int = 600):
    """Generate dummy European players for Algorithm 2 player comparison pool.
    No CSV required — purely synthetic data covering 12 nations, all positions.
    """
    used_names: set[str] = {p["name"] for p in db.players.find({}, {"name": 1})}
    generated = []

    pos_weights = [("GK", 0.08), ("DF", 0.30), ("MF", 0.37), ("FW", 0.25)]
    positions   = [p for p, _ in pos_weights]
    weights     = [w for _, w in pos_weights]

    per_nation = count // len(_EURO_NATIONS)
    extras     = count - per_nation * len(_EURO_NATIONS)

    for i, (nat_code, nation, first_names, surnames) in enumerate(_EURO_NATIONS):
        n = per_nation + (1 if i < extras else 0)
        for _ in range(n):
            pos     = random.choices(positions, weights)[0]
            quality = random.uniform(0.42, 0.92)
            name    = _gen_name(first_names, surnames, used_names)
            stats   = dict(POS_STATS.get(pos, POS_STATS["MF"]))
            mod     = int((quality - 0.5) * 40)
            for k in stats:
                stats[k] = _clamp(stats[k] + mod + random.randint(-10, 10))

            age  = random.randint(17, 36)
            apps = random.randint(10, 300)
            goals   = random.randint(0, max(1, apps // 4)  if pos == "FW" else max(1, apps // 14))
            assists = random.randint(0, max(1, apps // 6)  if pos in ("MF", "FW") else max(1, apps // 20))
            elo  = _elo_from_stats(stats)
            mv   = impute_market_value(
                {"age": age, "position": pos, "eloRating": elo,
                 "appearances": apps, "goals": goals, "assists": assists, **stats},
                _mv_model,
            )
            club = f"{random.choice(_EURO_CLUB_NAMES)} {random.randint(1, 99):02d}"

            _height = impute_height(nation, pos)
            _weight = impute_weight(_height, pos)
            _foot   = impute_preferred_foot(name, pos)

            generated.append({
                "name":          name,
                "position":      pos,
                "nationality":   f"{nat_code} {nat_code.upper()}",
                "age":           age,
                "gender":        "M",
                "height":        _height,
                "weight":        _weight,
                "preferredFoot": _foot,
                "currentClub":   club,
                "marketValue":   mv,
                "stats":         stats,
                "careerStats": {
                    "appearances": apps, "goals": goals, "assists": assists,
                    "yellowCards": random.randint(0, max(0, apps // 10)),
                    "redCards":    random.randint(0, 2),
                },
                "eloRating": elo,
                "source":    "european",
                "generated": True,
                "createdAt": datetime.utcnow(),
            })

    if generated:
        db.players.insert_many(generated)
    print(f"  Generated {len(generated)} European comparison players across {len(_EURO_NATIONS)} nations")


def seed_matches(db):
    db.matches.drop()
    t = {team["name"]: team["_id"] for team in db.teams.find()}
    now = datetime.utcnow()

    def match(home, away, comp, days, status, venue, hf="4-3-3", af="4-3-3",
               result=None, votes=None):
        h, a = t.get(home), t.get(away)
        if not h or not a:
            print(f"  Warning: team not found — {home!r} or {away!r}")
            return None
        home_lineup = _build_lineup(db, h, hf)
        away_lineup = _build_lineup(db, a, af)
        return {
            "homeTeam": h, "awayTeam": a,
            "date": now + timedelta(days=days),
            "competition": comp, "status": status, "venue": venue,
            "homeLineup": home_lineup, "awayLineup": away_lineup,
            "homeFormation": hf, "awayFormation": af,
            **({"result": result} if result else {}),
            "voteCounts": votes or {"home_win": 0, "draw": 0, "away_win": 0},
        }

    matches_raw = [
        # ─── Nepal Men — International ────────────────────────────────────
        match("Nepal National Team", "India",
              "SAFF Championship 2025", 7, "upcoming",
              "Dashrath Rangasala", "4-3-3", "4-2-3-1"),
        match("Nepal National Team", "Bhutan",
              "SAFF Championship 2025", 14, "upcoming",
              "Dashrath Rangasala", "4-3-3", "4-4-2"),
        match("Nepal National Team", "Bangladesh",
              "SAFF Championship 2025", 0, "live",
              "Dashrath Rangasala", "4-3-3", "4-3-3",
              votes={"home_win": 42, "draw": 11, "away_win": 18}),
        match("Nepal National Team", "Bangladesh",
              "AFC Asian Cup Qualifier", -10, "completed",
              "Dashrath Rangasala", "4-3-3", "4-3-3",
              result={"homeScore": 2, "awayScore": 1},
              votes={"home_win": 45, "draw": 8, "away_win": 12}),
        match("Pakistan", "Nepal National Team",
              "SAFF Championship 2024", -30, "completed",
              "Jinnah Stadium", "4-4-2", "4-3-3",
              result={"homeScore": 1, "awayScore": 1},
              votes={"home_win": 15, "draw": 22, "away_win": 38}),
        match("India", "Nepal National Team",
              "SAFF Championship 2024", -60, "completed",
              "Salt Lake Stadium", "4-2-3-1", "4-3-3",
              result={"homeScore": 2, "awayScore": 0},
              votes={"home_win": 20, "draw": 10, "away_win": 35}),

        # ─── Nepal Women — International ──────────────────────────────────
        match("Nepal Women's National Team", "India Women",
              "SAFF Women's Championship 2025", 12, "upcoming",
              "Dashrath Rangasala", "4-4-2", "4-3-3"),
        match("Nepal Women's National Team", "Bhutan",
              "SAFF Women's Championship 2025", 19, "upcoming",
              "Dashrath Rangasala", "4-4-2", "4-4-2"),
        match("Nepal Women's National Team", "Bangladesh",
              "SAFF Women's Championship 2025", -8, "completed",
              "Dashrath Rangasala", "4-4-2", "4-4-2",
              result={"homeScore": 2, "awayScore": 0},
              votes={"home_win": 28, "draw": 5, "away_win": 6}),
        match("Nepal Women's National Team", "Bhutan",
              "SAFF Women's Championship 2024", -25, "completed",
              "Dashrath Rangasala", "4-4-2", "4-4-2",
              result={"homeScore": 3, "awayScore": 1},
              votes={"home_win": 32, "draw": 4, "away_win": 3}),

        # ─── A-Division — Upcoming ────────────────────────────────────────
        match("Machhindra FC", "Manang Marshyangdi Club",
              "Martyr's Memorial A-Division League", 5, "upcoming",
              "Dashrath Rangasala", "4-4-2", "4-3-3"),
        match("Three Star Club", "Tribhuvan Army Club",
              "Martyr's Memorial A-Division League", 8, "upcoming",
              "Pokhara Stadium", "4-2-3-1", "4-3-3"),
        match("New Road Team", "APF FC",
              "Martyr's Memorial A-Division League", 11, "upcoming",
              "ANFA Complex", "4-4-2", "4-3-3"),
        match("Himalayan Sherpa Club", "Sankata Club",
              "Martyr's Memorial A-Division League", 15, "upcoming",
              "Dashrath Rangasala", "4-4-2", "4-4-2"),
        match("Nepal Police Club", "Friends Club",
              "Martyr's Memorial A-Division League", 18, "upcoming",
              "Police Ground", "4-3-3", "4-3-3"),
        match("Brigade Boys Club", "Chyasal Youth Club",
              "Martyr's Memorial A-Division League", 22, "upcoming",
              "Halchowk Stadium", "4-4-2", "4-3-3"),

        # ─── A-Division — Completed ───────────────────────────────────────
        match("Manang Marshyangdi Club", "Three Star Club",
              "Martyr's Memorial A-Division League", -7, "completed",
              "Halchowk Stadium", "4-3-3", "4-2-3-1",
              result={"homeScore": 2, "awayScore": 1},
              votes={"home_win": 18, "draw": 6, "away_win": 12}),
        match("Machhindra FC", "New Road Team",
              "Martyr's Memorial A-Division League", -14, "completed",
              "Dashrath Rangasala", "4-4-2", "4-4-2",
              result={"homeScore": 1, "awayScore": 1},
              votes={"home_win": 10, "draw": 14, "away_win": 8}),
        match("APF FC", "Himalayan Sherpa Club",
              "Martyr's Memorial A-Division League", -21, "completed",
              "Police Ground", "4-3-3", "4-4-2",
              result={"homeScore": 3, "awayScore": 0},
              votes={"home_win": 20, "draw": 4, "away_win": 7}),
        match("Tribhuvan Army Club", "Nepal Police Club",
              "Martyr's Memorial A-Division League", -28, "completed",
              "Dashrath Rangasala", "4-3-3", "4-3-3",
              result={"homeScore": 0, "awayScore": 2},
              votes={"home_win": 12, "draw": 5, "away_win": 16}),
        match("Sankata Club", "Brigade Boys Club",
              "Martyr's Memorial A-Division League", -35, "completed",
              "ANFA Complex", "4-4-2", "4-4-2",
              result={"homeScore": 1, "awayScore": 0},
              votes={"home_win": 9, "draw": 7, "away_win": 6}),
        match("Friends Club", "Chyasal Youth Club",
              "Martyr's Memorial A-Division League", -42, "completed",
              "Dashrath Rangasala", "4-3-3", "4-3-3",
              result={"homeScore": 2, "awayScore": 2},
              votes={"home_win": 8, "draw": 12, "away_win": 9}),
        match("Three Star Club", "Machhindra FC",
              "Martyr's Memorial A-Division League", -49, "completed",
              "Pokhara Stadium", "4-2-3-1", "4-4-2",
              result={"homeScore": 3, "awayScore": 0},
              votes={"home_win": 22, "draw": 3, "away_win": 4}),
        match("Nepal Police Club", "Manang Marshyangdi Club",
              "Martyr's Memorial A-Division League", -56, "completed",
              "Police Ground", "4-3-3", "4-3-3",
              result={"homeScore": 1, "awayScore": 2},
              votes={"home_win": 11, "draw": 6, "away_win": 19}),
    ]

    valid = [m for m in matches_raw if m]
    db.matches.insert_many(valid)
    print(f"  Inserted {len(valid)} matches")
    for m in valid:
        hc = len(m.get("homeLineup", []))
        ac = len(m.get("awayLineup", []))
        print(f"    {m['status']:9s}  home lineup: {hc}  away: {ac}")


def seed_demo_users(db):
    db.users.drop()
    import bcrypt
    pw_hash = bcrypt.hashpw(b"fotnep2025", bcrypt.gensalt()).decode()
    db.users.insert_many([
        {"email": "admin@fotnep.com", "passwordHash": pw_hash, "name": "Admin",
         "reputation": 80, "predictionsCorrect": 15, "predictionsTotal": 20,
         "createdAt": datetime.utcnow()},
        {"email": "demo@fotnep.com", "passwordHash": pw_hash, "name": "Demo User",
         "reputation": 50, "predictionsCorrect": 0, "predictionsTotal": 0,
         "createdAt": datetime.utcnow()},
    ])
    print("  Inserted demo users (admin@fotnep.com / demo@fotnep.com — password: fotnep2025)")


def seed_indexes(db):
    db.players.create_index("name")
    db.players.create_index("source")
    db.players.create_index("position")
    db.players.create_index("gender")
    db.players.create_index("eloRating")
    db.players.create_index("team")
    db.matches.create_index("status")
    db.matches.create_index("date")
    db.users.create_index("email", unique=True)
    db.votes.create_index([("userId", 1), ("matchId", 1)], unique=True)
    print("  Indexes created")


if __name__ == "__main__":
    db = get_db()

    print("Seeding teams...")
    seed_teams(db)

    print("Generating team squad players (20 per team, role-based dummy data)...")
    seed_generated_players(db)

    print("Generating European comparison players (Algorithm 2 pool)...")
    seed_european_generated(db, count=600)

    print("Seeding users...")
    seed_demo_users(db)

    print("Seeding matches...")
    seed_matches(db)

    print("Creating indexes...")
    seed_indexes(db)

    print("\n=== Seeding complete ===")
    print(f"  Players   : {db.players.count_documents({})}")
    print(f"    ↳ Nepali       : {db.players.count_documents({'source': 'nepali'})}")
    print(f"    ↳ International: {db.players.count_documents({'source': 'international'})}")
    print(f"    ↳ European     : {db.players.count_documents({'source': 'european'})}")
    print(f"  Teams     : {db.teams.count_documents({})}")
    print(f"    ↳ Nepal clubs : {db.teams.count_documents({'country': 'Nepal'})}")
    print(f"  Matches   : {db.matches.count_documents({})}")
    print(f"    ↳ upcoming : {db.matches.count_documents({'status': 'upcoming'})}")
    print(f"    ↳ live     : {db.matches.count_documents({'status': 'live'})}")
    print(f"    ↳ completed: {db.matches.count_documents({'status': 'completed'})}")
    print(f"  Users     : {db.users.count_documents({})}")
