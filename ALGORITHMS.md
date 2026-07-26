# FotNep Algorithms

Four algorithms power the platform. Algorithms 1–3 are request-time; Algorithm 4 runs at seed time only.

---

## Algorithm 1: Crowd Consensus Prediction

**File:** `services/ml-service/models/consensus.py`
**Endpoint:** `POST /predict-match` (ML service, proxied through backend `POST /api/v1/predict-match`)

### How it works

Users vote on a match outcome (home win, draw, away win). Each vote carries the voter's reputation score (0–100). The probability for each outcome equals the fraction of total reputation that voted for it. Confidence is derived from how uniform or concentrated the probability distribution is.

### Math

```
total_rep        = sum(reputation for all votes)
prob(outcome)    = sum(reputation of votes for that outcome) / total_rep
variance         = np.var([prob(home_win), prob(draw), prob(away_win)])
confidence       = clamp(0, 100, round((1 - variance) * 100, 1))
```

Confidence approaches 100 when all votes agree (variance near 0) and approaches 0 when votes are perfectly split across three outcomes (variance = 2/9 ≈ 0.222).

### Input

```json
{
  "matchId": "string",
  "votes": [
    { "userId": "string", "outcome": "home_win|draw|away_win", "reputation": 85 }
  ]
}
```

### Output

```json
{
  "matchId": "string",
  "prediction": {
    "homeWinProb": 0.5833,
    "drawProb": 0.2222,
    "awayWinProb": 0.1944
  },
  "confidence": 77.8,
  "voteBreakdown": { "homeWin": 3, "draw": 1, "awayWin": 1 }
}
```

### Backend flow

