"""
ELO Rating System — FotNep
Algorithm 2: Player & Team ELO ratings derived from match results.

Works purely from:
  - Match W/D/L results
  - Individual goals scored & cards per match
  - Opponent team quality (their ELO)

No positional tracking or external API needed.
"""

import math
from dataclasses import dataclass, field
from typing import Optional


# ─── Constants ────────────────────────────────────────────────────────────────
DEFAULT_ELO: float = 1000.0
K_FACTOR: float = 32.0          # Sensitivity — higher = faster rating change
GOAL_BONUS: float = 8.0         # ELO points added per goal scored
RED_CARD_PENALTY: float = 15.0  # ELO points deducted per red card
YELLOW_CARD_PENALTY: float = 3.0

# Win / Draw / Loss outcomes
WIN = 1.0
DRAW = 0.5
LOSS = 0.0


# ─── Data Classes ─────────────────────────────────────────────────────────────
@dataclass
class PlayerRating:
    """Holds the current ELO state for a single player."""
    player_id: str
    name: str
    position: str
    elo: float = DEFAULT_ELO
    matches_played: int = 0
    history: list = field(default_factory=list)   # list of dicts per match

    def __repr__(self) -> str:
        return f"PlayerRating({self.name}, ELO={self.elo:.1f}, MP={self.matches_played})"


@dataclass
class MatchPerformance:
    """Individual player performance in one match."""
    match_id: str
    opponent_team_elo: float         # Average ELO of the opponent team
    result: str                      # 'W', 'D', or 'L'
    goals: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    minutes_played: int = 90


# ─── Core ELO Functions ───────────────────────────────────────────────────────
def expected_score(player_elo: float, opponent_elo: float) -> float:
    """
    Probability that player beats (or outperforms) their opponent.

    Formula: E = 1 / (1 + 10^((Eo - Ep) / 400))
    """
    return 1.0 / (1.0 + math.pow(10, (opponent_elo - player_elo) / 400))


def actual_score(result: str) -> float:
    """Convert W/D/L string to numerical outcome."""
    mapping = {"W": WIN, "D": DRAW, "L": LOSS}
    return mapping.get(result.upper(), DRAW)


def calculate_individual_bonus(goals: int, yellow_cards: int, red_cards: int) -> float:
    """
    Individual contribution modifier on top of the team result.
    This allows a player to gain/lose ELO even from a W/D/L beyond the baseline.
    """
    bonus = (goals * GOAL_BONUS)
    bonus -= (yellow_cards * YELLOW_CARD_PENALTY)
    bonus -= (red_cards * RED_CARD_PENALTY)
    return bonus


def update_elo(
    player: PlayerRating,
    performance: MatchPerformance,
    k: float = K_FACTOR,
) -> float:
    """
    Compute and apply new ELO after a single match.

    Returns the delta (change in ELO).
    """
    E = expected_score(player.elo, performance.opponent_team_elo)
    S = actual_score(performance.result)

    # Base ELO change
    delta = k * (S - E)

    # Individual bonuses / penalties
    delta += calculate_individual_bonus(
        performance.goals,
        performance.yellow_cards,
        performance.red_cards,
    )

    # Apply
    old_elo = player.elo
    player.elo = max(100.0, player.elo + delta)   # Floor at 100
    player.matches_played += 1

    # Log history
    player.history.append({
        "match_id": performance.match_id,
        "result": performance.result,
        "goals": performance.goals,
        "yellow_cards": performance.yellow_cards,
        "red_cards": performance.red_cards,
        "elo_before": round(old_elo, 2),
        "elo_after": round(player.elo, 2),
        "delta": round(delta, 2),
    })

    return delta


