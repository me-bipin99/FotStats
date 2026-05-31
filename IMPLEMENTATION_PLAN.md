# FotNep — FotMob-like Nepali Football Stats App
## Implementation Plan

---

## Project Overview

**Goal:** Build a web application (like FotMob) for Nepali football player statistics with advanced analytics.

**Target Features:**
- Predicted lineups from available players
- Expected Goals (xG) per player
- Position heatmaps (synthetic, position-based)
- Win/Draw/Loss probability for matches
- Player synergy detection

**College Requirements:**
- Minimum 3 distinct algorithms ✓ (5 implemented)
- Session-based development (complete one session per focused work period)
- Limited API usage (only rule-based insights, no external LLM calls)

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS + Recharts |
| **Backend** | Node.js + Express + TypeScript + MongoDB + Redis + JWT |
| **ML Service** | Python + FastAPI + scikit-learn |
| **Infrastructure** | Docker Compose (MongoDB, Redis, Backend, ML Service, Frontend) |

---

## Algorithm Map

**5 Distinct Algorithm Families (3+ required):**

| # | Algorithm | File(s) | Feature |
|---|-----------|---------|---------|
| **1** | **K-Nearest Neighbors (KNN)** | `knn_comparator.py` + `knn_estimator.py` | xG/xA estimation + similar European player lookup |
| **2** | **K-Means Clustering** | `player_clusterer.py` (6 clusters) | Player role classification + synergy detection |
| **3** | **Gaussian Naive Bayes** | `match_predictor.py` (`MatchPredictor` + `LineupPredictor`) | Win/Draw/Loss probability + Bayesian lineup scoring |
| **4** | **ELO Rating System** | `elo_rating.py` | Player strength/form rating (feeds algorithms 3 & 5) |
| **5** | **Genetic Algorithm** | `genetic_optimizer.py` (`SquadOptimizer`) | Optimal 11-player lineup from squad pool |

**Minimum 3 met by algorithms 1–3. Algorithms 4 and 5 are bonus.**

---

## Current Codebase State

### ✅ Fully Implemented (Do Not Rewrite)

**Backend Infrastructure:**
- Database config + Mongoose models
- Redis cache client + helpers
- JWT auth middleware + error handler
- Winston logger + request logging
- All route definitions wired

**ML Models (Complete Logic):**
- `elo_rating.py` — ELO bootstrap, form calculation
- `knn_comparator.py` — KNN fitting, European player matching
- `knn_estimator.py` — KNN regression for stat prediction
- `match_predictor.py` — Naive Bayes classifier + Bayesian lineup scorer
- `player_clusterer.py` — KMeans clustering
- `insights_engine.py` — 6 rule-based insight rules

**Frontend Foundations:**
- React Router setup + auth-gated routes
- Zustand store (with persistence) for auth state
- Axios API service layer
- Login page + Navbar component

### 🚧 Stub / TODO (Needs Implementation)

- **ALL 6 backend controllers** — every method returns empty response
- **ALL 5 ML route handlers** — all return hardcoded stub values
- `genetic_optimizer.py` → `optimize()` body is TODO (helpers `_crossover`, `_mutate`, `_calculate_fitness` are coded)
- **ALL 4 frontend pages** except Login (Dashboard, Players, Teams, Matches are empty shells)
- `authContext.ts` → `login()` action is TODO

### ❌ Files to Delete

**Root-level planning docs (18 files, no code value):**
```
claude.md  model.md  roadmap.md  IMPLEMENTATION_AUDIT.md  skill.md
INDEX.md  ARCHITECTURE_SUMMARY.md  CREATION_SUMMARY.md  DOCUMENTATION.md
VISUAL_GUIDE.md  NSL_IMPLEMENTATION_ROADMAP.md  PROJECT_STRUCTURE.md
SETUP_GUIDE.md  api.md  api-generation.md  architecture.md  database.md  ml-models.md
```

**Unused data files:**
```
data/raw/random.csv
data/raw/randomdata.csv
data/raw/check list of international players.csv
data/statsbomb/compositions.json
data/statsbomb_compositions.json
data/players_data_light-2025_2026.csv    (duplicate)
data/raw/papaiboukebe.csv
data/raw/Jonathan Eduardo Cantillana Zorrilla.csv
```

### 📊 Data Available (Keep)

