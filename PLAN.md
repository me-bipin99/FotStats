# FotNep — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **ALWAYS READ THIS FILE AT THE START OF EVERY SESSION** before touching any code.

**Goal:** Connect a complete Nepali football analytics platform — React frontend → Express backend → FastAPI ML service → MongoDB — with all 3 ML algorithms working end-to-end.

**Architecture:** Single MongoDB as source of truth; Express backend on :3001 (dev) serves REST API; FastAPI ML service on :8000 handles algorithm execution; React Vite frontend on :3000 calls Express via typed HTTP client.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 · Express.js + TypeScript + Mongoose · FastAPI + Python + scikit-learn · MongoDB

---

## Quick Reference — Dev Startup

```bash
# Terminal 1 — MongoDB (if local)
mongod

# Terminal 2 — All services in one command (from repo root)
npm run dev   # starts backend :3001 + ML :8000 + frontend :3000

# Or individually:
# cd backend && PORT=3001 npm run dev
# cd services/ml-service && venv/bin/python -m uvicorn main:app --reload --port 8000
# cd frontend && npm run dev
```

---

## Current State Snapshot

### ✅ Done

| Layer | File/Area | Status |
| --- | --- | --- |
| Backend | `index.ts` — all 8 routes mounted | ✅ Done |
| Backend | `authController.ts` — login + register | ✅ Done |
| Backend | `playerController.ts` — list + get | ✅ Done |
| Backend | `teamController.ts` — list + get + lineup | ✅ Done |
| Backend | `matchController.ts` — list + get + lineups + create + update | ✅ Done |
| Backend | `voteController.ts` — castVote + getMatchVotes + leaderboard | ✅ Done |
| Backend | `predictionController.ts` — trigger + get + compare proxy + squad proxy | ✅ Done |
| Backend | All 8 route files created | ✅ Done |
| Backend | `models/User.ts` — role field (admin/user) | ✅ Done |
| Backend | `backend/.env` | ✅ Done |
| ML Service | `main.py` — all 3 routers registered | ✅ Done |
| ML Service | `consensus.py` — Algorithm 1 (reputation-weighted voting) | ✅ Done |
| ML Service | `player_estimator.py` — Algorithm 2 (cosine similarity) | ✅ Done |
| ML Service | `squad_optimizer.py` — Algorithm 3 (ELO greedy + GA stub) | ✅ Done |
| ML Service | `services/ml-service/.env` | ✅ Done |
| Frontend | `services/api.ts` — full typed HTTP client | ✅ Done |
| Frontend | `context/AuthContext.tsx` — JWT login/register/logout | ✅ Done |
| Frontend | `main.tsx` — wrapped with `<AuthProvider>` | ✅ Done |
| Frontend | `App.tsx` — fetches matches from API | ✅ Done |
| Frontend | `Header.tsx` — real JWT auth via `useAuth()` | ✅ Done |
| Frontend | `MatchDetails.tsx` — voting + Algorithm 1 prediction | ✅ Done |
| Frontend | `PlayerStats.tsx` — live player search + debounce | ✅ Done |
| Frontend | `PlayerComparison.tsx` — Algorithm 2 UI | ✅ Done |
| Frontend | `LineupBuilder.tsx` — Algorithm 3 UI | ✅ Done |
| Frontend | `mockData.ts` — zero imports confirmed (ready to delete) | ✅ Verified |
| Database | Seed data in MongoDB | ✅ Done (3086 players, 19 teams, 24 matches — all lineups predicted) |

### ❌ Not Yet Implemented

| Layer | File/Area | Status | Phase |
| --- | --- | --- | --- |
| Backend | `authController.ts` — `GET /auth/me` endpoint | ✅ Done | Phase 5.2 |
| Backend | `index.ts` — rate limiting on auth routes | ✅ Done | Phase 6 |
| Backend | `matchController.ts` — `resolveMatch()` endpoint | ✅ Done | Phase 9 |
| Frontend | `context/AuthContext.tsx` — JWT restore on page refresh | ✅ Done | Phase 5.1 |
| Frontend | `data/mockData.ts` — file deletion | ✅ Done | Phase 8.1 |
| Verification | E2E browser smoke test (all 3 algorithms) | ✅ Done (3 bugs found) | Phase 4 |
| Backend | `playerController.ts` — add `source` filter to `listPlayers` | ✅ Done | Phase 4-fix |
| Frontend | `LineupBuilder.tsx` — pass `source:'nepali'` to `getPlayers` | ✅ Done | Phase 4-fix |
| Frontend | `MatchDetails.tsx` — restore `userVote` on reload from API | ✅ Done | Phase 4-fix |
| Frontend | `MatchDetails.tsx` — auto-trigger `triggerPrediction()` after vote | ✅ Done | Phase 4-fix |
| Builds | `npm run build` frontend + backend | ❌ Not verified | Phase 7 |