`predictionController.triggerPrediction(matchId)` fetches all votes for the match from MongoDB (including each voter's reputation from the User collection), formats the payload, calls `mlIntegration.predictMatch()`, persists the result in the Prediction collection, and returns it. Requires at least one vote (400 if no votes, 503 if ML service is down).

---

## Algorithm 2: Player Performance Estimator

**File:** `services/ml-service/models/player_estimator.py`
**Endpoint:** `POST /compare-players` (ML service, proxied through backend `POST /api/v1/compare-players`)

### How it works

Both players' six attributes are fetched from MongoDB. The six values are treated as vectors and compared with cosine similarity. A similarity score of 100 means the two players have identical attribute ratios; lower scores indicate different playing profiles. The top two attributes per player are returned as their strengths.

### Math

```
stats_vector     = [pace, shooting, passing, dribbling, defending, physical]
cosine_sim(a, b) = dot(a, b) / (norm(a) * norm(b))
similarity       = round(cosine_sim * 100, 1)
strengths        = top 2 attributes by raw value
```

### Input

```json
{ "playerAId": "mongo_object_id", "playerBId": "mongo_object_id" }
```

### Output

```json
{
  "playerA": { "id": "...", "name": "...", "stats": { "pace": 72, ... } },
  "playerB": { "id": "...", "name": "...", "stats": { "pace": 65, ... } },
  "similarityScore": 99.1,
  "attributeComparison": {
    "pace": { "playerA": 72.0, "playerB": 65.0 },
    "shooting": { "playerA": 61.0, "playerB": 58.0 }
  },
  "strengths": { "playerA": ["pace", "dribbling"], "playerB": ["defending", "physical"] }
}
```

### Backend flow

`predictionController.comparePlayersProxy(playerAId, playerBId)` calls `mlIntegration.comparePlayers()` which POSTs to the ML service. No DB persistence — result is returned directly to the frontend.

---

## Algorithm 3: Optimal Squad Generator

**File:** `services/ml-service/models/squad_optimizer.py`
**Endpoint:** `POST /optimize-squad` (ML service, proxied through backend `POST /api/v1/optimize-squad`)

### Current implementation

Greedy ELO-ranked selection. For each formation slot, eligible players (after removing injured/suspended) are fetched from MongoDB, grouped by position, and sorted descending by `eloRating`. The top N per slot fill the starting XI.

Full genetic algorithm optimization is planned as a future training-phase enhancement once sufficient match history is available.

### Formation slot counts

| Formation | GK | DF | MF | FW |
|-----------|----|----|----|----|
| 4-3-3     | 1  | 4  | 3  | 3  |
| 4-4-2     | 1  | 4  | 4  | 2  |
| 4-2-3-1   | 1  | 4  | 5  | 1  |
| 3-5-2     | 1  | 3  | 5  | 2  |

### Fitness function (ELO-based)

```
fitness = sum(eloRating for player in starting_xi) / (11 * 2400)
confidence = clamp(0, 100, fitness * 100)
```

### Input

```json
{
  "teamId": "string",
  "availablePlayerIds": ["id1", "id2", ...],
  "formationPreference": "4-3-3",
  "constraints": { "injured": [], "suspended": [] }
}
```

### Output

```json
{
  "teamId": "string",
  "startingXI": [
    { "playerId": "...", "playerName": "...", "position": "GK", "bench": false }
  ],
  "bench": [
    { "playerId": "...", "playerName": "...", "position": "MF", "bench": true }
  ],
  "formation": "4-3-3",
  "confidence": 67.4,
  "tacticalInsights": ["Lineup selected by ELO rating strength."],
  "keyMissingPlayers": []
}
```

### Backend flow

`predictionController.optimizeSquadProxy()` receives the team ID, player ID list, formation, and constraints from the frontend. It calls `mlIntegration.optimizeSquad()` which POSTs directly to the ML service. Result is returned to the frontend without DB persistence.

---

## Algorithm 4: Player Attribute Imputer

**File:** `services/ml-service/models/attribute_imputer.py`
**Endpoint:** `POST /impute-attributes` (on-demand, primarily used at seed time)

Called inside `scripts/seed_db.py` before each player document is inserted. All four sub-algorithms run in sequence.

---

### 4a. Height — Nationality + Position Lookup Table

**Function:** `impute_height(nationality: str, position: str) -> int`

Deterministic. Maps nationality string to one of five groups, then cross-references with position.

```
groups: nepali / south_asian / european / african / south_american / default
```

Height table (cm):

| Group          | GK  | DF  | MF  | FW  |
|----------------|-----|-----|-----|-----|
| Nepali         | 178 | 174 | 171 | 169 |
| South Asian    | 179 | 175 | 172 | 170 |
| European       | 188 | 183 | 179 | 177 |
| African        | 187 | 182 | 178 | 175 |
| South American | 185 | 180 | 176 | 174 |
| Default        | 185 | 180 | 176 | 174 |

Nationality detection checks `.lower().split()` tokens against keyword sets: `_SOUTH_ASIAN`, `_EUROPEAN`, `_AFRICAN`, `_SOUTH_AMERICAN`. Falls back to `"default"` when unrecognised.

---

### 4b. Weight — BMI Formula from Height

**Function:** `impute_weight(height_cm: int, position: str) -> int`

```
weight_kg = round(bmi_target * (height_cm / 100) ** 2)
```

Position BMI targets: GK=24.0, DF=23.5, MF=22.5, FW=22.0

Example: 171 cm MF → `round(22.5 * 1.71²)` = **66 kg**

---

### 4c. Preferred Foot — Position-Weighted Probabilistic Assignment

**Function:** `impute_preferred_foot(player_name: str, position: str) -> str`

Deterministic per player name. Seed is derived from `MD5(player_name)[:8]` hex to integer, used in a local `random.Random` instance that does not affect the global RNG.

Probability of right foot by position: GK=88%, DF=80%, MF=77%, FW=76%.

---

### 4d. Market Value — CatBoost Regressor

**Function:** `impute_market_value(features: dict, model, source: str | None = None) -> int`

**Training script:** `scripts/train_imputer.py` — reads both CSV files, generates synthetic labels using the formula below, trains a `CatBoostRegressor`, saves to `trained_models/market_value_catboost.pkl`.

**Model config:** `iterations=500, learning_rate=0.05, depth=6, loss_function="RMSE", random_seed=42`

**Feature vector (12 inputs):**

| Index | Feature        | Description                  |
|-------|----------------|------------------------------|
| 0     | age            | Player age                   |
| 1     | position_enc   | GK=0, DF=1, MF=2, FW=3       |
| 2     | eloRating      | Computed ELO score           |
| 3     | appearances    | Career appearances           |
| 4     | goals          | Career goals                 |
| 5     | assists        | Career assists               |
| 6–11  | pace…physical  | Six attribute scores (0–100) |

**Synthetic label formula:**

```
base         = max(0, eloRating - 1400) * 800
age_factor   = 1.0                                    if age <= 24
             = clamp(0.20, 1.0 - (age-24)*0.04)      if 24 < age <= 32
             = clamp(0.20, 0.68 - (age-32)*0.06)     if age > 32
perf_factor  = clamp(1.0, 2.5, 1.0 + goals/apps*0.30 + assists/apps*0.20)
market_value = clamp(0, 15_000_000, base * age_factor * perf_factor)
```

Calibration examples:
- ELO 1600, age 24, no performance data: base €160,000 x 1.0 x 1.0 = **€160,000**
- ELO 1720, age 22, 0.4 g/game: base €256,000 x 1.0 x 1.12 = **~€287,000**

**Regional value ratio:** South Asian leagues are weaker than Europe's top-5, so an equivalent
stat line shouldn't command an equivalent transfer fee. After the CatBoost prediction, if
`source` is one of `SOUTH_ASIAN_SOURCES = {"nepali", "india", "bhutan", "bangladesh", "pakistan"}`,
the predicted value is multiplied by `SOUTH_ASIAN_VALUE_RATIO = 1/3` before rounding. European
(`source == "european"`) predictions are unchanged. Example: a Nepali player whose raw CatBoost
prediction is €580,000 is stored as **€193,333**.

Fallback: returns 0 when `model is None` (pkl not yet trained). The backfill script `scripts/backfill_market_values.py` can fix 0-valued records without re-seeding.

---

### Required run order

```bash
# 1. Train CatBoost (only needed when CSV data changes)
cd services/ml-service && source venv/bin/activate
python scripts/train_imputer.py
# writes: trained_models/market_value_catboost.pkl

# 2. Seed database (runs all four imputations per player)
python scripts/seed_db.py

# 3. Backfill if any marketValue=0 records remain
python scripts/backfill_market_values.py
```
