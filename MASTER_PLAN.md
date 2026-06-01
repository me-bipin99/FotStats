# FotNep Master Plan - Complete Overview

**Project:** Nepali Football Analytics Platform  
**Status:** Sessions 1-3 ✅ | Sessions 4-6 🚧  
**Last Updated:** 2026-06-01  
**Owner:** Hey Abee!

---

## Project Goals

1. **Build MVP** of FotMob-like Nepali football stats platform
2. **Implement 5 ML algorithms** (KNN, K-Means, Naive Bayes, ELO, Genetic Algorithm)
3. **Full-stack integration** (React frontend → Express backend → Python ML service → MongoDB)
4. **Add prediction voting system** with user reputation tracking
5. **Demo-ready** end-to-end application

**College Requirements:** ✅ Min 3 algorithms, session-based development, limited API usage

---

## Technology Stack

| Layer | Tech |
|-------|------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind + Recharts |
| **Backend** | Express.js + TypeScript + MongoDB Atlas + Redis (optional) |
| **ML Service** | FastAPI + Python + scikit-learn |
| **Database** | MongoDB Atlas (cloud) |
| **Cache** | Redis Cloud (optional, graceful fallback) |
| **Infrastructure** | Docker Compose + Node.js v24 |

---

## 5 Core Algorithms

| # | Name | Purpose | Status | Session |
|---|------|---------|--------|---------|
| 1 | **KNN** | Player similarity + xG estimation | ✅ | 2 |
| 2 | **K-Means** | Player clustering + role classification | ✅ | 1 |
| 3 | **Naive Bayes** | Match outcome prediction | ✅ | 2 |
| 4 | **ELO Rating** | Player strength ranking | ✅ | 1 |
| 5 | **Genetic Algorithm** | Squad lineup optimization | 🚧 | 2 |

---

## Feature Set (Sessions 1-6)

### Session 1: Data Seeding & Cleanup ✅
- ✅ Delete 26 clutter files
- ✅ Seed 102 Nepali players to MongoDB
- ✅ Seed 1 team, 1 match, 1 user
- ✅ Apply ELO ratings + K-Means clustering
- ✅ Create seed_db.py script

### Session 2: ML Service Routes ⏳
- 🚧 Implement `/api/v1/estimate-stats` (KNN)
- 🚧 Implement `/api/v1/predict-match` (Naive Bayes + ELO)
- 🚧 Implement `/api/v1/cluster-players` (K-Means)
- 🚧 Implement `/api/v1/optimize-squad` (Genetic Algorithm)
- 🚧 Create model_loader.py singleton
- 🚧 Wire InsightsEngine routes

### Session 3: Backend Controllers 🚧
- 🚧 Create User.ts model
- 🚧 Implement authController (login/register)
- 🚧 Implement playerController (CRUD + analytics)
- 🚧 Implement teamController (squad + synergy)
- 🚧 Implement matchController (predictions)
- 🚧 Implement predictionController (accuracy)
- 🚧 Create mlIntegrationService.ts wrapper

### **Session 3b: Voting System & Predictions** 🆕
- 🚧 Create Vote.ts model (choices, weights, results)
- 🚧 Update User.ts (reputation, prediction history)
- 🚧 Implement voting endpoints (vote, forecast, resolve)
- 🚧 Implement reputation calculation algorithm
- 🚧 Implement match result resolution + scoring
- 🚧 Create leaderboard endpoint

### Session 4: Frontend Pages 🚧
- 🚧 Fix authContext.ts login() method
- 🚧 Implement Dashboard.tsx (stats, charts, algo badges)
- 🚧 Implement Players.tsx (table, filter, detail panel)
- 🚧 Implement Teams.tsx (cards, squad, synergy)
- 🚧 Implement Matches.tsx (list, predictions, voting)

### Session 5: Visualizations 🚧
- 🚧 XGChart.tsx (actual vs expected goals)
- 🚧 HeatmapCanvas.tsx (position-based performance)
- 🚧 LineupPitch.tsx (tactical formation display)
- 🚧 SynergyMatrix.tsx (player clustering visualization)
- 🚧 WinProbabilityBar.tsx (match outcome probabilities)

### Session 6: Integration & Polish 🚧
- 🚧 Docker Compose full stack
- 🚧 Error handling & loading states
- 🚧 Formation selector (rerun predictions)
- 🚧 Full end-to-end testing
- 🚧 Demo checklist verification

---

## Data Sources

