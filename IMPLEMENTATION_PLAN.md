# FotNep Implementation Plan

**Purpose:** Complete specification for autonomous LLM development  
**Status:** Ready for Claude to build  
**Session:** 5+

---

## Quick Reference

| Component | Status | Port | Priority |
|-----------|--------|------|----------|
| Backend (Express) | To build | 3000 | 1st |
| Frontend (React) | To build | 3001 | 2nd |
| ML Service (FastAPI) | To build | 8000 | 1st |
| Database (MongoDB) | Exists | — | Setup first |
| OpenAPI Spec | ✅ Created | — | `backend/openapi.yaml` |

---

## What's Already Done ✅

- ✅ `backend/openapi.yaml` — Complete API specification
- ✅ `backend/BACKEND.md` — Architecture & schemas
- ✅ `frontend/FRONTEND.md` — Pages, components, flows
- ✅ `services/ml-service/ML_SERVICE.md` — Algorithms, data processing
- ✅ `CLAUDE.md` — Project context & commands
- ✅ `ALGORITHMS.md` — Algorithm specifications
- ✅ `data/raw/` — Raw Nepali player CSVs (2 files)

## What Claude Needs to Build 🔨

### 1. Backend (`/backend/src/`)
- [ ] TypeScript setup (tsconfig, package.json)
- [ ] Express app structure
- [ ] MongoDB schemas (User, Player, Team, Match, Vote, Prediction)
- [ ] 8 controllers (auth, players, teams, matches, predictions, comparisons, squad, votes)
- [ ] Route definitions
- [ ] Middleware (JWT auth, error handling)
- [ ] ML service integration wrapper
- [ ] Reputation engine (vote tracking & accuracy calculation)
- [ ] Unit tests (Jest)

### 2. ML Service (`/services/ml-service/`)
- [ ] FastAPI setup (main.py)
- [ ] 5 algorithm implementations (consensus, player_estimator, squad_optimizer, + supporting ML models)
- [ ] Data processing (load CSVs, normalize stats, fill missing values)
- [ ] Model training & caching (singleton pattern)
- [ ] Database seeding script
- [ ] Unit tests (pytest)

### 3. Frontend (`/frontend/src/`)
- [ ] React + TypeScript + Vite setup
- [ ] Tailwind CSS configuration
- [ ] 5 page components (Dashboard, Players, Teams, Matches, Login)
- [ ] 10+ UI components
- [ ] API client (auto-generated from OpenAPI)
- [ ] Auth context & hooks
- [ ] Routing with protection
- [ ] Component tests (Vitest + React Testing Library)

---

## Data Specifications

### Input: Raw Nepali Player Data

**Files:**
- `/data/raw/nepalisquad.csv` — Primary source (102 players)
  - Columns: Player Name, Position, Age, Caps, Goals, Yellow Cards, Red Cards, Est. Minutes, Market Value (€), Current Club, NSL Team
- `/data/raw/nepali player stats with role and gender.csv` — Supplementary (role/gender enrichment)
  - Columns: Player Name, Position, Role, Gender, Matches Played, Goals, Assists

**Processing:** (see `ML_SERVICE.md` section "Data Processing")
1. Load `nepalisquad.csv` as primary source
2. Join with role/gender file on Player Name (fuzzy match if exact match fails)
3. Normalize positions to nested structure: {primaryPosition, subPosition}
4. Calculate 6 core stats using formula below
5. Save consolidated data to `/data/raw/consolidated_nepali_players.csv`
6. Seed to MongoDB

### Position Normalization

Map raw positions to nested structure:

