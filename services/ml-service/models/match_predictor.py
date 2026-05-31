"""
Naive Bayes Match Predictor + Lineup Selector — FotNep
Algorithm 3: Probabilistic prediction for:
  1. Match Win / Draw / Loss outcome probabilities
  2. Predicted Nepal starting XI from squad

Uses sklearn GaussianNB + manual Bayesian scoring for lineup selection.
Works with sparse data (only goals, caps, minutes, form, ELO).
"""

import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score

# ─── Constants ────────────────────────────────────────────────────────────────
# Historical W/D/L base rates for international football
# Source: FIFA stats — home team wins ~47%, draws ~27%, away wins ~26%
BASE_HOME_WIN  = 0.47
BASE_DRAW      = 0.27
BASE_AWAY_WIN  = 0.26

HOME_ADVANTAGE = 0.08   # Flat boost to home win probability

# Position requirements for a standard 4-3-3 / 4-4-2 / 4-2-3-1
FORMATION_REQUIREMENTS = {
    "4-3-3":   {"GK": 1, "DEF": 4, "MID": 3, "FWD": 3},
    "4-4-2":   {"GK": 1, "DEF": 4, "MID": 4, "FWD": 2},
    "4-2-3-1": {"GK": 1, "DEF": 4, "MID": 5, "FWD": 1},
    "3-5-2":   {"GK": 1, "DEF": 3, "MID": 5, "FWD": 2},
    "5-3-2":   {"GK": 1, "DEF": 5, "MID": 3, "FWD": 2},
}


# ─── Position normaliser ──────────────────────────────────────────────────────
POSITION_NORMALISE = {
    # Nepali squad CSV positions → simple buckets
    "Goalkeeper":           "GK",
    "Defensive Midfield":   "MID",
    "Left Winger / Forward":"FWD",
    "Centre-Back":          "DEF",
    "Right Winger":         "MID",
    "Centre-Forward":       "FWD",
    "Central Midfield":     "MID",
    "Right-Back":           "DEF",
    # Already normalised
    "GK": "GK", "DEF": "DEF", "MID": "MID", "FWD": "FWD",
}


def normalise_position(pos: str) -> str:
    return POSITION_NORMALISE.get(pos.strip(), "MID")


