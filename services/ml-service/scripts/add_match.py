"""
CLI script to schedule upcoming matches directly in MongoDB.
Auto-generates predicted lineups for both teams using ELO-based selection.
If a team has fewer than 11 players, fills gaps from the Nepali player pool
or generates realistic fictional Nepali players.

Usage:
  python scripts/add_match.py                        # interactive mode
  python scripts/add_match.py --list-teams           # show all team names + IDs
  python scripts/add_match.py \\
      --home "nepal national team" \\
      --away "machhindra fc" \\
      --date "2026-08-15 15:00" \\
      --competition "SAFF Championship" \\
      --venue "Dashrath Rangasala" \\
      --home-formation "4-3-3" \\
      --away-formation "4-4-2"
"""
import os
import sys
import re
import json
import random
import argparse
from datetime import datetime
from pathlib import Path
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()
random.seed()  # unseeded so generated names vary each run

# ─── Hardcoded team squads ────────────────────────────────────────────────────
# Loaded from data/team_squads.json at repo root. Each entry has a "squad" list
# of {name, position} dicts. add_match uses these to build stable lineups without
# relying on the DB having the right club assignments.

_SQUADS_PATH = Path(__file__).parent.parent.parent.parent / "data" / "team_squads.json"
_TEAM_SQUADS: dict = {}
if _SQUADS_PATH.exists():
    with _SQUADS_PATH.open() as _f:
        _TEAM_SQUADS = json.load(_f)
    print(f"  Loaded hardcoded squads for {len(_TEAM_SQUADS)} teams from team_squads.json")

# ─── Formation slots ──────────────────────────────────────────────────────────

POSITION_SLOTS: dict[str, dict[str, int]] = {
    "4-3-3":   {"GK": 1, "DF": 4, "MF": 3, "FW": 3},
    "4-4-2":   {"GK": 1, "DF": 4, "MF": 4, "FW": 2},
    "4-2-3-1": {"GK": 1, "DF": 4, "MF": 5, "FW": 1},
    "3-5-2":   {"GK": 1, "DF": 3, "MF": 5, "FW": 2},
    "5-3-2":   {"GK": 1, "DF": 5, "MF": 3, "FW": 2},
    "4-1-4-1": {"GK": 1, "DF": 4, "MF": 5, "FW": 1},
}

# ─── Fictional player name pool ───────────────────────────────────────────────

_FIRST = [
    "Anil", "Bikash", "Dinesh", "Hari", "Kamal", "Nabin", "Prabesh", "Rajan",
    "Sagar", "Suresh", "Ujjwal", "Vivek", "Amrit", "Deepak", "Gaurav", "Krishna",
    "Nirajan", "Prabin", "Rohit", "Santosh", "Bibek", "Dipesh", "Ganesh", "Lochan",
    "Niroj", "Pradeep", "Rabindra", "Sanjay", "Bishal", "Diwas", "Hemanta", "Milan",
    "Nishant", "Pratik", "Ramesh", "Saroj", "Buddhi", "Dipak", "Gopal", "Manoj",
    "Nishan", "Prashant", "Rajesh", "Subash", "Alish", "Anish", "Ashim", "Binod",
]
_LAST = [
    "Tamang", "Rai", "Shrestha", "Gurung", "Thapa", "Magar", "Limbu", "Sherpa",
    "Lama", "Karki", "Bista", "Chand", "Basnet", "Adhikari", "Ghimire", "Poudel",
    "Khadka", "Pandit", "Rijal", "Ale", "Budha", "Chhetri", "Dahal", "Pokhrel",
    "Subedi", "Tiwari", "Upreti", "Yonjan", "Bajracharya", "Dangol", "Maharjan",
]

# Base stats per position for generated players (slightly below average)
_GEN_STATS: dict[str, dict[str, int]] = {
    "GK": {"pace": 44, "shooting": 22, "passing": 54, "dribbling": 34, "defending": 68, "physical": 70},
    "DF": {"pace": 58, "shooting": 35, "passing": 58, "dribbling": 46, "defending": 70, "physical": 66},
    "MF": {"pace": 62, "shooting": 52, "passing": 66, "dribbling": 60, "defending": 52, "physical": 58},
    "FW": {"pace": 72, "shooting": 68, "passing": 54, "dribbling": 66, "defending": 32, "physical": 58},
}


