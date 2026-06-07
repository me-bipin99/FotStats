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
# Each role defines base values for the 6 FIFA-style attributes.
# Missing stats are filled in by algorithm using these templates + performance data.

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

# Fallback by short position code
POS_STATS: dict[str, dict[str, int]] = {
    "GK": {"pace": 45, "shooting": 22, "passing": 56, "dribbling": 35, "defending": 73, "physical": 75},
    "DF": {"pace": 60, "shooting": 38, "passing": 62, "dribbling": 50, "defending": 76, "physical": 70},
    "MF": {"pace": 65, "shooting": 55, "passing": 70, "dribbling": 64, "defending": 55, "physical": 60},
    "FW": {"pace": 75, "shooting": 73, "passing": 58, "dribbling": 70, "defending": 35, "physical": 62},
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
    """ELO derived from average attribute score relative to 50."""
    avg = sum(stats.values()) / len(stats) if stats else 50
    return base + int((avg - 50) * 4)


def _stats_from_role(role: str, pos: str = "MF") -> dict[str, int]:
    """
    Algorithm: derive the 6 attributes when raw stat data is unavailable.
    1. Try exact role match from ROLE_STATS table.
    2. Try partial match (role keyword inside known role).
    3. Fall back to short position code (GK/DF/MF/FW).
    """
    # Exact match
    if role in ROLE_STATS:
        return dict(ROLE_STATS[role])
    # Partial match — longest key that is a substring of the role wins
    matched = None
    for key in sorted(ROLE_STATS, key=len, reverse=True):
        if key.lower() in role.lower():
            matched = key
            break
    if matched:
        return dict(ROLE_STATS[matched])
    # Fallback to position code
    short = pos[:2].upper() if pos else "MF"
    return dict(POS_STATS.get(short, POS_STATS["MF"]))


def _apply_performance_boost(stats: dict, goals: int, assists: int, appearances: int) -> dict:
    """
    Boost shooting and passing based on actual performance data.
    Players who score/assist frequently get higher attacking attributes.
    """
    if appearances <= 0:
        return stats
    goal_rate = goals / appearances
    assist_rate = assists / appearances
    stats["shooting"] = _clamp(stats["shooting"] + int(goal_rate * 25))
    stats["passing"] = _clamp(stats["passing"] + int(assist_rate * 20))
    return stats


def _build_team_lookup(db) -> dict:
    """Case-insensitive name → _id map with stripped aliases (e.g. 'machhindra' alongside 'machhindra fc')."""
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
    """Return ObjectId if club_name fuzzy-matches any DB team, else None."""
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
    """Assign Nepali players with no team to teams round-robin by position.
    Ensures every team has enough players per position to field a full lineup.
    """
    team_ids = [t["_id"] for t in db.teams.find()]
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
    """Pick top players by ELO per position slot. Falls back to any nepali player if team pool is thin."""
    slots = FORMATION_SLOTS.get(formation, FORMATION_SLOTS["4-3-3"])
    lineup = []
    shirt = 1
    used_ids: set = set()

    for pos, count in slots.items():
        team_players = list(
            db.players.find({
                "team": team_id,
                "position": pos,
                "_id": {"$nin": list(used_ids)},
            }).sort("eloRating", -1).limit(count)
        )
        selected = team_players

        if len(selected) < count:
            remaining = count - len(selected)
            fill = list(
                db.players.find({
                    "source": "nepali",
                    "position": pos,
                    "_id": {"$nin": list(used_ids) + [p["_id"] for p in selected]},
                }).sort("eloRating", -1).limit(remaining)
            )
            selected += fill

        for p in selected:
            lineup.append({
                "playerId": p["_id"],
                "position": pos,
                "shirtNumber": shirt,
            })
            used_ids.add(p["_id"])
            shirt += 1

    return lineup


def _map_euro_pos(raw: str) -> str:
    """Map European CSV compound Pos field (e.g. 'MF,FW') to GK/DF/MF/FW."""
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

def seed_players(db, team_lookup: dict):
    db.players.drop()
    players = []

    nat_m_id = team_lookup.get("nepal national team")
    nat_f_id = team_lookup.get("nepal women's national team")

    # --- Build name→detail lookup from nepalisquad.csv ---
    squad_lookup: dict[str, dict] = {}
    if NEPALI_SQUAD_CSV.exists():
        with open(NEPALI_SQUAD_CSV, newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                name = row.get("Player Name", "").strip()
                if name:
                    squad_lookup[name.lower()] = row
    print(f"  Squad lookup built: {len(squad_lookup)} entries")

    # --- Nepali players (all 100) ---
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

                # Algorithm: derive stats from role, then boost from performance
                stats = _stats_from_role(role, position)
                stats = _apply_performance_boost(stats, goals, assists, appearances)

                # Merge squad detail if this player is in the national squad
                sq = squad_lookup.get(name.lower(), {})
                age = _safe_int(sq.get("Age", 24), 24) or 24
                caps = _safe_int(sq.get("Caps", appearances)) or appearances
                yellow_cards = _safe_int(sq.get("Yellow Cards", 0))
                red_cards = _safe_int(sq.get("Red Cards", 0))
                market_value = _safe_int(sq.get("Market Value (€)", 0))
                current_club = (sq.get("Current Club", "") or "").strip() or "Nepal"
                nsl_team = (sq.get("NSL Team", "") or "").strip() or None

                # Team assignment priority:
                # 1. NSL club match → assign to that NSL club team
                # 2. Current club match → assign to that DB team
                # 3. Player is in national squad → assign to national team (M/F)
                team_id = (
                    _find_team_id(nsl_team or "", team_lookup)
                    or _find_team_id(current_club, team_lookup)
                    or (nat_f_id if (gender == "F" and name.lower() in squad_lookup) else None)
                    or (nat_m_id if (gender == "M" and name.lower() in squad_lookup) else None)
                )

                # Algorithm 4: impute missing physical attributes
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

    # --- European players (2779) ---
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

                # Algorithm: derive stats from position, boost from performance,
                # add small random variance so European players aren't identical
                stats = dict(POS_STATS.get(position, POS_STATS["MF"]))
                stats = _apply_performance_boost(stats, goals, assists, appearances)
                for key in stats:
                    stats[key] = _clamp(stats[key] + random.randint(-6, 6))

                # Algorithm 4: impute missing physical attributes
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


def seed_teams(db):
    db.teams.drop()
    teams = [
        {"name": "Nepal National Team",       "country": "Nepal", "color": "#DC2626",
         "stadium": "Dashrath Rangasala",      "coach": "Vincenzo Alberto Annese",
         "formation": "4-3-3", "players": [],  "founded": 1951},
        {"name": "Nepal Women's National Team","country": "Nepal", "color": "#BE185D",
         "stadium": "Dashrath Rangasala",      "coach": "Kumar Thapa",
         "formation": "4-4-2", "players": [],  "founded": 1980},
        {"name": "Machhindra FC",              "country": "Nepal", "color": "#047857",
         "stadium": "Dashrath Rangasala",      "coach": "Kishore Kumar",
         "formation": "4-4-2", "players": [],  "founded": 1966},
        {"name": "Manang Marshyangdi Club",    "country": "Nepal", "color": "#1E3A8A",
         "stadium": "Halchowk Stadium",        "coach": "Tope Ayodeji Fuja",
         "formation": "4-3-3", "players": [],  "founded": 1982},
        {"name": "Three Star Club",            "country": "Nepal", "color": "#B45309",
         "stadium": "Pokhara Stadium",         "coach": "Johnson Singh",
         "formation": "4-2-3-1", "players": [],"founded": 1975},
        {"name": "Tribhuvan Army Club",        "country": "Nepal", "color": "#15803D",
         "stadium": "Dashrath Rangasala",      "coach": "Hari Khadka",
         "formation": "4-3-3", "players": [],  "founded": 1957},
        {"name": "New Road Team",              "country": "Nepal", "color": "#7C3AED",
         "stadium": "ANFA Complex",            "coach": "Bikash Thapa",
         "formation": "4-4-2", "players": [],  "founded": 1956},
        {"name": "APF FC",                     "country": "Nepal", "color": "#0369A1",
         "stadium": "Police Ground",           "coach": "Nirajan Rayamajhi",
         "formation": "4-3-3", "players": [],  "founded": 1997},
    ]
    db.teams.insert_many(teams)
    print(f"  Inserted {len(teams)} teams")


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
        home_lineup = _build_lineup(db, h, hf) if status != "upcoming" else []
        away_lineup = _build_lineup(db, a, af) if status != "upcoming" else []
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
        # 5 upcoming matches — lineups empty, ML predicts on frontend load
        match("Nepal National Team", "Machhindra FC",
              "SAFF Championship", 3, "upcoming", "Dashrath Rangasala",
              "4-3-3", "4-4-2"),
        match("Machhindra FC", "Manang Marshyangdi Club",
              "A-Division League", 7, "upcoming", "Dashrath Rangasala",
              "4-4-2", "4-3-3"),
        match("Three Star Club", "Tribhuvan Army Club",
              "A-Division League", 10, "upcoming", "Pokhara Stadium",
              "4-2-3-1", "4-3-3"),
        match("New Road Team", "APF FC",
              "Martyr's Memorial A-Division League", 14, "upcoming", "ANFA Complex",
              "4-4-2", "4-3-3"),
        match("Nepal Women's National Team", "Nepal National Team",
              "SAFF Women's Championship", 5, "upcoming", "Dashrath Rangasala",
              "4-4-2", "4-3-3"),
        # 1 live match — lineup populated from team players
        match("Nepal National Team", "APF FC",
              "Martyr's Memorial A-Division League", 0, "live",
              "Dashrath Rangasala", "4-3-3", "4-3-3",
              votes={"home_win": 18, "draw": 5, "away_win": 7}),
        # 3 completed matches — lineups populated
        match("Manang Marshyangdi Club", "Nepal National Team",
              "A-Division League", -5, "completed", "Halchowk Stadium",
              "4-3-3", "4-3-3",
              result={"homeScore": 2, "awayScore": 1},
              votes={"home_win": 14, "draw": 4, "away_win": 9}),
        match("Nepal National Team", "Three Star Club",
              "Martyr's Memorial A-Division League", -12, "completed",
              "Dashrath Rangasala", "4-3-3", "4-2-3-1",
              result={"homeScore": 3, "awayScore": 0},
              votes={"home_win": 22, "draw": 3, "away_win": 4}),
        match("Machhindra FC", "New Road Team",
              "A-Division League", -20, "completed", "Dashrath Rangasala",
              "4-4-2", "4-4-2",
              result={"homeScore": 1, "awayScore": 1},
              votes={"home_win": 10, "draw": 8, "away_win": 7}),
    ]

    valid = [m for m in matches_raw if m]
    db.matches.insert_many(valid)
    print(f"  Inserted {len(valid)} matches")
    for m in valid:
        hc = len(m.get("homeLineup", []))
        ac = len(m.get("awayLineup", []))
        print(f"    {m['status']:9s}  home lineup: {hc} players  away: {ac}")


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
    db.matches.create_index("status")
    db.matches.create_index("date")
    db.users.create_index("email", unique=True)
    db.votes.create_index([("userId", 1), ("matchId", 1)], unique=True)
    print("  Indexes created")


if __name__ == "__main__":
    db = get_db()
    print("Seeding teams...")
    seed_teams(db)
    team_lookup = _build_team_lookup(db)
    print(f"  Team lookup: {list(team_lookup.keys())}")
    print("Seeding players...")
    seed_players(db, team_lookup)
    print("Distributing unassigned Nepali players to teams...")
    _distribute_unassigned_players(db)
    print("Seeding users...")
    seed_demo_users(db)
    print("Seeding matches...")
    seed_matches(db)
    print("Creating indexes...")
    seed_indexes(db)

    print("\n=== Seeding complete ===")
    print(f"  Players : {db.players.count_documents({})}")
    print(f"    ↳ Nepali  : {db.players.count_documents({'source': 'nepali'})}")
    print(f"    ↳ European: {db.players.count_documents({'source': 'european'})}")
    print(f"  Teams   : {db.teams.count_documents({})}")
    print(f"  Matches : {db.matches.count_documents({})}")
    print(f"  Users   : {db.users.count_documents({})}")