### Players (101 total)
- **12** from `data/raw/nepalisquad.csv` (squad players)
- **101** from `data/raw/nepali player stats with role and gender.csv` (extended pool)
- **2,780** European players in `data/players_data-2025_2026.csv` (KNN training corpus)

### Matches
- 1 demo match (Nepal vs Bangladesh) seeded
- Real match data added during gameplay

### Users
- 1 admin user seeded: `admin@fotnep.com` / `fotnep2025`
- Additional users created during registration

---

## Key Design Patterns (from UI Model Folder)

### 1. Voting System Architecture
```
┌─────────────────────────────────────────────────┐
│              MATCH PREDICTION VOTING             │
├─────────────────────────────────────────────────┤
│ User votes: '1' (home) | 'X' (draw) | '2' (away) │
│                                                   │
│ Vote power = max(1, round(1 + reputation/5))    │
│                                                   │
│ Crowd votes (35%):    Simple count of votes      │
│ Expert votes (65%):   Weighted sum (7+6+5+3)     │
│                                                   │
│ Final = 0.35*crowd + 0.65*expert                 │
│                                                   │
│ Result: Home 52% | Draw 27% | Away 21%          │
└─────────────────────────────────────────────────┘
```

### 2. Reputation Scoring
```
Prediction correct → +3 reputation points
Prediction wrong   → -1 reputation point

Vote weight = max(1, round(1 + reputation/5))
Example: 25 rep → weight 6, 50 rep → weight 11
```

### 3. UI Color Scheme
```
Dark Base:    #0c0d10 (background)
Dark Border:  #151619 (card backgrounds)
Emerald:      #10B981 (home win, positive)
Rose:         #ef4444 (away win, negative)
Slate:        #94A3B8 (muted text, secondary)
```

### 4. Data Persistence (localStorage)
```
FOTNEP_LOGGED_IN      → Current user email
FOTNEP_USERS          → User list {username, reputation, correct, wrong}
FOTNEP_PREDICTIONS    → Match predictions by user
FOTNEP_MATCH_OVERRIDES → Simulated match results
```

---

## Session Breakdown & Timeline

### Session 1: Data Seeding (2-3 hrs) ✅ COMPLETE
**What:** Delete clutter, seed 102 players with ELO + K-Means clusters  
**Code:** seed_db.py  
**Deliverable:** 102 players in MongoDB, ready for APIs  
**Verify:** `db.players.countDocuments()` returns 102  

