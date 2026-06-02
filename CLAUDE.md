# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: FotNep - Nepali Football Analytics Platform

**What:** Full-stack analytics app for Nepali football with 3 core ML algorithms  
**Status:** Early MVP - Session 5+, Documentation & Planning Phase  
**Tech Stack:** React 18 + TypeScript + Express.js + MongoDB + FastAPI (Python)

**Current State:** Documentation complete, data seeded. Code scaffolding needed (backend/, frontend/, services/).  
**Key References:** 
- [MASTER_PLAN.md](./MASTER_PLAN.md) — 5-session roadmap with detailed status
- [ALGORITHMS.md](./ALGORITHMS.md) — Algorithm specifications
- [SETUP.md](./SETUP.md) — Setup and deployment guide

---

## The 3 Algorithms

### 1. Crowd Consensus Prediction
- **Purpose:** Community-driven match outcome forecasting with reputation-weighted voting
- **Input:** Match ID, user votes (Home/Draw/Away), user reputation scores
- **Output:** Predicted winner probability, community confidence (0-100%), vote breakdown
- **Endpoint:** POST /api/v1/predict-match
- **Logic:** Higher reputation users have more voting weight; final prediction = weighted average

### 2. Player Performance Estimator
- **Purpose:** Compare player statistics predicted by ML from available training data
- **Input:** Player A ID, Player B ID, historical stats
- **Output:** Similarity score (0-100%), attribute breakdown (pace, shooting, passing, dribbling, defending, physical), tactical recommendations
- **Endpoint:** POST /api/v1/compare-players
- **Logic:** ML predicts missing stats; enables fair comparison across different career histories

### 3. Optimal Squad Generator
- **Purpose:** Predict ideal match lineups based on historical performance and player availability
- **Input:** Available players, opponent (optional), formation preference, constraints (injuries/suspensions)
- **Output:** Predicted starting XI, bench recommendations, formation, confidence score, tactical insights
- **Endpoint:** POST /api/v1/optimize-squad
- **Logic:** Analyzes past lineups/outcomes, learns winning combinations, respects player chemistry & constraints

---

## Architecture

### Data Layer
**Location:** `/data/`
- `players_data-2025_2026.csv` — 2780 European players (comparison dataset)
- `raw/` — Raw datasets for ML training
- `processed/` — Cleaned datasets post-processing
- `statsbomb/` — StatsBomb event data for advanced analytics

**Seeding:** `services/ml-service/scripts/seed_db.py` populates MongoDB with:
- 102 Nepali players (with ELO ratings, positions, stats)
- Matches, teams, users, votes

### Frontend (React 18 + TypeScript + Tailwind)
**Location:** `/frontend/src/` (to be created)

**Pages (Design Complete - Implementation Needed):**
- `pages/Dashboard.tsx` — Overview, key stats, algorithm summaries
- `pages/Players.tsx` — Player database, search, filter by position
- `pages/Teams.tsx` — Team listings and management
- `pages/Matches.tsx` — Match fixtures, voting interface, predictions
- `pages/Login.tsx` — Authentication page

**Components (Design Complete):**
- `components/Header.tsx` — Navigation navbar
- `components/PlayerComparison.tsx` — Algorithm 2: Compare two players
- `components/LineupBuilder.tsx` — Algorithm 3: Squad optimization UI
- `components/MatchFeed.tsx` — Match list sidebar with filters
- `components/MatchDetails.tsx` — Match info and prediction controls
- `components/PlayerStats.tsx` — Individual player stats display
- `components/ErrorBoundary.tsx` — Error handling wrapper

**Services (to be created):**
- `services/api.ts` — REST client for backend API calls (JWT auth)
- `services/comparisonEngine.ts` — Algorithm 2 client-side logic
- `types/index.ts` — TypeScript interfaces

**State Management:**
- `context/authContext.ts` — JWT token & user auth state (Context API)