# ─── DB helpers ───────────────────────────────────────────────────────────────

def get_db():
    uri = os.environ["MONGO_URI"]
    client = MongoClient(uri)
    db_name = uri.rstrip("/").split("/")[-1].split("?")[0] or "fotnep"
    return client[db_name]


def _normalize_name(s: str) -> str:
    """Lowercase, collapse spaces, expand common abbreviations for matching."""
    s = s.lower().strip()
    s = re.sub(r'\s+', ' ', s)
    s = s.replace(' fc', ' football club').replace(' afc', ' army football club')
    return s


def find_team(db, name_or_id: str):
    """
    Resolve a team by ObjectId, exact name, or fuzzy substring match.
    Handles case, abbreviations (FC → Football Club), and partial words.
    When multiple teams match the input the closest one by score is returned.
    """
    import difflib
    name_or_id = name_or_id.strip()

    # 1. ObjectId
    try:
        team = db.teams.find_one({"_id": ObjectId(name_or_id)})
        if team:
            return team
    except Exception:
        pass

    # 2. Exact case-insensitive
    team = db.teams.find_one({"name": {"$regex": f"^{re.escape(name_or_id)}$", "$options": "i"}})
    if team:
        return team

    # 3. Scored fuzzy match against all team names
    all_teams = list(db.teams.find({}, {"name": 1}))
    norm_input = _normalize_name(name_or_id)

    def _score(team_doc):
        norm_team = _normalize_name(team_doc["name"])
        # substring bonus: input contained in team name
        substr = 1.0 if norm_input in norm_team else 0.0
        # sequence similarity
        ratio = difflib.SequenceMatcher(None, norm_input, norm_team).ratio()
        return substr * 0.5 + ratio

    scored = sorted(all_teams, key=_score, reverse=True)
    best = scored[0] if scored else None
    if best and _score(best) >= 0.45:
        return db.teams.find_one({"_id": best["_id"]})
    return None


def parse_date(raw: str) -> datetime:
    for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(raw.strip(), fmt)
        except ValueError:
            continue
    raise ValueError(f"Cannot parse date '{raw}'. Use format: YYYY-MM-DD HH:MM")


# ─── Lineup generation ────────────────────────────────────────────────────────

def _elo_from_stats(stats: dict) -> int:
    avg = sum(stats.values()) / len(stats) if stats else 50
    return 1600 + int((avg - 50) * 4)


def _team_gender(team_name: str) -> str:
    """Return 'F' for women's teams, 'M' for everything else."""
    tl = team_name.lower()
    return "F" if any(kw in tl for kw in ("women", "woman", "female", "girls")) else "M"


def _generate_player(db, position: str, team_name: str, gender: str = "M") -> dict:
    """Insert a fictional Nepali player into the DB and return the document."""
    first = random.choice(_FIRST)
    last = random.choice(_LAST)
    name = f"{first} {last}"
    stats = {k: v + random.randint(-8, 8) for k, v in _GEN_STATS[position].items()}
    stats = {k: max(25, min(85, v)) for k, v in stats.items()}
    doc = {
        "name": name,
        "position": position,
        "nationality": "Nepali",
        "age": random.randint(19, 32),
        "gender": gender,
        "currentClub": team_name,
        "nslTeam": team_name,
        "stats": stats,
        "careerStats": {
            "appearances": random.randint(5, 60),
            "goals": random.randint(0, 10) if position == "FW" else random.randint(0, 3),
            "assists": random.randint(0, 8),
            "yellowCards": random.randint(0, 5),
            "redCards": 0,
        },
        "eloRating": _elo_from_stats(stats),
        "source": "nepali",
        "generated": True,
        "createdAt": datetime.utcnow(),
    }
    result = db.players.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def _find_or_create_player(db, name: str, position: str, gender: str = "M") -> dict:
    """Find a player in MongoDB by exact name (case-insensitive). Insert a minimal
    record with the given gender if not found so the lineup reference is always valid."""
    player = db.players.find_one(
        {"name": {"$regex": f"^{re.escape(name)}$", "$options": "i"}}
    )
    if player:
        return player
    stats = {k: v + random.randint(-5, 5) for k, v in _GEN_STATS[position].items()}
    stats = {k: max(30, min(85, v)) for k, v in stats.items()}
    doc = {
        "name": name,
        "position": position,
        "nationality": "Nepali",
        "age": random.randint(20, 33),
        "gender": gender,
        "source": "nepali",
        "stats": stats,
        "eloRating": _elo_from_stats(stats),
        "createdAt": datetime.utcnow(),
    }
    result = db.players.insert_one(doc)
    doc["_id"] = result.inserted_id
    print(f"    Inserted missing player: {name} ({position}, {gender})")
    return doc


