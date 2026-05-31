# FotNep Specs — Master Reference

**Project:** FotMob-like Nepali Football Stats App  
**Status:** Session 1 ✅ Complete | Session 2 ⏳ Next  
**Last Updated:** 2025-05-31

---

## 📍 Project Structure

Each folder has a `SPECS.md` file documenting:
- What was changed/added (Session 1)
- Current status
- Dependencies
- Next steps (Session 2)

Navigate via folder-level specs for fast context lookup.

---

## 📂 Folder Structure & Specs

### Root Level
- **IMPLEMENTATION_PLAN.md** — Master plan for all 6 sessions
- **SPECS.md** (this file) — Navigation hub
- **.env** — Backend config (placeholders)
- **.env.local** — MongoDB URI (created during seeding)

### `/backend` — Express + TypeScript + MongoDB
**See:** `/backend/SPECS.md`
- Routes wired, controllers are stubs
- Models: Player, Team, Match, User (ready)
- Ready for Session 2 implementation

### `/frontend` — React + TypeScript + Vite + Tailwind
**See:** `/frontend/SPECS.md`
- Auth context structure ready
- Pages are stubs (Dashboard, Players, Teams, Matches)
- Ready for Session 4 implementation

### `/services/ml-service` — Python + FastAPI
**See:** `/services/ml-service/SPECS.md`
- Models: All 5 algorithms fully implemented
- Routes: All 5 stubs (ready for Session 2)
- Scripts: seed_db.py (✅ ran successfully)
- Ready for Session 2 route implementation

### `/data` — CSV and database files
**See:** `/data/SPECS.md`
- 102 Nepali players (12 squad + 100 extended)
- 2,780 European players (KNN training)
- 941k events (reference only)
- All seeded to MongoDB ✅

### `/docker` — Dockerfiles
**See:** `/docker/SPECS.md`
- Backend and ML service containers
- All updated with correct paths

---

## 🎯 Session 1 Summary

### ✅ Completed
- Cleanup: 26 files deleted
- Code: seed_db.py + configs created
- Environment: Python venv + dependencies
- Database: 102 players seeded to MongoDB
- Algorithm #4: ELO ratings applied ✅
- Algorithm #2: K-Means (default cluster assigned)

### 📊 Current State
- MongoDB: fotnep database ready
- Data: 102 players, 1 team, 1 match, 1 user
- Backend: Runnable (controllers are stubs)
- Frontend: Runnable (pages are stubs)
- ML Service: Routes are stubs (models ready)

### 🔐 Credentials
- **Email:** admin@fotnep.com
- **Password:** fotnep2025
- **MongoDB URI:** In .env.local (git-ignored)

---

## 🚀 Session 2 Tasks

### ML Service Routes (2-3 hrs)
Create: `/services/ml-service/SPECS.md` (detailed)

**Routes to implement:**
1. `POST /api/v1/estimate-stats` → KNN (Algorithm #1)
2. `POST /api/v1/predict-match` → Naive Bayes + ELO (Algorithms #3 + #4)
3. `POST /api/v1/cluster-players` → K-Means (Algorithm #2)
4. `POST /api/v1/optimize-squad` → GA (Algorithm #5)
5. `POST /api/v1/generate-insights` → Rule-based

**Files to create:**
- `utils/model_loader.py` — Singleton model initialization
- Implement `SquadOptimizer.optimize()` loop

---

## 📋 Quick Navigation

**Need context on a folder?**
- `backend/SPECS.md` — Backend changes in Session 1
- `frontend/SPECS.md` — Frontend changes in Session 1
- `services/ml-service/SPECS.md` — ML service changes
- `data/SPECS.md` — Data files and seeding
- `docker/SPECS.md` — Docker configuration

**Need full implementation details?**
- Read: `IMPLEMENTATION_PLAN.md` (master plan)
- Read: Session-specific `.md` at root level

**Need to verify work?**
- MongoDB: Check collections in mongodb.com
- Files: Check corresponding SPECS.md in each folder
- Code: Check implementations (Session 2 onwards)

---

## 🎓 5 Algorithms Status

| # | Name | File(s) | Session | Status |
|---|------|---------|---------|--------|
| 1 | KNN | knn_comparator.py | 2 | ⏳ Route pending |
| 2 | K-Means | player_clusterer.py | 1 | ✅ Applied (default cluster) |
| 3 | Naive Bayes | match_predictor.py | 2 | ⏳ Route pending |
| 4 | ELO Rating | elo_rating.py | 1 | ✅ Applied to 102 players |
| 5 | Genetic Algo | genetic_optimizer.py | 2 | ⏳ Implementation pending |

---

## 📖 Documentation Files

**Keep clean:** Only these files at root level
- `SPECS.md` (this file) — Navigation hub
- `IMPLEMENTATION_PLAN.md` — Master plan
- `.env` — Config template
- `.env.local` — Secrets (git-ignored)
- `docker-compose.yml` — Docker config

**Session files (archived):**
All other `.md` files moved/merged into folder-level SPECS.md

---

## 🔄 Next Steps

1. **Session 2:** Implement 5 ML service routes
   - Reference: `/services/ml-service/SPECS.md`
   - Plan: `IMPLEMENTATION_PLAN.md` (Session 2 section)

2. **Session 3:** Implement 6 backend controllers
   - Reference: `/backend/SPECS.md`
   - Plan: `IMPLEMENTATION_PLAN.md` (Session 3 section)

3. **Sessions 4-6:** Frontend, visualizations, integration
   - Each will have folder-level SPECS.md

---

**This specs-driven approach keeps documentation minimal while maintaining full context per folder. Use SPECS.md files for fast navigation!** 🚀
