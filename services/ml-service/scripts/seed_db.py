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

# 3-letter football-prefix codes for SAFF opponents, so `nationality` follows the
# same "xx XXX" convention frontend/src/utils/nationality.ts parses into a flag
# emoji (a bare country name like "India" falls through to the 🌍 placeholder).
SAFF_NAT_CODE = {"India": "ind", "Bhutan": "btn", "Bangladesh": "ban", "Pakistan": "pak"}


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

        # ─── NSL (Nepal Super League) franchise clubs ──────────────────────
        # Local logos (data/logos/) — stadium/coach unverified, left blank (UI falls back to '—')
        {"name": "Kathmandu Rayzrs",           "country": "Nepal", "color": "#DC2626",
         "stadium": "",                        "coach": "",
         "formation": "4-3-3", "players": [],  "founded": 2021, "logo": "/logos/kathmandu-rayzrs.png"},
        {"name": "Pokhara Thunders",           "country": "Nepal", "color": "#F59E0B",
         "stadium": "",                        "coach": "",
         "formation": "4-3-3", "players": [],  "founded": 2021, "logo": "/logos/pokhara-thunders.webp"},
        {"name": "FC Chitwan",                 "country": "Nepal", "color": "#16A34A",
         "stadium": "",                        "coach": "",
         "formation": "4-3-3", "players": [],  "founded": 2021, "logo": "/logos/fc-chitwan.webp"},
        {"name": "Butwal Lumbini FC",          "country": "Nepal", "color": "#2563EB",
         "stadium": "",                        "coach": "",
         "formation": "4-3-3", "players": [],  "founded": 2021, "logo": "/logos/butwal-lumbini-fc.webp"},
        {"name": "Dhangadi FC",                "country": "Nepal", "color": "#7C2D12",
         "stadium": "",                        "coach": "",
         "formation": "4-3-3", "players": [],  "founded": 2021, "logo": "/logos/dhangadi-fc.webp"},
        {"name": "Jhapa FC",                   "country": "Nepal", "color": "#0891B2",
         "stadium": "",                        "coach": "",
         "formation": "4-3-3", "players": [],  "founded": 2021, "logo": "/logos/jhapa-fc.webp"},
        {"name": "Lalitpur City FC",           "country": "Nepal", "color": "#9333EA",
         "stadium": "",                        "coach": "",
         "formation": "4-3-3", "players": [],  "founded": 2021, "logo": "/logos/lalitpur-city-fc.png"},

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


def _norm_nepali_pos(raw: str) -> str:
    first = raw.strip().upper().split("/")[0].strip()
    return first if first in ("GK", "DF", "MF", "FW") else "MF"


def seed_real_nepal_players(db):
    """Load the ~100 real Nepali players from NEPALI_CSV (name/position/role/gender/
    career totals), enriched with age/caps/cards/market value/club from
    NEPALI_SQUAD_CSV where available. Players whose club can't be resolved are left
    without a `team` field — _distribute_unassigned_players() places them afterward.
    Does not drop the players collection (caller owns that).
    """
    team_lookup = _build_team_lookup(db)
    players = []

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
                raw_position = row.get("Position", "MF").strip()
                position = _norm_nepali_pos(raw_position)
                role = row.get("Role", raw_position).strip()
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
                        source="nepali",
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
    print(f"  Loaded {nepali_count} real Nepali players")

    if players:
        db.players.insert_many(players)
        with_team = sum(1 for p in players if "team" in p)
        print(f"  Inserted {len(players)} real players ({with_team} with a resolved club, "
              f"{len(players) - with_team} pending distribution)")
    else:
        print("  ERROR: no real Nepali players inserted")


# ─── Real SAFF opponent internationals (best-effort, conservative list) ──────
# Only players reasonably well known to have represented these countries.
# Deliberately not exhaustive — seed_generated_players() tops up the rest of
# each squad with the existing name-pool generator.

SAFF_REAL_PLAYERS: dict[str, list[tuple[str, str, float]]] = {
    "India": [
        ("Gurpreet Singh Sandhu", "GK", 0.74),
        ("Sandesh Jhingan", "DF", 0.70),
        ("Anwar Ali", "DF", 0.66),
        ("Akash Mishra", "DF", 0.62),
        ("Rahul Bheke", "DF", 0.58),
        ("Anirudh Thapa", "MF", 0.68),
        ("Naorem Mahesh Singh", "MF", 0.64),
        ("Brandon Fernandes", "MF", 0.63),
        ("Apuia Ralte", "MF", 0.60),
        ("Sahal Abdul Samad", "MF", 0.58),
        ("Lallianzuala Chhangte", "FW", 0.72),
        ("Manvir Singh", "FW", 0.63),
        ("Liston Colaco", "FW", 0.62),
    ],
    "India Women": [
        ("Bala Devi", "FW", 0.68),
        ("Manisha Kalyan", "FW", 0.66),
        ("Dangmei Grace", "FW", 0.58),
        ("Sandhiya Ranganathan", "GK", 0.56),
        ("Karthika Angamuthu", "GK", 0.54),
        ("Ratanbala Devi", "MF", 0.56),
        ("Anju Tamang", "FW", 0.55),
    ],
    "Bangladesh": [
        ("Jamal Bhuyan", "MF", 0.62),
        ("Hamza Choudhury", "DF", 0.66),
        ("Tapu Barman", "DF", 0.58),
        ("Rahmat Mia", "DF", 0.54),
        ("Sohel Rana", "MF", 0.56),
        ("Rakib Hossain", "FW", 0.56),
        ("Faisal Ahmed Fahim", "FW", 0.54),
        ("Mitul Marma", "GK", 0.52),
    ],
    "Pakistan": [
        ("Otis Khan", "FW", 0.58),
        ("Harun Hamid", "GK", 0.54),
        ("Easah Suliman", "DF", 0.54),
        ("Abdullah Iqbal", "MF", 0.52),
        ("Adil Nabi", "FW", 0.52),
    ],
    "Bhutan": [
        ("Chencho Gyeltshen", "FW", 0.56),
        ("Nima Wangdi", "MF", 0.48),
        ("Karma Shedrup Tshering", "GK", 0.44),
    ],
}