# ─── Batch Processing ─────────────────────────────────────────────────────────
def process_squad_elo(
    squad: list[dict],
    match_history: list[dict],
) -> dict[str, PlayerRating]:
    """
    Bootstrap ELO ratings for all players from historical match data.

    Args:
        squad: List of player dicts with keys:
               {player_id, name, position, caps, goals, yellow_cards, red_cards}
        match_history: List of match dicts with keys:
               {match_id, result, opponent_avg_elo, player_goals, player_id,
                yellow_cards, red_cards, minutes}

    Returns:
        Dictionary of player_id → PlayerRating
    """
    # Initialise ratings
    ratings: dict[str, PlayerRating] = {}
    for p in squad:
        ratings[p["player_id"]] = PlayerRating(
            player_id=p["player_id"],
            name=p["name"],
            position=p["position"],
        )

    # Process each match chronologically
    for match in sorted(match_history, key=lambda m: m.get("date", "")):
        player_id = match.get("player_id")
        if player_id not in ratings:
            continue

        perf = MatchPerformance(
            match_id=match.get("match_id", "unknown"),
            opponent_team_elo=match.get("opponent_avg_elo", DEFAULT_ELO),
            result=match.get("result", "D"),
            goals=match.get("goals", 0),
            yellow_cards=match.get("yellow_cards", 0),
            red_cards=match.get("red_cards", 0),
            minutes_played=match.get("minutes", 90),
        )
        update_elo(ratings[player_id], perf)

    return ratings


