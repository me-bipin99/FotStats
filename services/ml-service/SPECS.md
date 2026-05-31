# ML Service SPECS — Session 1 Status

**Location:** `/services/ml-service`  
**Tech:** Python 3.10 + FastAPI + scikit-learn  
**Port:** 8000  
**Status:** ✅ Models complete | ⏳ Routes are stubs

---

## 📋 Session 1 Changes

### ✅ Created
- `.env` file (secure placeholders)
- `scripts/seed_db.py` (202 lines, ✅ runs successfully)
- `utils/model_loader.py` (⏳ Session 2)
- Python venv with all dependencies

### ✅ Already Existed
- All 5 algorithm models (fully implemented)
- Insights engine (fully implemented)
- All 5 route files (stubs)

### ✅ Session 1 Execution
- Created `.env.local` with MongoDB URI
- Fixed seed script file paths
- Ran seed_db.py successfully
- 102 players seeded to MongoDB with ELO ratings

### ⏳ Session 2
- Implement 5 route handlers (wire models to routes)
- Create `utils/model_loader.py` (singleton model initialization)
- Implement `SquadOptimizer.optimize()` body

---

## 📁 File Structure

```
services/ml-service/
├── .env                          (✅ Created Session 1)
├── requirements.txt
├── main.py                       (✅ Complete - routes registered)
├── venv/                         (✅ Python environment)
├── models/
│   ├── elo_rating.py             (✅ Complete - Algorithm #4)
│   ├── knn_comparator.py         (✅ Complete - Algorithm #1)
│   ├── knn_estimator.py          (✅ Complete - Algorithm #1)
│   ├── match_predictor.py        (✅ Complete - Algorithm #3)
│   ├── player_clusterer.py       (✅ Complete - Algorithm #2)
│   └── genetic_optimizer.py      (⏳ optimize() body needed)
├── services/
│   └── insights_engine.py        (✅ Complete - Rule-based)
├── routes/
│   ├── estimate.py               (⏳ Stub - needs KNN wiring)
│   ├── predict.py                (⏳ Stub - needs Naive Bayes + ELO)
│   ├── cluster.py                (⏳ Stub - needs K-Means)
│   ├── optimize.py               (⏳ Stub - needs GA)
│   └── insights.py               (⏳ Stub - needs InsightsEngine)
├── scripts/
│   └── seed_db.py                (✅ Created & Ran Successfully)
├── utils/
│   └── model_loader.py           (⏳ Session 2)
└── saved_models/                 (Cache directory)
```

---

## 🎓 5 Algorithms Status

### Algorithm #1: K-Nearest Neighbors (KNN)
**Files:** `models/knn_comparator.py` + `models/knn_estimator.py`  
**Status:** ✅ Fully implemented  
**Session 2 Task:** Wire to `routes/estimate.py`  
**Input:** Player dict (name, position, stats)  
**Output:** xG, xA, similar_players list  

### Algorithm #2: K-Means Clustering
**File:** `models/player_clusterer.py`  
**Status:** ✅ Fully implemented  
**Session 1 Applied:** Yes (all 102 players clustered, default cluster 1 used)  
**Session 2 Task:** Wire to `routes/cluster.py`  
**Input:** player_ids list  
**Output:** clusters dict, synergy_pairs list  

### Algorithm #3: Gaussian Naive Bayes
**File:** `models/match_predictor.py`  
**Status:** ✅ Fully implemented  
**Session 2 Task:** Wire to `routes/predict.py`  
**Input:** home_team, away_team, is_neutral_venue  
**Output:** home_win %, draw %, away_win % probability  

### Algorithm #4: ELO Rating System
**File:** `models/elo_rating.py`  
**Status:** ✅ Fully implemented  
**Session 1 Applied:** Yes (all 102 players rated, avg ELO ~1520)  
**Session 2 Task:** Use in `routes/predict.py` for lineup scoring  
**Input:** Player career stats  
**Output:** Player strength rating (1000-2000 scale)  

### Algorithm #5: Genetic Algorithm
**File:** `models/genetic_optimizer.py`  
**Status:** ⏳ Body TODO (helpers written)  
**Session 2 Task:** Implement `optimize()` loop  
**Input:** players list, formation string  
**Output:** bestXI (optimal 11 players)  