def _get_squad_from_json(db, team_name: str, gender: str) -> list | None:
    """Return a squad list from the hardcoded JSON file, or None if not found.
    Resolves each player by name in MongoDB, inserting a record (with the correct
    gender) if absent."""
    matched_key = None
    tl = team_name.lower()
    for key in _TEAM_SQUADS:
        if key.lower() == tl:
            matched_key = key
            break
    if matched_key is None:
        # Partial fallback: every word in the team name must appear in the key
        words = tl.split()
        for key in _TEAM_SQUADS:
            kl = key.lower()
            if all(w in kl for w in words):
                matched_key = key
                break
    if matched_key is None:
        return None

    squad = []
    for entry in _TEAM_SQUADS[matched_key]["squad"]:
        pos = entry["position"]
        if pos not in ("GK", "DF", "MF", "FW"):
            continue
        player = _find_or_create_player(db, entry["name"], pos, gender)
        squad.append(player)
    return squad


def _get_squad(db, team, formation: str, exclude_ids: set | None = None) -> list:
    """
    Return a pool of ≥15 players for the team.
    All DB queries and generated players are filtered/tagged by team gender so
    male lineups never include female players and vice-versa.
    Pass exclude_ids (e.g. the home lineup's player IDs) so the away squad can
    never contain a player already selected for the other team.
    Priority:
      1. Hardcoded squad from team_squads.json (stable, predictable lineups)
      2. Players whose nslTeam or currentClub matches this team name (DB fallback)
      3. Top Nepali players by ELO filtered by gender (national teams or padding)
      4. Generated fictional Nepali players with correct gender if still short
    """
    team_name = team["name"]
    gender = _team_gender(team_name)
    exclude_ids = exclude_ids or set()

    # Step 1 — hardcoded JSON squad (preferred path)
    json_squad = _get_squad_from_json(db, team_name, gender)
    if json_squad:
        # Drop anyone already picked for the other team
        json_squad = [p for p in json_squad if p["_id"] not in exclude_ids]
        print(f"    Using hardcoded squad ({len(json_squad)} players) for {team_name}")
        linked = json_squad
    else:
        is_national = any(kw in team_name.lower() for kw in ("national", "nepal"))
        if is_national:
            linked = list(
                db.players.find({"source": "nepali", "gender": gender})
                .sort("eloRating", -1)
                .limit(25)
            )
        else:
            first_word = team_name.split()[0]
            linked = list(db.players.find({
                "source": "nepali",
                "gender": gender,
                "$or": [
                    {"nslTeam":     {"$regex": first_word, "$options": "i"}},
                    {"currentClub": {"$regex": first_word, "$options": "i"}},
                ],
            }))

    # Step 2 — pad from same-gender Nepali pool (avoid duplicates and other-team players)
    target = 18
    existing_ids = {p["_id"] for p in linked}
    if len(linked) < target:
        extras = list(
            db.players.find({
                "source": "nepali",
                "gender": gender,
                "_id": {"$nin": list(existing_ids | exclude_ids)},
            })
            .sort("eloRating", -1)
            .limit(target - len(linked))
        )
        linked.extend(extras)
        existing_ids.update(p["_id"] for p in extras)

    # Step 3 — check position coverage; generate fictional players if a slot is empty
    slots = POSITION_SLOTS.get(formation, POSITION_SLOTS["4-3-3"])
    by_pos: dict[str, list] = {"GK": [], "DF": [], "MF": [], "FW": []}
    for p in linked:
        pos = p.get("position", "MF")
        if pos in by_pos:
            by_pos[pos].append(p)

    generated = []
    for pos, need in slots.items():
        shortfall = need - len(by_pos[pos])
        for _ in range(shortfall):
            fake = _generate_player(db, pos, team_name, gender)
            by_pos[pos].append(fake)
            generated.append(fake)

    if generated:
        print(f"    Generated {len(generated)} fictional player(s) to fill {team_name} squad")

    return linked + generated