**Styling:**
- `index.css` — Component utilities (.card, .btn-primary, .input, .badge-*, .table-*)
- `tailwind.config.ts` — Tailwind theme tokens
- **Theme:** Light mode only (white bg, black text, gray borders)
- **Accents:** Emerald (#10B981) for interactive, Nepal red (#C8102E) for wins only

### Backend (Express.js + TypeScript + MongoDB)
**Location:** `/backend/src/` (to be created)

**Controllers (to be implemented):**
- `authController.ts` — Login, register, JWT validation
- `playerController.ts` — CRUD operations, analytics
- `teamController.ts` — Team management, squad synergy
- `matchController.ts` — Match fixtures, lineup management
- `predictionController.ts` — Prediction accuracy tracking
- `insightController.ts` — ML algorithm integration

**Models (MongoDB schemas to be created):**
- `User.ts` — Users, reputation scores, voting history
- `Player.ts` — Player stats, positions, ELO ratings
- `Team.ts` — Team data, formations, lineups
- `Match.ts` — Match fixtures, results, lineups
- `Prediction.ts` — Predictions from algorithms
- `Vote.ts` — Voting records, reputation weighting

**API Routes:**
- `/api/v1/auth/*` — login, register, validate
- `/api/v1/players/*` — CRUD operations
- `/api/v1/teams/*` — Team management
- `/api/v1/matches/*` — Match fixtures
- `/api/v1/predict-match` — Algorithm 1 (Crowd Consensus)
- `/api/v1/compare-players` — Algorithm 2 (Player Estimator)
- `/api/v1/optimize-squad` — Algorithm 3 (Squad Generator)

**Database:** MongoDB (Atlas or local)  
**Auth:** JWT + bcrypt  
**Testing:** Jest for unit/integration tests

### ML Service (FastAPI + Python)
**Location:** `/services/ml-service/` (to be created)

**Algorithm Endpoints:**
- `POST /predict-match` — Crowd Consensus Prediction (Algorithm 1)
- `POST /compare-players` — Player Performance Estimator (Algorithm 2)
- `POST /optimize-squad` — Optimal Squad Generator (Algorithm 3)

**ML Models (to be implemented):**
- `models/consensus.py` — Reputation-weighted voting aggregation
- `models/player_estimator.py` — KNN-based player comparison
- `models/squad_optimizer.py` — Genetic algorithm for lineup optimization

**Utilities (to be created):**
- `scripts/seed_db.py` — Database seeding script
- `model_loader.py` — Singleton model caching
- `config.py` — Environment and model configuration

---

## Seeded Data

**Admin Account:**
- Email: admin@fotnep.com
- Password: fotnep2025

**Players:**
- 102 Nepali players (name, position, stats, ELO rating)
- 2780 European players (comparison dataset)

**Matches:**
- Demo fixtures with lineups, venues, competitions

---

## Commands

### Project-Level
```bash
# Start all services (when directories exist)
bash START.sh
```

### Backend (Express.js + TypeScript)
```bash
cd backend

# Development
npm install                 # First-time setup
npm run dev                 # Dev server with hot-reload (:3000)
npm run build              # Build for production
npm run build:watch       # Build with file watching
npm test                   # Run test suite
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix linting issues

# Production
npm start                  # Run built version
NODE_ENV=production npm run build
```

### Frontend (React 18 + Vite + Tailwind)
```bash
cd frontend

# Development
npm install                 # First-time setup
npm run dev                 # Vite dev server (:3001)
npm run build              # Production build
npm run preview            # Preview production bundle locally
npm test                   # Run test suite
npm run lint              # ESLint check

# Type checking
npm run type-check        # TypeScript check
```

### ML Service (FastAPI + Python)
```bash
cd services/ml-service

# Setup
python -m venv venv                                    # Create virtual environment
source venv/bin/activate                              # Activate (Windows: venv\Scripts\activate)
pip install -r requirements.txt                       # Install dependencies

# Development
python -m uvicorn main:app --reload --port 8000      # Dev server (:8000) with auto-reload
python -m uvicorn main:app --reload --host 0.0.0.0   # For external access

# Testing & Quality
python -m pytest                                       # Run test suite
python -m pytest -v                                   # Verbose output
python -m pytest --cov                                # Coverage report
python -m black .                                     # Format code
python -m flake8 .                                    # Lint check

# Database
python scripts/seed_db.py                             # Seed players, teams, matches to MongoDB
```

### Environment Setup
```bash
# Backend .env
cat > backend/.env << 'EOF'
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fotnep
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
REDIS_URL=redis://localhost:6379  # Optional
PORT=3000
EOF

# Frontend .env.local
cat > frontend/.env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AUTH_TOKEN_KEY=fotnep_token
EOF

# ML Service .env
cat > services/ml-service/.env << 'EOF'
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fotnep
PYTHONUNBUFFERED=1
EOF
```

---

## Design System

**Colors (Light Theme Only):**
- Background: #ffffff
- Cards: #ffffff with border #e5e5e5
- Text primary: #000000 (black)
- Text secondary: #64748b (gray)
- Interactive: #10b981 (emerald)
- Win/Critical CTA: #c8102e (Nepal red)
- Borders: #e5e5e5 (gray)

**Spacing:** Tailwind standard (4/8/12/16/24/32/48px)  
**Radius:** rounded-lg = 8px, rounded-xl = 12px  
**Fonts:** System UI stack + monospace for numbers  
**Shadows:** shadow-sm, shadow-md, shadow-lg for depth

**Component Classes:**
- .card — Card with border, shadow
- .btn-primary — Emerald button
- .btn-secondary — Gray secondary button
- .input — Text input with emerald focus
- .table-head, .table-row — Table styling
- .badge-fwd, .badge-mid, .badge-def, .badge-gk — Position badges
- .text-stat — Bold monospace for stats

---

## Important Rules

1. **Light mode only** — No dark mode toggle anywhere
2. **Emerald for interactive** — All buttons, focus states, active elements
3. **Nepal red sparingly** — Wins, critical CTAs only
4. **Professional design** — Clean, readable, no harsh gradients
5. **No AI slop** — Professional dark theme typography, proper contrast
6. **Dense information** — Tables and lists are compact
7. **System fonts only** — No Google Fonts
8. **All context in CLAUDE.md** — No external memory, version-controlled only

---

## Development Workflow

1. **Scaffold the directories** (if not present):
   ```bash
   mkdir -p backend/src/{controllers,models,routes,middleware,services}
   mkdir -p frontend/src/{pages,components,services,types,context,styles}
   mkdir -p services/ml-service/{models,scripts}
   ```

2. **Setup environment files** before running services
3. **Seed database** once backend is running: `python scripts/seed_db.py`
4. **Run services in parallel** for full-stack development
5. **Test in browser** before marking features complete (use `/verify` skill)

## Testing Strategy

- **Unit Tests:** Implement for utility functions and services
- **Integration Tests:** Test API endpoints with real DB (use test database)
- **E2E Tests:** Manual verification via browser (use `/verify` skill)
- **Run tests before committing:** `npm test` in backend/frontend, `pytest` in ML service

## Code Quality

- **Linting:** Run `npm run lint:fix` and `black .` before committing
- **Type Safety:** Ensure `npm run type-check` passes in frontend
- **No console errors:** Check browser console in `/verify`
- **Commit messages:** Reference session number and feature (e.g., "Session 5: Implement player search")

## Important Context

- **Session-based development:** Each session builds incrementally (see MASTER_PLAN.md)
- **College requirements:** Minimum 3 algorithms (we have 3), documented ML models
- **Data already seeded:** 102 Nepali + 2780 European players available in MongoDB
- **Admin credentials:** Use email: `admin@fotnep.com`, password: `fotnep2025`
- **Reputation system:** Voting accuracy feeds into user reputation weighting for predictions

## What NOT to do

- Don't add dark mode toggle — light mode only
- Don't use harsh colors or decorative gradients — professional design
- Don't use Google Fonts — system UI stack only
- Don't create redundant MD files — all context in CLAUDE.md + MASTER_PLAN.md
- Don't mock API data — integrate with actual backend once running
- Don't over-engineer components — follow provided designs, keep simple
- Don't add features beyond the 3 algorithms — scope-locked
- Don't save context to memory — use CLAUDE.md (version-controlled)
- Don't skip linting/tests before committing — quality gate required
- Don't commit .env files or sensitive data — update .gitignore if needed

---

**Last Updated:** 2026-06-02  
**Status:** MVP Phase - Session 5+, Scaffolding & Implementation  
**Maintainer:** Claude Code