def seed_real_saff_players(db):
    """Insert the curated real-name SAFF opponent internationals above,
    assigned directly to their national team. Does not drop players collection.
    """
    teams = {t["name"]: t["_id"] for t in db.teams.find()}
    inserted = []
    for team_name, roster in SAFF_REAL_PLAYERS.items():
        team_id = teams.get(team_name)
        if not team_id:
            continue
        country = team_name.replace(" Women", "")
        is_women = "Women" in team_name
        for name, pos, quality in roster:
            stats = _stats_from_role(_POS_ROLE_MAP[pos])
            mod = int((quality - 0.5) * 30)
            for k in stats:
                stats[k] = _clamp(stats[k] + mod + random.randint(-6, 6))
            age = random.randint(22, 32)
            apps = random.randint(15, 90)
            goals = random.randint(0, max(1, apps // 4) if pos == "FW" else max(1, apps // 12))
            assists = random.randint(0, max(1, apps // 6))
            elo = _elo_from_stats(stats)
            _height = impute_height(country, pos)
            _weight = impute_weight(_height, pos)
            _foot = impute_preferred_foot(name, pos)
            mv = impute_market_value(
                {"age": age, "position": pos, "eloRating": elo,
                 "appearances": apps, "goals": goals, "assists": assists, **stats},
                _mv_model,
                source=country.lower(),
            )
            nat_code = SAFF_NAT_CODE.get(country, country[:3].lower())
            inserted.append({
                "name": name,
                "position": pos,
                "nationality": f"{nat_code} {nat_code.upper()}",
                "age": age,
                "gender": "F" if is_women else "M",
                "height": _height,
                "weight": _weight,
                "preferredFoot": _foot,
                "currentClub": team_name,
                "marketValue": mv,
                "stats": stats,
                "careerStats": {
                    "appearances": apps, "goals": goals, "assists": assists,
                    "yellowCards": random.randint(0, max(0, apps // 8)),
                    "redCards": random.randint(0, 1),
                },
                "eloRating": elo,
                "source": country.lower(),
                "team": team_id,
                "createdAt": datetime.utcnow(),
            })
    if inserted:
        db.players.insert_many(inserted)
    print(f"  Inserted {len(inserted)} real SAFF internationals across {len(SAFF_REAL_PLAYERS)} squads")


def _gen_name(first_names: list, surnames: list, used: set) -> str:
    for _ in range(60):
        name = f"{random.choice(first_names)} {random.choice(surnames)}"
        if name not in used:
            used.add(name)
            return name
    name = f"{random.choice(first_names)} {random.choice(surnames)} {random.randint(2, 9)}"
    used.add(name)
    return name


def seed_generated_players(db, drop: bool = True):
    """Top up every team to TARGET_SQUAD with generated filler players.
    Nepal clubs/national: Nepali names + source='nepali'.
    International opponents: country-specific names + source=country.
    Only fills the gap below TARGET_SQUAD per team/position — real players
    seeded beforehand (seed_real_nepal_players, seed_real_saff_players) are
    left untouched and simply reduce how many fillers are needed.
    """
    if drop:
        db.players.drop()
    used_names: set[str] = {p["name"] for p in db.players.find({}, {"name": 1})}
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
            nat_code = SAFF_NAT_CODE.get(country, country[:3].lower())
            nationality = f"{nat_code} {nat_code.upper()}"
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
                    source="nepali" if is_nepal_country else country.lower(),
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


# ─── World-class players (Algorithm 2 comparison pool) ───────────────────────
# Real players from the top 5 European leagues (Premier League, La Liga, Serie A,
# Bundesliga, Ligue 1) plus the Saudi Pro League and MLS, curated by hand rather
# than generated. Squads reflect the 2025-26 season to the best of available
# knowledge (verified via web search for major summer-2025 transfers e.g.
# Wirtz/Alexander-Arnold/Frimpong/Isak/De Bruyne/Gyokeres) — a hobby comparison
# pool, not a live roster feed, so some drift after future transfer windows is
# expected. Ages are approximate. quality (0-1) drives the generated stat spread.
# Format: (name, pos, nation_code, nation_name, club, league, age, quality)

WORLD_CLASS_PLAYERS: list[tuple[str, str, str, str, str, str, int, float]] = [
    # ── Premier League ──
    # Manchester City
    ("Ederson", "GK", "bra", "Brazil", "Manchester City", "Premier League", 32, 0.83),
    ("Ruben Dias", "DF", "por", "Portugal", "Manchester City", "Premier League", 28, 0.87),
    ("Josko Gvardiol", "DF", "hrv", "Croatia", "Manchester City", "Premier League", 24, 0.83),
    ("Nathan Ake", "DF", "ned", "Netherlands", "Manchester City", "Premier League", 30, 0.76),
    ("Rico Lewis", "DF", "eng", "England", "Manchester City", "Premier League", 21, 0.72),
    ("Rodri", "MF", "esp", "Spain", "Manchester City", "Premier League", 29, 0.94),
    ("Bernardo Silva", "MF", "por", "Portugal", "Manchester City", "Premier League", 31, 0.87),
    ("Phil Foden", "MF", "eng", "England", "Manchester City", "Premier League", 26, 0.88),
    ("Savinho", "MF", "bra", "Brazil", "Manchester City", "Premier League", 21, 0.76),
    ("Erling Haaland", "FW", "nor", "Norway", "Manchester City", "Premier League", 25, 0.97),
    ("Omar Marmoush", "FW", "egy", "Egypt", "Manchester City", "Premier League", 26, 0.78),
    ("Jeremy Doku", "FW", "bel", "Belgium", "Manchester City", "Premier League", 23, 0.79),
    # Arsenal
    ("David Raya", "GK", "esp", "Spain", "Arsenal", "Premier League", 30, 0.87),
    ("Gabriel Magalhaes", "DF", "bra", "Brazil", "Arsenal", "Premier League", 27, 0.85),
    ("William Saliba", "DF", "fra", "France", "Arsenal", "Premier League", 24, 0.87),
    ("Jurrien Timber", "DF", "ned", "Netherlands", "Arsenal", "Premier League", 24, 0.78),
    ("Riccardo Calafiori", "DF", "ita", "Italy", "Arsenal", "Premier League", 23, 0.75),
    ("Declan Rice", "MF", "eng", "England", "Arsenal", "Premier League", 26, 0.91),
    ("Martin Odegaard", "MF", "nor", "Norway", "Arsenal", "Premier League", 27, 0.88),
    ("Mikel Merino", "MF", "esp", "Spain", "Arsenal", "Premier League", 29, 0.76),
    ("Bukayo Saka", "FW", "eng", "England", "Arsenal", "Premier League", 24, 0.92),
    ("Gabriel Martinelli", "FW", "bra", "Brazil", "Arsenal", "Premier League", 24, 0.78),
    ("Viktor Gyokeres", "FW", "swe", "Sweden", "Arsenal", "Premier League", 27, 0.85),
    ("Kai Havertz", "FW", "ger", "Germany", "Arsenal", "Premier League", 26, 0.80),
    # Liverpool
    ("Alisson", "GK", "bra", "Brazil", "Liverpool", "Premier League", 33, 0.87),
    ("Virgil van Dijk", "DF", "ned", "Netherlands", "Liverpool", "Premier League", 34, 0.87),
    ("Ibrahima Konate", "DF", "fra", "France", "Liverpool", "Premier League", 26, 0.80),
    ("Jeremie Frimpong", "DF", "ned", "Netherlands", "Liverpool", "Premier League", 24, 0.78),
    ("Milos Kerkez", "DF", "hun", "Hungary", "Liverpool", "Premier League", 21, 0.72),
    ("Florian Wirtz", "MF", "ger", "Germany", "Liverpool", "Premier League", 22, 0.90),
    ("Alexis Mac Allister", "MF", "arg", "Argentina", "Liverpool", "Premier League", 26, 0.85),
    ("Ryan Gravenberch", "MF", "ned", "Netherlands", "Liverpool", "Premier League", 23, 0.78),
    ("Dominik Szoboszlai", "MF", "hun", "Hungary", "Liverpool", "Premier League", 24, 0.79),
    ("Mohamed Salah", "FW", "egy", "Egypt", "Liverpool", "Premier League", 33, 0.94),
    ("Alexander Isak", "FW", "swe", "Sweden", "Liverpool", "Premier League", 26, 0.87),
    ("Cody Gakpo", "FW", "ned", "Netherlands", "Liverpool", "Premier League", 26, 0.78),
    # Manchester United
    ("Andre Onana", "GK", "cmr", "Cameroon", "Manchester United", "Premier League", 29, 0.72),
    ("Lisandro Martinez", "DF", "arg", "Argentina", "Manchester United", "Premier League", 27, 0.78),
    ("Noussair Mazraoui", "DF", "mar", "Morocco", "Manchester United", "Premier League", 27, 0.72),
    ("Leny Yoro", "DF", "fra", "France", "Manchester United", "Premier League", 20, 0.72),
    ("Bruno Fernandes", "MF", "por", "Portugal", "Manchester United", "Premier League", 31, 0.88),
    ("Casemiro", "MF", "bra", "Brazil", "Manchester United", "Premier League", 33, 0.74),
    ("Kobbie Mainoo", "MF", "eng", "England", "Manchester United", "Premier League", 20, 0.73),
    ("Rasmus Hojlund", "FW", "den", "Denmark", "Manchester United", "Premier League", 23, 0.72),
    ("Alejandro Garnacho", "FW", "arg", "Argentina", "Manchester United", "Premier League", 21, 0.74),
    ("Matheus Cunha", "FW", "bra", "Brazil", "Manchester United", "Premier League", 26, 0.78),
    ("Benjamin Sesko", "FW", "svn", "Slovenia", "Manchester United", "Premier League", 22, 0.75),
    # Chelsea
    ("Robert Sanchez", "GK", "esp", "Spain", "Chelsea", "Premier League", 27, 0.71),
    ("Levi Colwill", "DF", "eng", "England", "Chelsea", "Premier League", 22, 0.74),
    ("Wesley Fofana", "DF", "fra", "France", "Chelsea", "Premier League", 24, 0.73),
    ("Marc Cucurella", "DF", "esp", "Spain", "Chelsea", "Premier League", 27, 0.76),
    ("Moises Caicedo", "MF", "ecu", "Ecuador", "Chelsea", "Premier League", 23, 0.83),
    ("Enzo Fernandez", "MF", "arg", "Argentina", "Chelsea", "Premier League", 24, 0.83),
    ("Cole Palmer", "MF", "eng", "England", "Chelsea", "Premier League", 23, 0.90),
    ("Nicolas Jackson", "FW", "sen", "Senegal", "Chelsea", "Premier League", 24, 0.74),
    ("Christopher Nkunku", "FW", "fra", "France", "Chelsea", "Premier League", 27, 0.76),
    ("Joao Pedro", "FW", "bra", "Brazil", "Chelsea", "Premier League", 23, 0.77),
    ("Pedro Neto", "FW", "por", "Portugal", "Chelsea", "Premier League", 25, 0.76),
    # Tottenham
    ("Guglielmo Vicario", "GK", "ita", "Italy", "Tottenham Hotspur", "Premier League", 28, 0.76),
    ("Cristian Romero", "DF", "arg", "Argentina", "Tottenham Hotspur", "Premier League", 27, 0.80),
    ("Micky van de Ven", "DF", "ned", "Netherlands", "Tottenham Hotspur", "Premier League", 24, 0.77),
    ("James Maddison", "MF", "eng", "England", "Tottenham Hotspur", "Premier League", 28, 0.79),
    ("Yves Bissouma", "MF", "mli", "Mali", "Tottenham Hotspur", "Premier League", 28, 0.72),
    ("Son Heung-min", "FW", "kor", "South Korea", "Tottenham Hotspur", "Premier League", 33, 0.83),
    ("Dominic Solanke", "FW", "eng", "England", "Tottenham Hotspur", "Premier League", 27, 0.74),
    ("Richarlison", "FW", "bra", "Brazil", "Tottenham Hotspur", "Premier League", 28, 0.75),
    ("Dejan Kulusevski", "FW", "swe", "Sweden", "Tottenham Hotspur", "Premier League", 25, 0.78),
    ("Brennan Johnson", "FW", "wal", "Wales", "Tottenham Hotspur", "Premier League", 24, 0.71),
    # Newcastle United
    ("Nick Pope", "GK", "eng", "England", "Newcastle United", "Premier League", 33, 0.76),
    ("Sven Botman", "DF", "ned", "Netherlands", "Newcastle United", "Premier League", 25, 0.76),
    ("Kieran Trippier", "DF", "eng", "England", "Newcastle United", "Premier League", 35, 0.73),
    ("Bruno Guimaraes", "MF", "bra", "Brazil", "Newcastle United", "Premier League", 27, 0.84),
    ("Sandro Tonali", "MF", "ita", "Italy", "Newcastle United", "Premier League", 25, 0.79),
    ("Anthony Gordon", "FW", "eng", "England", "Newcastle United", "Premier League", 24, 0.78),
    ("Harvey Barnes", "FW", "eng", "England", "Newcastle United", "Premier League", 27, 0.71),
    # Aston Villa
    ("Emiliano Martinez", "GK", "arg", "Argentina", "Aston Villa", "Premier League", 33, 0.83),
    ("Ezri Konsa", "DF", "eng", "England", "Aston Villa", "Premier League", 27, 0.72),
    ("Pau Torres", "DF", "esp", "Spain", "Aston Villa", "Premier League", 28, 0.75),
    ("Youri Tielemans", "MF", "bel", "Belgium", "Aston Villa", "Premier League", 28, 0.74),
    ("John McGinn", "MF", "sco", "Scotland", "Aston Villa", "Premier League", 30, 0.73),
    ("Ollie Watkins", "FW", "eng", "England", "Aston Villa", "Premier League", 29, 0.81),
    ("Morgan Rogers", "FW", "eng", "England", "Aston Villa", "Premier League", 22, 0.74),

    # ── La Liga ──
    # Real Madrid
    ("Thibaut Courtois", "GK", "bel", "Belgium", "Real Madrid", "La Liga", 33, 0.90),
    ("Trent Alexander-Arnold", "DF", "eng", "England", "Real Madrid", "La Liga", 27, 0.86),
    ("Dani Carvajal", "DF", "esp", "Spain", "Real Madrid", "La Liga", 33, 0.79),
    ("Eder Militao", "DF", "bra", "Brazil", "Real Madrid", "La Liga", 27, 0.81),
    ("Antonio Rudiger", "DF", "ger", "Germany", "Real Madrid", "La Liga", 32, 0.83),
    ("Jude Bellingham", "MF", "eng", "England", "Real Madrid", "La Liga", 22, 0.95),
    ("Federico Valverde", "MF", "uru", "Uruguay", "Real Madrid", "La Liga", 27, 0.87),
    ("Aurelien Tchouameni", "MF", "fra", "France", "Real Madrid", "La Liga", 25, 0.82),
    ("Arda Guler", "MF", "tur", "Turkey", "Real Madrid", "La Liga", 21, 0.78),
    ("Kylian Mbappe", "FW", "fra", "France", "Real Madrid", "La Liga", 27, 0.98),
    ("Vinicius Junior", "FW", "bra", "Brazil", "Real Madrid", "La Liga", 25, 0.95),
    ("Rodrygo", "FW", "bra", "Brazil", "Real Madrid", "La Liga", 25, 0.83),
    ("Endrick", "FW", "bra", "Brazil", "Real Madrid", "La Liga", 19, 0.73),
    # Barcelona
    ("Joan Garcia", "GK", "esp", "Spain", "Barcelona", "La Liga", 24, 0.76),
    ("Jules Kounde", "DF", "fra", "France", "Barcelona", "La Liga", 27, 0.82),
    ("Pau Cubarsi", "DF", "esp", "Spain", "Barcelona", "La Liga", 19, 0.79),
    ("Alejandro Balde", "DF", "esp", "Spain", "Barcelona", "La Liga", 22, 0.78),
    ("Pedri", "MF", "esp", "Spain", "Barcelona", "La Liga", 23, 0.90),
    ("Gavi", "MF", "esp", "Spain", "Barcelona", "La Liga", 21, 0.83),
    ("Frenkie de Jong", "MF", "ned", "Netherlands", "Barcelona", "La Liga", 28, 0.84),
    ("Robert Lewandowski", "FW", "pol", "Poland", "Barcelona", "La Liga", 37, 0.86),
    ("Lamine Yamal", "FW", "esp", "Spain", "Barcelona", "La Liga", 19, 0.96),
    ("Raphinha", "FW", "bra", "Brazil", "Barcelona", "La Liga", 29, 0.89),
    ("Ferran Torres", "FW", "esp", "Spain", "Barcelona", "La Liga", 26, 0.75),
    # Atletico Madrid
    ("Jan Oblak", "GK", "svn", "Slovenia", "Atletico Madrid", "La Liga", 33, 0.86),
    ("Jose Gimenez", "DF", "uru", "Uruguay", "Atletico Madrid", "La Liga", 31, 0.77),
    ("Robin Le Normand", "DF", "esp", "Spain", "Atletico Madrid", "La Liga", 29, 0.79),
    ("Koke", "MF", "esp", "Spain", "Atletico Madrid", "La Liga", 34, 0.76),
    ("Pablo Barrios", "MF", "esp", "Spain", "Atletico Madrid", "La Liga", 22, 0.76),
    ("Conor Gallagher", "MF", "eng", "England", "Atletico Madrid", "La Liga", 26, 0.74),
    ("Julian Alvarez", "FW", "arg", "Argentina", "Atletico Madrid", "La Liga", 26, 0.89),
    ("Antoine Griezmann", "FW", "fra", "France", "Atletico Madrid", "La Liga", 35, 0.85),
    ("Alexander Sorloth", "FW", "nor", "Norway", "Atletico Madrid", "La Liga", 30, 0.76),

    # ── Serie A ──
    # Inter Milan
    ("Yann Sommer", "GK", "sui", "Switzerland", "Inter Milan", "Serie A", 37, 0.79),
    ("Alessandro Bastoni", "DF", "ita", "Italy", "Inter Milan", "Serie A", 26, 0.85),
    ("Federico Dimarco", "DF", "ita", "Italy", "Inter Milan", "Serie A", 28, 0.82),
    ("Benjamin Pavard", "DF", "fra", "France", "Inter Milan", "Serie A", 30, 0.78),
    ("Denzel Dumfries", "DF", "ned", "Netherlands", "Inter Milan", "Serie A", 30, 0.82),
    ("Nicolo Barella", "MF", "ita", "Italy", "Inter Milan", "Serie A", 29, 0.87),
    ("Hakan Calhanoglu", "MF", "tur", "Turkey", "Inter Milan", "Serie A", 32, 0.85),
    ("Henrikh Mkhitaryan", "MF", "arm", "Armenia", "Inter Milan", "Serie A", 37, 0.76),
    ("Lautaro Martinez", "FW", "arg", "Argentina", "Inter Milan", "Serie A", 28, 0.90),
    ("Marcus Thuram", "FW", "fra", "France", "Inter Milan", "Serie A", 28, 0.85),
    # AC Milan
    ("Mike Maignan", "GK", "fra", "France", "AC Milan", "Serie A", 30, 0.85),
    ("Fikayo Tomori", "DF", "eng", "England", "AC Milan", "Serie A", 28, 0.77),
    ("Malick Thiaw", "DF", "ger", "Germany", "AC Milan", "Serie A", 24, 0.73),
    ("Tijjani Reijnders", "MF", "ned", "Netherlands", "AC Milan", "Serie A", 27, 0.79),
    ("Christian Pulisic", "MF", "usa", "United States", "AC Milan", "Serie A", 27, 0.83),
    ("Rafael Leao", "FW", "por", "Portugal", "AC Milan", "Serie A", 26, 0.85),
    ("Alvaro Morata", "FW", "esp", "Spain", "AC Milan", "Serie A", 33, 0.76),
    # Juventus
    ("Michele Di Gregorio", "GK", "ita", "Italy", "Juventus", "Serie A", 28, 0.75),
    ("Gleison Bremer", "DF", "bra", "Brazil", "Juventus", "Serie A", 28, 0.82),
    ("Pierre Kalulu", "DF", "fra", "France", "Juventus", "Serie A", 25, 0.73),
    ("Teun Koopmeiners", "MF", "ned", "Netherlands", "Juventus", "Serie A", 27, 0.80),
    ("Manuel Locatelli", "MF", "ita", "Italy", "Juventus", "Serie A", 28, 0.77),
    ("Kenan Yildiz", "MF", "tur", "Turkey", "Juventus", "Serie A", 21, 0.80),
    ("Dusan Vlahovic", "FW", "srb", "Serbia", "Juventus", "Serie A", 26, 0.79),
    ("Randal Kolo Muani", "FW", "fra", "France", "Juventus", "Serie A", 27, 0.77),
    # Napoli
    ("Alex Meret", "GK", "ita", "Italy", "Napoli", "Serie A", 29, 0.75),
    ("Giovanni Di Lorenzo", "DF", "ita", "Italy", "Napoli", "Serie A", 32, 0.79),
    ("Amir Rrahmani", "DF", "kvx", "Kosovo", "Napoli", "Serie A", 31, 0.75),
    ("Kevin De Bruyne", "MF", "bel", "Belgium", "Napoli", "Serie A", 34, 0.90),
    ("Scott McTominay", "MF", "sco", "Scotland", "Napoli", "Serie A", 29, 0.85),
    ("Stanislav Lobotka", "MF", "svk", "Slovakia", "Napoli", "Serie A", 31, 0.79),
    ("Romelu Lukaku", "FW", "bel", "Belgium", "Napoli", "Serie A", 32, 0.81),
    ("David Neres", "FW", "bra", "Brazil", "Napoli", "Serie A", 28, 0.78),

    # ── Bundesliga ──
    # Bayern Munich
    ("Manuel Neuer", "GK", "ger", "Germany", "Bayern Munich", "Bundesliga", 40, 0.83),
    ("Dayot Upamecano", "DF", "fra", "France", "Bayern Munich", "Bundesliga", 27, 0.81),
    ("Kim Min-jae", "DF", "kor", "South Korea", "Bayern Munich", "Bundesliga", 29, 0.80),
    ("Alphonso Davies", "DF", "can", "Canada", "Bayern Munich", "Bundesliga", 25, 0.83),
    ("Jonathan Tah", "DF", "ger", "Germany", "Bayern Munich", "Bundesliga", 30, 0.80),
    ("Joshua Kimmich", "MF", "ger", "Germany", "Bayern Munich", "Bundesliga", 31, 0.90),
    ("Aleksandar Pavlovic", "MF", "ger", "Germany", "Bayern Munich", "Bundesliga", 22, 0.78),
    ("Jamal Musiala", "MF", "ger", "Germany", "Bayern Munich", "Bundesliga", 23, 0.92),
    ("Harry Kane", "FW", "eng", "England", "Bayern Munich", "Bundesliga", 32, 0.96),
    ("Michael Olise", "FW", "fra", "France", "Bayern Munich", "Bundesliga", 24, 0.86),
    ("Serge Gnabry", "FW", "ger", "Germany", "Bayern Munich", "Bundesliga", 30, 0.78),
    # Borussia Dortmund
    ("Gregor Kobel", "GK", "sui", "Switzerland", "Borussia Dortmund", "Bundesliga", 28, 0.82),
    ("Nico Schlotterbeck", "DF", "ger", "Germany", "Borussia Dortmund", "Bundesliga", 26, 0.82),
    ("Waldemar Anton", "DF", "ger", "Germany", "Borussia Dortmund", "Bundesliga", 29, 0.75),
    ("Julian Ryerson", "DF", "nor", "Norway", "Borussia Dortmund", "Bundesliga", 27, 0.74),
    ("Felix Nmecha", "MF", "ger", "Germany", "Borussia Dortmund", "Bundesliga", 25, 0.76),
    ("Pascal Gross", "MF", "ger", "Germany", "Borussia Dortmund", "Bundesliga", 34, 0.74),
    ("Serhou Guirassy", "FW", "gui", "Guinea", "Borussia Dortmund", "Bundesliga", 29, 0.85),
    ("Karim Adeyemi", "FW", "ger", "Germany", "Borussia Dortmund", "Bundesliga", 24, 0.78),
    ("Jamie Gittens", "FW", "eng", "England", "Borussia Dortmund", "Bundesliga", 21, 0.77),
    # Bayer Leverkusen
    ("Mark Flekken", "GK", "ned", "Netherlands", "Bayer Leverkusen", "Bundesliga", 32, 0.74),
    ("Edmond Tapsoba", "DF", "bfa", "Burkina Faso", "Bayer Leverkusen", "Bundesliga", 26, 0.76),
    ("Alejandro Grimaldo", "DF", "esp", "Spain", "Bayer Leverkusen", "Bundesliga", 30, 0.84),
    ("Granit Xhaka", "MF", "sui", "Switzerland", "Bayer Leverkusen", "Bundesliga", 33, 0.83),
    ("Exequiel Palacios", "MF", "arg", "Argentina", "Bayer Leverkusen", "Bundesliga", 27, 0.78),
    ("Patrik Schick", "FW", "cze", "Czechia", "Bayer Leverkusen", "Bundesliga", 30, 0.80),
    ("Victor Boniface", "FW", "nga", "Nigeria", "Bayer Leverkusen", "Bundesliga", 25, 0.78),
    # RB Leipzig
    ("Peter Gulacsi", "GK", "hun", "Hungary", "RB Leipzig", "Bundesliga", 35, 0.75),
    ("Willi Orban", "DF", "hun", "Hungary", "RB Leipzig", "Bundesliga", 33, 0.75),
    ("David Raum", "DF", "ger", "Germany", "RB Leipzig", "Bundesliga", 28, 0.78),
    ("Xavi Simons", "MF", "ned", "Netherlands", "RB Leipzig", "Bundesliga", 23, 0.83),
    ("Kevin Kampl", "MF", "svn", "Slovenia", "RB Leipzig", "Bundesliga", 35, 0.72),
    ("Loïs Openda", "FW", "bel", "Belgium", "RB Leipzig", "Bundesliga", 26, 0.81),
    ("Yussuf Poulsen", "FW", "den", "Denmark", "RB Leipzig", "Bundesliga", 32, 0.71),

    # ── Ligue 1 ──
    # Paris Saint-Germain
    ("Gianluigi Donnarumma", "GK", "ita", "Italy", "Paris Saint-Germain", "Ligue 1", 27, 0.88),
    ("Achraf Hakimi", "DF", "mar", "Morocco", "Paris Saint-Germain", "Ligue 1", 27, 0.88),
    ("Marquinhos", "DF", "bra", "Brazil", "Paris Saint-Germain", "Ligue 1", 32, 0.85),
    ("Nuno Mendes", "DF", "por", "Portugal", "Paris Saint-Germain", "Ligue 1", 23, 0.83),
    ("Vitinha", "MF", "por", "Portugal", "Paris Saint-Germain", "Ligue 1", 26, 0.87),
    ("Joao Neves", "MF", "por", "Portugal", "Paris Saint-Germain", "Ligue 1", 21, 0.86),
    ("Fabian Ruiz", "MF", "esp", "Spain", "Paris Saint-Germain", "Ligue 1", 30, 0.83),
    ("Ousmane Dembele", "FW", "fra", "France", "Paris Saint-Germain", "Ligue 1", 29, 0.96),
    ("Khvicha Kvaratskhelia", "FW", "geo", "Georgia", "Paris Saint-Germain", "Ligue 1", 25, 0.88),
    ("Desire Doue", "FW", "fra", "France", "Paris Saint-Germain", "Ligue 1", 20, 0.85),
    ("Bradley Barcola", "FW", "fra", "France", "Paris Saint-Germain", "Ligue 1", 23, 0.81),
    # Monaco
    ("Radoslaw Majecki", "GK", "pol", "Poland", "AS Monaco", "Ligue 1", 26, 0.70),
    ("Wilfried Singo", "DF", "civ", "Ivory Coast", "AS Monaco", "Ligue 1", 25, 0.74),
    ("Vanderson", "DF", "bra", "Brazil", "AS Monaco", "Ligue 1", 25, 0.75),
    ("Mohamed Camara", "MF", "mli", "Mali", "AS Monaco", "Ligue 1", 26, 0.74),
    ("Denis Zakaria", "MF", "sui", "Switzerland", "AS Monaco", "Ligue 1", 29, 0.75),
    ("Folarin Balogun", "FW", "usa", "United States", "AS Monaco", "Ligue 1", 24, 0.75),
    ("Maghnes Akliouche", "FW", "fra", "France", "AS Monaco", "Ligue 1", 23, 0.77),
    # Marseille
    ("Geronimo Rulli", "GK", "arg", "Argentina", "Olympique de Marseille", "Ligue 1", 33, 0.75),
    ("Leonardo Balerdi", "DF", "arg", "Argentina", "Olympique de Marseille", "Ligue 1", 26, 0.73),
    ("Adrien Rabiot", "MF", "fra", "France", "Olympique de Marseille", "Ligue 1", 31, 0.80),
    ("Mason Greenwood", "FW", "eng", "England", "Olympique de Marseille", "Ligue 1", 24, 0.82),
    ("Amine Gouiri", "FW", "alg", "Algeria", "Olympique de Marseille", "Ligue 1", 25, 0.76),

    # ── Saudi Pro League ──
    ("Bento", "GK", "bra", "Brazil", "Al Nassr", "Saudi Pro League", 26, 0.72),
    ("Mohamed Simakan", "DF", "fra", "France", "Al Nassr", "Saudi Pro League", 25, 0.73),
    ("Inigo Martinez", "DF", "esp", "Spain", "Al Nassr", "Saudi Pro League", 34, 0.76),
    ("Kingsley Coman", "MF", "fra", "France", "Al Nassr", "Saudi Pro League", 29, 0.79),
    ("Marcelo Brozovic", "MF", "hrv", "Croatia", "Al Nassr", "Saudi Pro League", 33, 0.76),
    ("Sadio Mane", "FW", "sen", "Senegal", "Al Nassr", "Saudi Pro League", 33, 0.80),
    ("Joao Felix", "FW", "por", "Portugal", "Al Nassr", "Saudi Pro League", 26, 0.79),
    ("Cristiano Ronaldo", "FW", "por", "Portugal", "Al Nassr", "Saudi Pro League", 41, 0.88),
    ("Yassine Bounou", "GK", "mar", "Morocco", "Al Hilal", "Saudi Pro League", 34, 0.77),
    ("Theo Hernandez", "DF", "fra", "France", "Al Hilal", "Saudi Pro League", 28, 0.83),
    ("Sergej Milinkovic-Savic", "MF", "srb", "Serbia", "Al Hilal", "Saudi Pro League", 30, 0.81),
    ("Ruben Neves", "MF", "por", "Portugal", "Al Hilal", "Saudi Pro League", 28, 0.79),
    ("Malcom", "FW", "bra", "Brazil", "Al Hilal", "Saudi Pro League", 28, 0.76),
    ("Karim Benzema", "FW", "fra", "France", "Al Hilal", "Saudi Pro League", 38, 0.83),

    # ── MLS ──
    ("Lionel Messi", "FW", "arg", "Argentina", "Inter Miami", "MLS", 39, 0.97),
    ("Luis Suarez", "FW", "uru", "Uruguay", "Inter Miami", "MLS", 39, 0.78),
    ("Rodrigo De Paul", "MF", "arg", "Argentina", "Inter Miami", "MLS", 32, 0.81),
    ("Sergio Busquets", "MF", "esp", "Spain", "Inter Miami", "MLS", 37, 0.76),
    ("Tadeo Allende", "FW", "arg", "Argentina", "Inter Miami", "MLS", 26, 0.70),
    ("German Berterame", "FW", "arg", "Argentina", "Inter Miami", "MLS", 25, 0.71),
]


def seed_world_class_players(db):
    """Seed the curated real-player pool above for Algorithm 2 (Player Comparison).
    Replaces the previous fully-synthetic 'European' generator — every entry here
    is a real footballer with a real name/position/nationality/club.
    """
    used_names: set[str] = {p["name"] for p in db.players.find({}, {"name": 1})}
    generated = []

    for name, pos, nat_code, nation, club, league, age, quality in WORLD_CLASS_PLAYERS:
        if name in used_names:
            continue
        used_names.add(name)

        stats = dict(POS_STATS.get(pos, POS_STATS["MF"]))
        mod = int((quality - 0.5) * 60)
        for k in stats:
            stats[k] = _clamp(stats[k] + mod + random.randint(-6, 6))

        apps = random.randint(15, 34)
        goals = random.randint(0, max(1, apps // 2) if pos == "FW" else max(1, apps // 6))
        assists = random.randint(0, max(1, apps // 3) if pos in ("MF", "FW") else max(1, apps // 10))
        elo = _elo_from_stats(stats)
        mv = impute_market_value(
            {"age": age, "position": pos, "eloRating": elo,
             "appearances": apps, "goals": goals, "assists": assists, **stats},
            _mv_model,
            source="european",
        )

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
            "competition":   league,
            "marketValue":   mv,
            "stats":         stats,
            "careerStats": {
                "appearances": apps, "goals": goals, "assists": assists,
                "yellowCards": random.randint(0, max(0, apps // 10)),
                "redCards":    random.randint(0, 1),
            },
            "eloRating": elo,
            "source":    "european",
            "createdAt": datetime.utcnow(),
        })

    if generated:
        db.players.insert_many(generated)
    clubs = len({p["currentClub"] for p in generated})
    print(f"  Inserted {len(generated)} real world-class players across {clubs} clubs")


KICKOFF_TIMES = [(11, 0), (13, 30), (16, 30)]


def seed_matches(db):
    db.matches.drop()
    t = {team["name"]: team["_id"] for team in db.teams.find()}
    now = datetime.utcnow()
    kickoff_index = 0

    def match(home, away, comp, days, status, venue, hf="4-3-3", af="4-3-3",
               result=None, votes=None):
        nonlocal kickoff_index
        h, a = t.get(home), t.get(away)
        if not h or not a:
            print(f"  Warning: team not found — {home!r} or {away!r}")
            return None
        home_lineup = _build_lineup(db, h, hf)
        away_lineup = _build_lineup(db, a, af)
        hour, minute = KICKOFF_TIMES[kickoff_index % len(KICKOFF_TIMES)]
        kickoff_index += 1
        match_date = (now + timedelta(days=days)).replace(
            hour=hour, minute=minute, second=0, microsecond=0
        )
        return {
            "homeTeam": h, "awayTeam": a,
            "date": match_date,
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
    db.players.drop()

    print("Seeding teams...")
    seed_teams(db)

    print("Seeding real Nepali players from CSV...")
    seed_real_nepal_players(db)
    _distribute_unassigned_players(db)

    print("Seeding real SAFF opponent internationals...")
    seed_real_saff_players(db)

    print("Generating filler players to complete squads (Nepal clubs + SAFF opponents)...")
    seed_generated_players(db, drop=False)

    print("Seeding curated world-class players (Algorithm 2 comparison pool)...")
    seed_world_class_players(db)

    print("Seeding users...")
    seed_demo_users(db)

    print("Seeding matches...")
    seed_matches(db)

    print("Creating indexes...")
    seed_indexes(db)

    print("\n=== Seeding complete ===")
    print(f"  Players   : {db.players.count_documents({})}")
    print(f"    ↳ Nepali   : {db.players.count_documents({'source': 'nepali'})}")
    print(f"    ↳ European : {db.players.count_documents({'source': 'european'})}")
    for country in ("india", "bangladesh", "pakistan", "bhutan"):
        print(f"    ↳ {country.capitalize():10s}: {db.players.count_documents({'source': country})}")
    print(f"  Teams     : {db.teams.count_documents({})}")
    print(f"    ↳ Nepal clubs : {db.teams.count_documents({'country': 'Nepal'})}")
    print(f"  Matches   : {db.matches.count_documents({})}")
    print(f"    ↳ upcoming : {db.matches.count_documents({'status': 'upcoming'})}")
    print(f"    ↳ live     : {db.matches.count_documents({'status': 'live'})}")
    print(f"    ↳ completed: {db.matches.count_documents({'status': 'completed'})}")
    print(f"  Users     : {db.users.count_documents({})}")