```
"Goalkeeper" → {primaryPosition: "GK", subPosition: "GK"}
"Left-Back" / "Fullback" → {primaryPosition: "DF", subPosition: "LB"}
"Right-Back" → {primaryPosition: "DF", subPosition: "RB"}
"Centre-Back" / "Defender" → {primaryPosition: "DF", subPosition: "CB"}
"Central Midfielder" / "Midfielder" → {primaryPosition: "MF", subPosition: "CM"}
"Left Midfielder" / "Left Winger" → {primaryPosition: "MF", subPosition: "LM"}
"Right Midfielder" / "Right Winger" → {primaryPosition: "MF", subPosition: "RM"}
"Defensive Midfielder" → {primaryPosition: "MF", subPosition: "DM"}
"Attacking Midfielder" → {primaryPosition: "MF", subPosition: "AM"}
"Striker" / "Forward" → {primaryPosition: "FW", subPosition: "ST"}
"Left Wing" / "Left Forward" → {primaryPosition: "FW", subPosition: "LW"}
"Right Wing" / "Right Forward" → {primaryPosition: "FW", subPosition: "RW"}
"Centre Forward" → {primaryPosition: "FW", subPosition: "CF"}
```

### Player Stats Calculation Formula

**Goal:** Calculate 6-attribute stats (0-100 scale) from available CSV data.

**Inputs:**
- Position/Role (determines baseline)
- Goals, Assists, Matches Played, Yellow Cards, Red Cards (weighting factors)
- Caps, Est. Minutes (experience modifiers)

**Formula (Conservative: 80% defaults + 20% data-driven):**

```
// Position-based DEFAULTS (0-100)
const defaults = {
  'GK': { pace: 40, shooting: 20, passing: 60, dribbling: 20, defending: 80, physical: 70 },
  'CB': { pace: 60, shooting: 30, passing: 65, dribbling: 35, defending: 90, physical: 85 },
  'LB': { pace: 75, shooting: 35, passing: 70, dribbling: 55, defending: 80, physical: 75 },
  'RB': { pace: 75, shooting: 35, passing: 70, dribbling: 55, defending: 80, physical: 75 },
  'CM': { pace: 75, shooting: 55, passing: 80, dribbling: 70, defending: 70, physical: 75 },
  'DM': { pace: 70, shooting: 40, passing: 75, dribbling: 55, defending: 85, physical: 80 },
  'AM': { pace: 80, shooting: 70, passing: 85, dribbling: 80, defending: 55, physical: 70 },
  'LW': { pace: 85, shooting: 70, passing: 75, dribbling: 85, defending: 40, physical: 65 },
  'RW': { pace: 85, shooting: 70, passing: 75, dribbling: 85, defending: 40, physical: 65 },
  'ST': { pace: 80, shooting: 85, passing: 70, dribbling: 80, defending: 30, physical: 80 },
  'CF': { pace: 80, shooting: 85, passing: 70, dribbling: 80, defending: 30, physical: 80 }
};

// Data-driven BONUSES (applied to defaults)
const goalBonus = Math.min(goals / 5, 10);  // Max 10 point bonus for 5+ goals
const assistBonus = Math.min(assists / 5, 8);  // Max 8 point bonus for 5+ assists
const cardsRatio = (yellowCards + redCards * 3) / (matches / 10);  // Discipline factor
const playingTime = estimatedMinutes / matches;  // Avg minutes per appearance

// FINAL CALCULATION (80% default, 20% data-driven)
function calculateStat(attribute, player):
  baseValue = defaults[position][attribute]
  
  if attribute == 'shooting':
    bonus = goalBonus * 0.3  // Goals heavily influence shooting
  else if attribute == 'passing':
    bonus = assistBonus * 0.2  // Assists show passing ability
  else if attribute == 'defending':
    bonus = -cardsRatio * 0.1  // More cards = worse defending
  else if attribute == 'pace':
    bonus = (playingTime > 60 ? 5 : 0)  // Regular minutes = consistent pace
  else:
    bonus = 0
  
  return Math.min(100, Math.max(0, baseValue * 0.8 + bonus * 0.2))
```

**Example:**
```
Player: "Anjan Bista" (Forward, 13 goals in 74 caps, 5950 minutes)
- Position default for ST: shooting=85
- Goals bonus: 13/5 = 2.6 point bonus
- Final shooting: (85 * 0.8) + (2.6 * 0.2) = 68 + 0.52 = 68.52 → 69/100

Result:
pace: 80, shooting: 69, passing: 70, dribbling: 78, defending: 32, physical: 78
```

---

## Database Schema (MongoDB Collections)

See detailed schemas in `backend/BACKEND.md`. Summary:

