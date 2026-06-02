# Claude Developer Checklist

**Purpose:** Step-by-step guide for autonomous development  
**Read First:** IMPLEMENTATION_PLAN.md, then this checklist  
**Time Estimate:** ~4-6 hours per service (depends on parallelization)

---

## Pre-Development Checklist ✅

- [ ] Read `IMPLEMENTATION_PLAN.md` completely
- [ ] Read `CLAUDE.md` for project context
- [ ] Read `backend/openapi.yaml` to understand all API endpoints
- [ ] Read `backend/BACKEND.md` for backend architecture
- [ ] Read `services/ml-service/ML_SERVICE.md` for algorithms
- [ ] Read `frontend/FRONTEND.md` for UI design
- [ ] Have MongoDB URI ready (ask user if not provided)
- [ ] Review position normalization table in IMPLEMENTATION_PLAN.md
- [ ] Review player stats calculation formula in IMPLEMENTATION_PLAN.md

---

## Step 1: Backend Development (Priority 1)

**Estimated Time:** 3-4 hours  
**When Complete:** Backend runs on http://localhost:3000, accepts requests

### 1.1 Project Setup
- [ ] Create `backend/` directory structure from `BACKEND.md`
- [ ] Create `package.json` with dependencies:
  - express, typescript, ts-node, bcrypt, jsonwebtoken, mongoose, cors
  - Dev: @types/node, @types/express, jest, ts-jest, supertest, nodemon
- [ ] Create `tsconfig.json`
- [ ] Create `.env` file with MongoDB URI + JWT secret (ask user if missing)
- [ ] Create `.env.test` file for test database

### 1.2 Database Connection
- [ ] Create `src/config/database.ts` — MongoDB connection setup
- [ ] Create `src/config/environment.ts` — Load env vars
- [ ] Test connection: `npm run dev` should connect without errors

### 1.3 MongoDB Schemas
- [ ] Create `src/models/User.ts` — User schema
- [ ] Create `src/models/Player.ts` — Player schema (with nested position)
- [ ] Create `src/models/Team.ts` — Team schema
- [ ] Create `src/models/Match.ts` — Match schema
- [ ] Create `src/models/Vote.ts` — Vote schema
- [ ] Create `src/models/Prediction.ts` — Prediction schema
- [ ] Create `src/models/index.ts` — Export all models
- [ ] Verify all schemas with types matching `openapi.yaml`

### 1.4 Middleware
- [ ] Create `src/middleware/authMiddleware.ts` — JWT validation
- [ ] Create `src/middleware/errorHandler.ts` — Centralized error handling
- [ ] Create `src/middleware/requestLogger.ts` — Request logging (optional)
- [ ] Test middleware with dummy route

### 1.5 Auth Controller & Routes
- [ ] Create `src/controllers/authController.ts`:
  - `login(email, password)` → JWT + User
  - `register(email, password, name)` → JWT + User
  - `validateToken(token)` → User
- [ ] Create `src/routes/auth.ts` — Route definitions
- [ ] Test with Postman/curl:
  - POST /auth/register → new user
  - POST /auth/login → token
  - GET /auth/validate + token → user data

### 1.6 Player Controller & Routes
- [ ] Create `src/controllers/playerController.ts`:
  - `listPlayers(position, search, sortBy, limit, offset)` → Player[]
  - `getPlayer(id)` → Player
  - `getPlayerStats(id)` → Player with predicted stats
  - `createPlayer(data)` → Player (for seeding)
- [ ] Create `src/routes/players.ts` — Route definitions
- [ ] Test all endpoints

### 1.7 Team, Match, Vote Controllers
- [ ] Create `src/controllers/teamController.ts` (teamController, getTeamLineup)
- [ ] Create `src/controllers/matchController.ts` (listMatches, getMatch, getLineups, completeMatch)
- [ ] Create `src/controllers/voteController.ts` (submitVote, getVotes, getLeaderboard)
- [ ] Create corresponding route files
- [ ] Test all endpoints