---

## Phase 1 — Environment Setup (BLOCKER — must do first)

> Nothing runs without these. `.env` files are gitignored so they must be created manually.

### Task 1.1: Create backend/.env

**File:** `backend/.env` (create from example)

- [x] **Step 1: Copy the example**


  ```bash
  cp backend/.env.example backend/.env

  ```

- [x] **Step 2: Fill in values** — open `backend/.env` and set:

  ```env
  PORT=3001
  MONGO_URI=mongodb://localhost:27017/fotnep1
  JWT_SECRET=fotnep_dev_secret_change_in_prod
  JWT_EXPIRY=7d
  ML_SERVICE_URL=http://localhost:8000
  ```

- [ ] **Step 3: Verify backend starts**

  ```bash
  cd backend && PORT=3001 npm run dev
  ```

  Expected output: `Backend running on http://localhost:3001`

---

### Task 1.2: Create ML service/.env

**File:** `services/ml-service/.env` (create from example)

- [x] **Step 1: Copy the example**

  ```bash
  cp services/ml-service/.env.example services/ml-service/.env

  ```

- [x] **Step 2: Fill in values** — open `services/ml-service/.env` and set:

  ```
  MONGO_URI=mongodb://localhost:27017/fotnep1

  ```

- [ ] **Step 3: Verify ML service starts**

  ```bash
  cd services/ml-service && source venv/bin/activate
  python -m uvicorn main:app --reload --port 8000

  ```
  Expected output: `Application startup complete.`

---

## Phase 2 — Database Seeding

> Seeds 102 Nepali players + 2780 European players + demo teams + demo matches + demo users.

### Task 2.1: Seed the database

**File:** `services/ml-service/scripts/seed_db.py` (already written — just run it)

- [x] **Step 1: Activate venv and seed**

  ```bash
  cd services/ml-service && source venv/bin/activate
  python scripts/seed_db.py

  ```
  Seeded: 2879 players (100 Nepali + 2779 European), 8 teams, 8 matches, 2 users.

- [ ] **Step 2: Verify data via curl** (backend must be running)

  ```bash
  curl -s http://localhost:3001/api/v1/matches | python3 -m json.tool | head -30

  ```
  Expected: JSON with `matches` array containing seeded match data.

- [ ] **Step 3: Verify players**

  ```bash
  curl -s "http://localhost:3001/api/v1/players?limit=5" | python3 -m json.tool

  ```
  Expected: JSON with `players` array, each player has `eloRating`, `stats`, `source` fields.

---

## Phase 3 — Type-Check & Lint Pass

> Catch any TypeScript errors before manual testing.

### Task 3.1: Backend type check

**File:** `backend/tsconfig.json`, `backend/src/**/*.ts`

- [x] **Step 1: Run type check**

  ```bash
  cd backend && npm run type-check

  ```
  Expected: no errors. If errors appear, fix them before continuing.

- [x] **Step 2: Run lint**

  ```bash
  cd backend && npm run lint

  ```
  Expected: no errors. (Created `eslint.config.js` for ESLint 9 flat config; fixed 2 errors: `_next` ignore pattern + `as unknown as RequestHandler` in votes route.)

---

### Task 3.2: Frontend type check

**File:** `frontend/tsconfig.json`, `frontend/src/**/*.tsx`

- [x] **Step 1: Run lint (includes TypeScript check)**

  ```bash
  cd frontend && npm run lint

  ```
  Expected: no errors.

---

### Task 3.3: ML service tests

**File:** `services/ml-service/tests/test_consensus.py`

- [x] **Step 1: Run pytest**

  ```bash
  cd services/ml-service && source venv/bin/activate && python -m pytest -v

  ```
  Expected: all tests pass. (2/2 passed)

---

## Phase 4 — End-to-End Verification

> Manual smoke test of every user flow.

### Task 4.1: Auth flow

- [x] **Step 1: Register a new user** — ✅ Returns `{ token, user: { id, email, reputation: 50 } }`.

- [x] **Step 2: Login with demo credentials** — ✅ Returns `{ token, user: { id, email, reputation: 80 } }`.

---

