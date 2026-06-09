# FotNep — Nepali Football Analytics Platform

A full-stack analytics platform for Nepali football with community match prediction, player comparison, and ML-driven lineup generation. All three algorithms connect end-to-end through a React frontend, Express backend, and FastAPI ML service backed by a single MongoDB database.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Express.js + TypeScript + Mongoose (MongoDB)
- **ML Service:** FastAPI + Python 3.12 + scikit-learn + CatBoost
- **Database:** MongoDB (single source of truth for all three services)

## Algorithms

1. **Crowd Consensus Prediction** — Reputation-weighted voting aggregation. Each user's vote is weighted by their reputation score; confidence is derived from the variance of the probability distribution across outcomes.
2. **Player Performance Estimator** — Direct cosine similarity on six normalized attributes (pace, shooting, passing, dribbling, defending, physical). No KNN fill-in; both players' stats are read straight from MongoDB.
3. **Optimal Squad Generator** — Greedy ELO-ranked selection per formation slot. Full genetic algorithm optimization is planned as a post-training enhancement.
4. **Player Attribute Imputer** — Four sub-algorithms run at seed time: height lookup table (Algorithm 4a), BMI-formula weight (4b), MD5-seeded foot assignment (4c), CatBoost market-value regressor (4d).

## Quick Start

```bash
# Install root dev dependency (concurrently)
npm install

# Start all three services in parallel
npm run dev
```

Color-coded output: cyan = backend (:3001), magenta = ML service (:8000), green = frontend (:3000).

### First-time setup

```bash
# 1. Environment files
cp backend/.env.example backend/.env
cp services/ml-service/.env.example services/ml-service/.env
# Edit both files — set MONGO_URI and JWT_SECRET

# 2. Python venv and dependencies
cd services/ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Train CatBoost market value model (required before seeding)
python scripts/train_imputer.py

# 4. Seed the database
python scripts/seed_db.py

# 5. Install frontend + backend Node deps (from repo root)
cd ../../
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

## Documentation

- [PLAN.md](./PLAN.md) — Task tracking, phase status, current blockers
- [ALGORITHMS.md](./ALGORITHMS.md) — Algorithm math and implementation detail
- [SEEDING_BENCHMARK.md](./SEEDING_BENCHMARK.md) — Field-by-field seeding reference
- [backend/BACKEND.md](./backend/BACKEND.md) — Controller, route, and model API reference
- [frontend/FRONTEND.md](./frontend/FRONTEND.md) — Component and data flow reference
- [services/ml-service/ML_SERVICE.md](./services/ml-service/ML_SERVICE.md) — ML service API and seeding reference
- [backend/openapi.yaml](./backend/openapi.yaml) — Full REST API specification

## Demo Credentials (development only — remove before production)

- Email: `admin@fotnep.com`
- Password: `fotnep2025`

## Database State (current dev seed)

- 980 players: 280 Nepali, 100 international (India/Bhutan/Bangladesh/Pakistan), 600 European comparison pool
- 19 teams, 24 matches, 2 demo users
- All player documents have height, weight, preferredFoot, and marketValue populated
