# FotNep Algorithms

Three core machine learning algorithms powering the FotNep platform.

---

## 1. Crowd Consensus Prediction

**Purpose:** Community-driven match outcome forecasting with reputation-weighted voting

**How it works:**
- Users vote on match outcomes (Home Win, Draw, Away Win)
- Each user's vote is weighted by their reputation score
- High-reputation users have greater influence on predictions
- Final prediction = weighted average of all community votes
- Confidence score reflects vote distribution variance

**Inputs:**
- Match ID
- User votes (outcome + user reputation)
- Historical accuracy of users

**Outputs:**
- Predicted winner probability distribution
- Community confidence (0-100%)
- Vote breakdown by outcome

**Use case:** Gauge community sentiment and expert opinion on matches before they're played

---

## 2. Player Performance Estimator

**Purpose:** Compare player statistics predicted by ML from available training data

**How it works:**
- ML model trained on player performance datasets (stats, position, team, game history)
- Predicts missing or future player statistics based on patterns in training data
- Enables head-to-head comparison between players with different career histories
- Normalizes stats across different competitions and time periods
- Generates similarity scores between any two players

**Inputs:**
- Player 1 ID (name, position, stats)
- Player 2 ID (name, position, stats)
- Available historical data

**Outputs:**
- Predicted stat breakdown for both players
- Similarity score (0-100%)
- Attribute-by-attribute comparison (pace, shooting, passing, dribbling, defending, physical)
- Recommended tactical pairing insights

**Use case:** Scout new players, find position alternatives, understand player strengths/weaknesses

---

## 3. Optimal Squad Generator

**Purpose:** Predict ideal match lineups based on historical performance and player availability

**How it works:**
- Analyzes past match lineups and outcomes
- Learns which player combinations win most frequently
- Considers player chemistry (players who've played together before)
- Optimizes for formation (4-3-3, 4-2-3-1, 3-5-2, etc.)
- Respects player availability constraints (injuries, suspensions)
- Generates confidence scores for predicted lineups

**Inputs:**
- Available players
- Match opponent (if known)
- Formation preference
- Historical match data
- Player constraint flags (injured, suspended, etc.)

**Outputs:**
- Predicted optimal starting XI
- Bench recommendations
- Formation suggestion
- Confidence score
- Key tactical insights

**Use case:** Tactical planning, squad rotation, injury management, youth integration

---

## Data Requirements

All three algorithms rely on:
- **Player Dataset:** 102 Nepali players with detailed stats
- **Match History:** Past game results, lineups, scores, performances
- **User Reputation System:** Tracks voting accuracy for Crowd Consensus
- **Team Context:** Team colors, formations, competition level

---

## API Integration

Algorithms are exposed via `/api/v1/` endpoints:
- `POST /api/v1/predict-match` — Crowd Consensus Prediction
- `POST /api/v1/compare-players` — Player Performance Estimator
- `POST /api/v1/optimize-squad` — Optimal Squad Generator

All endpoints require JWT authentication.

---

## Current Status

🚧 **In Development**
- Algorithm 1: Basic voting system implemented
- Algorithm 2: Prototype comparison engine ready
- Algorithm 3: Formation optimizer being refined
