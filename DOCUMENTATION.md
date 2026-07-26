# FotNep — Nepali Football Analytics Platform
### Project Documentation

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Objectives](#2-objectives)
3. [Problem Statement](#3-problem-statement)
4. [Use Case Diagram](#4-use-case-diagram)
5. [System Architecture](#5-system-architecture)
6. [Core Algorithms](#6-core-algorithms)
7. [Supporting Algorithms](#7-supporting-algorithms)

---

## 1. Introduction

**FotNep** (Football + Nepal) is a full-stack sports analytics platform dedicated to Nepali football. It combines crowd intelligence, machine learning, and player statistics to deliver three key capabilities: match outcome prediction, player performance comparison, and automated squad optimization.

The platform ingests data from two sources — 102 Nepali players (domestic league) and 2,780 European players (FIFA 2025–26 dataset) — storing everything in a single MongoDB database that acts as the ground truth for all three services. A React-based dark-themed SPA sits in front; an Express.js REST API sits in the middle; and a FastAPI Python service handles all algorithm execution on the back.

FotNep is purpose-built for the Nepali football context: player market values are calibrated to regional league standards, lineup prediction accounts for the actual squad compositions of South Asian international teams (India, Bhutan, Bangladesh, Pakistan), and the reputation-weighted voting system is designed for the small, knowledgeable communities that follow club football in Nepal.

**Current scale:** 3,086 players · 19 teams · 24 matches · 3 live ML algorithms

---

## 2. Objectives

### Primary Objectives

1. **Democratize match prediction** — Let fans contribute knowledge via outcome voting and aggregate those votes into statistically meaningful probability estimates using a reputation-weighted consensus model.

2. **Quantify player similarity** — Provide a data-driven comparison tool that surfaces how similar two players are in playing style and capability using normalized attribute vectors and cosine similarity, giving coaches and analysts an objective baseline.

### Secondary Objectives

3. **Automate squad selection** — Generate optimal starting XIs for any formation using ELO-based greedy selection, filtering out injured or suspended players and respecting position constraints.

4. **Impute missing player data** — Automatically compute height, weight, preferred foot, and market value for players where raw data is unavailable, keeping the player database analytics-ready at all times.

5. **Establish a regional market value benchmark** — Apply a calibrated valuation ratio (1/3 of European equivalent) so Nepali and South Asian player market values reflect realistic transfer economics, not inflated European league equivalents.

---

## 3. Problem Statement

Nepali football suffers from a significant data infrastructure gap. Unlike European leagues — where decades of tracked statistics, scouting databases, and publicly funded analytics underpin every coaching decision — clubs and fans in Nepal operate almost entirely on intuition and informal knowledge.

**Three specific problems this platform addresses:**

**3.1 No structured match prediction tool for Nepali football**
Existing platforms (Sofascore, FotMob) do not cover domestic Nepali matches or South Asian international fixtures. Fans who follow these matches have no platform to register and aggregate their predictions, and coaches have no crowd-intelligence signal to compare against their own assessments.

**3.2 No objective player comparison baseline**
Nepali coaching and scouting decisions rely on informal reputation. There is no publicly accessible tool that computes a numeric similarity score between two players based on their actual performance attributes, making it impossible to identify like-for-like replacements or benchmark Nepali players against international counterparts.

**3.3 Missing player data blocks analytics**
The public datasets available for Nepali players (and the generated data for South Asian international opponents) are frequently incomplete — missing height, weight, preferred foot, and market value. Without imputation, even simple analytics queries break. Furthermore, naïve imputation that applies European market value models to South Asian players produces economically unrealistic numbers that corrupt any transfer-value analysis.

---

## 4. Use Case Diagram

```
                        ┌─────────────────────────────────────────────┐
                        │              FotNep Platform                │
                        │                                             │
  ┌──────────┐          │  ┌─────────────────────────────────────┐   │
  │          │──────────┼─▶│  Register / Login                   │   │
  │  Guest   │          │  └─────────────────────────────────────┘   │
  │  User    │──────────┼─▶│  Browse Matches (read-only)             │   │
  └──────────┘          │  └─────────────────────────────────────┘   │
                        │  ┌─────────────────────────────────────┐   │
  ┌──────────┐          │  │  Cast Match Vote (home/draw/away)   │   │
  │          │──────────┼─▶│  ──requires login──                 │   │
  │Registered│          │  └─────────────────────────────────────┘   │
  │  User    │──────────┼─▶│  View Algorithm 1: Consensus            │   │
  │          │          │  │  Prediction (triggered post-vote)   │   │
  │          │──────────┼─▶│  Compare Two Players (Algorithm 2)  │   │
  │          │          │  └─────────────────────────────────────┘   │
  │          │──────────┼─▶│  Browse Player Stats + Search       │   │
  │          │          │  └─────────────────────────────────────┘   │
  │          │──────────┼─▶│  Generate Optimal Squad (Algorithm 3)│  │
  │          │          │  │  · Select formation                  │   │
  │          │          │  │  · Auto-fill or manually draft       │   │
  └──────────┘          │  └─────────────────────────────────────┘   │
                        │                                             │
  ┌──────────┐          │  ┌─────────────────────────────────────┐   │
  │   ML     │──────────┼─▶│  Algorithm 1: Consensus Prediction  │   │
  │ Service  │          │  │  Algorithm 2: Cosine Similarity      │   │
  │ (system) │──────────┼─▶│  Algorithm 3: ELO Squad Optimizer   │   │
  └──────────┘          │  │  Algorithm 4: Attribute Imputer     │   │
                        │  └─────────────────────────────────────┘   │
                        └─────────────────────────────────────────────┘
```

**Key relationships:**

| Actor | Interaction | Condition |
|---|---|---|
| Guest | Browse matches, view leaderboard | No auth required |
| Registered User | Cast votes, compare players, build lineups | JWT required |
| ML Service | All algorithm execution | Internal — called by backend only |

---

## 5. System Architecture

### 5.1 High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│   React 19 + TypeScript + Vite + Tailwind v4  (port :3000)     │
│                                                                 │
│   MatchFeed  │  MatchDetails  │  PlayerComparison  │ LineupBuilder│
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS REST (JWT bearer)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                │
│   Express.js + TypeScript + Mongoose  (port :3001)             │
│                                                                 │
│  /auth  /players  /teams  /matches  /votes                      │
│  /predict-match  /compare-players  /optimize-squad             │
└───────────────┬──────────────────────────┬──────────────────────┘
                │ Mongoose                 │ HTTP (internal)
                ▼                          ▼
┌─────────────────────┐    ┌──────────────────────────────────────┐
│   MongoDB           │    │      ML Service Layer                │
│   (port :27017)     │    │   FastAPI + Python  (port :8000)    │
│                     │    │                                      │
│  users              │◀───│  POST /predict-match  (Alg 1)       │
│  players            │    │  POST /compare-players (Alg 2)      │
│  teams              │◀───│  POST /optimize-squad  (Alg 3)      │
│  matches            │    │  POST /impute-attributes (Alg 4)    │
│  votes              │    │                                      │
│  predictions        │    └──────────────────────────────────────┘
└─────────────────────┘
```

### 5.2 Data Flow

1. **Match Prediction:** Browser → `POST /api/v1/predict-match` → Express fetches votes + reputations from MongoDB → Express calls ML Service → ML computes probability → Express persists result in `predictions` collection → response to browser.

2. **Player Comparison:** Browser → `POST /api/v1/compare-players` → Express → ML Service reads player docs from MongoDB via pymongo → returns similarity score → Express proxies result to browser (not persisted).

3. **Squad Optimization:** Browser → `POST /api/v1/optimize-squad` → Express → ML Service queries MongoDB for available players → ELO-sorted selection → Express proxies result (not persisted).

4. **Seed-time Imputation:** `seed_db.py` → calls `POST /impute-attributes` locally → ML Service computes height/weight/foot/market-value → values written back into the player document before MongoDB insert.

### 5.3 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Express.js, TypeScript, Mongoose, bcrypt, express-rate-limit |
| ML Service | FastAPI, Python, scikit-learn, CatBoost, pymongo |
| Database | MongoDB |
| Auth | JWT (7-day expiry, bcrypt-12 password hashing) |
| Dev tooling | tsx watch, Vite HMR, uvicorn --reload, concurrently |

### 5.4 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT signed with `JWT_SECRET`, verified on all protected routes
- `requireAuth` middleware: hard 401 if token absent or expired
- `softAuth` middleware: populates `req.userId` when token is valid, always calls `next()` (used for routes that return extra data for logged-in users)
- Rate limiting on `/auth` routes: 20 requests per 15 minutes

---

## 6. Core Algorithms

### Algorithm 1: Crowd Consensus Prediction

**File:** `services/ml-service/models/consensus.py`
**Trigger:** `POST /api/v1/predict-match` — auto-triggered after every vote

#### Working Mechanism

Each user who votes on a match carries a reputation score (0–100) earned through historical prediction accuracy. Rather than treating all votes equally (simple majority), each vote is weighted by the voter's reputation. This means a user with reputation 80 contributes four times more signal than a user with reputation 20.

The algorithm computes three outcome probabilities, then derives a confidence score from the variance of that distribution. When all high-reputation voters agree, variance is low and confidence is high. When votes are evenly split, variance is high and confidence drops.

#### Formulas

```
total_rep        = Σ reputation_i   (for all votes on the match)

prob(outcome)    = Σ reputation_i   (for votes where outcome_i == outcome)
                   ──────────────────────────────────────────────────────
                              total_rep

variance         = Var([prob(home_win), prob(draw), prob(away_win)])

confidence       = clamp(0, 100,  (1 − variance) × 100)
```

**Range note:** variance is maximally 2/9 ≈ 0.222 when the three probabilities are equal (1/3 each). Confidence then equals `(1 − 0.222) × 100 ≈ 77.8`. Confidence reaches 100 only when 100% of reputation voted for a single outcome.

#### Example

| Voter | Reputation | Vote |
|---|---|---|
| User A | 80 | home_win |
| User B | 60 | home_win |
| User C | 50 | draw |

```
total_rep        = 80 + 60 + 50 = 190
prob(home_win)   = (80 + 60) / 190 = 0.737
prob(draw)       = 50 / 190 = 0.263
prob(away_win)   = 0 / 190 = 0.000
variance         = Var([0.737, 0.263, 0.000]) ≈ 0.093
confidence       = (1 − 0.093) × 100 ≈ 90.7
```

#### Backend Integration

`predictionController.triggerPrediction()` fetches all votes for a match from the `votes` collection, joins each vote's user to get their current `reputation` from the `users` collection, formats the payload, calls the ML service, and upserts the result into the `predictions` collection. Returns 400 if no votes exist, 503 if the ML service is unreachable.

---

### Algorithm 2: Player Performance Estimator

**File:** `services/ml-service/models/player_estimator.py`
**Trigger:** `POST /api/v1/compare-players` — fires when both player slots are filled

#### Working Mechanism

Each player's six core attributes (pace, shooting, passing, dribbling, defending, physical) form a six-dimensional vector. Cosine similarity measures the angle between these two vectors in that space. Unlike Euclidean distance, cosine similarity is scale-independent: two players where one has exactly double the stats of the other would score 100%, because their attribute *ratios* are identical. This makes it a good fit for playing style comparison — a high score means "similar player profile", not necessarily "equally good".

#### Formulas

```
v_A = [pace_A, shooting_A, passing_A, dribbling_A, defending_A, physical_A]
v_B = [pace_B, shooting_B, passing_B, dribbling_B, defending_B, physical_B]

cosine_similarity(A, B) = (v_A · v_B) / (‖v_A‖ × ‖v_B‖)

                        = Σ (v_A_i × v_B_i)
                          ──────────────────────────────
                          √(Σ v_A_i²) × √(Σ v_B_i²)

similarity_score        = round(cosine_similarity × 100, 1)

strengths_A             = top 2 attributes by raw value in v_A
strengths_B             = top 2 attributes by raw value in v_B
```

**Score interpretation:** 100 = identical attribute ratios (same playing profile); 0 = orthogonal profiles (completely different strengths). In practice, scores above 90 indicate a like-for-like replacement; scores below 70 indicate a stylistically different player.

#### Example

```
Player A (Bimal Gharti Magar): pace=72, shooting=61, passing=68, dribbling=74, defending=45, physical=62
Player B (Anjan Bista):         pace=65, shooting=58, passing=71, dribbling=69, defending=48, physical=59

v_A · v_B = (72×65) + (61×58) + (68×71) + (74×69) + (45×48) + (62×59)
          = 4680 + 3538 + 4828 + 5106 + 2160 + 3658 = 23970

‖v_A‖ = √(72²+61²+68²+74²+45²+62²) = √(5184+3721+4624+5476+2025+3844) = √24874 ≈ 157.7
‖v_B‖ = √(65²+58²+71²+69²+48²+59²) = √(4225+3364+5041+4761+2304+3481) = √23176 ≈ 152.2

similarity = 23970 / (157.7 × 152.2) ≈ 23970 / 24012 ≈ 0.998 → 99.8%
```

#### Backend Integration

`predictionController.comparePlayersProxy()` passes `playerAId` and `playerBId` directly to the ML service. The ML service fetches both player documents from MongoDB (via pymongo), extracts their `stats` subdocuments, and runs the cosine calculation. The result is returned directly to the frontend — not persisted.

---

### Algorithm 3: Optimal Squad Generator

**File:** `services/ml-service/models/squad_optimizer.py`
**Trigger:** `POST /api/v1/optimize-squad`

#### Working Mechanism

Given a pool of available players, a target formation, and a list of injured/suspended player IDs to exclude, the algorithm fills each formation slot greedily by selecting the highest-ELO eligible player for that position. The result is 11 starters + a bench of remaining candidates.

ELO rating is the primary ranking signal. Each player's ELO is computed at seed time as:

```
eloRating = 1600 + (average_of_6_attributes − 50) × 4
```

This maps an average-stat player (50/100) to ELO 1600 (historical chess baseline), a top-tier player (90/100 average) to ELO 1760, and a weak player (30/100 average) to ELO 1520.

#### Formation Slot Counts

| Formation | GK | DF | MF | FW |
|---|---|---|---|---|
| 4-3-3 | 1 | 4 | 3 | 3 |
| 4-4-2 | 1 | 4 | 4 | 2 |
| 4-2-3-1 | 1 | 4 | 5 | 1 |
| 3-5-2 | 1 | 3 | 5 | 2 |

#### Fitness Function

```
fitness    = Σ eloRating_i  / (11 × 2400)    (for all 11 starters)

confidence = clamp(0, 100, fitness × 100)
```

A team where every starter has ELO 2400 (theoretical maximum) would score confidence = 100%. The average Nepali squad (ELO ~1640 per player) scores approximately 62%.

#### Selection Logic

```
for each position_group in [GK, DF, MF, FW]:
    eligible = [p for p in pool
                if p.position == position_group
                and p.id not in excluded]
    eligible.sort(by=eloRating, descending=True)
    starters += eligible[:slots_needed[position_group]]
    bench    += eligible[slots_needed:]
```

`excluded` is built from `constraints.injured + constraints.suspended`. Output order is deterministic: `sorted(excluded)` is used when iterating the set.

#### Backend Integration

`predictionController.optimizeSquadProxy()` receives `teamId`, `availablePlayerIds`, `formationPreference`, and `constraints` from the frontend. It calls the ML service, which queries MongoDB directly by ID list, runs the greedy selection, and returns the `startingXI`, `bench`, `formation`, `confidence`, `tacticalInsights`, and `keyMissingPlayers`. Result is proxied to the frontend without DB persistence.

---

## 7. Supporting Algorithms

All four sub-algorithms below run at **seed time** inside `scripts/seed_db.py` via the `/impute-attributes` endpoint. They populate missing fields for all 3,086 players before insertion into MongoDB.

**File:** `services/ml-service/models/attribute_imputer.py`

---

### 7a. Height Imputer — Census + Positional Average Lookup

**Function:** `impute_height(nationality: str, position: str) -> int`

For each player with a missing height, the algorithm predicts height from two data sources combined: national/regional census average heights and average recorded heights of professional football players at that position. The nationality string is tokenized to classify the player into one of five demographic groups; the group is then crossed with the player's position to produce a predicted height.

**Group detection** (checks `.lower().split()` tokens against keyword sets):

- `"nepali"` / `"nepal"` → `nepali`
- `{"indian", "bangladeshi", "pakistani", "bhutanese", ...}` → `south_asian`
- `{"eng", "fra", "ger", "esp", "english", "french", ...}` → `european`
- `{"ngr", "gha", "sen", "nigerian", "ghanaian", ...}` → `african`
- `{"bra", "arg", "col", "brazilian", "argentinian", ...}` → `south_american`
- (unrecognised) → `default`

**Predicted heights (cm) — derived from census averages × positional player averages:**

| Group | GK | DF | MF | FW |
|---|---|---|---|---|
| Nepali | 178 | 174 | 171 | 169 |
| South Asian | 179 | 175 | 172 | 170 |
| European | 188 | 183 | 179 | 177 |
| African | 187 | 182 | 178 | 175 |
| South American | 185 | 180 | 176 | 174 |
| Default | 185 | 180 | 176 | 174 |

The values reflect that GKs are consistently the tallest players in their nationality group (dominant aerial role), DFs second, MFs third, and FWs shortest (speed premium). The same nationality + position pair always produces the same predicted height — the lookup is deterministic once the table values are fixed.

---

### 7b. Weight Imputer — BMI Formula from Height

**Function:** `impute_weight(height_cm: int, position: str) -> int`

Uses a sports-science BMI target per position to back-calculate weight from imputed height.

```
weight_kg = round(bmi_target × (height_cm / 100)²)
```

**BMI targets by position:**

| Position | BMI Target | Rationale |
|---|---|---|
| GK | 24.0 | Larger frame, stronger physique |
| DF | 23.5 | Balance of size and mobility |
| MF | 22.5 | Lean for stamina and range |
| FW | 22.0 | Lightest for speed and agility |

**Example:** A Nepali MF imputed at 171 cm:
```
weight = round(22.5 × (171/100)²) = round(22.5 × 2.9241) = round(65.79) = 66 kg
```

---

### 7c. Preferred Foot — Position-Weighted Probabilistic Assignment

**Function:** `impute_preferred_foot(player_name: str, position: str) -> str`

Assigns preferred foot probabilistically, with the probability seeded deterministically from the player's name so the same player always gets the same foot.

```
seed   = int(MD5(player_name)[:8], 16)
rng    = random.Random(seed)           # isolated — does not affect global RNG
p_right = { GK: 0.88, DF: 0.80, MF: 0.77, FW: 0.76 }[position]
foot   = "Right" if rng.random() < p_right else "Left"
```

The probabilities reflect real-world football statistics: goalkeepers skew heavily right-footed due to distribution habits; forwards have the lowest right-foot dominance due to the premium on two-footed attackers.

---

### 7d. Market Value Imputer — CatBoost Regressor with Regional Ratio

**Function:** `impute_market_value(features: dict, model, source: str | None) -> int`

A CatBoost gradient-boosted regression model trained on synthetic labels derived from ELO rating, age, and career performance. After the model prediction, a regional ratio correction is applied for South Asian players.

#### Feature Vector (12 inputs)

| Index | Feature | Description |
|---|---|---|
| 0 | age | Player age |
| 1 | position_enc | GK=0, DF=1, MF=2, FW=3 |
| 2 | eloRating | Computed ELO score |
| 3 | appearances | Career appearances |
| 4 | goals | Career goals |
| 5 | assists | Career assists |
| 6–11 | pace … physical | Six attribute scores (0–100) |

#### Synthetic Label Formula (used during training)

```
base         = max(0, eloRating − 1400) × 800

age_factor   = 1.0                                      if age ≤ 24
             = clamp(0.20,  1.0 − (age − 24) × 0.04)   if 24 < age ≤ 32
             = clamp(0.20,  0.68 − (age − 32) × 0.06)  if age > 32

perf_factor  = clamp(1.0, 2.5,  1.0 + (goals/apps)×0.30 + (assists/apps)×0.20)

market_value = clamp(0, 15_000_000, base × age_factor × perf_factor)
```

**Calibration examples:**

| ELO | Age | g/game | Calculation | Value |
|---|---|---|---|---|
| 1600 | 24 | 0.0 | 160,000 × 1.0 × 1.0 | €160,000 |
| 1720 | 22 | 0.4 | 256,000 × 1.0 × 1.12 | ~€287,000 |
| 1800 | 29 | 0.3 | 320,000 × 0.80 × 1.09 | ~€279,000 |

#### Regional Value Ratio

South Asian leagues are substantially weaker than Europe's top-5. An equivalent stat line in the Nepali or Bangladeshi league should not command an equivalent transfer fee. After the CatBoost prediction:

```
SOUTH_ASIAN_SOURCES = {"nepali", "india", "bhutan", "bangladesh", "pakistan"}
SOUTH_ASIAN_VALUE_RATIO = 1/3

if source in SOUTH_ASIAN_SOURCES:
    market_value = round(catboost_prediction × SOUTH_ASIAN_VALUE_RATIO)
else:
    market_value = round(catboost_prediction)    # European — unchanged
```

**Post-ratio averages (after applying to seeded DB):**

| Source | Raw CatBoost Avg | After Ratio |
|---|---|---|
| European | €199,927 | €199,927 |
| Nepali | ~€193,831 | €64,610 |
| India | ~€202,093 | €67,364 |
| Bhutan | ~€181,014 | €60,338 |
| Bangladesh | ~€187,240 | €62,414 |
| Pakistan | ~€191,572 | €63,857 |

#### Model Config

```
CatBoostRegressor(
    iterations    = 500,
    learning_rate = 0.05,
    depth         = 6,
    loss_function = "RMSE",
    random_seed   = 42
)
```

**Fallback:** Returns `0` when the `.pkl` model file has not been trained yet. The `scripts/backfill_market_values.py` script can fix zero-valued records without requiring a full re-seed.

#### Required Run Order

```bash
# 1. Train model (only when training data changes)
python scripts/train_imputer.py
# → writes: trained_models/market_value_catboost.pkl

# 2. Seed database (imputes all 4 fields per player)
python scripts/seed_db.py

# 3. Fix any remaining marketValue=0 records
python scripts/backfill_market_values.py

# 4. Apply ratio correction to already-seeded South Asian players (one-time)
python scripts/rescale_south_asian_market_values.py
```

---

*Last Updated: 2026-06-26*
*Platform Version: Phase 13 complete — all 3 algorithms live, builds passing, market value calibration applied.*