def _build_lineup(squad: list, formation: str) -> list:
    """
    Select best 11 by ELO per formation slot.
    Returns list of {playerId, position, shirtNumber} dicts.
    """
    slots = POSITION_SLOTS.get(formation, POSITION_SLOTS["4-3-3"])
    by_pos: dict[str, list] = {"GK": [], "DF": [], "MF": [], "FW": []}
    for p in squad:
        pos = p.get("position", "MF")
        if pos in by_pos:
            by_pos[pos].append(p)

    lineup = []
    shirt = 1
    used_ids: set = set()
    for pos, count in slots.items():
        candidates = sorted(
            [p for p in by_pos[pos] if p["_id"] not in used_ids],
            key=lambda p: p.get("eloRating", 0),
            reverse=True,
        )[:count]
        for p in candidates:
            lineup.append({
                "playerId": p["_id"],
                "position": pos,
                "shirtNumber": shirt,
            })
            used_ids.add(p["_id"])
            shirt += 1

    return lineup


def _lineup_summary(lineup: list, db) -> str:
    ids = [e["playerId"] for e in lineup]
    players = {str(p["_id"]): p["name"] for p in db.players.find({"_id": {"$in": ids}})}
    lines = []
    for e in lineup:
        name = players.get(str(e["playerId"]), "Unknown")
        lines.append(f"      #{e['shirtNumber']:>2}  {e['position']}  {name}")
    return "\n".join(lines)


# ─── Core action ─────────────────────────────────────────────────────────────

def list_teams(db):
    print("\nAvailable teams:")
    print(f"  {'Name':<38} ID")
    print("  " + "-" * 74)
    for t in db.teams.find({}, {"name": 1}).sort("name", 1):
        print(f"  {t['name']:<38} {t['_id']}")
    print()