### Task 4.2: Voting + Algorithm 1 (in-browser)

- [x] **Step 1:** Open `http://localhost:3000` in browser. ✅ App loads with match feed.
- [x] **Step 2:** Login with `admin@fotnep.com / fotnep2025`. ✅ Auth works; AD avatar appears; leaderboard shows.
- [x] **Step 3:** Click on any match in the left sidebar. ✅ Match details panel loads.
- [x] **Step 4:** Click a vote button (1 / X / 2). ✅ `POST /votes` → 200; "PREDICTION REGISTERED" banner appears; percentages update.
- [x] **Step 5:** Algorithm 1 trigger. ⚠️ No "Run Prediction" button in UI — `triggerPrediction()` exists in `api.ts` but is NOT wired to any button. Trigger via curl instead: `POST /predict-match` → `{ homeWinProb:1, drawProb:0, awayWinProb:0, confidence:77.8 }`. "ALGORITHM 1 · ML CONSENSUS H 100% · D 0% · A 0% · conf 78%" row shows after re-voting.
- [x] **Step 6:** Refresh — JWT session persists (AD avatar stays). ⚠️ But `userVote` is in-memory only — on reload the "PREDICTION REGISTERED" branch never renders; vote buttons appear interactive again (backend deduplication prevents actual double-voting, but UI is misleading).

---

### Task 4.3: Algorithm 2 — Player Comparison (in-browser)

- [x] **Step 1:** Click "Compare" tab. ✅ Loads with two empty player slots.
- [x] **Step 2:** Search for two Nepali players. ✅ Search debounces correctly; returns Nepali results.
- [x] **Step 3:** Select one for slot A and one for slot B. ✅ Player cards populate with stats + radar chart.
- [x] **Step 4:** Comparison auto-triggers when both slots filled. ✅ `POST /compare-players` → 200; "ALGORITHM 2 · COSINE SIMILARITY 100.0%" banner with attribute breakdown and overlapping radar.

---

### Task 4.4: Algorithm 3 — Lineup Builder (in-browser)

- [x] **Step 1:** Click "Lineups" tab. ✅ Pitch diagram, formation selector, bench, Synergy Index panel load.
- [x] **Step 2:** Click "Fill Gorkhali XI". ⚠️ `POST /optimize-squad` → 200; 7 of 11 positions filled (LW, ST, RCM, RW empty). Players shown are Europeans (Kane, Herrmann, etc.) not Nepali — root cause: `listPlayers` in `playerController.ts` ignores `?source=` param; LineupBuilder passes all 150 IDs (mixed pool); ML picks highest-ELO = Europeans. Fix: add `if (source) filter.source = source;` to backend, pass `source:'nepali'` in `getPlayers` call.
- [x] **Step 3:** Change formation 4-3-3 → 3-5-2. ✅ Pitch rearranges immediately to correct slot layout; Synergy Index resets to 0% (expected on draft clear).

---

## Phase 4-fix — E2E Bug Fixes (found during smoke test)

> Three bugs uncovered during Phase 4 browser verification. Fix these before Phase 7 production builds.

### Fix 1: `listPlayers` ignores `?source=` filter → "Fill Gorkhali XI" returns Europeans

**Files:** `backend/src/controllers/playerController.ts`, `frontend/src/components/LineupBuilder.tsx`

- [x] **Step 1:** In `backend/src/controllers/playerController.ts` line 5, extract `source` and add it to the filter:

  ```typescript
  const { position, search, source, sortBy = 'eloRating', limit = '50', offset = '0' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (position) filter.position = position;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (source) filter.source = source;
  ```

- [x] **Step 2:** In `frontend/src/components/LineupBuilder.tsx` line 245, add `source: 'nepali'` to the fetch:

  ```typescript
  getPlayers({ limit: 150, source: 'nepali' })
  ```

  Also update the `getPlayers` signature in `frontend/src/services/api.ts` if `source` is not already a param (check around line 220).

- [x] **Step 3:** Run type-check and verify in browser — "Fill Gorkhali XI" should now return Nepali players and fill all 11 positions.

---

### Fix 2: `userVote` not restored on page reload → Algorithm 1 Consensus row never shows after refresh

**File:** `backend/src/controllers/voteController.ts`, `backend/src/routes/votes.ts`, `frontend/src/components/MatchDetails.tsx`, `frontend/src/services/api.ts`

