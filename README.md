# FotStats

A full-stack analytics platform for Nepali football. It combines community-driven match prediction, player performance comparison, and machine-learning-based lineup generation — all connected through a single MongoDB database shared across three services.

**Note:** This project is built as a college-level prototype. MongoDB is used as a convenience store for static player and match data. It is not yet wired for real-time data ingestion or live match feeds. See the Planned Improvements section for the roadmap.

---

## Architecture

```text
MongoDB (single source of truth)
    |
    +-- Express.js backend (:3001)   REST API, JWT auth, business logic
    |       |
    |       +-- FastAPI ML service (:8000)   Algorithm execution, model inference
    |
    +-- React frontend (:3000)   SPA, dark theme, tab-based navigation
```

All GET endpoints query MongoDB directly. The backend proxies algorithm requests to the ML service and stores results back to the database.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Express.js, TypeScript, Mongoose, express-rate-limit |
| ML Service | FastAPI, Python 3.12, scikit-learn, CatBoost |
| Database | MongoDB |

---

## Algorithms

Algorithms 1–3 run at request time. Algorithm 4 runs exclusively during database seeding.

### Algorithm 1 — Crowd Consensus Prediction

Aggregates user votes using reputation-weighted probability. Each voter's contribution is scaled by their reputation score (0–100). Confidence is derived from the inverse variance of the outcome probability distribution.

```
total_rep     = sum(reputation for all votes)
prob(outcome) = sum(reputation of votes for that outcome) / total_rep
variance      = np.var([prob(home_win), prob(draw), prob(away_win)])
confidence    = clamp(0, 100, round((1 - variance) * 100, 1))
```

Confidence approaches 100 when all votes agree (variance near 0) and approaches 0 when votes are perfectly split across three outcomes (variance = 2/9 ≈ 0.222).

- Endpoint: `POST /api/v1/predictions/:matchId/trigger`
- Implementation: `services/ml-service/models/consensus.py`

### Algorithm 2 — Player Performance Estimator

Fetches both players' six attributes from MongoDB and computes cosine similarity. A score of 100 means identical attribute ratios; lower scores indicate different playing profiles. The top two attributes per player are returned as their strengths.

```
stats_vector     = [pace, shooting, passing, dribbling, defending, physical]
cosine_sim(a, b) = dot(a, b) / (norm(a) * norm(b))
similarity       = round(cosine_sim * 100, 1)
strengths        = top 2 attributes by raw value
```

- Endpoint: `POST /api/v1/predictions/compare-players`
- Implementation: `services/ml-service/models/player_estimator.py`

### Algorithm 3 — Optimal Squad Generator

Selects the best available players per formation slot using greedy ELO ranking. Unavailable players are excluded before selection. The fitness score is the mean ELO of the selected XI normalized against a 2400-rating ceiling.

```
fitness    = sum(eloRating for player in starting_xi) / (11 * 2400)
confidence = clamp(0, 100, fitness * 100)
```

| Formation | GK | DF | MF | FW |
| --- | --- | --- | --- | --- |
| 4-3-3 | 1 | 4 | 3 | 3 |
| 4-4-2 | 1 | 4 | 4 | 2 |
| 4-2-3-1 | 1 | 4 | 5 | 1 |
| 3-5-2 | 1 | 3 | 5 | 2 |

Full genetic algorithm optimization is scaffolded but not yet trained. It is planned as a post-training enhancement once sufficient match history is available.

- Endpoint: `POST /api/v1/predictions/optimize-squad`
- Implementation: `services/ml-service/models/squad_optimizer.py`

### Algorithm 4 — Player Attribute Imputer (seed time only)

Runs inside `scripts/seed_db.py` before each player document is inserted. All four sub-algorithms execute in sequence per player.

**Implementation:** `services/ml-service/models/attribute_imputer.py`

#### 4a — Height: Nationality and Position Lookup Table