---

## 🔑 Dependencies

```
pymongo==4.7          # MongoDB client
pandas==2.2           # Data processing
scikit-learn==1.4     # ML algorithms (KNN, KMeans, NB)
fastapi==0.111        # Web framework
uvicorn==0.29         # ASGI server
pydantic==2.7         # Data validation
numpy==1.26           # Numerical computing
joblib==1.4           # Model persistence
deap==1.4             # GA framework (for genetic optimizer)
python-dotenv         # .env loading
httpx                 # Async HTTP (FastAPI)
```

---

## 🚀 Running

```bash
# From /services/ml-service
source venv/bin/activate
python main.py

# API running on http://localhost:8000
```

---

## 📊 Session 1 Results

### Seed Script Execution ✅
```
✓ Connected to MongoDB
✓ Loaded 12 squad players
✓ Loaded 100 extended players
✓ Total unique: 102 players
✓ Applied ELO ratings to all 102
✓ Applied K-Means clustering (default cluster)
✓ Seeded: 102 players, 1 team, 1 match, 1 user
```

### Database State
- **players:** 102 documents with eloRating field
- **teams:** 1 Nepal National Team document
- **matches:** 1 Nepal vs Bangladesh match
- **users:** 1 admin user (bcrypt-hashed password)

---

## 📝 Session 2 Checklist

### Route 1: estimate.py (Algorithm #1: KNN)
- [ ] Get player dict from request
- [ ] Call `get_comparator().find_similar_players(player)`
- [ ] Derive xG = estimated_stats["G/Sh"] * estimated_stats["Sh"]
- [ ] Return { xG, xA, similar_players, estimated_stats }

### Route 2: predict.py (Algorithms #3 + #4: Naive Bayes + ELO)
- [ ] Get home_team, away_team, formation from request
- [ ] Fetch squad from MongoDB (motor async)
- [ ] Call `LineupPredictor().predict_lineup(squad, formation, elo_ratings)`
- [ ] Call `get_predictor().predict(home_team, away_team, is_neutral)`
- [ ] Return { lineup, match_outcome }

### Route 3: cluster.py (Algorithm #2: K-Means)
- [ ] Get player_ids from request
- [ ] Fetch players from MongoDB
- [ ] Call `get_clusterer().predict_multiple(stats_list)`
- [ ] Group by cluster, identify synergy pairs
- [ ] Return { clusters, synergy_pairs, cluster_labels }

### Route 4: optimize.py (Algorithm #5: Genetic Algorithm)
- [ ] Implement `SquadOptimizer.optimize()` body:
  - [ ] `_initialize_population()`
  - [ ] `_run_evolution()` loop
  - [ ] `_best_solution()` return
- [ ] Call optimizer in route
- [ ] Return { bestXI, formation, fitness_score }

### Route 5: insights.py (Rule-based)
- [ ] Wire `InsightsEngine.generate_player_insights()`
- [ ] Wire `InsightsEngine.generate_match_narrative()`
- [ ] Return insights list + narrative text

### Create: utils/model_loader.py
- [ ] Singleton pattern for model initialization
- [ ] `init_models()` function (startup)
- [ ] `get_comparator()`, `get_clusterer()`, `get_predictor()`, `get_optimizer()`
- [ ] Load in `main.py` lifespan

---

## 🔐 Environment Setup

```bash
# .env file structure
ML_SERVICE_PORT=8000
MONGODB_URI=mongodb+srv://...@cluster0.gltstuo.mongodb.net/fotnep
BACKEND_URL=http://backend:3000
GA_POPULATION_SIZE=100
GA_GENERATIONS=50
KMEANS_N_CLUSTERS=6
```

---

## 🔄 Dependencies

**Blocks on:** Nothing (all models complete)

**Unblocks:**
- Backend controllers (Session 3)
- Frontend pages (Session 4)
- Visualizations (Session 5)

---

## ✨ Next: Session 2

See: `IMPLEMENTATION_PLAN.md` → Session 2 section for full ML service spec

**Estimated implementation:** 2-3 hours (5 routes × 30-40 mins each)