- `data/raw/nepalisquad.csv` — 12 Nepal squad players
- `data/raw/nepali player stats with role and gender.csv` — 101 Nepali players
- `data/players_data-2025_2026.csv` — 2780 European players (KNN training corpus)
- `data/events.csv` — 941k rows (reference only; never load fully)
- `data/processed/` — preprocessed match/player/team data

---

## Prerequisites (Before Session 1)

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install
cd services/ml-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Create environment files
cp backend/.env.example backend/.env
cp services/ml-service/.env.example services/ml-service/.env

# Configure .env files
# backend/.env: MONGODB_URI, REDIS_URL, JWT_SECRET
# services/ml-service/.env: MONGODB_URI, BACKEND_URL

# Start infrastructure (MongoDB + Redis only)
docker-compose up -d mongodb redis
```

---

## Session-by-Session Breakdown

### Session 1 — Cleanup + Data Seeding (2–3 hrs)

**Objective:** Delete clutter, populate MongoDB with real Nepali player data (ELO + cluster assignments).

**Files to Create:**
- `services/ml-service/scripts/seed_db.py`

**`seed_db.py` Implementation:**

```
1. Read CSV files
   - data/raw/nepalisquad.csv (12 players)
   - data/raw/nepali player stats with role and gender.csv (101 players)
   - Deduplicate by name

2. Calculate ELO ratings
   - Call bootstrap_from_career_stats(players) from elo_rating.py
   - Attach eloRating to each player dict

3. Cluster players (K-Means)
   - Train PlayerClusterer on data/players_data-2025_2026.csv
   - Column mapping: Gls→goals, Ast→assists, Min→minutes, Sh→defensiveActions, SoT→ballRecoveries, SoT%→passAccuracy
   - Predict cluster for each Nepali player
   - Attach roleClassification.cluster + primaryRole

4. Seed MongoDB
   - Upsert all 101 players (keyed on playerId, idempotent)
   - Seed 1 Team: { teamId: "nepal_national", name: "Nepal National Team", squad: [all 12 squad playerIds] }
   - Seed 1 Match: { matchId: "nep_ban_2025", homeTeam: "nepal_national", awayTeam: "bangladesh", status: "scheduled", date: "2025-08-15" }
   - Seed 1 User (admin): { email: "admin@fotnep.com", passwordHash: bcrypt("fotnep2025"), role: "admin" }

5. Verify
   - Log: "Seeded 101 players, 1 team, 1 match, 1 user"
   - Check: db.players.countDocuments() returns 101+
```

**Verify:**
```bash
python services/ml-service/scripts/seed_db.py
# Expected output: Seeded 101 players, 1 team, 1 match, 1 user
```

---

### Session 2 — ML Service Routes Wired to Models (2–3 hrs)

**Objective:** Replace all 5 hardcoded stub routes with real algorithmic calls.

**Files to Create:**
- `services/ml-service/utils/model_loader.py` — singleton module for model initialization

**`model_loader.py` Purpose:**
- Fit `NepaliPlayerComparator` once on European CSV at startup (avoids 2–3 second re-fit per request)
- Train `PlayerClusterer` once
- Export `get_comparator()`, `get_clusterer()`, `get_predictor()`, `get_optimizer()` functions
- Initialize in `main.py` lifespan startup block

**Modify `services/ml-service/main.py`:**
```python
from utils.model_loader import init_models

@app.on_event("startup")
async def startup():
    init_models()  # ~3 seconds, runs once
```

**Wire Routes:**

#### `routes/estimate.py` (Algorithm 1: KNN)
```
POST /api/v1/estimate-stats
Input: { player: { Player Name, Position, Caps, Goals, ... } }

Logic:
- Call get_comparator().find_similar_players(player_dict)
- Derive: xG = estimated_stats["G/Sh"] * estimated_stats["Sh"]
- Derive: xA = estimated_stats["Ast"]

Output: {
  xG: float,
  xA: float,
  similar_players: [{ name, position, goals, assists }, ...],
  estimated_stats: { Sh, SoT, G/Sh, ... }
}
```

#### `routes/predict.py` (Algorithms 3 & 4: Naive Bayes + ELO)
```
POST /api/v1/predict-match
Input: { home_team, away_team, formation: "4-3-3", is_neutral_venue: bool }

Logic:
- Fetch squad from MongoDB (motor async)
- Call LineupPredictor().predict_lineup(squad, formation, elo_ratings)
- Call get_predictor().predict(home_team, away_team, is_neutral)

