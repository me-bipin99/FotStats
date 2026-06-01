# 🚀 Run FotNep - Complete Guide

## ✅ All Set! Everything is Ready

The app is fully configured and seeded. Just start the services:

### Quick Start (3 Commands)

```bash
# Terminal 1: Start Backend
cd /home/abee/Music/fotnep/backend
npm run dev

# Terminal 2: Start Frontend
cd /home/abee/Music/fotnep/frontend
npm run dev

# Then open browser: http://localhost:3003
```

**Login with:**
- Email: `admin@fotnep.com`
- Password: `fotnep2025`

---

## What's Running

| Service | Port | Status |
|---------|------|--------|
| **Frontend** | 3003 | ✅ Vite dev server |
| **Backend API** | 3000 | ✅ Express server |
| **MongoDB** | Atlas Cloud | ✅ 102 Nepali players seeded |
| **Redis** | Optional | ⚠️ Caching disabled (not required) |

---

## Database Content

Already seeded with:
- **102 Nepali football players** (names, positions, ELO ratings, stats)
- **1 Team** (default squad)
- **1 Match** (demo prediction)
- **1 Admin User** (for login)

---

## Key Features

✅ **CSS Styling** - Dark theme with Nepal flag colors (Red & Blue)
✅ **Real Data** - 102 players from MongoDB Atlas
✅ **Authentication** - JWT-based with bcrypt hashing
✅ **5 ML Algorithms** - KNN, K-Means, Naive Bayes, ELO, Genetic Algorithm
✅ **Data Visualizations** - Recharts, Heatmaps, Radar charts
✅ **4 Main Pages**:
  - Dashboard (stats & charts)
  - Players (table, analytics, comparison)
  - Teams (squad, synergy matrix, lineups)
  - Matches (predictions, formation selection)

---

## Architecture

```
Frontend (React + TypeScript + Tailwind CSS)
  ↓ (API calls via Axios)
Backend (Express + MongoDB Atlas)
  ↓ (ML algorithms)
ML Service (FastAPI - optional for predictions)
```

**Frontend proxy:** `/api` → `http://localhost:3000`

---

## Environment Configuration

Backend `.env.local`:
```
MONGODB_URI=mongodb+srv://hello_db_user:...@cluster0.gltstuo.mongodb.net/fotnep
REDIS_URL=redis://default:...@redis-14046.c289.us-east-1-2.ec2.cloud.redislabs.com:14046
JWT_SECRET=fotnep_dev_secret_2025
PORT=3000
```

---

## Troubleshooting

### Backend won't start
```bash
cd backend
npm run dev
```
Check logs for MongoDB/Redis errors - both are optional, server starts without them.

### Frontend shows "Backend starting up"
- Backend needs 5-10 seconds to connect to MongoDB
- Wait and refresh browser

### CSS not loading
```bash
cd frontend
rm -rf node_modules/.vite
npm install --save-dev postcss autoprefixer
npm run dev
```

### Login failing
- Make sure backend is running on port 3000
- Credentials: `admin@fotnep.com` / `fotnep2025`
- Check MongoDB connection in backend logs

---

## Development Workflow

1. **Start Backend** → Connects to MongoDB Atlas → Logs "Server running on port 3000"
2. **Start Frontend** → Connects to Backend API → Shows login page
3. **Login** → Get JWT token → Access all pages with real data
4. **Develop** → Hot reload works (save = instant updates)

---

## API Endpoints (with JWT auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/login` | Get JWT token |
| GET | `/api/v1/players` | List all players (102 total) |
| GET | `/api/v1/players/:id` | Player details |
| GET | `/api/v1/players/:id/analytics` | Player ML analytics |
| GET | `/api/v1/teams` | List teams |
| GET | `/api/v1/matches` | List matches |
| GET | `/api/v1/matches/:id/prediction` | Match prediction |

---

## Next Steps (Optional)

- **Add ML Service** (for advanced predictions):
  ```bash
  cd services/ml-service
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  python main.py
  ```

- **Deploy to Production**:
  - Use Docker: `docker-compose up --build`
  - Or use your preferred cloud platform

---

## Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + MongoDB Atlas + JWT auth
- **Database:** MongoDB Atlas (cloud) + 102 Nepali players
- **ML:** FastAPI (optional) with 5 algorithms
- **Auth:** bcrypt + JWT tokens
- **Visualization:** Recharts, HTML5 Canvas
