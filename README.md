# FotNep

A full-stack analytics platform for Nepali football. It combines community-driven match prediction, player performance comparison, and machine-learning-based lineup generation — all connected through a single MongoDB database shared across three services.

> **Note:** This project is built as a college-level prototype. MongoDB is used as a convenience store for static player and match data. It is not yet wired for real-time data ingestion or live match feeds. See the Planned Improvements section for the roadmap.

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

| Layer       | Technologies                                              |
| ----------- | --------------------------------------------------------- |
| Frontend    | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion |
| Backend     | Express.js, TypeScript, Mongoose, express-rate-limit       |
| ML Service  | FastAPI, Python 3.12, scikit-learn, CatBoost               |
| Database    | MongoDB                                                    |

---

## Algorithms

### Algorithm 1 — Crowd Consensus Prediction

Aggregates user votes using reputation-weighted probability. Each voter's contribution is scaled by their reputation score (0–100). Confidence is derived from the inverse variance of the outcome probability distribution.

- Endpoint: `POST /api/v1/predictions/:matchId/trigger`
- Implementation: `services/ml-service/models/consensus.py`

### Algorithm 2 — Player Performance Estimator

Computes cosine similarity between two players on six normalized attributes: pace, shooting, passing, dribbling, defending, and physical. Both players are read directly from MongoDB at request time.

- Endpoint: `POST /api/v1/predictions/compare-players`
- Implementation: `services/ml-service/models/player_estimator.py`

### Algorithm 3 — Optimal Squad Generator

Selects the best available players per formation slot using greedy ELO ranking. Unavailable players are excluded before selection. Genetic algorithm optimization is planned as a post-training enhancement.

- Endpoint: `POST /api/v1/predictions/optimize-squad`
- Implementation: `services/ml-service/models/squad_optimizer.py`

### Algorithm 4 — Player Attribute Imputer (seed time)

Four sub-algorithms run during database seeding to fill missing player attributes:

- **4a** Height lookup table by position
- **4b** Weight derived from height via BMI formula
- **4c** Preferred foot assigned via MD5-seeded deterministic RNG
- **4d** Market value predicted by a trained CatBoost regressor

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

Required before seeding. Trains the CatBoost regressor on the European player dataset.

```bash
cd services/ml-service
source venv/bin/activate
python scripts/train_imputer.py
```

### 4. Seed the database

Loads Nepali and European player data, generates teams, matches, and demo users.

```bash
cd services/ml-service
source venv/bin/activate
python scripts/seed_db.py
```

Seeded state: 3086 players (Nepali, South Asian, European), 19 teams, 24 matches.

### 5. Install Node dependencies

```bash
cd ../../
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

Key endpoints:

| Method | Path                                  | Description                                   |
| ------ | ------------------------------------- | --------------------------------------------- |
| POST   | `/auth/register`                      | Register a new user                           |
| POST   | `/auth/login`                         | Authenticate and receive a JWT                |
| GET    | `/auth/me`                            | Get the current authenticated user            |
| GET    | `/matches`                            | List all matches                              |
| GET    | `/players`                            | List players (`?source=nepali&position=ST&search=`) |
| POST   | `/votes`                              | Cast a vote on a match outcome                |
| POST   | `/predictions/:id/trigger`            | Run Algorithm 1 on a match                   |
| POST   | `/predictions/compare-players`        | Run Algorithm 2 on two players                |
| POST   | `/predictions/optimize-squad`         | Run Algorithm 3 for a team and formation      |

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

| File                                                                        | Contents                                      |
| --------------------------------------------------------------------------- | --------------------------------------------- |
| [PLAN.md](./PLAN.md)                                                        | Task tracking, phase status, current blockers |
| [ALGORITHMS.md](./ALGORITHMS.md)                                            | Algorithm math and implementation detail      |
| [SEEDING_BENCHMARK.md](./SEEDING_BENCHMARK.md)                              | Field-by-field seeding reference              |
| [backend/BACKEND.md](./backend/BACKEND.md)                                  | Controller, route, and model reference        |
| [frontend/FRONTEND.md](./frontend/FRONTEND.md)                              | Component and data flow reference             |
| [services/ml-service/ML_SERVICE.md](./services/ml-service/ML_SERVICE.md)   | ML service API and seeding reference          |
| [backend/openapi.yaml](./backend/openapi.yaml)                              | Full OpenAPI specification                    |

---