```javascript
// User: Auth & reputation
{ _id, email, name, passwordHash, reputation, predictionsCorrect, predictionsTotal }

// Player: Core entity
{
  _id, name, age, nationality, gender,
  position: { primaryPosition: "FW", subPosition: "RW" },
  team, currentClub, nslTeam,
  stats: { pace, shooting, passing, dribbling, defending, physical },
  careerStats: { appearances, goals, assists, yellowCards, redCards },
  eloRating, marketValue, estimatedMinutes,
  source: "nepali", rawDataPath
}

// Team: Team data
{ _id, name, country, founded, color, stadium, coach, players[], formation }

// Match: Fixtures & results
{
  _id, homeTeam, awayTeam, date, competition, status,
  homeLineup[], awayLineup[], homeFormation, awayFormation,
  result: { homeScore, awayScore }
}

// Vote: User predictions
{ _id, userId, matchId, outcome, correct, timestamp }

// Prediction: Algorithm 1 results
{ _id, matchId, prediction: {homeWinProb, drawProb, awayWinProb}, confidence, voteBreakdown }
```

---

## API Endpoints Summary

Complete spec in `backend/openapi.yaml`. Quick reference:

```
AUTH:
  POST /auth/login          → JWT token + User
  POST /auth/register       → JWT token + User
  GET  /auth/validate       → Verify token

PLAYERS:
  GET  /players?position=FW&search=...&sortBy=eloRating&limit=20
  GET  /players/{id}
  GET  /players/stats/{id}

TEAMS:
  GET  /teams
  GET  /teams/{id}
  GET  /teams/{id}/lineup

MATCHES:
  GET  /matches?status=upcoming&limit=10
  GET  /matches/{id}
  GET  /matches/{id}/lineups

ALGORITHM 1 (Crowd Consensus):
  POST /predict-match        { matchId, votes[] } → MatchPrediction
  GET  /predict-match/{matchId}

ALGORITHM 2 (Player Comparison):
  POST /compare-players      { playerAId, playerBId } → PlayerComparison

ALGORITHM 3 (Squad Optimization):
  POST /optimize-squad       { teamId, availablePlayerIds, formation?, constraints } → SquadOptimization

VOTES & REPUTATION:
  POST /votes                { matchId, outcome }
  GET  /votes/{matchId}
  GET  /leaderboard?limit=10
```

---

## Development Workflow for Claude

When implementing, follow this order:

### Phase 1: Backend Foundation
1. Create Express app structure + TypeScript config
2. Connect to MongoDB (use Atlas URI provided)
3. Define all MongoDB schemas
4. Implement auth controller (login/register/validate)
5. Implement middleware (JWT, error handling)
6. Create all remaining controllers
7. Wire up all routes per `openapi.yaml`
8. Add unit tests

### Phase 2: ML Service
1. Create FastAPI app structure
2. Implement data loading (load both CSVs, normalize, calculate stats)
3. Implement seeding script (`scripts/seed_db.py`)
4. Implement Algorithm 1: Consensus prediction
5. Implement Algorithm 2: Player estimator (with KNN)
6. Implement Algorithm 3: Squad optimizer (with Genetic Algorithm)
7. Add model training & caching
8. Add unit tests

**⚠️ Important:** Don't start ML service until backend is running (needs MongoDB seeding)

### Phase 3: Frontend
1. Create React + Vite + TypeScript setup
2. Run `npm run gen:api` to generate types from OpenAPI
3. Create auth context & hooks
4. Implement Login page first
5. Implement protected routing
6. Create Dashboard page
7. Create Players, Teams, Matches pages
8. Create Algorithm UI components (MatchVoting, PlayerComparison, LineupBuilder)
9. Add component tests

---

## Critical Integration Points