### 1.8 Prediction & Comparison Controllers
- [ ] Create `src/controllers/predictionController.ts` (predictMatch endpoint)
- [ ] Create `src/controllers/comparisonController.ts` (comparePlayer endpoint)
- [ ] Create `src/controllers/squadController.ts` (optimizeSquad endpoint)
- [ ] Create corresponding route files
- [ ] **Important:** These call ML Service via HTTP — Mock in tests, integrate after ML service runs
- [ ] Test endpoint structure (don't call actual ML service yet)

### 1.9 ML Service Integration
- [ ] Create `src/services/mlIntegration.ts`:
  - `callMLService(endpoint, payload)` → Response
  - `predictMatch(matchId, votes)` → calls `/predict-match`
  - `comparePlayer(playerAId, playerBId)` → calls `/compare-players`
  - `optimizeSquad(teamId, availablePlayerIds, ...)` → calls `/optimize-squad`
  - Error handling for timeouts/failures
- [ ] Create `src/services/reputationEngine.ts`:
  - `calculateReputation(userId)` → accuracy-based reputation (0-100)
  - Update reputation when vote is resolved

### 1.10 Express App Setup
- [ ] Create `src/index.ts` — Main app setup:
  - Initialize Express
  - Connect MongoDB
  - Register all middleware
  - Register all routes (auth, players, teams, matches, votes, predictions, comparisons, squad)
  - Start server on PORT
- [ ] Verify app starts: `npm run dev` → "Server running on :3000"

### 1.11 Testing
- [ ] Create `src/__tests__/auth.test.ts` — Auth endpoint tests
- [ ] Create `src/__tests__/players.test.ts` — Player endpoint tests
- [ ] Create `jest.config.js` configuration
- [ ] Run tests: `npm test` → All pass ✅

### 1.12 Verification
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts server on :3000
- [ ] Backend responds to requests (use Postman or curl)
- [ ] Error handling works (try invalid token, missing fields)
- [ ] **Commit**: "Backend scaffold complete"

---

## Step 2: ML Service Development (Priority 2)

**Estimated Time:** 3-4 hours  
**Dependency:** MongoDB must be seeded with player data  
**When Complete:** ML Service runs on http://localhost:8000, algorithms work

### 2.1 Project Setup
- [ ] Create `services/ml-service/` directory structure
- [ ] Create `requirements.txt` with dependencies:
  - fastapi, uvicorn, pymongo, scikit-learn, numpy, pandas
- [ ] Create `.env` file with MongoDB URI
- [ ] Create `venv` and install dependencies

### 2.2 Data Processing
- [ ] Create `scripts/data_processor.py`:
  - `load_nepali_players(csv_path)` — Load from `/data/raw/nepalisquad.csv`
  - `load_role_gender(csv_path)` — Load from `/data/raw/nepali player stats with role and gender.csv`
  - `merge_player_data(nepali, roles)` — Join on Player Name
  - `normalize_position(role_string)` → {primaryPosition, subPosition}
  - `calculate_player_stats(player)` — Apply formula from IMPLEMENTATION_PLAN.md
  - `save_consolidated_csv(players, path)` — Save to `/data/raw/consolidated_nepali_players.csv`

### 2.3 Database Seeding
- [ ] Create `scripts/seed_db.py`:
  - Load consolidated player CSV
  - Calculate initial ELO ratings (start at 1600, vary by position)
  - Create sample teams (2-3 Nepali teams)
  - Assign players to teams
  - Create sample matches (5-10)
  - Create sample users (5)
  - Insert all to MongoDB
  - Print confirmation: "✓ 102 players seeded"
- [ ] **Run once:** `python scripts/seed_db.py` (after backend is running)
- [ ] Verify in MongoDB: `db.players.countDocuments()` → 102

### 2.4 Model Training & Caching
- [ ] Create `config/model_loader.py` — Singleton pattern:
  - Load pre-trained/default models on init
  - Cache in memory
  - Provide `get(model_name)` method
- [ ] Create `models/knn_model.py` — KNN implementation
- [ ] Create `models/kmeans_model.py` — K-Means clustering
- [ ] Create `models/elo_model.py` — ELO rating system
- [ ] Create pickle files for caching (if pre-training)

### 2.5 Algorithm 1: Consensus Prediction
- [ ] Create `models/consensus.py`:
  - `predict_match(match_id, votes)` — See spec in ML_SERVICE.md
  - Input: {matchId, votes[]}
  - Output: {matchId, prediction{homeWinProb, drawProb, awayWinProb}, confidence, voteBreakdown}
- [ ] Test with sample votes

### 2.6 Algorithm 2: Player Estimator
- [ ] Create `models/player_estimator.py`:
  - `compare_players(player_a_id, player_b_id)` — See spec in ML_SERVICE.md
  - Use KNN to fill missing stats
  - Calculate cosine similarity
  - Generate attribute comparison
  - Output: {playerA, playerB, similarityScore, attributeComparison, ...}
- [ ] Test with 2 real players from seeded DB

### 2.7 Algorithm 3: Squad Optimizer
- [ ] Create `models/genetic_algorithm.py` — Genetic algorithm for lineups
- [ ] Create `models/squad_optimizer.py`:
  - `optimize_squad(team_id, available_players, formation, constraints)` — See spec
  - Use K-Means for position clustering
  - Use Genetic Algorithm to evolve lineups
  - Calculate fitness (history + chemistry + strength)
  - Output: {teamId, startingXI, bench, formation, confidence, tacticalInsights}
- [ ] Test with sample team data

### 2.8 FastAPI Routes
- [ ] Create `main.py`:
  - POST `/predict-match` → calls consensus.predict_match()
  - POST `/compare-players` → calls player_estimator.compare_players()
  - POST `/optimize-squad` → calls squad_optimizer.optimize_squad()
  - Add error handling, logging
  - Swagger docs at `/docs`

### 2.9 Testing
- [ ] Create `tests/test_consensus.py` — Consensus tests
- [ ] Create `tests/test_player_estimator.py` — Player estimator tests
- [ ] Create `tests/test_squad_optimizer.py` — Squad optimizer tests
- [ ] Run: `pytest` → All pass ✅

### 2.10 Verification
- [ ] `python -m uvicorn main:app --reload` starts on :8000
- [ ] Visit http://localhost:8000/docs → Swagger UI loads
- [ ] Test POST /predict-match with sample data
- [ ] Test POST /compare-players with sample data
- [ ] Test POST /optimize-squad with sample data
- [ ] Response times acceptable (<2 sec per algorithm)
- [ ] **Commit**: "ML service complete with all 3 algorithms"

---

## Step 3: Frontend Development (Priority 3)

**Estimated Time:** 3-4 hours  
**Dependency:** Backend must be running on :3000  
**When Complete:** Frontend runs on http://localhost:3001, all pages render

### 3.1 Project Setup
- [ ] Create `frontend/` directory structure
- [ ] Create `package.json` with dependencies:
  - react, react-dom, react-router-dom, typescript, vite, @vitejs/plugin-react
  - @hey-api/openapi-ts (for code generation)
  - tailwind, autoprefixer, axios
  - Dev: vitest, @testing-library/react, @types/node
- [ ] Create `tsconfig.json`
- [ ] Create `.env.local` with VITE_API_BASE_URL=http://localhost:3000/api/v1
- [ ] Create `tailwind.config.ts` (see FRONTEND.md for theme)

### 3.2 OpenAPI Type Generation
- [ ] Run `npm run gen:api` to generate types from `backend/openapi.yaml`
- [ ] Verify `/src/gen/` directory created with:
  - `types.ts` — All API types
  - `services/` — API client methods
- [ ] Import types in components as needed

### 3.3 API Client
- [ ] Create `src/services/api.ts` — HTTP client:
  - axios instance with base URL
  - Auto-add Authorization header (JWT from localStorage)
  - Error handling
  - Token refresh on 401 (optional)
- [ ] Create `src/hooks/useApi.ts` — Generic hook for API calls
- [ ] Test with dummy fetch

### 3.4 Auth Context & Hooks
- [ ] Create `src/context/authContext.ts`:
  - User state, token state
  - `login(email, password)` → stores token, redirects to /dashboard
  - `logout()` → clears token, redirects to /login
  - `isAuthenticated` flag
- [ ] Create `src/hooks/useAuth.ts` — Consume auth context
- [ ] Test login/logout flows

### 3.5 Routing Setup
- [ ] Create `src/App.tsx` — Root component with routes:
  - `/login` → Login.tsx (public)
  - `/dashboard` → Dashboard.tsx (protected)
  - `/players` → Players.tsx (protected)
  - `/teams` → Teams.tsx (protected)
  - `/matches` → Matches.tsx (protected)
  - `/*` → NotFound.tsx
  - Redirect `/` → `/dashboard` if auth, else `/login`
- [ ] Create `src/pages/NotFound.tsx`
- [ ] Test routing (navigate between pages)

### 3.6 Login Page
- [ ] Create `src/pages/Login.tsx`:
  - Email + password form
  - Submit → `useAuth().login(email, password)`
  - Error display on 401
  - Loading spinner while authenticating
- [ ] Create `src/components/Forms/LoginForm.tsx` (if separating form)
- [ ] Test login flow with real backend

### 3.7 Layout Components
- [ ] Create `src/components/Layout/Header.tsx`:
  - Navigation links (Dashboard, Players, Teams, Matches)
  - User profile dropdown
  - Logout button
- [ ] Create `src/components/Layout/Sidebar.tsx` (optional for MatchFeed)
- [ ] Apply design system colors (emerald, Nepal red)

### 3.8 Dashboard Page
- [ ] Create `src/pages/Dashboard.tsx`:
  - Display overall stats (total players, teams, matches)
  - Show 3 algorithm overview cards
  - Recent predictions list
  - Top voted players
- [ ] Create supporting components as needed
- [ ] Test data fetching

### 3.9 Players Page
- [ ] Create `src/pages/Players.tsx`:
  - Table/card list of players
  - Filters: position dropdown, search bar
  - Sort options: eloRating (default), appearances, goals, assists
  - Click row → show detail panel
- [ ] Create `src/components/Player/PlayerTable.tsx`
- [ ] Create `src/components/Player/PlayerCard.tsx`
- [ ] Create `src/components/Player/PlayerStats.tsx` (detail panel)
- [ ] Test filtering and sorting

### 3.10 Teams Page
- [ ] Create `src/pages/Teams.tsx`:
  - Cards for each team
  - Display team name, country, players count
  - Click to see full squad
- [ ] Create `src/components/Team/TeamCard.tsx`
- [ ] Create `src/components/Team/LineupBuilder.tsx` (Algorithm 3 UI)
  - Input: formation dropdown, constraints
  - Button: "Optimize Lineup"
  - Output: Starting XI on pitch diagram
  - Display confidence, tactical insights
- [ ] Test team listing

### 3.11 Matches Page
- [ ] Create `src/pages/Matches.tsx`:
  - List matches (upcoming, live, completed)
  - Each match card shows: teams, date, venue, status
  - If Algorithm 1 prediction available, show probability
  - If status = upcoming, show voting widget
- [ ] Create `src/components/Match/MatchCard.tsx`
- [ ] Create `src/components/Match/MatchDetails.tsx` (expanded view)
- [ ] Create `src/components/Match/MatchVoting.tsx` (Algorithm 1 UI):
  - Radio buttons: home_win, draw, away_win
  - Submit button
  - Display current vote breakdown
  - Display current prediction (if available)
  - POST /votes, then GET /predict-match
- [ ] Test voting and prediction display

### 3.12 Algorithm UI Components
- [ ] Create `src/components/Player/PlayerComparison.tsx` (Algorithm 2):
  - Dropdowns to select 2 players
  - Button: "Compare"
  - Display: side-by-side stats, similarity score
  - Show tactical pairing insights
  - Call POST `/compare-players`
- [ ] Test comparison

### 3.13 Styling & Design System
- [ ] Create `src/styles/index.css`:
  - Card utility class
  - Button utilities (.btn-primary emerald, .btn-secondary gray)
  - Input utilities with emerald focus
  - Badge utilities for positions
  - Table utilities
  - Text-stat utility (monospace for numbers)
- [ ] Apply colors from CLAUDE.md design section
- [ ] No dark mode anywhere
- [ ] Test responsive design (mobile, tablet, desktop)

### 3.14 Error Handling & Loading
- [ ] Create `src/components/Common/ErrorBoundary.tsx`
- [ ] Create `src/components/Common/ErrorMessage.tsx`
- [ ] Create `src/components/Common/LoadingSpinner.tsx`
- [ ] Wrap pages with error boundaries
- [ ] Show loading spinners during API calls
- [ ] Test error scenarios (invalid token, network error)

### 3.15 Testing
- [ ] Create `src/__tests__/LoginPage.test.tsx` — Login flow
- [ ] Create `src/__tests__/PlayersPage.test.tsx` — Player list
- [ ] Create `vitest.config.ts` configuration
- [ ] Run tests: `npm test` → All pass ✅

### 3.16 Verification
- [ ] `npm run dev` starts on :3001
- [ ] Frontend loads and shows Login page
- [ ] Can login with `admin@fotnep.com / fotnep2025` (after seeding)
- [ ] Redirects to Dashboard
- [ ] Can navigate all pages
- [ ] Can see players, teams, matches from backend
- [ ] Can vote on matches
- [ ] Can compare players
- [ ] Can optimize lineups
- [ ] No console errors
- [ ] `npm run build` succeeds
- [ ] **Commit**: "Frontend complete with all pages and algorithms"

---

## Final Verification Checklist

After all 3 services complete:

- [ ] **Backend**
  - [ ] `npm run dev` runs on :3000
  - [ ] Can call all endpoints with valid JWT
  - [ ] Error handling works
  - [ ] All tests pass

- [ ] **ML Service**
  - [ ] `python -m uvicorn main:app --reload` runs on :8000
  - [ ] Swagger UI loads at /docs
  - [ ] All 3 algorithms respond correctly
  - [ ] All tests pass

- [ ] **Frontend**
  - [ ] `npm run dev` runs on :3001
  - [ ] Login works
  - [ ] All pages render
  - [ ] Can interact with all 3 algorithms
  - [ ] No console errors
  - [ ] All tests pass

- [ ] **Integration**
  - [ ] Run `bash START.sh` from root → all 3 start together
  - [ ] Frontend successfully calls backend
  - [ ] Backend successfully calls ML service
  - [ ] End-to-end flows work (login → predict → compare → optimize)
  - [ ] Use `/verify` skill to test in real browser

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `MONGO_URI not found` | Create `.env` with MongoDB connection string |
| `Cannot call ML service` | Ensure ML service is running on :8000 |
| `Unauthorized 401` | Check JWT token in request header |
| `Player stats missing` | Run `python scripts/seed_db.py` to populate database |
| `Build fails` | Check TypeScript errors with `npm run type-check` |
| `Tests failing` | Ensure test database is separate from dev database |

---

## Quick Commands Reference

```bash
# Backend
cd backend
npm install
npm run dev           # Start dev server
npm test             # Run tests
npm run build        # Build for production

# ML Service
cd services/ml-service
pip install -r requirements.txt
python -m uvicorn main:app --reload  # Start dev server
python -m pytest                       # Run tests
python scripts/seed_db.py             # Seed database

# Frontend
cd frontend
npm install
npm run gen:api      # Generate types from OpenAPI
npm run dev          # Start Vite dev server
npm test             # Run tests
npm run build        # Build for production
```

---

## Done! 🎉

All services complete and integrated. The FotNep platform is ready for demo.

**Total development time:** ~10-12 hours (can be parallelized)