Output: {
  lineup: { starters: [11 players], formation: "4-3-3" },
  match_outcome: {
    home_win: 0.52,
    draw: 0.27,
    away_win: 0.21,
    confidence: 0.68,
    narrative: "Nepal favoured on home turf..."
  }
}
```

#### `routes/cluster.py` (Algorithm 2: K-Means)
```
POST /api/v1/cluster-players
Input: { player_ids: [str] }

Logic:
- Fetch players from MongoDB
- Call get_clusterer().predict_multiple(stats_list)
- Group by cluster; identify synergy pairs (same cluster)

Output: {
  clusters: { 0: [names...], 1: [...], ... },
  synergy_pairs: [[p1, p2], [p2, p3], ...],
  cluster_labels: { 0: "Elite Forward", 1: "Defensive Midfielder", ... }
}
```

#### `routes/optimize.py` (Algorithm 5: Genetic Algorithm)
```
POST /api/v1/optimize-squad
Input: { players: [dict], formation: "4-3-3" }

Logic:
- Implement SquadOptimizer.optimize() body:
  ✓ _initialize_population: random 11-player samples per formation
  ✓ _run_evolution loop: select top 50% by fitness; crossover + mutate
  ✓ Return best-fitness individual
- (Helpers _calculate_fitness, _crossover, _mutate already exist)

Output: {
  bestXI: [11 player objects],
  formation: "4-3-3",
  fitness_score: 89.3,
  composition: { GK: 1, DEF: 4, MID: 3, FWD: 3 }
}
```

#### `routes/insights.py` (Rule-based)
```
POST /api/v1/generate-insights
Input: { player: dict }
Logic: Call InsightsEngine().generate_player_insights(player_data)

POST /api/v1/generate-narrative
Input: { prediction: dict, home_team: dict, away_team: dict }
Logic: Call InsightsEngine().generate_match_narrative(...)
```

**Verify:**
```bash
curl -X POST http://localhost:8000/api/v1/estimate-stats \
  -H "Content-Type: application/json" \
  -d '{"player": {"Player Name":"Anjan Bista","Position":"Left Winger / Forward","Caps":74,"Goals":13}}'
# Expected: real xG value + list of similar European players (NOT hardcoded 7.8)
```

---

### Session 3 — Backend Controllers Implemented (2–3 hrs)

**Objective:** All 6 Express controllers go from empty stubs to real MongoDB + ML service calls.

**Files to Create:**
- `backend/src/models/User.ts` — user schema with email, passwordHash, role
- `backend/src/services/mlIntegrationService.ts` — Axios wrapper for all 6 ML endpoints

**`mlIntegrationService.ts` Methods:**
```typescript
estimatePlayerStats(playerData: object): Promise<MLEstimateResponse>
predictMatch(homeTeam, awayTeam, formation): Promise<MLPredictResponse>
clusterPlayers(playerIds: string[]): Promise<MLClusterResponse>
optimizeSquad(players, formation): Promise<MLOptimizeResponse>
generateInsights(playerData): Promise<MLInsightResponse>
generateNarrative(prediction, homeTeam, awayTeam): Promise<MLNarrativeResponse>
```

- Use `process.env.ML_SERVICE_URL` from docker-compose
- 10-second timeout per request
- Log all errors via existing `logger` from `@utils/logger`

**Implement Controllers:**

#### `authController.ts`
```
registerUser():
- Check User.findOne({ email }) exists
- Hash password: bcryptjs.hash(password, 10)
- Create user: User.create({ email, passwordHash, name, role: 'viewer' })

loginUser():
- Find user by email
- Compare password: bcryptjs.compare(password, user.passwordHash)
- Sign JWT: jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
```

#### `playerController.ts`
```
getAllPlayers():
- Query: Player.find(filter).skip((page-1)*limit).limit(limit)
- Support filters: ?position=FWD, ?team=nepal_national
- Paginate results

getPlayerAnalytics():
- Fetch player from MongoDB
- Call: mlService.estimatePlayerStats(player) + generateInsights + clusterPlayers([id])
- Merge responses
- Cache: cacheSet('player:analytics:{id}', merged, 300) via backend/src/config/cache.ts
- Return { xG, xA, insights, cluster, role, similar_players }