def add_match(db, home_name, away_name, date_str, competition, venue, hf, af):
    home = find_team(db, home_name)
    if not home:
        print(f"  ERROR: Team not found: '{home_name}'")
        print("  Run --list-teams to see available teams.")
        sys.exit(1)

    away = find_team(db, away_name)
    if not away:
        print(f"  ERROR: Team not found: '{away_name}'")
        print("  Run --list-teams to see available teams.")
        sys.exit(1)

    if home["_id"] == away["_id"]:
        print("  ERROR: Home and away team must be different.")
        sys.exit(1)

    match_date = parse_date(date_str)
    hf = hf or "4-3-3"
    af = af or "4-3-3"

    # Build predicted lineups — away squad excludes any player already in home lineup
    print(f"\n  Building lineup for {home['name']} ({hf})...")
    home_squad   = _get_squad(db, home, hf)
    home_lineup  = _build_lineup(home_squad, hf)
    home_ids     = {e["playerId"] for e in home_lineup}

    print(f"  Building lineup for {away['name']} ({af})...")
    away_squad   = _get_squad(db, away, af, exclude_ids=home_ids)
    away_lineup  = _build_lineup(away_squad, af)

    doc = {
        "homeTeam":      home["_id"],
        "awayTeam":      away["_id"],
        "date":          match_date,
        "competition":   competition.strip(),
        "venue":         venue.strip() if venue else "",
        "status":        "upcoming",
        "homeFormation": hf,
        "awayFormation": af,
        "homeLineup":    home_lineup,
        "awayLineup":    away_lineup,
        "voteCounts":    {"home_win": 0, "draw": 0, "away_win": 0},
        "createdAt":     datetime.utcnow(),
        "updatedAt":     datetime.utcnow(),
    }

    result = db.matches.insert_one(doc)

    print(f"\n  Match scheduled!")
    print(f"  ID          : {result.inserted_id}")
    print(f"  Home        : {home['name']}")
    print(f"  Away        : {away['name']}")
    print(f"  Date        : {match_date.strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"  Competition : {competition}")
    print(f"  Venue       : {venue or '—'}")
    print(f"  Formations  : {hf} vs {af}")
    print(f"\n  Predicted lineup — {home['name']}:")
    print(_lineup_summary(home_lineup, db))
    print(f"\n  Predicted lineup — {away['name']}:")
    print(_lineup_summary(away_lineup, db))
    print()


# ─── Interactive + CLI ────────────────────────────────────────────────────────

_FORMATION_LIST = list(POSITION_SLOTS.keys())


def _pick_team(db, prompt: str) -> dict:
    """Display a numbered team list and return the selected team document."""
    teams = list(db.teams.find({}, {"name": 1}).sort("name", 1))
    if not teams:
        print("  ERROR: No teams found in database. Run seed_db.py first.")
        sys.exit(1)
    print(f"\n  {prompt}")
    for i, t in enumerate(teams, 1):
        print(f"    {i:>2}.  {t['name']}")
    while True:
        raw = input("  Enter number: ").strip()
        if raw.isdigit():
            idx = int(raw) - 1
            if 0 <= idx < len(teams):
                chosen = db.teams.find_one({"_id": teams[idx]["_id"]})
                print(f"  → {chosen['name']}")
                return chosen
        print(f"  Please enter a number between 1 and {len(teams)}.")


def _pick_formation(prompt: str, default: str = "4-3-3") -> str:
    """Display a numbered formation list and return the chosen formation string."""
    print(f"\n  {prompt}")
    for i, f in enumerate(_FORMATION_LIST, 1):
        marker = " (default)" if f == default else ""
        print(f"    {i:>2}.  {f}{marker}")
    while True:
        raw = input(f"  Enter number [default={default}]: ").strip()
        if raw == "":
            return default
        if raw.isdigit():
            idx = int(raw) - 1
            if 0 <= idx < len(_FORMATION_LIST):
                chosen = _FORMATION_LIST[idx]
                print(f"  → {chosen}")
                return chosen
        print(f"  Please enter a number between 1 and {len(_FORMATION_LIST)}, or press Enter for default.")


def interactive_mode(db):
    print("\n=== Add Upcoming Match (interactive) ===")

    home = _pick_team(db, "Select HOME team:")
    away = _pick_team(db, "Select AWAY team:")

    if home["_id"] == away["_id"]:
        print("  ERROR: Home and away team must be different.")
        sys.exit(1)

    date_str    = input("\n  Date & time (YYYY-MM-DD HH:MM): ").strip()
    competition = input("  Competition name: ").strip()
    venue       = input("  Venue (Enter to skip): ").strip()
    hf          = _pick_formation("Select HOME formation:", home.get("formation", "4-3-3"))
    af          = _pick_formation("Select AWAY formation:", away.get("formation", "4-3-3"))

    confirm = input(
        f"\n  Schedule {home['name']} vs {away['name']} on {date_str}? [y/N] "
    ).strip().lower()
    if confirm != "y":
        print("Cancelled.")
        sys.exit(0)

    add_match(db, home["name"], away["name"], date_str, competition, venue, hf, af)


def main():
    parser = argparse.ArgumentParser(
        description="Schedule an upcoming match in FotNep MongoDB",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--list-teams",       action="store_true", help="List all teams and exit")
    parser.add_argument("--home",             help="Home team name or ID (case-insensitive)")
    parser.add_argument("--away",             help="Away team name or ID (case-insensitive)")
    parser.add_argument("--date",             help="Match date (YYYY-MM-DD HH:MM)")
    parser.add_argument("--competition",      help="Competition name")
    parser.add_argument("--venue",            default="", help="Venue (optional)")
    parser.add_argument("--home-formation",   default="4-3-3")
    parser.add_argument("--away-formation",   default="4-3-3")

    args = parser.parse_args()
    db = get_db()

    if args.list_teams:
        list_teams(db)
        sys.exit(0)

    if not all([args.home, args.away, args.date, args.competition]):
        interactive_mode(db)
    else:
        add_match(db, args.home, args.away, args.date, args.competition,
                  args.venue, args.home_formation, args.away_formation)


if __name__ == "__main__":
    main()