# ─── 1. MATCH OUTCOME PREDICTOR ───────────────────────────────────────────────
class MatchPredictor:
    """
    Naive Bayes match outcome predictor.

    Training: Provide historical match data.
    Inference: Given two team feature vectors, returns P(Home Win), P(Draw), P(Away Win).

    If no training data is provided, falls back to a weighted rule-based calculation
    using ELO difference, form scores, and home advantage — still interpretable
    as a Bayesian model with uniform priors.
    """

    def __init__(self):
        self.model = GaussianNB()
        self.label_encoder = LabelEncoder()
        self._is_trained = False

    # ── Training ──────────────────────────────────────────────────────────────
    def train(self, match_data: list[dict]) -> dict:
        """
        Train on historical match data.

        Each match dict should have:
          {
            "home_elo", "away_elo",
            "home_form", "away_form",       # 0-10 form scores
            "home_goals_avg", "away_goals_avg",
            "is_neutral_venue",             # bool
            "result"                        # "H" (home win) | "D" | "A"
          }

        Returns: cross-validation accuracy dict
        """
        X, y = [], []
        for m in match_data:
            X.append(self._match_to_features(m))
            y.append(m["result"])

        X = np.array(X, dtype=float)
        y_enc = self.label_encoder.fit_transform(y)

        self.model.fit(X, y_enc)
        self._is_trained = True

        # Cross-validate (3-fold)
        if len(X) >= 6:
            scores = cross_val_score(self.model, X, y_enc, cv=min(3, len(X)), scoring="accuracy")
            return {"cv_accuracy_mean": round(scores.mean(), 3), "cv_accuracy_std": round(scores.std(), 3)}

        return {"cv_accuracy_mean": None, "note": "Need ≥6 samples for CV"}

    def _match_to_features(self, m: dict) -> list:
        elo_diff   = m.get("home_elo", 1000) - m.get("away_elo", 1000)
        form_diff  = m.get("home_form", 5.0) - m.get("away_form", 5.0)
        goal_diff  = m.get("home_goals_avg", 1.5) - m.get("away_goals_avg", 1.5)
        home_adv   = 0.0 if m.get("is_neutral_venue", False) else 1.0
        return [elo_diff, form_diff, goal_diff, home_adv]

    # ── Prediction ────────────────────────────────────────────────────────────
    def predict(
        self,
        home_team: dict,
        away_team: dict,
        is_neutral_venue: bool = False,
    ) -> dict:
        """
        Predict match outcome.

        Args:
            home_team: {
              "name", "elo", "form_score", "avg_goals_scored",
              "avg_goals_conceded", "injured_count"
            }
            away_team: same structure
            is_neutral_venue: True for World Cup / SAFF finals etc.

        Returns:
            {
              "home_win": float,
              "draw": float,
              "away_win": float,
              "confidence": float,
              "predicted_result": "H" | "D" | "A",
              "narrative": str
            }
        """
        match_features = {
            "home_elo":        home_team.get("elo", 1000),
            "away_elo":        away_team.get("elo", 1000),
            "home_form":       home_team.get("form_score", 5.0),
            "away_form":       away_team.get("form_score", 5.0),
            "home_goals_avg":  home_team.get("avg_goals_scored", 1.2),
            "away_goals_avg":  away_team.get("avg_goals_scored", 1.2),
            "is_neutral_venue": is_neutral_venue,
        }

        if self._is_trained:
            return self._predict_trained(match_features, home_team, away_team)
        else:
            return self._predict_rule_based(match_features, home_team, away_team, is_neutral_venue)

    def _predict_trained(self, features: dict, home_team: dict, away_team: dict) -> dict:
        vec = np.array([self._match_to_features(features)])
        probs = self.model.predict_proba(vec)[0]
        classes = self.label_encoder.classes_   # alphabetical: A, D, H

        prob_map = dict(zip(classes, probs))
        hw = prob_map.get("H", 0.33)
        dr = prob_map.get("D", 0.34)
        aw = prob_map.get("A", 0.33)

        return self._format_prediction(hw, dr, aw, home_team, away_team)

    def _predict_rule_based(
        self,
        features: dict,
        home_team: dict,
        away_team: dict,
        neutral: bool,
    ) -> dict:
        """
        Bayesian-style rule-based prediction (used when no training data).
        Adjusts base rates using ELO difference + form difference.
        """
        elo_diff   = features["home_elo"] - features["away_elo"]
        form_diff  = features["home_form"] - features["away_form"]
        goal_diff  = features["home_goals_avg"] - features["away_goals_avg"]

        # Logistic-style scaling — each factor contributes small adjustments
        elo_adj  = np.tanh(elo_diff / 400) * 0.20
        form_adj = np.tanh(form_diff / 5) * 0.12
        goal_adj = np.tanh(goal_diff / 2) * 0.08
        home_adj = 0.0 if neutral else HOME_ADVANTAGE

        total_adj = elo_adj + form_adj + goal_adj

        hw = BASE_HOME_WIN + total_adj + home_adj
        aw = BASE_AWAY_WIN - total_adj
        dr = BASE_DRAW

        # Apply injury penalties
        home_inj = home_team.get("injured_count", 0)
        away_inj = away_team.get("injured_count", 0)
        hw -= home_inj * 0.02
        aw -= away_inj * 0.02
        dr += (home_inj + away_inj) * 0.01

        # Normalise to sum = 1
        total = hw + dr + aw
        hw, dr, aw = hw / total, dr / total, aw / total

        return self._format_prediction(hw, dr, aw, home_team, away_team)

    @staticmethod
    def _format_prediction(hw: float, dr: float, aw: float, home: dict, away: dict) -> dict:
        hw = max(0.01, min(0.98, hw))
        dr = max(0.01, min(0.98, dr))
        aw = max(0.01, min(0.98, aw))

        # Renormalise
        total = hw + dr + aw
        hw, dr, aw = hw / total, dr / total, aw / total

        predicted = "H" if hw > max(dr, aw) else ("D" if dr > aw else "A")
        confidence = max(hw, dr, aw)

        result_label = {
            "H": f"{home['name']} Win",
            "D": "Draw",
            "A": f"{away['name']} Win",
        }[predicted]

        narrative = _build_narrative(hw, dr, aw, home, away, predicted)

        return {
            "home_win":   round(hw, 3),
            "draw":       round(dr, 3),
            "away_win":   round(aw, 3),
            "confidence": round(confidence, 3),
            "predicted_result": predicted,
            "predicted_label": result_label,
            "narrative": narrative,
        }


