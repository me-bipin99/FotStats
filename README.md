# 🎯 FotNep — FotMob-like Nepali Football Stats App

[![Status](https://img.shields.io/badge/status-active-brightgreen)]()
[![Sessions](https://img.shields.io/badge/progress-Sessions%201%20%26%202%20Complete-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

A machine learning-powered web application for analyzing Nepali national football team player statistics, predicting match outcomes, and optimizing squad lineups.

## 📋 Overview

**FotNep** is a college project that leverages **5 distinct ML algorithms** to provide comprehensive football analytics:

- 🎯 **Match Prediction** — Predict win/draw/loss probabilities using Naive Bayes
- ⚽ **Expected Goals (xG)** — Estimate player performance using KNN
- 🔄 **Player Clustering** — Identify player synergies using K-Means
- 📊 **ELO Ratings** — Rank player strength using ELO system
- 🧬 **Squad Optimization** — Find optimal lineups using Genetic Algorithm

**Database:** 102 Nepali players seeded to MongoDB with ELO ratings + role classifications

---

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express + TypeScript + MongoDB + Redis
- **ML Service:** FastAPI + Python + scikit-learn
- **Infrastructure:** Docker + docker-compose
- **Database:** MongoDB Atlas (or local)
- **Cache:** Redis

### Component Diagram
```
Frontend (React :3001)
    ↓ Axios
Backend (Express :3000)
    ↓ Axios
ML Service (FastAPI :8000)
    ↓ Motor
MongoDB + Redis
```

---

## 🎓 5 ML Algorithms (College Requirement: 3 min)

| # | Algorithm | File | Route | Status |
|---|-----------|------|-------|--------|
| **1** | K-Nearest Neighbors (KNN) | `knn_comparator.py` | `/estimate-stats` | ✅ Active |
| **2** | K-Means Clustering | `player_clusterer.py` | `/cluster-players` | ✅ Active |
| **3** | Gaussian Naive Bayes | `match_predictor.py` | `/predict-match` | ✅ Active |
| **4** | ELO Rating System | `elo_rating.py` | `/predict-match` | ✅ Active |
| **5** | Genetic Algorithm | `genetic_optimizer.py` | `/optimize-squad` | ✅ Active |

---

## 📁 Project Structure

```
fotnep/
├── backend/                   # Express + MongoDB
│   ├── src/
│   │   ├── controllers/       # 6 API handlers
│   │   ├── models/            # Mongoose schemas
│   │   ├── routes/            # API endpoints
│   │   ├── services/          # mlIntegrationService
│   │   └── middleware/        # Auth, logging
│   └── package.json
│
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── pages/             # 4 main pages
│   │   ├── components/        # 5 visualization components
│   │   ├── context/           # Auth (Zustand)
│   │   ├── api/               # API clients
│   │   └── styles/            # Tailwind CSS
│   └── package.json
│
├── services/ml-service/       # FastAPI ML service
│   ├── models/                # 5 ML algorithms
│   ├── routes/                # 5 wired endpoints
│   ├── utils/                 # Model loader (singleton)
│   ├── scripts/               # seed_db.py
│   └── requirements.txt
│
├── data/                      # Training data
│   ├── raw/
│   │   ├── nepalisquad.csv (12 players)
│   │   └── nepali player stats.csv (101 players)
│   └── players_data-2025_2026.csv (2780 European players)
│
├── .sessions/                 # Session documentation
│   ├── S1.md                  # Session 1 status
│   └── S2.md                  # Session 2 status
│
├── docker-compose.yml
├── SPECS.md                   # Technical specs
├── IMPLEMENTATION_PLAN.md     # Full roadmap
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.10+
- MongoDB
- Redis
- Docker (optional)

### Local Development

**1. Backend**
```bash
cd backend
npm install
npm run dev          # Runs on :3000
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev          # Runs on :3001
```

**3. ML Service**
```bash
cd services/ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/seed_db.py    # Seed database
python main.py               # Runs on :8000
```

**4. Access App**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- ML Service: http://localhost:8000

### Docker
```bash
docker-compose up --build
```

---

## 🔐 Login Credentials

```
Email: admin@fotnep.com
Password: fotnep2025
```

**Setup Environment:**
Create `.env.local`:
```
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=your-secret
ML_SERVICE_URL=http://localhost:8000
```

---

## 📊 API Endpoints

### Auth
```
POST /api/v1/auth/login
POST /api/v1/auth/register
```

### Players
```
GET  /api/v1/players
GET  /api/v1/players/{id}
GET  /api/v1/players/{id}/analytics
POST /api/v1/players/compare
```

### Teams
```
GET  /api/v1/teams/{id}
GET  /api/v1/teams/{id}/analytics
POST /api/v1/teams/{id}/optimize-squad
```

### Matches
```
GET /api/v1/matches/{id}/prediction
```

### ML Service (Internal)
```
POST /api/v1/estimate-stats       — KNN
POST /api/v1/predict-match        — Naive Bayes + ELO
POST /api/v1/cluster-players      — K-Means
POST /api/v1/optimize-squad       — GA
POST /api/v1/generate-insights    — Rule-based
```

---

## ✅ Session Progress

### Session 1 — Database Seeding ✅
- 102 players seeded to MongoDB
- Algorithm #4 (ELO) applied
- Algorithm #2 (K-Means) applied
- Secure .env setup

### Session 2 — ML Routes Wired ✅
- All 5 routes wired to algorithms
- model_loader.py singleton created
- Algorithm #5 (GA) implemented
- All models initialized at startup

### Session 3 — Backend Controllers ⏳
- 6 controllers to implement
- mlIntegrationService.ts

### Session 4 — Frontend Pages ⏳
- Dashboard, Players, Teams, Matches pages

### Session 5 — Visualizations ⏳
- XGChart, Heatmap, WinProbBar, Synergy, LineupPitch

### Session 6 — Docker + Polish ⏳
- Full integration test
- Demo-ready

---

## 📚 Documentation

- **[SPECS.md](SPECS.md)** — Technical specifications
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** — Full roadmap
- **[.sessions/S1.md](.sessions/S1.md)** — Session 1 details
- **[.sessions/S2.md](.sessions/S2.md)** — Session 2 details

---

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/name`
2. Make changes and test
3. Commit: `git commit -m "Add feature: description"`
4. Push: `git push origin feature/name`
5. Create pull request

---

## 📄 License

MIT License

---

## 👤 Author

**Bipin Parajuli** (@me-bipin99)

---

**Status:** Sessions 1 & 2 Complete ✅ | Actively Developing 🚀

Last Updated: 2026-05-31