### Session 2: ML Service (2-3 hrs) 🚧 IN PROGRESS
**What:** Wire 5 ML routes, implement model_loader.py singleton  
**Code:** routes/*.py, utils/model_loader.py, implement optimize() body  
**Deliverable:** All 5 endpoints return real data (not stubs)  
**Verify:** `/estimate-stats` returns real xG (not hardcoded 7.8)  

### Session 3: Backend Controllers (2-3 hrs) 🚧
**What:** Implement 6 controllers (auth, player, team, match, prediction, insight)  
**Code:** controllers/*.ts, models/User.ts, services/mlIntegrationService.ts  
**Deliverable:** All CRUD endpoints + ML integration working  
**Verify:** `GET /players` + JWT returns 102 players with real analytics  

### **Session 3b: Voting System (1-2 hrs) 🆕**
**What:** Implement weighted voting + reputation tracking  
**Code:** models/Vote.ts, voting endpoints, reputation calculation  
**Deliverable:** Users can vote on match outcomes, reputation updates  
**Verify:** Vote endpoints functional, forecast probabilities calculated  

### Session 4: Frontend Pages (2-3 hrs) 🚧
**What:** Build 4 pages (Dashboard, Players, Teams, Matches)  
**Code:** pages/*.tsx, fix authContext.ts login()  
**Deliverable:** All pages load with real data from backend  
**Verify:** Navigate all pages without errors, see 102 real players  

### Session 5: Visualizations (2-3 hrs) 🚧
**What:** Build 5 chart components + integrate into pages  
**Code:** components/XGChart.tsx, HeatmapCanvas.tsx, etc.  
**Deliverable:** All visualizations render + wire into pages  
**Verify:** Player detail shows xG chart + heatmap, Teams show pitch  

### Session 6: Integration & Polish (2-3 hrs) 🚧
**What:** Full Docker integration, error handling, demo-ready  
**Code:** docker-compose updates, error boundaries, loading states  
**Deliverable:** One-command startup, full end-to-end working  
**Verify:** `docker-compose up` → login → explore all features  

---

## Critical Path Dependencies

```
Session 1 (Seeding)
    ↓
Session 2 (ML Routes) ← BLOCKING SESSION 3
    ↓
Session 3 (Backend) ← BLOCKING SESSION 3b
    ↓
Session 3b (Voting) [PARALLEL with Session 3]
    ↓
Session 4 (Frontend) ← BLOCKING SESSIONS 5-6
    ↓
Session 5 (Visualizations)
    ↓
Session 6 (Polish & Integration)
```

**Key Blocker:** Session 2 ML routes must complete before Session 3  
**Parallel Work:** Session 3b voting can start once Session 3 models created  

---

## File Structure (Reference)

```
fotnep/
├── MASTER_PLAN.md              ← You are here
├── IMPLEMENTATION_PLAN.md       ← Detailed session breakdown
├── CLAUDE.md                    ← Project context
├── README.md                    ← Quick start
├── STATUS.md                    ← Progress tracker
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.ts          (Session 3: create)
│   │   │   ├── Vote.ts          (Session 3b: NEW)
│   │   │   └── [other models]
│   │   ├── controllers/         (Session 3: implement)
│   │   ├── routes/              (wired, ready for controllers)
│   │   └── services/
│   │       └── mlIntegrationService.ts (Session 3: create)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    (Session 4)
│   │   │   ├── Players.tsx      (Session 4)
│   │   │   ├── Teams.tsx        (Session 4)
│   │   │   └── Matches.tsx      (Session 4 + voting UI)
│   │   ├── components/          (Session 5: visualizations)
│   │   └── context/
│   │       └── authContext.ts   (Session 4: fix login())
│
├── services/ml-service/
│   ├── routes/                  (Session 2: implement)
│   ├── utils/
│   │   └── model_loader.py      (Session 2: create)
│   └── scripts/
│       └── seed_db.py           (✅ Session 1 complete)
│
├── ui model/                    ← Reference folder (voting system, pitch viz)
│   └── src/components/
│       ├── MatchDetails.tsx     (voting algorithm reference)
│       └── LineupBuilder.tsx    (pitch visualization reference)
│
└── data/                        ← Data sources (102 players seeded)
    ├── raw/
    │   ├── nepalisquad.csv
    │   └── nepali player stats with role and gender.csv
    └── players_data-2025_2026.csv
```

---

## Success Metrics (Demo Checklist)

- [ ] All 5 algorithms showcase-able
- [ ] 102 real Nepali players loaded
- [ ] Dark mode UI polished
- [ ] Voting system functional (vote, reputation, forecast)
- [ ] Full end-to-end flow working (login → explore → vote → see forecast)
- [ ] No console errors
- [ ] Responsive on mobile

---

## Commands (Quick Reference)

```bash
# Start everything
bash START.sh
# Or manually:
cd backend && npm run dev &
cd frontend && npm run dev &
cd services/ml-service && python -m uvicorn main:app --reload &

# Seed data
python services/ml-service/scripts/seed_db.py

# Check backend health
curl http://localhost:3000/api/v1

# Login & get token
TOKEN=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fotnep.com","password":"fotnep2025"}' | jq -r '.token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/players
```

---

## Important Notes

1. **UI Model Folder** is reference implementation — don't modify, only learn from
2. **Main project** gradually ports patterns from UI model as needed
3. **Voting system** is NEW requirement, not in original plan → Session 3b
4. **Reputation** is core to voting — affects vote weight in forecasts
5. **Match resolution** must update reputation + archive predictions
6. **localStorage** persists votes locally; backend stores in DB
7. **Experts** are hardcoded for MVP; can be dynamic in future

---

## Next Immediate Tasks

### Right Now (Session 3+)
1. ✅ Update all MD files with voting system context
2. ✅ Create MASTER_PLAN.md (this file)
3. 🚧 Create SESSION_PLAN.md with next 3 sessions detailed

### Session 3 (Backend)
1. Implement 6 controllers
2. Create User.ts + Vote.ts models
3. Create mlIntegrationService.ts
4. Implement voting endpoints
5. Implement reputation calculation

### Session 3b (Voting)
1. Wire voting form in Matches.tsx
2. Display live forecast probabilities
3. Show leaderboard
4. Implement match resolution

### Session 4 (Frontend)
1. Build all 4 pages
2. Fix authContext login()
3. Wire data from backend
4. Add visualizations

---

## Contact & Questions

Refer to IMPLEMENTATION_PLAN.md for detailed session instructions.  
Refer to CLAUDE.md for architecture decisions and context.  
Ask "Hey Abee!" before starting to avoid context loss.

**Ready to build! 🚀⚽**