def _build_narrative(hw, dr, aw, home, away, predicted) -> str:
    """Generate a human-readable match preview."""
    lines = []
    h_name, a_name = home["name"], away["name"]

    if abs(hw - aw) < 0.06:
        lines.append(f"This is an evenly matched contest between {h_name} and {a_name}.")
    elif hw > aw:
        lines.append(f"{h_name} are favourites with a {hw:.0%} win probability.")
    else:
        lines.append(f"{a_name} come in as the stronger side with a {aw:.0%} win chance.")

    elo_diff = home.get("elo", 1000) - away.get("elo", 1000)
    if abs(elo_diff) > 50:
        stronger = h_name if elo_diff > 0 else a_name
        lines.append(f"{stronger} hold a significant ELO advantage ({abs(elo_diff):.0f} points).")

    if home.get("injured_count", 0) > 2:
        lines.append(f"{h_name} are missing {home['injured_count']} players through injury.")

    lines.append(
        f"Prediction: {predicted} | "
        f"Home Win {hw:.0%} | Draw {dr:.0%} | Away Win {aw:.0%}"
    )
    return " ".join(lines)


# ─── 2. LINEUP PREDICTOR ──────────────────────────────────────────────────────
class LineupPredictor:
    """
    Predicts the most likely Nepal starting XI using Naive Bayes-style
    probability scoring per player.

    Scoring factors (all normalised to 0-1):
      - ELO / form score
      - Caps (experience)
      - Goals contribution (for attacking positions)
      - Availability (not suspended / low injury risk)
      - Recent form trend
    """

    # Weight per factor per position type
    WEIGHTS = {
        "GK":  {"form": 0.35, "elo": 0.30, "caps": 0.25, "goals": 0.05, "availability": 0.05},
        "DEF": {"form": 0.30, "elo": 0.25, "caps": 0.25, "goals": 0.05, "availability": 0.15},
        "MID": {"form": 0.30, "elo": 0.20, "caps": 0.20, "goals": 0.15, "availability": 0.15},
        "FWD": {"form": 0.25, "elo": 0.20, "caps": 0.15, "goals": 0.25, "availability": 0.15},
    }

    def predict_lineup(
        self,
        squad: list[dict],
        formation: str = "4-3-3",
        elo_ratings: dict | None = None,
    ) -> dict:
        """
        Predict best starting XI.

        Args:
            squad: list of player dicts from nepalisquad.csv + optional ELO/form
            formation: one of FORMATION_REQUIREMENTS keys
            elo_ratings: optional {player_id: PlayerRating} from elo_rating.py

        Returns:
            {
              "formation": str,
              "starting_xi": [...],
              "bench": [...],
              "probabilities": {...}
            }
        """
        requirements = FORMATION_REQUIREMENTS.get(formation, FORMATION_REQUIREMENTS["4-3-3"])

        # Score every player
        scored = []
        for p in squad:
            pos = normalise_position(p.get("Position", p.get("position", "MID")))
            score, prob_breakdown = self._score_player(p, pos, elo_ratings)
            scored.append({
                "player_id": p.get("player_id", p.get("Player Name", "").replace(" ", "_").lower()),
                "name":      p.get("Player Name", p.get("name", "?")),
                "position":  pos,
                "score":     score,
                "probability": round(score * 100, 1),
                "breakdown": prob_breakdown,
                "suspended": self._is_suspended(p),
                "raw": p,
            })

        # Select by position slot
        starting_xi = self._select_xi(scored, requirements)
        bench = [p for p in scored if p not in starting_xi][:7]

        return {
            "formation":   formation,
            "starting_xi": starting_xi,
            "bench":       bench[:7],
            "all_scores":  sorted(scored, key=lambda x: x["score"], reverse=True),
        }

    def _score_player(
        self,
        player: dict,
        pos: str,
        elo_ratings: dict | None,
    ) -> tuple[float, dict]:
        weights = self.WEIGHTS.get(pos, self.WEIGHTS["MID"])

        # ── Form score (0-1) ──
        form_raw = player.get("form_score", 5.0)
        form_norm = float(form_raw) / 10.0

        # ── ELO score (0-1) ──
        elo_raw = 1000.0
        if elo_ratings:
            pid = player.get("player_id", "")
            if pid in elo_ratings:
                elo_raw = elo_ratings[pid].elo
        elo_norm = min((elo_raw - 700) / 700, 1.0)    # 700–1400 → 0–1

        # ── Caps (experience, 0-1) ──
        caps = float(player.get("Caps", player.get("caps", 0)) or 0)
        caps_norm = min(caps / 100, 1.0)

        # ── Goals contribution (0-1) ──
        goals = float(player.get("Goals", player.get("goals", 0)) or 0)
        goals_norm = min(goals / 15, 1.0)

        # ── Availability (0-1) ──
        yellow = float(player.get("Yellow Cards", player.get("yellow_cards", 0)) or 0)
        red    = float(player.get("Red Cards",    player.get("red_cards",    0)) or 0)
        # High yellow cards / red → lower availability probability
        availability = max(0.0, 1.0 - (red * 0.40) - (yellow * 0.02))

        score = (
            weights["form"]         * form_norm +
            weights["elo"]          * elo_norm +
            weights["caps"]         * caps_norm +
            weights["goals"]        * goals_norm +
            weights["availability"] * availability
        )

        breakdown = {
            "form":         round(form_norm, 3),
            "elo":          round(elo_norm, 3),
            "caps":         round(caps_norm, 3),
            "goals":        round(goals_norm, 3),
            "availability": round(availability, 3),
            "final":        round(score, 3),
        }

        return score, breakdown

    @staticmethod
    def _is_suspended(player: dict) -> bool:
        """Simple heuristic: 5+ yellow cards = likely suspension."""
        yellows = int(player.get("Yellow Cards", player.get("yellow_cards", 0)) or 0)
        reds    = int(player.get("Red Cards",    player.get("red_cards",    0)) or 0)
        return reds >= 1 or yellows >= 5

    @staticmethod
    def _select_xi(scored: list[dict], requirements: dict) -> list[dict]:
        """
        Greedily fill each positional slot with the highest-scoring
        available, non-suspended player.
        """
        selected = []
        used = set()

        for pos_bucket, count in requirements.items():
            candidates = [
                p for p in scored
                if p["position"] == pos_bucket
                and p["player_id"] not in used
                and not p["suspended"]
            ]
            candidates.sort(key=lambda x: x["score"], reverse=True)
            for p in candidates[:count]:
                selected.append(p)
                used.add(p["player_id"])

        return selected