# ─── Form Score ───────────────────────────────────────────────────────────────
def calculate_form_score(player: PlayerRating, last_n: int = 5) -> dict:
    """
    Compute weighted form score from last N matches.

    Most recent match has highest weight (1.0), oldest has lowest (0.6).
    
    Returns:
        {
            "form_score": float (0-10),
            "trend": "improving" | "declining" | "stable",
            "last_matches": list of simplified match dicts
        }
    """
    if not player.history:
        return {"form_score": 5.0, "trend": "stable", "last_matches": []}

    recent = player.history[-last_n:]
    weights = [0.6, 0.7, 0.8, 0.9, 1.0][-len(recent):]

    # Score each match: W=3, D=1, L=0 (like points) + goal bonus
    raw_scores = []
    for m in recent:
        base = {"W": 3, "D": 1, "L": 0}.get(m["result"], 1)
        bonus = m.get("goals", 0) * 0.5
        raw_scores.append(base + bonus)

    weighted_sum = sum(s * w for s, w in zip(raw_scores, weights))
    max_possible = sum(3.5 * w for w in weights)   # 3 + 0.5 goal max
    form_score = round((weighted_sum / max_possible) * 10, 2)

    # Trend: compare first half vs second half of the window
    if len(recent) >= 4:
        first_half = sum(raw_scores[: len(recent) // 2])
        second_half = sum(raw_scores[len(recent) // 2 :])
        if second_half > first_half + 0.5:
            trend = "improving"
        elif second_half < first_half - 0.5:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    return {
        "form_score": form_score,
        "trend": trend,
        "last_matches": [
            {
                "result": m["result"],
                "goals": m.get("goals", 0),
                "elo_delta": m["delta"],
            }
            for m in recent
        ],
    }


# ─── Leaderboard ──────────────────────────────────────────────────────────────
def build_leaderboard(ratings: dict[str, PlayerRating]) -> list[dict]:
    """Return sorted ELO leaderboard."""
    leaderboard = []
    for pid, player in ratings.items():
        form = calculate_form_score(player)
        leaderboard.append(
            {
                "rank": 0,  # filled below
                "player_id": pid,
                "name": player.name,
                "position": player.position,
                "elo": round(player.elo, 1),
                "matches_played": player.matches_played,
                "form_score": form["form_score"],
                "trend": form["trend"],
            }
        )

    leaderboard.sort(key=lambda x: x["elo"], reverse=True)
    for i, entry in enumerate(leaderboard):
        entry["rank"] = i + 1

    return leaderboard


# ─── Bootstrap from sparse data (no match history) ────────────────────────────
def bootstrap_from_career_stats(players: list[dict]) -> dict[str, PlayerRating]:
    """
    When no per-match history is available, estimate ELO from career stats.
    Uses: caps, goals, market_value, age.

    Good for cold-start when only summary stats exist.
    """
    ratings = {}

    # Normalise market value for scaling
    max_value = max((p.get("market_value", 1) for p in players), default=1)

    for p in players:
        player_id = p.get("player_id", p.get("name", "unknown").replace(" ", "_"))
        caps = p.get("caps", 0)
        goals = p.get("goals", 0)
        market_value = p.get("market_value", 50000)
        age = p.get("age", 25)

        # Heuristic ELO from career stats
        # Base: 800–1400 range
        cap_score = min(caps / 100, 1.0) * 200       # 0–200 from caps
        goal_score = min(goals / 20, 1.0) * 150      # 0–150 from goals
        value_score = (market_value / max_value) * 100  # 0–100 from value
        age_penalty = max(0, (age - 32) * 5)         # Penalty for 32+

        elo = DEFAULT_ELO + cap_score + goal_score + value_score - age_penalty

        ratings[player_id] = PlayerRating(
            player_id=player_id,
            name=p.get("name", player_id),
            position=p.get("position", "MID"),
            elo=round(min(max(elo, 700), 1400), 1),
        )

    return ratings


# ─── Quick demo ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    # Sample squad data matching nepalisquad.csv columns
    sample_squad = [
        {"player_id": "kiran_chemjong", "name": "Kiran Chemjong",    "position": "GK",  "caps": 111, "goals": 0,  "market_value": 50000,  "age": 36},
        {"player_id": "rohit_chand",    "name": "Rohit Chand",       "position": "MID", "caps": 98,  "goals": 2,  "market_value": 150000, "age": 34},
        {"player_id": "anjan_bista",    "name": "Anjan Bista",       "position": "FWD", "caps": 74,  "goals": 13, "market_value": 125000, "age": 27},
        {"player_id": "ananta_tamang",  "name": "Ananta Tamang",     "position": "DEF", "caps": 73,  "goals": 4,  "market_value": 175000, "age": 28},
        {"player_id": "manish_dangi",   "name": "Manish Dangi",      "position": "MID", "caps": 44,  "goals": 5,  "market_value": 50000,  "age": 24},
        {"player_id": "ayush_ghalan",   "name": "Ayush Ghalan",      "position": "MID", "caps": 35,  "goals": 2,  "market_value": 150000, "age": 22},
        {"player_id": "sanish_shrestha","name": "Sanish Shrestha",   "position": "DEF", "caps": 27,  "goals": 1,  "market_value": 125000, "age": 25},
    ]

    # Bootstrap from career stats
    ratings = bootstrap_from_career_stats(sample_squad)

    # Simulate some match performances
    simulated_matches = [
        {"player_id": "anjan_bista",   "match_id": "m001", "result": "W", "goals": 1, "yellow_cards": 0, "red_cards": 0, "opponent_avg_elo": 1000, "date": "2025-01-10"},
        {"player_id": "anjan_bista",   "match_id": "m002", "result": "D", "goals": 0, "yellow_cards": 1, "red_cards": 0, "opponent_avg_elo": 1050, "date": "2025-02-01"},
        {"player_id": "anjan_bista",   "match_id": "m003", "result": "W", "goals": 2, "yellow_cards": 0, "red_cards": 0, "opponent_avg_elo": 980,  "date": "2025-03-15"},
        {"player_id": "rohit_chand",   "match_id": "m001", "result": "W", "goals": 0, "yellow_cards": 1, "red_cards": 0, "opponent_avg_elo": 1000, "date": "2025-01-10"},
        {"player_id": "rohit_chand",   "match_id": "m002", "result": "D", "goals": 0, "yellow_cards": 0, "red_cards": 0, "opponent_avg_elo": 1050, "date": "2025-02-01"},
        {"player_id": "ayush_ghalan",  "match_id": "m003", "result": "W", "goals": 1, "yellow_cards": 0, "red_cards": 0, "opponent_avg_elo": 980,  "date": "2025-03-15"},
    ]

    # Update ratings with simulated matches
    for match in simulated_matches:
        pid = match["player_id"]
        if pid in ratings:
            perf = MatchPerformance(
                match_id=match["match_id"],
                opponent_team_elo=match["opponent_avg_elo"],
                result=match["result"],
                goals=match["goals"],
                yellow_cards=match["yellow_cards"],
                red_cards=match["red_cards"],
            )
            update_elo(ratings[pid], perf)

    # Print leaderboard
    print("\n=== FotNep ELO Leaderboard ===")
    for entry in build_leaderboard(ratings):
        print(f"#{entry['rank']:2d}  {entry['name']:<20}  ELO: {entry['elo']:7.1f}  Form: {entry['form_score']:.1f}/10  [{entry['trend']}]")
