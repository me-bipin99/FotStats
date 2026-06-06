# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: FotNep — Nepali Football Analytics Platform

Full-stack analytics app for Nepali football with 3 core ML algorithms.

**Tech Stack:**

- Frontend: React 19 + TypeScript + Vite + Tailwind CSS v4
- Backend: Express.js + TypeScript + MongoDB (Mongoose)
- ML Service: FastAPI + Python + scikit-learn

**Service ports:** Frontend :3000 (dev) · Backend :3000 · ML Service :8000

> During development run frontend via Vite and backend on a different port (e.g. change `PORT=3001` in `backend/.env`) to avoid collision.

---

## Current Implementation State

| Layer | Status |
| --- | --- |
| Frontend | ✅ Implemented (dark theme, mock data — not yet API-connected) |
| Backend | 🔧 Scaffolded (models + middleware defined — controllers need completion) |
| ML Service | 🔧 Scaffolded (Algorithm 1 ready, 2 & 3 need DB wiring) |
| Database | ✅ Schema defined, seed script ready |

---

## Commands

### Frontend

```bash
cd frontend
npm install
npm run dev          # Vite dev server on :3000
npm run build        # Production build to /dist
npm run preview      # Test production build locally
npm run lint         # TypeScript check (tsc --noEmit)
npm run clean        # Remove dist/ and server.js
```

### Backend (Express.js + TypeScript)

```bash
cd backend
npm install
npm run dev          # tsx watch — hot reload
npm run build        # tsc → dist/
npm start            # Run compiled dist/index.js
npm run type-check   # TypeScript check without emitting
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm test             # Jest
npm run test:watch   # Jest watch mode
npm test -- auth     # Single test file (e.g. auth)
```

### ML Service (FastAPI + Python)

```bash
cd services/ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
# Swagger UI: http://localhost:8000/docs

python scripts/seed_db.py       # Seed demo data (development only)
python -m pytest                 # All tests
python -m pytest tests/test_consensus.py  # Single test file
python -m pytest --cov=models   # Coverage
python -m black .                # Format
python -m flake8 .               # Lint
```

### Environment Setup

```bash
cp backend/.env.example backend/.env
cp services/ml-service/.env.example services/ml-service/.env
# Fill in MONGO_URI and JWT_SECRET
```

---

## The 3 Algorithms

### Algorithm 1: Crowd Consensus Prediction

- **Endpoint:** `POST /predict-match` (ML service)
- **Logic:** Reputation-weighted vote aggregation. `homeWinProb = sum(reputation of home_win voters) / total_rep`. Confidence = `(1 - variance_of_probs) * 100`.
- **Implemented in:** `services/ml-service/models/consensus.py`

### Algorithm 2: Player Performance Estimator

- **Endpoint:** `POST /compare-players` (ML service)
- **Logic:** Fetches two players from MongoDB → normalizes 6 stats (pace/shooting/passing/dribbling/defending/physical) → cosine similarity score 0–100.
- **Implemented in:** `services/ml-service/models/player_estimator.py`

### Algorithm 3: Optimal Squad Generator

- **Endpoint:** `POST /optimize-squad` (ML service)
- **Logic:** Filters unavailable players → groups by position → selects top players by ELO per formation slot. Full genetic algorithm optimization planned after training phase.
- **Implemented in:** `services/ml-service/models/squad_optimizer.py`

---

## Architecture & Data Flow

```text
MongoDB (single source of truth)
    ↓ Mongoose models
Backend (Express :3000) — /api/v1/*
    ↓ JWT-authenticated REST
Frontend (React Vite dev :3000)
    ↓ POST /api/v1/predict-match etc.
Backend → HTTP call → ML Service (FastAPI :8000)
    ↓ result stored back to MongoDB (Prediction collection)
```

**Rule:** All GET endpoints query MongoDB. Never hardcode player/match data in controllers.

---

## Frontend Architecture

The frontend is a **dark-themed SPA** with tab navigation (no React Router).

```text
frontend/src/
├── App.tsx              # Root: tab state, layout grid, player comparison state
├── types.ts             # Team, Player, Match, LineupPosition, MatchStats interfaces
├── index.css            # Tailwind v4 @theme tokens + Google Fonts + animations
├── components/          # Flat structure (not nested subdirectories)
│   ├── Header.tsx       # Navbar + auth (localStorage, temporary)
│   ├── MatchFeed.tsx    # Sidebar: match list with MEN/WOMEN/DOMESTIC filter
│   ├── MatchDetails.tsx # Main panel: scoreboard, pitch, vote prediction
│   ├── PlayerComparison.tsx  # Algorithm 2 UI
│   ├── PlayerStats.tsx  # Player stat tables
│   └── LineupBuilder.tsx     # Algorithm 3 UI
└── data/
    └── mockData.ts      # Mock teams/players/matches — replace with API calls
```

**Tab navigation:** `activeTab: 'home' | 'compare' | 'stats' | 'lineups'` in `App.tsx`.