- [x] **Step 1:** In `voteController.ts`, update `getMatchVotes` to return the calling user's vote when an auth token is present:

  ```typescript
  export async function getMatchVotes(req: AuthRequest, res: Response): Promise<void> {
    const votes = await Vote.find({ matchId: req.params.matchId }).lean();
    const counts = { home_win: 0, draw: 0, away_win: 0 };
    votes.forEach(v => { counts[v.outcome as keyof typeof counts]++; });
    const userVote = req.userId
      ? votes.find(v => v.userId?.toString() === req.userId)?.outcome ?? null
      : null;
    res.json({ ...counts, userVote });
  }
  ```

- [x] **Step 2:** Make the route optionally authenticated (no hard 401 if no token) — use a `softAuth` middleware that calls `next()` even without a token but populates `req.userId` if one is present.

- [x] **Step 3:** In `frontend/src/services/api.ts`, update `getMatchVotes` return type to include `userVote`:

  ```typescript
  export async function getMatchVotes(matchId: string): Promise<{ home_win: number; draw: number; away_win: number; userVote: string | null }> {
    return request(`/votes/${matchId}`);
  }
  ```

- [x] **Step 4:** In `frontend/src/components/MatchDetails.tsx`, restore `voteOutcome` from the API response on mount:

  ```typescript
  getMatchVotes(match.id).then(data => {
    setVoteCounts({ home_win: data.home_win, draw: data.draw, away_win: data.away_win });
    if (data.userVote) setVoteOutcome(data.userVote as 'home_win' | 'draw' | 'away_win');
  }).catch(() => {});
  ```

- [x] **Step 5:** Run type-check. Test in browser: vote, reload, confirm "PREDICTION REGISTERED" + Algorithm 1 row still show.

---

### Fix 3: No "Run Prediction" UI button → Algorithm 1 ML Consensus only visible after manual API call

**File:** `frontend/src/components/MatchDetails.tsx`