Maps the player's nationality string to one of six groups, then looks up the group-position average height. Detection checks `.lower().split()` tokens against keyword sets for each region. Falls back to the default group when no keyword matches.

| Group | GK | DF | MF | FW |
| --- | --- | --- | --- | --- |
| Nepali | 178 cm | 174 cm | 171 cm | 169 cm |
| South Asian | 179 cm | 175 cm | 172 cm | 170 cm |
| European | 188 cm | 183 cm | 179 cm | 177 cm |
| African | 187 cm | 182 cm | 178 cm | 175 cm |
| South American | 185 cm | 180 cm | 176 cm | 174 cm |
| Default | 185 cm | 180 cm | 176 cm | 174 cm |

#### 4b — Weight: BMI Formula from Imputed Height

Derives weight from the height assigned in 4a using a sport-appropriate BMI target per position.

```
weight_kg = round(bmi_target * (height_cm / 100) ** 2)
```

BMI targets: GK = 24.0, DF = 23.5, MF = 22.5, FW = 22.0

Example: 171 cm MF → `round(22.5 × 1.71²)` = **66 kg**

#### 4c — Preferred Foot: Position-Weighted Deterministic Assignment

Assigns preferred foot deterministically per player using the first 8 hex characters of `MD5(player_name)` as an integer seed for a local `random.Random` instance. This does not affect the global RNG and produces the same result on every run for the same player name.

Right-foot probability by position: GK = 88%, DF = 80%, MF = 77%, FW = 76%.

#### 4d — Market Value: CatBoost Regressor

Trains a `CatBoostRegressor` on European player data with synthetic labels, then predicts market value for every player at seed time. Nepali and South Asian players averaged approximately €190,000–200,000 after the model was applied.

**Model config:** `iterations=500, learning_rate=0.05, depth=6, loss_function=RMSE, random_seed=42`

**Feature vector (12 inputs):** age, position (encoded GK=0/DF=1/MF=2/FW=3), ELO rating, appearances, goals, assists, and the six attribute scores (pace through physical).

**Synthetic label formula:**

```
base         = max(0, eloRating - 1400) * 800
age_factor   = 1.0                                   if age <= 24
             = clamp(0.20, 1.0 - (age-24) * 0.04)   if 24 < age <= 32
             = clamp(0.20, 0.68 - (age-32) * 0.06)  if age > 32
perf_factor  = clamp(1.0, 2.5, 1.0 + goals/apps * 0.30 + assists/apps * 0.20)
market_value = clamp(0, 15_000_000, base * age_factor * perf_factor)
```

Calibration: ELO 1600, age 24, no performance data → €160,000. ELO 1720, age 22, 0.4 goals/game → ~€287,000.

Returns 0 when the pkl file is not yet trained. The backfill script `scripts/backfill_market_values.py` corrects any zero-valued records without requiring a full re-seed.

---

## Project Structure

```text
fotnep/
├── frontend/               React + Vite SPA
├── backend/                Express.js REST API
├── services/
│   └── ml-service/         FastAPI ML algorithms + seeding scripts
├── data/
│   └── raw/                Source CSV files (Nepali and European player stats)
├── package.json            Root — runs all three services via concurrently
└── PLAN.md                 Implementation task tracking (single source of truth)
```

---

## Setup

### Prerequisites

- Node.js 20+
- Python 3.12+
- MongoDB (local or Atlas)

### 1. Environment files

```bash
cp backend/.env.example backend/.env
cp services/ml-service/.env.example services/ml-service/.env
```

Edit both files and set `MONGO_URI` and `JWT_SECRET`.

### 2. Python environment

```bash
cd services/ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Train the market value model

Required before seeding. Trains the CatBoost regressor on the European player dataset and writes `trained_models/market_value_catboost.pkl`.

```bash
cd services/ml-service
source venv/bin/activate
python scripts/train_imputer.py
```

### 4. Seed the database

Loads Nepali and European player data, generates teams, matches, and demo users. All four Algorithm 4 sub-algorithms run per player during this step.

```bash
cd services/ml-service
source venv/bin/activate
python scripts/seed_db.py
```

Seeded state: 3086 players (Nepali, South Asian, European), 19 teams, 24 matches.

### 5. Install Node dependencies

```bash
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

