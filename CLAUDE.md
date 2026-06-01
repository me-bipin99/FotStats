# CLAUDE.md

This file provides guidance to Claude Code when working in the FotNep repository.

---

## Project: FotNep - Nepali Football Analytics Platform

**What:** Full-stack analytics app for Nepali football with 3 core ML algorithms  
**Status:** Starting Fresh - Session 5+  
**Tech Stack:** React 18 + TypeScript + Express.js + MongoDB + FastAPI (Python)

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

### Frontend (React 18 + TypeScript + Tailwind)
**Location:** `/frontend/src/`

**Pages:**
- Dashboard.tsx — Overview, key stats, algorithm summaries
- Players.tsx — Player database, search, filter by position
- Teams.tsx — Team listings and management
- Matches.tsx — Match fixtures, voting interface, predictions
- Login.tsx — Authentication page

**Components:**
- Header.tsx — Navigation navbar
- PlayerComparison.tsx — Algorithm 2: Compare two players
- LineupBuilder.tsx — Algorithm 3: Squad optimization UI
- MatchFeed.tsx — Match list sidebar with filters
- MatchDetails.tsx — Match info and prediction controls
- PlayerStats.tsx — Individual player stats display
- ErrorBoundary.tsx — Error handling wrapper

**Services:**
- api.ts — REST client for backend API calls (JWT auth)
- comparisonEngine.ts — Algorithm 2 logic/calculations
- types.ts — TypeScript interfaces

**State Management:**
- context/authContext.ts — JWT token & user auth state (Context API)

**Styling:**
- index.css — Component utilities (.card, .btn-primary, .input, .badge-*, .table-*)
- tailwind.config.ts — Tailwind theme tokens
- **Theme:** Light mode only (white bg, black text, gray borders)
- **Accents:** Emerald (#10B981) for interactive, Nepal red (#C8102E) for wins only

### Backend (Express.js + TypeScript + MongoDB)
**Location:** `/backend/src/`

**Controllers:** authController.ts, playerController.ts, teamController.ts, matchController.ts, predictionController.ts, insightController.ts

**Models:** User.ts, Player.ts, Team.ts, Match.ts, Prediction.ts

**Routes:**
- /api/v1/auth/* — login, register, validate
- /api/v1/players/* — CRUD operations
- /api/v1/teams/* — Team management
- /api/v1/matches/* — Match fixtures
- /api/v1/predict-match — Algorithm 1
- /api/v1/compare-players — Algorithm 2
- /api/v1/optimize-squad — Algorithm 3

**Database:** MongoDB (Atlas or local)  
**Auth:** JWT + bcrypt

### ML Service (FastAPI + Python)
**Location:** `/services/ml-service/`

**Endpoints:**
- POST /predict-match — Algorithm 1
- POST /compare-players — Algorithm 2
- POST /optimize-squad — Algorithm 3

**Models:** consensus.py, player_estimator.py, squad_optimizer.py

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

```bash
# Start everything
bash START.sh

# Or manually:
cd backend && npm run dev           # :3000
cd frontend && npm run dev          # :3001
cd services/ml-service && python -m uvicorn main:app --reload  # :8000

# Build
cd backend && npm run build
cd frontend && npm run build
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

## What NOT to do

- Don't add dark mode toggle
- Don't use harsh colors or decorative gradients
- Don't use Google Fonts
- Don't create redundant MD files
- Don't mock API data (integrate with backend)
- Don't over-engineer components
- Don't add features beyond the 3 algorithms
- Don't save context to memory (use CLAUDE.md)

---

**Last Updated:** 2026-06-01  
**Status:** Starting Fresh Implementation  
**Maintainer:** Claude Code