- [x] **Step 1:** Import `triggerPrediction` in `MatchDetails.tsx` (it's already in `api.ts` line 331):

  ```typescript
  import { castVote, getMatchVotes, getPrediction, triggerPrediction, PredictionResult } from '../services/api';
  ```

- [x] **Step 2:** After a successful vote in `handleVoteChoice`, auto-trigger the prediction:

  ```typescript
  await castVote(match.id, outcomeMap[choice]);
  setVoteOutcome(outcomeMap[choice]);
  const counts = await getMatchVotes(match.id);
  setVoteCounts(counts);
  // Auto-trigger Algorithm 1 after voting
  try {
    const pred = await triggerPrediction(match.id);
    setPredResult(pred);
  } catch { /* prediction will show on next load */ }
  ```

- [x] **Step 3:** Test: vote on a match → Algorithm 1 ML Consensus row should appear immediately without needing a page reload.

---

## Phase 5 — Auth Session Persistence Fix

> Currently, refreshing the page logs the user out — AuthContext doesn't read the stored token on mount.

### Task 5.1: Persist JWT across page refresh

**File:** `frontend/src/context/AuthContext.tsx`

- [x] **Step 1:** Read the current `AuthContext.tsx`
- [x] **Step 2:** Add token restore on mount — implemented via `getMe()` call in `useEffect`
- [x] **Step 3:** Run lint — no errors
- [x] **Step 4:** Test in browser — login, refresh, user stays logged in ✅
- [x] **Step 5: Commit** — done

---

### Task 5.2: Add GET /auth/me endpoint

**Files:** `backend/src/controllers/authController.ts`, `backend/src/routes/auth.ts`

- [x] **Step 1:** `me()` handler added to `authController.ts` (line 35)
- [x] **Step 2:** Mounted at `GET /me` in `routes/auth.ts` with `requireAuth`
- [x] **Step 3:** `getMe()` added to `frontend/src/services/api.ts`
- [x] **Step 4:** `AuthContext.tsx` calls `getMe()` on mount to restore session
- [x] **Step 5:** Type-check and lint passed
- [x] **Step 6: Commit** — done

---

## Phase 6 — Rate Limiting (Security)

> `express-rate-limit` is already installed. Just needs wiring.

### Task 6.1: Enable rate limiting on auth routes

**File:** `backend/src/index.ts`

- [x] **Step 1:** `import rateLimit from 'express-rate-limit'` added to `backend/src/index.ts` (line 6)
- [x] **Step 2:** `authLimiter` (20 req / 15 min) mounted before auth routes (lines 27–32)
- [x] **Step 3:** Backend starts successfully
- [x] **Step 4: Committed**

---

## Phase 7 — Production Build Verification

### Task 7.1: Frontend production build

- [ ] **Step 1:**

  ```bash
  cd frontend && npm run build

  ```
  Expected: `dist/` created, no TypeScript or Vite errors.

- [ ] **Step 2:** Preview the build

  ```bash
  cd frontend && npm run preview

  ```
  Open `http://localhost:4173` and verify the app loads.

---

### Task 7.2: Backend production build

- [ ] **Step 1:**

  ```bash
  cd backend && npm run build

  ```
  Expected: `dist/` created, no TypeScript errors.

- [ ] **Step 2:** Run compiled output

  ```bash
  cd backend && PORT=3001 npm start

  ```
  Expected: `Backend running on http://localhost:3001`

---

## Phase 8 — Cleanup Before Production

### Task 8.1: Remove mock data file

**File:** `frontend/src/data/mockData.ts`

- [x] **Step 1:** Confirmed — no mockData imports in any `.ts`/`.tsx` file
- [x] **Step 2:** `frontend/src/data/` directory deleted (does not exist)
- [x] **Step 3:** Lint passes — no broken imports
- [x] **Step 4: Committed**

---

### Task 8.2: Pre-production security checklist

- [ ] Remove demo user from seed script (`admin@fotnep.com / fotnep2025`) before any public deploy
- [ ] Replace `JWT_SECRET` with a strong random value in production `.env`
- [ ] Verify `CORS` in `backend/src/index.ts` restricts to production domain (not wildcard)
- [ ] Verify `CORS` in `services/ml-service/main.py` restricts to production domain

---

## Phase 9 — Match Resolution & Reputation Update (Future)

> Reputation scoring depends on correct match result being recorded after a match ends.

### Task 9.1: Add match result endpoint

**Files:** `backend/src/controllers/matchController.ts`, `backend/src/routes/matches.ts`

- [x] **Step 1:** `resolveMatch()` implemented in `matchController.ts` (line 130) — validates result, updates match status + result, populates teams
- [x] **Step 2:** Mounted at `POST /:id/resolve` with `requireAuth` in `routes/matches.ts`
- [x] **Step 3: Committed**

---

### Task 9.2: Update user reputation after match resolution

**File:** `backend/src/controllers/matchController.ts`

- [x] **Step 1:** Reputation update implemented inside `resolveMatch()` — iterates all votes, increments `predictionsCorrect` (+1 if correct), `reputation` (+2 correct / -1 wrong), marks `vote.correct` flag
- [x] **Step 2:** Type-check passed
- [x] **Step 3: Committed**

---

## Completed Phases Summary

| Phase | Description | Status |
|---|---|---|
| 0 | UI Design (dark theme, all components) | ✅ Complete |
| Backend scaffold | Models, middleware, routes structure | ✅ Complete |
| Backend controllers | All 6 controllers + POST/PATCH /matches | ✅ Complete |
| ML algorithms | All 3 algorithms implemented | ✅ Complete |
| Frontend integration | api.ts, AuthContext, all components API-connected | ✅ Complete |
| 1 | `.env` files creation | ✅ Complete |
| 2 | DB seeding | ✅ Complete (3086 players, 19 teams, 24 matches — all lineups predicted) |
| ML↔DB link | ML service `database.py` reads DB name from URI; `load_dotenv()` in `main.py` | ✅ Fixed |
| ML↔Backend link | All 3 algorithms flow: Frontend→Backend→ML→MongoDB→Response | ✅ Verified |
| 3 | Type-check & lint pass | ✅ Complete |
| 4 | E2E verification (browser) | ✅ Complete (3 bugs found — see Task 4.2 Step 5-6, Task 4.4 Step 2) |
| 4-fix | E2E bug fixes (source filter, userVote restore, auto-trigger prediction) | ✅ Complete |
| 5 | Auth session persistence (JWT lost on refresh) | ✅ Complete |
| 6 | Rate limiting | ✅ Complete |
| Admin | Dropped — admin features removed from scope | ❌ Removed |
| 7 | Production builds | ⏳ Upcoming |
| 8 | Cleanup | ✅ Complete (mockData deleted, security checklist is pre-deploy only) |
| 9 | Match resolution + reputation | ✅ Complete |

---

**Last Updated:** 2026-06-07
**Current Blocker:** Phase 7 (production builds not yet verified). All feature code complete. Only remaining work before deploy: run `npm run build` in both `frontend/` and `backend/`, then apply Phase 8.2 security checklist (CORS lock-down, rotate JWT_SECRET, remove demo creds from seed script).