---

## Running

### All services (recommended)

From the repo root:

```bash
npm run dev
```

Starts all three services in parallel. Terminal output is color-coded: cyan = backend (:3001), magenta = ML service (:8000), green = frontend (:3000).

### Individual services

```bash
# Backend
cd backend && PORT=3001 npm run dev

# ML service
cd services/ml-service && source venv/bin/activate
python -m uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

---

## API Reference

The full REST API is documented in [`backend/openapi.yaml`](./backend/openapi.yaml).

Interactive ML service docs are available at `http://localhost:8000/docs` when the ML service is running.

Base URL: `http://localhost:3001/api/v1`

| Method | Path | Description |
| --- | --- | --- |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate and receive a JWT |
| GET | `/auth/me` | Get the current authenticated user |
| GET | `/matches` | List all matches |
| GET | `/players` | List players — supports `?source=nepali&position=ST&search=` |
| POST | `/votes` | Cast a vote on a match outcome |
| POST | `/predictions/:id/trigger` | Run Algorithm 1 on a match |
| POST | `/predictions/compare-players` | Run Algorithm 2 on two players |
| POST | `/predictions/optimize-squad` | Run Algorithm 3 for a team and formation |

Authentication uses `Authorization: Bearer <token>` on protected routes.

---

## Development

### Type checking and lint

```bash
# Backend
cd backend && npm run type-check
cd backend && npm run lint

# Frontend
cd frontend && npm run lint

# ML service
cd services/ml-service && source venv/bin/activate
python -m flake8 .
python -m pytest -v
```

### Production builds

```bash
cd frontend && npm run build
cd backend && npm run build
```

---

## Planned Improvements

The following features are not yet implemented and represent the next development phase after the college submission.

### Real-time match data sync

The current database is seeded from static CSV files. A planned ingestion layer would connect to a live football data provider, automatically update match scores as games progress, and trigger Algorithm 1 re-evaluation when a match status changes from upcoming to live or completed.

### Tournament and competition coverage

Currently the platform covers a fixed set of demo matches. Future versions would support full tournament structures — group stages, knockout brackets, standings tables — for competitions such as the A-Division League, Martyr's Memorial A Division, and SAFF Championship.

### Expanded player pool and transfer tracking

Player market values and ELO ratings are computed once at seed time. A scheduled sync job would re-run the CatBoost imputer as transfer windows close, keeping ratings current and reflecting players who move between clubs or change form across a season.

### Genetic algorithm squad optimization

Algorithm 3 currently uses a greedy ELO selection. The full genetic algorithm implementation — population initialization, crossover, mutation, fitness function based on positional balance and chemistry score — is scaffolded but not yet trained or deployed.

### Social and community features

- Match comment threads linked to vote outcomes
- Head-to-head voting history between two users
- Public leaderboard with weekly and seasonal reputation resets

---

## Documentation

| File | Contents |
| --- | --- |
| [PLAN.md](./PLAN.md) | Task tracking, phase status, current blockers |
| [ALGORITHMS.md](./ALGORITHMS.md) | Algorithm math and implementation detail |
| [SEEDING_BENCHMARK.md](./SEEDING_BENCHMARK.md) | Field-by-field seeding reference |
| [backend/BACKEND.md](./backend/BACKEND.md) | Controller, route, and model reference |
| [frontend/FRONTEND.md](./frontend/FRONTEND.md) | Component and data flow reference |
| [services/ml-service/ML_SERVICE.md](./services/ml-service/ML_SERVICE.md) | ML service API and seeding reference |
| [backend/openapi.yaml](./backend/openapi.yaml) | Full OpenAPI specification |

---