**Design system (dark):**
- Backgrounds: `#0d0e10` (page), `#151619` (cards)
- Text: `#cbd5e1` (primary), `#64748b` (secondary)
- Accents: `#10b981` emerald (interactive), `#dc2626` Nepal red (wins only)
- Fonts via Google Fonts in `index.css`: Open Sans (body), Space Grotesk (display), JetBrains Mono (stats)
- Animations via `motion/react` (Framer Motion API)
- Tailwind v4 configured with `@tailwindcss/vite` plugin; theme tokens in `@theme {}` block in `index.css` — no `tailwind.config.ts`

**Migrating from mock data to backend:**
1. Create `src/services/api.ts` — HTTP client with `Authorization: Bearer <token>` header
2. Replace `import { mockX } from './data/mockData'` with `useEffect` + API calls
3. Move auth state from `Header.tsx` localStorage to a proper `authContext.ts`
4. Add `VITE_API_BASE_URL=http://localhost:3000/api/v1` to `frontend/.env.local`

---

## Backend Architecture

```text
backend/src/
├── index.ts             # Express app entry, middleware, route mounting
├── config/
│   └── database.ts      # Mongoose connectDB() — reads MONGO_URI
├── models/              # Mongoose schemas: User, Player, Team, Match, Vote, Prediction
├── controllers/
│   ├── authController.ts   # login(), register()
│   └── playerController.ts # listPlayers(), getPlayer()
├── routes/
│   ├── auth.ts          # POST /login, POST /register
│   └── players.ts       # GET /players, GET /players/:id
├── middleware/
│   ├── authMiddleware.ts # requireAuth() — JWT verify → req.userId
│   └── errorHandler.ts  # Standard { error, message } response
└── services/
    └── mlIntegration.ts  # predictMatch(), comparePlayers(), optimizeSquad() → HTTP to :8000
```

**Error response format:** `{ "error": "ERROR_CODE", "message": "Human readable" }`

**Auth:** `POST /api/v1/auth/login` → `{ token, user }`. Use `Authorization: Bearer <token>` for protected routes. `requireAuth` middleware validates JWT and sets `req.userId`.

**Key model fields:**

- `Player.eloRating` — default 1600, higher = better
- `Player.source` — `'nepali' | 'european'` (comparison dataset distinction)
- `Vote` — unique compound index on `(userId, matchId)`
- `User.reputation` — 0–100, updated after match resolution

---

## ML Service Architecture

```text
services/ml-service/
├── main.py              # FastAPI app, CORS, router registration
├── models/
│   ├── consensus.py     # Algorithm 1 — fully implemented
│   ├── player_estimator.py  # Algorithm 2 — needs real DB connection
│   └── squad_optimizer.py   # Algorithm 3 — needs real DB + GA training
├── config/
│   ├── database.py      # pymongo singleton — get_db()
│   └── model_loader.py  # Pickle model loader singleton (trained_models/*.pkl)
├── scripts/
│   └── seed_db.py       # Demo data seeder — development only
└── tests/
    └── test_consensus.py
```

**Adding a new algorithm:** Create `models/new_algo.py` with `router = APIRouter()`, then uncomment its import and `app.include_router()` call in `main.py`.

**Trained models** are stored as pickle files in `trained_models/` (not yet generated). `ModelLoader` auto-loads all `.pkl` files from that directory on first use.

---

## Database (MongoDB)

**Collections:** `users` · `players` · `teams` · `matches` · `votes` · `predictions`

**Seeding (development only):**

```bash
cd services/ml-service && source venv/bin/activate
python scripts/seed_db.py
```

Loads Nepali players from `/data/raw/nepali player stats with role and gender.csv`, creates demo teams/matches/users.

**Demo credentials (dev only — remove before production):**

- `admin@fotnep.com` / `fotnep2025`

**Player data:**

- `/data/raw/nepali player stats with role and gender.csv` — 102 Nepali players
- `/data/players_data-2025_2026.csv` — 2780 European players (Algorithm 2 comparison dataset)

---

## ⚠️ Production Checklist

- [ ] Remove demo credentials from seed script and database
- [ ] Replace all `mockData.ts` imports with real API calls
- [ ] Set strong `JWT_SECRET` (not the example value)
- [ ] Enable rate limiting (`express-rate-limit` is already installed)
- [ ] `npm run build` passes in both `frontend/` and `backend/`
- [ ] `npm run type-check` passes in `backend/`
- [ ] `pytest` passes in `services/ml-service/`
- [ ] No hardcoded data in any controller — all queries hit MongoDB

---

## Key Reference Files

- [ALGORITHMS.md](./ALGORITHMS.md) — Detailed algorithm math
- [backend/BACKEND.md](./backend/BACKEND.md) — Full controller/model API reference
- [frontend/FRONTEND.md](./frontend/FRONTEND.md) — Component and flow reference
- [services/ml-service/ML_SERVICE.md](./services/ml-service/ML_SERVICE.md) — Algorithm implementation detail
- [backend/openapi.yaml](./backend/openapi.yaml) — Full REST API specification

---

**Last Updated:** 2026-06-06  
**Status:** Frontend UI complete (dark theme, mock data). Backend + ML service scaffolded, ready for implementation.
