# FotNep Setup Guide

Complete guide for setting up and running the FotNep platform locally.

---

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- MongoDB (local or Atlas connection)
- Redis (optional, for caching)

---

## Quick Start

```bash
bash START.sh
```

This launches all three services in parallel:
- **Frontend:** React dev server on http://localhost:3001
- **Backend:** Express.js API on http://localhost:3000
- **ML Service:** FastAPI on http://localhost:8000

---

## Manual Setup

### 1. Backend (Express.js + MongoDB)

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/fotnep
JWT_SECRET=your-secret-key
NODE_ENV=development
REDIS_URL=redis://localhost:6379 (optional)
EOF

# Run development server
npm run dev

# Or build for production
npm run build
npm start
```

**API runs on:** http://localhost:3000/api/v1

**Test endpoints:**
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fotnep.com","password":"fotnep2025"}'

# Get players
curl -X GET http://localhost:3000/api/v1/players \
  -H "Authorization: Bearer <token>"
```

---

### 2. Frontend (React 18 + Vite + Tailwind)

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Or build for production
npm run build
```

**App runs on:** http://localhost:3001

**Login credentials:**
- Email: admin@fotnep.com
- Password: fotnep2025

---

### 3. ML Service (FastAPI + Python)

```bash
cd services/ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**API runs on:** http://localhost:8000

**Interactive docs:** http://localhost:8000/docs

---

## Database Setup

### MongoDB Seeding

```bash
cd services/ml-service

# Seed players and matches
python scripts/seed_db.py
```

This populates:
- 102 Nepali players
- 2780 European players (for comparison)
- Match fixtures

---

## Project Structure

```
fotnep/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── models/       # MongoDB schemas
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, error handling
│   │   └── services/     # Business logic
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/             # React application
│   ├── src/
│   │   ├── pages/        # Dashboard, Players, Teams, Matches
│   │   ├── components/   # Reusable UI components
│   │   ├── services/     # API client, data fetching
│   │   ├── types/        # TypeScript interfaces
│   │   ├── context/      # Auth & global state
│   │   └── styles/       # Tailwind CSS
│   ├── index.html
│   └── package.json
│
├── services/ml-service/  # FastAPI ML algorithms
│   ├── main.py           # FastAPI app
│   ├── models/           # Algorithm implementations
│   ├── scripts/          # Data seeding
│   └── requirements.txt
│
└── data/                 # CSV datasets
    ├── nepali_players.csv
    └── european_players.csv
```

---

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
NODE_ENV=development
REDIS_URL=redis://localhost:6379
PORT=3000
```

### Frontend (.env.local)
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AUTH_TOKEN_KEY=fotnep_token
```

### ML Service (.env)
```
MONGO_URI=mongodb+srv://...
PYTHONUNBUFFERED=1
```

---

## Development Commands

### Backend
```bash
npm run dev          # Start dev server with hot-reload
npm run build        # Build for production
npm test             # Run test suite
npm run lint         # ESLint check
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### ML Service
```bash
python -m uvicorn main:app --reload  # Dev server
python -m pytest                      # Run tests
python scripts/seed_db.py             # Seed database
```

---

## Troubleshooting

### Frontend shows black screen
- Check backend is running on :3000
- Check API token in browser console
- Verify MongoDB connection

### API returns 401
- Backend requires JWT token
- Login first to get token
- Add token to `Authorization: Bearer <token>` header

### ML service won't start
- Check Python 3.8+ installed
- Install requirements: `pip install -r requirements.txt`
- Check port 8000 is available

### Port already in use
- Frontend: `lsof -i :3001` to find process
- Backend: `lsof -i :3000`
- ML: `lsof -i :8000`
- Kill with `kill -9 <PID>`

---

## Production Deployment

### Build all services
```bash
cd backend && npm run build
cd frontend && npm run build
cd services/ml-service && pip install -r requirements.txt
```

### Docker (if available)
```bash
docker-compose up -d
```

---

## Next Steps

1. Read [README.md](./README.md) for project overview
2. Read [ALGORITHMS.md](./ALGORITHMS.md) for algorithm details
3. Check `/api/v1` endpoints in backend source code
4. Login to app and explore the interface

---

**Last Updated:** 2026-06-01  
**Current Status:** MVP Ready - Session 5+
