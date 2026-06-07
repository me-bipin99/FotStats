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

---

## 4. Player Attribute Imputer

**Purpose:** Fill in missing physical attributes (height, weight, preferred foot, market value) for all players at seed time. Neither the Nepali CSV nor the European CSV contains these fields — all 4 are predicted from available data before `insert_many()` in `scripts/seed_db.py`.

**Primary flow:** Called inside `scripts/seed_db.py` before each player document is inserted. A FastAPI endpoint `POST /impute-attributes` is also available for on-demand use.

**Implementation:** `services/ml-service/models/attribute_imputer.py`

---

### 4a. Height — Nationality + Position Average Lookup

**Type:** Rule-based lookup table. Deterministic, no training required.

**Logic:**

1. Map `nationality` string → one of 5 groups: `nepali` / `south_asian` / `european` / `african` / `south_american` / `default`
2. Cross-reference with position (`GK` / `DF` / `MF` / `FW`)
3. Return pre-computed average height in cm

**Height table (cm):**

| Group          | GK  | DF  | MF  | FW  |
|----------------|-----|-----|-----|-----|
| Nepali         | 178 | 174 | 171 | 169 |
| South Asian    | 179 | 175 | 172 | 170 |
| European       | 188 | 183 | 179 | 177 |
| African        | 187 | 182 | 178 | 175 |
| South American | 185 | 180 | 176 | 174 |
| Default        | 185 | 180 | 176 | 174 |

**Rationale:** Goalkeepers average 6–10 cm taller than forwards due to positional selection. Nepali/South Asian players average ~10 cm shorter than Europeans due to population and nutritional factors.

**Nationality detection:** FBref stores nationality as `"eng ENG"` — detection checks `.split()` tokens against keyword sets (e.g. `{"eng", "fra", "ger", …}` for European). Falls back to `"default"` when unrecognised.

**Function:** `impute_height(nationality: str, position: str) -> int`

---

### 4b. Weight — BMI-Based Estimation from Height

**Type:** Deterministic formula. Derived from the imputed (or known) height.

**Formula:**

```text
weight_kg = round(bmi_target × (height_cm / 100)²)
```

**Position BMI targets:**

| Position | BMI  | Rationale                           |
|----------|------|-------------------------------------|
| GK       | 24.0 | Larger frame, physical aerial duels |
| DF       | 23.5 | Strong but mobile                   |
| MF       | 22.5 | Balance of endurance and strength   |
| FW       | 22.0 | Lean for explosive pace             |

**Example:** 178 cm MF → `round(22.5 × 1.78²)` = `round(71.3)` = **71 kg**

**Function:** `impute_weight(height_cm: int, position: str) -> int`

---

### 4c. Preferred Foot — Position-Based Probability Distribution

**Type:** Probabilistic assignment, deterministic per player across runs.

**Probability table:**

| Position | Right | Left |
|----------|-------|------|
| GK       | 88%   | 12%  |
| DF       | 80%   | 20%  |
| MF       | 77%   | 23%  |
| FW       | 76%   | 24%  |

**Determinism guarantee:**

- Seed = `int(hashlib.md5(player_name.encode("utf-8")).hexdigest()[:8], 16)`
- Uses a per-player `random.Random(seed)` instance — does **not** disturb `random.seed(42)` used for European stat variance in `seed_db.py`
- `hashlib.md5` is platform-independent (unlike Python's built-in `hash()`)
- Same name + position → same foot on every re-seed

**Function:** `impute_preferred_foot(player_name: str, position: str) -> str`

---

### 4d. Market Value — CatBoost Regressor

**Type:** Trained ML model (supervised regression). Requires `scripts/train_imputer.py` to run before seeding.

**Features (12):**

| Feature        | Type  | Description             |
|----------------|-------|-------------------------|
| `age`          | int   | Player age              |
| `position_enc` | int   | GK=0, DF=1, MF=2, FW=3  |
| `eloRating`    | float | Computed ELO score      |
| `appearances`  | int   | Career appearances      |
| `goals`        | int   | Career goals            |
| `assists`      | int   | Career assists          |
| `pace`         | float | 0–100 attribute         |
| `shooting`     | float | 0–100 attribute         |
| `passing`      | float | 0–100 attribute         |
| `dribbling`    | float | 0–100 attribute         |
| `defending`    | float | 0–100 attribute         |
| `physical`     | float | 0–100 attribute         |

**Synthetic training label formula** (applied to all CSV players to generate labeled training data):

```text
base         = max(0, eloRating − 1400) × 800
age_factor   = 1.0                                      if age ≤ 24
             = clamp(0.20, 1.0 − (age − 24) × 0.04)   if 24 < age ≤ 32
             = clamp(0.20, 0.68 − (age − 32) × 0.06)  if age > 32
perf_factor  = clamp(1.0, 2.5, 1.0 + g/app×0.30 + a/app×0.20)
market_value = clamp(0, 15_000_000, base × age_factor × perf_factor)
```

**Calibration examples:**

- ELO 1600, age 24, avg performance → base 160 000 € × 1.0 × 1.0 = **€160 000**
- ELO 1700, age 22, 0.3 g/game → base 240 000 € × 1.0 × 1.09 = **≈€261 600**

**Model config:** `CatBoostRegressor(iterations=500, learning_rate=0.05, depth=6, loss_function="RMSE", random_seed=42)`

**Persistence:** Saved as `services/ml-service/trained_models/market_value_catboost.pkl`. Auto-loaded by `config.model_loader.ModelLoader` singleton which globs `trained_models/*.pkl` on first use.

**Fallback:** If pkl does not exist at seed time, `marketValue` retains the CSV value (or 0). A `WARNING` is printed to stderr.

**Function:** `impute_market_value(features: dict, model) -> int`

---

### Required Run Order

```bash
# 1. Install CatBoost (first time only)
pip install catboost==1.2.5

# 2. Train CatBoost from CSVs (no DB required — reads same CSV files as seed_db.py)
cd services/ml-service && source venv/bin/activate
python scripts/train_imputer.py
# → writes trained_models/market_value_catboost.pkl

# 3. Seed database (runs all 4 imputations, including CatBoost)
python scripts/seed_db.py
# → every player document now has height, weight, preferredFoot, marketValue
```

Re-run `train_imputer.py` only when the CSV data changes significantly.
After step 3, all ~2879 player documents have all 4 attributes populated.