comparePlayers():
- Fetch multiple players by ID array
- Call: mlService.clusterPlayers(playerIds)
- Extract synergy data from cluster response
```

#### `teamController.ts`
```
getTeamById():
- Query: Team.findOne({ teamId }).populate('squad')

getTeamAnalytics():
- Call: mlService.clusterPlayers(squad) for synergy
- Call: mlService.optimizeSquad(squadPlayers, "4-3-3") for best XI
- Return { squad, synergy, optimizedLineup }
```

#### `matchController.ts`
```
getMatchPrediction():
- Fetch match + both teams (populated)
- Call: mlService.predictMatch(homeTeam, awayTeam, "4-3-3")
- Save result to: match.prediction field
- Cache: cacheSet('match:prediction:{id}', result, 600)
- Return prediction object
```

#### `predictionController.ts`
```
getPredictionAccuracy():
- Query all completed matches from MongoDB
- Compare: prediction.homeWin > 0.5 → "H" vs actual result.homeGoals > awayGoals
- Calculate: { accuracy, correct, totalMatches }
```

**Verify:**
```bash
# Get auth token
TOKEN=$(curl -s -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fotnep.com","password":"fotnep2025"}' | jq -r '.token')

# Test players endpoint
curl -H "Authorization: Bearer $TOKEN" localhost:3000/api/v1/players
# Expected: array of 101+ players

# Test analytics (triggers KNN + ELO + insights from ML service)
curl -H "Authorization: Bearer $TOKEN" \
  localhost:3000/api/v1/players/anjan_bista/analytics
# Expected: { xG, xA, similar_players, insights, cluster, role }
```

---

### Session 4 — Frontend Core Pages (2–3 hrs)

**Objective:** Dashboard, Players, Teams, Matches all functional with real data.

**Fix First (Blocks Everything):**

`frontend/src/context/authContext.ts` — implement `login()` TODO:
```typescript
login: async (email, password) => {
  const response = await authAPI.login(email, password);
  set({
    token: response.data.token,
    user: { email },
    isAuthenticated: true
  });
  // Zustand persist middleware auto-saves to localStorage
}
```

**Implement Pages:**

#### `Dashboard.tsx`
```
Sections:
1. Stat cards (4 cards):
   - Total Players (fetch count from playerAPI.getAll())
   - Total Teams (fetch count from teamAPI.getAll())
   - Total Matches (fetch count from matchAPI.getAll())
   - Prediction Accuracy (fetch from /api/v1/predictions/accuracy)

2. Charts (Recharts):
   - BarChart: top 10 players by goals (vertical bars)
   - PieChart: position distribution (GK/DEF/MID/FWD percentages)

3. Algorithm badges row:
   KNN | K-Means | Naive Bayes | ELO | Genetic Algorithm
   (Helps examiners immediately see algorithm count)
```

#### `Players.tsx`
```
1. Table section:
   - Columns: Name | Position | Caps | Goals | ELO Rating | Role
   - Sorting: click header to sort by column
   - Filtering: ?position= dropdown (All, GK, DEF, MID, FWD)
   - Pagination: prev/next buttons, show 20 per page
   - Loading state: animate-pulse skeleton rows (Tailwind)

2. Detail panel (right side, on row click):
   - Player name, position, stats summary
   - RadarChart (Recharts): 5 axes
     * Goals, Assists, Caps, ELO Rating, xG
```

#### `Teams.tsx`
```
1. Team list:
   - Cards for each team (Nepal National, Bangladesh, etc.)
   - Click to load squad

2. Squad list (on click):
   - Table: Player Name | Position | Caps | Goals
   - Link to player detail
```

#### `Matches.tsx`
```
1. Match list table:
   - Columns: Date | Home | Away | Status | Score
   - Filter: ?status= (Scheduled, Completed, Live)
   - Pagination

2. Match detail panel (on row click):
   - Match info header (date, teams, venue)
   - Prediction probabilities (raw numbers; charts added in Session 5)
     * Home Win: 52%, Draw: 27%, Away Win: 21%
   - Predicted XI (from ML service lineup prediction)
```

**Verify:**
```bash
# Start frontend dev server
cd frontend && npm run dev
# Open http://localhost:3001

# Login with: admin@fotnep.com / fotnep2025
# Verify all 4 pages load without errors
# Verify data is real (101+ players visible, real stats)
```

---

### Session 5 — Analytics Visualisations (2–3 hrs)

**Objective:** Build 5 visualization components that showcase the algorithms.

**Create Components:**

#### `frontend/src/components/XGChart.tsx`
```
Props: { playerId: string }

Function:
- Fetch: playerAPI.getAnalytics(playerId)
- Display: BarChart (Recharts)
  * Actual goals (blue bar)
  * xG expected goals (orange bar)
- Below chart: list 3–5 KNN-matched European players
  * Name, position, goals, assists from similar_players response
```

#### `frontend/src/components/HeatmapCanvas.tsx`
```
Props: { playerId: string, position: string, role: string }

Function:
- getHeatZones(position, role): number[][] → 8×6 grid of weights (0–1)
  * GK: high weight at rows 0–1, cols 3–4 (goal area)
  * DEF: rows 1–3, spread cols 1–6
  * MID: rows 2–5, center cols 2–5
  * FWD: rows 4–7, center-right cols 3–5
  * Add noise: + Math.sin(playerId.charCodeAt(0) * i) * 0.15

- Render:
  * <canvas> 320×480 pixels
  * Paint: green (low weight) → red (high weight) gradient
  * useEffect: draw gradient based on grid weights
  * Overlay: pitch SVG (centre line, centre circle, penalty boxes ~20 lines)
```

#### `frontend/src/components/WinProbabilityBar.tsx`
```
Props: { homeWin: number, draw: number, awayWin: number, homeName, awayName, narrative: string }

Function:
- Three horizontally stacked <div>:
  * Blue section: width = homeWin * 100%
  * Grey section: width = draw * 100%
  * Red section: width = awayWin * 100%
- Below bars: narrative text from ML response
- Pure CSS, no chart library needed
```

#### `frontend/src/components/SynergyMatrix.tsx`
```
Props: { playerIds: string[] }

Function:
- Fetch: playerAPI.compare({ playerIds })
- Render: Grid of player pairs with cluster-based badges:
  * Same cluster → green "High Synergy"
  * Different cluster, same position → orange "Positional Rival"
  * Different cluster → grey "Low Synergy"
- Demonstrates K-Means algorithm visually to examiners
```

#### `frontend/src/components/LineupPitch.tsx`
```
Props: { lineup: Player[], formation: string }

Function:
- SVG pitch 400×600
- Formation coordinate map (pre-defined positions):
  * 4-3-3: GK at bottom, 4 DEF, 3 MID, 3 FWD
  * 4-4-2, 4-2-3-1, 3-5-2 (formation maps for other formations)
- Render player circles at formation positions:
  * GK = yellow circle
  * DEF = blue circle
  * MID = green circle
  * FWD = red circle
  * Name label below each circle
```

**Wire Into Pages:**

- **`Players.tsx` detail panel:**
  * Add `<XGChart playerId={selectedId} />`
  * Add `<HeatmapCanvas playerId={selectedId} position={player.position} role={player.roleClassification.primaryRole} />`

- **`Teams.tsx` detail:**
  * Fetch `teamAPI.getAnalytics(teamId)` → get `optimizedLineup.bestXI`
  * Add `<LineupPitch lineup={optimizedLineup.bestXI} formation="4-3-3" />`
  * Add `<SynergyMatrix playerIds={squad.map(p => p.playerId)} />`

- **`Matches.tsx` detail:**
  * Add `<WinProbabilityBar homeWin={prediction.home_win} draw={prediction.draw} awayWin={prediction.away_win} homeName={match.homeTeam.name} awayName={match.awayTeam.name} narrative={prediction.narrative} />`
  * Add formation selector `<select>` (4-3-3 | 4-4-2 | 4-2-3-1 | 3-5-2) that re-runs prediction on change

**Verify:**
```bash
# Navigate to Players page
# Click a player (e.g., Anjan Bista)
# Verify: xG chart displays, heatmap renders with position-based zones

# Navigate to Teams page
# Click Nepal National Team
# Verify: 4-3-3 pitch with 11 player circles, synergy matrix displays

# Navigate to Matches page
# Click Nepal vs Bangladesh match
# Verify: probability bar displays (52% / 27% / 21%), narrative visible
```

---

### Session 6 — Integration + Polish (2–3 hrs)

**Objective:** Full Docker integration, error handling, demo-ready.

**`docker-compose.yml` Update:**

Add volume mount so ML service can resolve European CSV path:
```yaml
ml-service:
  volumes:
    - ./services/ml-service:/app
    - ./data:/data          # Required: knn_comparator resolves ../data/players_data-2025_2026.csv
    - ml_models:/app/saved_models
```

**Error Handling:**

- All frontend API calls wrap in `try/catch`
- Show toast/alert on error
- If API returns 503: display "Backend starting up, please wait..."
- If ML service slow: show spinner on analytics panels (xG chart, heatmap loading state)

**Formation Selector (Matches.tsx):**

Add `<select>` dropdown:
```
<select onChange={(e) => refetchPrediction(e.target.value)}>
  <option value="4-3-3">4-3-3</option>
  <option value="4-4-2">4-4-2</option>
  <option value="4-2-3-1">4-2-3-1</option>
  <option value="3-5-2">3-5-2</option>
</select>
```

On change: call `/api/v1/predict-match` with new formation → LineupPredictor updates starting XI

**Dashboard Accuracy:**

Wire `GET /api/v1/predictions/accuracy` real data to the Prediction Accuracy stat card

**Full Integration Test:**

```bash
# Build and start all services
docker-compose up --build

# Wait ~30 seconds for all services healthy

# Seed database
docker exec fotnep-ml-service python scripts/seed_db.py
# Expected: "Seeded 101 players, 1 team, 1 match, 1 user"

# Open http://localhost:3001 in browser
# Login: admin@fotnep.com / fotnep2025

# Test flow:
# 1. Dashboard → verify algorithm badges visible, stat counts real
# 2. Players → Anjan Bista → verify xG chart (KNN) + heatmap renders
# 3. Teams → Nepal National → verify 4-3-3 pitch (GA) + synergy matrix (K-Means)
# 4. Matches → Nepal vs Bangladesh → verify probability bar (Naive Bayes) + narrative + formation selector works
```

**Checklist Before Demo:**

- [ ] All 101 Nepali players loaded in database
- [ ] Dashboard shows correct stat counts
- [ ] Players page loads and filters work
- [ ] Player detail shows real xG + heatmap
- [ ] Teams page shows Nepal squad
- [ ] Match prediction shows probabilities + narrative
- [ ] Formation selector works (changes lineup on selection)
- [ ] Algorithm badges visible on Dashboard (KNN, K-Means, Naive Bayes, ELO, Genetic)
- [ ] No console errors
- [ ] No broken images or styling

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser :3001                             │
│            React + TypeScript + Vite + Tailwind CSS              │
│                      + Recharts Charts                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard | Players | Teams | Matches             │   │
│  │ Components: XGChart | Heatmap | ProbabilityBar | Synergy │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬────────────────────────────────┘
                                │ Axios
                ┌───────────────▼───────────────┐
                │    Backend :3000              │
                │  Express + TypeScript         │
                │  + MongoDB + Redis            │
                │                               │
                │ Controllers (Auth, Player,    │
                │ Team, Match, Prediction,      │
                │ Insight)                      │
                └───────────────┬───────────────┘
                                │ Axios
                                │ ML_SERVICE_URL
                ┌───────────────▼───────────────┐
                │   ML Service :8000            │
                │   FastAPI + Python            │
                │                               │
                │ ├─ KNN                        │
                │ │  └─ xG + similarity         │
                │ │                             │
                │ ├─ K-Means                    │
                │ │  └─ synergy + roles         │
                │ │                             │
                │ ├─ Naive Bayes                │
                │ │  └─ probability + lineup    │
                │ │                             │
                │ ├─ ELO Rating                 │
                │ │  └─ player strength         │
                │ │                             │
                │ └─ Genetic Algorithm          │
                │    └─ optimal lineup          │
                └───────────────────────────────┘
```

---

## Key Reuse — Don't Rewrite These

| Function | Location | Purpose |
|----------|----------|---------|
| `bootstrap_from_career_stats()` | `services/ml-service/models/elo_rating.py` | Use in seed_db.py to assign ELO ratings |
| `InsightsEngine` class | `services/ml-service/services/insights_engine.py` | Fully implemented; import & call in routes |
| `cacheGet` / `cacheSet` / `cacheDelete` | `backend/src/config/cache.ts` | Use in controllers for analytics caching |
| `authenticateToken` middleware | `backend/src/middleware/auth.ts` | Already wired to all protected routes |
| `LineupPredictor` class | `services/ml-service/models/match_predictor.py` | Bayesian scorer; pass ELO ratings + squad |
| `NepaliPlayerComparator` fit | `services/ml-service/models/knn_comparator.py` | Fit once in model_loader.py, cache in module var |

---

## Common Pitfalls to Avoid

1. **KNN warm-up time:** `NepaliPlayerComparator.fit()` on 2780 rows takes 2–3 seconds. Do NOT fit per-request. Call once in `model_loader.py` lifespan startup.

2. **PlayerClusterer feature mismatch:** European CSV doesn't have all required columns by name. Map in seed_db.py:
   - `Sh` → defensiveActions
   - `SoT` → ballRecoveries
   - `Ast` → keyPasses
   - `SoT%` → passAccuracy
   - Default missing values to 0

3. **Heatmap data:** No positional tracking data exists for Nepali players. Do NOT try to use events.csv as a "reference" — that's European data and would misrepresent Nepali players. Use synthetic position-based zones instead.

4. **JWT on unprotected routes:** `/api/v1/auth/login` and `/api/v1/auth/register` should NOT require JWT. Seed script calls MongoDB directly, bypassing Express.

5. **Genetic Algorithm TODO:** Only the `optimize()` loop scaffold is TODO. Helper methods `_initialize_population`, `_calculate_fitness`, `_crossover`, `_mutate` are already fully implemented. Don't rewrite them.

---

## File Structure Reference

```
fotnep/
├── IMPLEMENTATION_PLAN.md          ← You are here
├── docker-compose.yml
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.ts                (Express app entry)
│   │   ├── config/
│   │   │   ├── database.ts         (MongoDB)
│   │   │   └── cache.ts            (Redis helpers)
│   │   ├── middleware/
│   │   │   ├── auth.ts             (JWT authenticateToken)
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── Player.ts
│   │   │   ├── Team.ts
│   │   │   ├── Match.ts
│   │   │   └── User.ts             (Session 3: create)
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── playerController.ts
│   │   │   ├── teamController.ts
│   │   │   ├── matchController.ts
│   │   │   ├── predictionController.ts
│   │   │   └── insightController.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── players.ts
│   │   │   ├── teams.ts
│   │   │   ├── matches.ts
│   │   │   ├── predictions.ts
│   │   │   └── insights.ts
│   │   ├── services/
│   │   │   └── mlIntegrationService.ts (Session 3: create)
│   │   └── utils/
│   │       └── logger.ts            (Winston)
│   └── dist/                        (compiled output)
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx                (React entry)
│   │   ├── App.tsx                 (Router setup)
│   │   ├── pages/
│   │   │   ├── Login.tsx            (done)
│   │   │   ├── Dashboard.tsx        (Session 4)
│   │   │   ├── Players.tsx          (Session 4)
│   │   │   ├── Teams.tsx            (Session 4)
│   │   │   └── Matches.tsx          (Session 4)
│   │   ├── components/
│   │   │   ├── Navbar.tsx           (done)
│   │   │   ├── XGChart.tsx          (Session 5)
│   │   │   ├── HeatmapCanvas.tsx    (Session 5)
│   │   │   ├── WinProbabilityBar.tsx (Session 5)
│   │   │   ├── SynergyMatrix.tsx    (Session 5)
│   │   │   └── LineupPitch.tsx      (Session 5)
│   │   ├── context/
│   │   │   └── authContext.ts       (Session 4: fix login() TODO)
│   │   ├── services/
│   │   │   └── api.ts              (Axios instance)
│   │   └── styles/
│   │       └── index.css            (Tailwind directives)
│   └── dist/                        (build output)
│
├── services/ml-service/
│   ├── main.py                      (FastAPI app)
│   ├── requirements.txt
│   ├── models/
│   │   ├── elo_rating.py            (done)
│   │   ├── knn_comparator.py        (done)
│   │   ├── knn_estimator.py         (done)
│   │   ├── match_predictor.py       (done)
│   │   ├── player_clusterer.py      (done)
│   │   └── genetic_optimizer.py     (Session 2: implement optimize() body)
│   ├── services/
│   │   └── insights_engine.py       (done)
│   ├── routes/
│   │   ├── estimate.py              (Session 2: wire KNN)
│   │   ├── predict.py               (Session 2: wire Naive Bayes + ELO)
│   │   ├── cluster.py               (Session 2: wire K-Means)
│   │   ├── optimize.py              (Session 2: wire Genetic Algo)
│   │   └── insights.py              (Session 2: wire InsightsEngine)
│   ├── utils/
│   │   └── model_loader.py          (Session 2: create)
│   ├── scripts/
│   │   └── seed_db.py               (Session 1: create)
│   └── saved_models/                (joblib model cache)
│
├── data/
│   ├── raw/
│   │   ├── nepalisquad.csv          (12 players, keep)
│   │   └── nepali player stats...csv (101 players, keep)
│   ├── players_data-2025_2026.csv   (2780 EUR players, keep)
│   ├── events.csv                   (941k rows, keep)
│   └── processed/                   (keep)
│
└── docker/
    ├── Dockerfile.backend
    └── Dockerfile.ml-service
```

---

## Success Criteria (Demo Checklist)

### Session 1 ✓
- [ ] All 18 root-level doc files deleted
- [ ] 8 unused data files deleted
- [ ] `seed_db.py` runs without errors
- [ ] 101 players in MongoDB with ELO + clusters
- [ ] 1 team (Nepal National) seeded
- [ ] 1 match seeded
- [ ] 1 admin user seeded

### Session 2 ✓
- [ ] `model_loader.py` initializes all models at startup (~3 seconds)
- [ ] `/api/v1/estimate-stats` returns real xG (not 7.8 hardcoded)
- [ ] `/api/v1/predict-match` returns real probabilities + real lineup
- [ ] `/api/v1/cluster-players` returns synergy data (K-Means)
- [ ] `/api/v1/optimize-squad` returns best XI (Genetic Algorithm)
- [ ] `SquadOptimizer.optimize()` body implemented

### Session 3 ✓
- [ ] `User.ts` model created
- [ ] `mlIntegrationService.ts` wraps all 6 ML endpoints
- [ ] `authController.loginUser()` hashes + signs JWT
- [ ] `playerController.getPlayerAnalytics()` merges ML data + caches
- [ ] `teamController.getTeamAnalytics()` returns synergy + best XI
- [ ] `matchController.getMatchPrediction()` returns real probabilities
- [ ] All endpoints callable with JWT

### Session 4 ✓
- [ ] `authContext.ts` `login()` implemented; token saved to localStorage
- [ ] Dashboard loads: stat cards, bar chart, pie chart, algorithm badges
- [ ] Players page loads: table, filter, detail panel with RadarChart
- [ ] Teams page loads: team cards, squad list
- [ ] Matches page loads: match table, detail panel

### Session 5 ✓
- [ ] XGChart renders: actual vs xG (BarChart) + similar players list
- [ ] HeatmapCanvas renders: position-based gradient (green→red) + pitch overlay
- [ ] WinProbabilityBar renders: 3 sections (blue/grey/red) + narrative
- [ ] SynergyMatrix renders: cluster-based badges
- [ ] LineupPitch renders: 4-3-3 pitch + 11 coloured player circles
- [ ] All components wired into pages correctly

### Session 6 ✓
- [ ] Docker Compose runs all services without error
- [ ] `docker-compose up --build` completes in < 2 min
- [ ] ML service resolves `data/players_data-2025_2026.csv` via volume mount
- [ ] Formation selector on Matches page works (re-runs prediction)
- [ ] Error handling: 503 shows "Backend starting up..."
- [ ] Full end-to-end test passes: login → Dashboard → Players → Teams → Matches

---

## Quick Start Commands

```bash
# Prerequisites (one-time)
cd backend && npm install
cd ../frontend && npm install
cd ../services/ml-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Session 1 (Seed data)
python services/ml-service/scripts/seed_db.py

# Start all services (Sessions 2+)
docker-compose up --build

# Frontend dev server
cd frontend && npm run dev
# Open http://localhost:3001

# Test backend
curl -X POST localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fotnep.com","password":"fotnep2025"}'

# Test ML service
curl -X POST localhost:8000/api/v1/estimate-stats \
  -H "Content-Type: application/json" \
  -d '{"player": {"Player Name":"Anjan Bista","Position":"Left Winger / Forward","Caps":74,"Goals":13}}'
```

---

## Contact / Questions

Refer to this plan file throughout the implementation. Each session builds on the prior, so follow the session order.

**Happy coding!** ⚽