# ─── Quick demo ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import pandas as pd

    # ── 1. Match predictor demo ──
    predictor = MatchPredictor()

    nepal = {
        "name": "Nepal",
        "elo": 1050.0,
        "form_score": 6.5,
        "avg_goals_scored": 1.1,
        "avg_goals_conceded": 1.8,
        "injured_count": 1,
    }

    bangladesh = {
        "name": "Bangladesh",
        "elo": 980.0,
        "form_score": 4.8,
        "avg_goals_scored": 0.8,
        "avg_goals_conceded": 2.0,
        "injured_count": 0,
    }

    india = {
        "name": "India",
        "elo": 1180.0,
        "form_score": 7.2,
        "avg_goals_scored": 1.8,
        "avg_goals_conceded": 1.1,
        "injured_count": 2,
    }

    print("\n=== Match Predictions ===")
    for away in [bangladesh, india]:
        result = predictor.predict(nepal, away, is_neutral_venue=False)
        print(f"\nNepal vs {away['name']}:")
        print(f"  Home Win: {result['home_win']:.1%}  |  Draw: {result['draw']:.1%}  |  Away Win: {result['away_win']:.1%}")
        print(f"  Prediction: {result['predicted_label']}  (confidence: {result['confidence']:.1%})")
        print(f"  {result['narrative']}")

    # ── 2. Lineup predictor demo ──
    nepali_squad = [
        {"Player Name": "Kiran Chemjong",    "Position": "Goalkeeper",           "Caps": 111, "Goals": 0,  "Yellow Cards": 4, "Red Cards": 0, "form_score": 7.0},
        {"Player Name": "Rohit Chand",       "Position": "Defensive Midfield",   "Caps": 98,  "Goals": 2,  "Yellow Cards": 11,"Red Cards": 1, "form_score": 5.5},
        {"Player Name": "Anjan Bista",       "Position": "Left Winger / Forward","Caps": 74,  "Goals": 13, "Yellow Cards": 8, "Red Cards": 0, "form_score": 8.0},
        {"Player Name": "Ananta Tamang",     "Position": "Centre-Back",          "Caps": 73,  "Goals": 4,  "Yellow Cards": 12,"Red Cards": 1, "form_score": 6.5},
        {"Player Name": "Manish Dangi",      "Position": "Right Winger",         "Caps": 44,  "Goals": 5,  "Yellow Cards": 3, "Red Cards": 0, "form_score": 7.0},
        {"Player Name": "Ayush Ghalan",      "Position": "Right Winger",         "Caps": 35,  "Goals": 2,  "Yellow Cards": 2, "Red Cards": 0, "form_score": 7.5},
        {"Player Name": "Sanish Shrestha",   "Position": "Right-Back",           "Caps": 27,  "Goals": 1,  "Yellow Cards": 4, "Red Cards": 0, "form_score": 6.2},
        {"Player Name": "Gillespye Karki",   "Position": "Centre-Forward",       "Caps": 20,  "Goals": 3,  "Yellow Cards": 1, "Red Cards": 0, "form_score": 6.8},
        {"Player Name": "Arik Bista",        "Position": "Central Midfield",     "Caps": 32,  "Goals": 0,  "Yellow Cards": 5, "Red Cards": 0, "form_score": 6.0},
        {"Player Name": "Mani Kumar Lama",   "Position": "Defensive Midfield",   "Caps": 16,  "Goals": 0,  "Yellow Cards": 2, "Red Cards": 0, "form_score": 6.3},
        {"Player Name": "Suman Shrestha",    "Position": "Centre-Back",          "Caps": 10,  "Goals": 0,  "Yellow Cards": 1, "Red Cards": 0, "form_score": 5.8},
        {"Player Name": "Abhishek Limbu",    "Position": "Centre-Back",          "Caps": 6,   "Goals": 0,  "Yellow Cards": 0, "Red Cards": 0, "form_score": 5.5},
    ]

    # Add player_ids
    for p in nepali_squad:
        p["player_id"] = p["Player Name"].replace(" ", "_").lower()

    lineup_predictor = LineupPredictor()
    result = lineup_predictor.predict_lineup(nepali_squad, formation="4-3-3")

    print("\n\n=== Predicted Nepal Starting XI (4-3-3) ===")
    for pos_label, pos_code in [("GK", "GK"), ("Defenders", "DEF"), ("Midfielders", "MID"), ("Forwards", "FWD")]:
        in_pos = [p for p in result["starting_xi"] if p["position"] == pos_code]
        if in_pos:
            names = ", ".join(f"{p['name']} ({p['probability']:.0f}%)" for p in in_pos)
            print(f"  {pos_label}: {names}")

    print("\n  Bench:", ", ".join(p["name"] for p in result["bench"][:5]))

    # Train on synthetic data
    synthetic_matches = [
        {"home_elo": 1050, "away_elo": 980,  "home_form": 6.5, "away_form": 4.8, "home_goals_avg": 1.1, "away_goals_avg": 0.8, "is_neutral_venue": False, "result": "H"},
        {"home_elo": 1050, "away_elo": 1180, "home_form": 6.5, "away_form": 7.2, "home_goals_avg": 1.1, "away_goals_avg": 1.8, "is_neutral_venue": False, "result": "A"},
        {"home_elo": 1050, "away_elo": 1020, "home_form": 5.0, "away_form": 5.0, "home_goals_avg": 1.2, "away_goals_avg": 1.2, "is_neutral_venue": True,  "result": "D"},
        {"home_elo": 1100, "away_elo": 950,  "home_form": 7.5, "away_form": 4.0, "home_goals_avg": 1.8, "away_goals_avg": 0.9, "is_neutral_venue": False, "result": "H"},
        {"home_elo": 900,  "away_elo": 1100, "home_form": 4.0, "away_form": 7.5, "home_goals_avg": 0.8, "away_goals_avg": 1.8, "is_neutral_venue": False, "result": "A"},
        {"home_elo": 1030, "away_elo": 1030, "home_form": 5.5, "away_form": 5.5, "home_goals_avg": 1.1, "away_goals_avg": 1.1, "is_neutral_venue": True,  "result": "D"},
    ]

    cv_result = predictor.train(synthetic_matches)
    print(f"\n\n[Trained NB Model] CV accuracy: {cv_result}")

    result_trained = predictor.predict(nepal, india)
    print(f"\n[Trained] Nepal vs India: {result_trained['predicted_label']}  "
          f"({result_trained['home_win']:.0%} / {result_trained['draw']:.0%} / {result_trained['away_win']:.0%})")