### Backend ↔ ML Service
- Backend calls ML Service via HTTP (async POST requests)
- ML Service location: `http://localhost:8000`
- All 3 algorithm endpoints return structured responses
- Handle timeouts gracefully (ML algorithms might take 2-5 seconds)
- **Mock ML service in backend tests** (don't make HTTP calls during testing)

### Frontend ↔ Backend
- Frontend calls backend REST API via `api.ts` client
- All requests include `Authorization: Bearer <JWT_TOKEN>`
- Backend validates token in all protected routes
- Frontend stores JWT in `localStorage` under key from `.env.local`
- Handle 401 → redirect to login

### Database Initialization
- Run `python scripts/seed_db.py` **once** after both backend and ML service are running
- Script loads CSVs → calculates stats → seeds 102 Nepali players + sample teams/matches
- After seeding, all algorithms have training data available

---

## Testing Strategy

### Backend Tests (Jest)
```bash
npm test
```
- Unit tests for controllers (mock MongoDB & ML service)
- Integration tests for routes (use test MongoDB)
- Test each endpoint with valid/invalid inputs

### ML Service Tests (pytest)
```bash
python -m pytest
```
- Unit tests for each algorithm
- Test with sample player data
- Verify stat calculations

### Frontend Tests (Vitest)
```bash
npm test
```
- Component rendering tests
- Form submission tests
- Integration tests for critical flows (login → dashboard)

---

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://[user]:[pass]@[cluster].mongodb.net/fotnep
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
NODE_ENV=development
PORT=3000
ML_SERVICE_URL=http://localhost:8000
```

### ML Service (.env)
```
MONGO_URI=mongodb+srv://[user]:[pass]@[cluster].mongodb.net/fotnep
PYTHONUNBUFFERED=1
LOG_LEVEL=INFO
```

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AUTH_TOKEN_KEY=fotnep_token
```

---

## Clarifications & Notes

### Position Handling
- **Database:** Store nested `{ primaryPosition: "FW", subPosition: "RW" }`
- **Algorithms:** Use `primaryPosition` for broad clustering (FW/MF/DF/GK)
- **UI:** Display both for clarity (e.g., "Right Winger (Forward)")

### Stats Calculation
- **Conservative approach:** 80% position defaults + 20% goal/assist weighting
- **Missing data:** Always interpolate with position defaults, never store null
- **Normalization:** Use z-score (mean=0, std=1) for ML algorithms

### European Player Data
- `/data/players_data-2025_2026.csv` contains 2780 European players
- Use as comparison dataset for KNN (Algorithm 2)
- Don't seed to main collection yet (2782 total players might be large)
- **Optional:** Implement lazy-loading if needed

### Vote Tracking
- Each vote is recorded with timestamp
- When match resolves (status → completed), retroactively set `vote.correct = true/false`
- Use vote history to calculate user reputation (accuracy-based weighting)

### Formation Support
Implement all formations: 4-3-3, 4-2-3-1, 3-5-2, 5-4-1, 5-3-2, 4-1-4-1
- Use position-based validation (e.g., 4-3-3 = 1 GK + 4 DF + 3 MF + 3 FW)

---

## Remaining Questions to Ask if Needed

If Claude encounters edge cases:

1. **Match Lineups:** Should we store player IDs or full player data snapshots? (IDs for efficiency, snapshots for history)
2. **ELO Calculation:** Should ELO update after each match? If yes, when and how? (Suggest: update batch after match resolves)
3. **Reputation Reset:** Should user reputation reset seasonally, or accumulate indefinitely?
4. **API Rate Limiting:** Should backend rate-limit ML service calls? (Suggest: no for MVP)
5. **Caching:** Should frontend cache player/team data, or always fetch fresh? (Suggest: cache, invalidate on mutation)

---

## Success Criteria

Backend complete when:
- All endpoints respond per OpenAPI spec
- JWT auth works
- MongoDB CRUD operations work
- ML service integration works (can call /predict-match, /compare-players, /optimize-squad)
- All tests pass

ML Service complete when:
- All 3 algorithms respond with correct output structure
- Data seeding populates 102 Nepali players with calculated stats
- Models load and cache correctly
- Tests pass

Frontend complete when:
- All 5 pages render without errors
- Login flow works (get token, store, use in requests)
- Can fetch and display players, teams, matches
- Can submit votes and see predictions
- Can trigger all 3 algorithms
- No console errors

---

**Created:** 2026-06-02  
**Ready for:** Autonomous Claude development  
**Next Step:** Run `bash START.sh` once all services are built
