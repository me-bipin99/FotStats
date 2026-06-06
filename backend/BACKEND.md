# Backend Service Documentation

**Location:** `/backend/`  
**Port:** 3000  
**API Base:** `/api/v1`

## Quick Start

```bash
cd backend
npm install
npm run dev
```

## Architecture

```
src/
├── controllers/       # Request handlers (maps to OpenAPI paths)
│   ├── authController.ts
│   ├── playerController.ts
│   ├── teamController.ts
│   ├── matchController.ts
│   ├── predictionController.ts
│   ├── comparisonController.ts
│   ├── squadController.ts
│   └── voteController.ts
├── models/           # MongoDB schemas
│   ├── User.ts
│   ├── Player.ts
│   ├── Team.ts
│   ├── Match.ts
│   ├── Prediction.ts
│   ├── Vote.ts
│   └── index.ts
├── routes/           # API route definitions
│   ├── auth.ts
│   ├── players.ts
│   ├── teams.ts
│   ├── matches.ts
│   ├── predictions.ts
│   ├── comparisons.ts
│   ├── squad.ts
│   └── votes.ts
├── middleware/       # Auth, error handling, logging
│   ├── authMiddleware.ts
│   ├── errorHandler.ts
│   └── requestLogger.ts
├── services/         # Business logic & ML integration
│   ├── mlIntegration.ts      # Calls to ML service (:8000)
│   ├── reputationEngine.ts   # Reputation calculation
│   └── dataValidation.ts
├── config/           # Configuration
│   ├── database.ts
│   └── environment.ts
└── index.ts          # Express app setup
```

## Key Controllers

### authController.ts
- `login(email, password)` → JWT token + User
- `register(email, password, name)` → JWT token + User
- `me(req)` → User (requires `requireAuth` — reads `req.userId` from JWT)

### playerController.ts
- `listPlayers(position?, search?, sortBy, limit, offset)` → Player[]
- `getPlayer(id)` → Player
- `getPlayerStats(id)` → Player + Predicted Stats
- `createPlayer(data)` → Player (for seeding)

### teamController.ts
- `listTeams()` → Team[]
- `getTeam(id)` → Team
- `getTeamLineup(id)` → Lineup with formation

### matchController.ts
- `listMatches(status?, limit)` → Match[]
- `getMatch(id)` → Match
- `getMatchLineups(id)` → Home/Away lineups
- `completeMatch(id, homeScore, awayScore)` → Updated match

### predictionController.ts
- `predictMatch(matchId, votes[])` → MatchPrediction (calls ML service)
- `getPredictionHistory(matchId)` → Prediction[]

### comparisonController.ts
- `comparePlayer(playerAId, playerBId)` → PlayerComparison (calls ML service)

### squadController.ts
- `optimizeSquad(teamId, availablePlayerIds, formation?, constraints)` → SquadOptimization (calls ML service)

### voteController.ts
- `submitVote(userId, matchId, outcome)` → Vote
- `getVotes(matchId)` → Vote[]
- `getLeaderboard(limit)` → User[] sorted by reputation

## Database Models

### User
```typescript
{
  _id: ObjectId
  email: string (unique, indexed)
  passwordHash: string (bcrypt)
  name: string
  reputation: number (0-100, default 50)
  predictionsCorrect: number
  predictionsTotal: number
  createdAt: Date
  updatedAt: Date
}
```

### Player
```typescript
{
  _id: ObjectId
  name: string
  position: 'FW' | 'MF' | 'DF' | 'GK'
  nationality: string
  age: number
  team: string (Team._id)
  gender: string ('M' | 'F')
  stats: {
    pace: number (0-100)
    shooting: number
    passing: number
    dribbling: number
    defending: number
    physical: number
  }
  careerStats: {
    appearances: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
  eloRating: number (starting 1600)
  source: 'nepali' | 'european'
  rawDataPath: string (path to CSV in /data/raw if nepali)
  createdAt: Date
}
```

### Team
```typescript
{
  _id: ObjectId
  name: string
  country: string
  founded: number
  color: string (hex, e.g. '#ff0000')
  stadium: string
  coach: string
  players: [Player._id]
  formation: string (default '4-3-3')
  createdAt: Date
}
```

### Match
```typescript
{
  _id: ObjectId
  homeTeam: Team._id
  awayTeam: Team._id
  date: Date
  competition: string
  status: 'upcoming' | 'live' | 'completed'
  venue: string
  homeLineup: [{ playerId, position, shirtNumber }]
  awayLineup: [{ playerId, position, shirtNumber }]
  homeFormation: string
  awayFormation: string
  result: {
    homeScore: number
    awayScore: number
  } (only if completed)
  createdAt: Date
}
```

### Vote
```typescript
{
  _id: ObjectId
  userId: User._id
  matchId: Match._id
  outcome: 'home_win' | 'draw' | 'away_win'
  correct: boolean (null until match resolves, then true/false)
  timestamp: Date
}
```

### Prediction
```typescript
{
  _id: ObjectId
  matchId: Match._id
  prediction: {
    homeWinProb: number (0-1)
    drawProb: number
    awayWinProb: number
  }
  confidence: number (0-100)
  voteBreakdown: {
    homeWin: number
    draw: number
    awayWin: number
  }
  timestamp: Date
}
```

## ML Service Integration (mlIntegration.ts)

All 3 algorithms are called via HTTP to ML Service (:8000):

```typescript
// Example function
async function predictMatch(
  matchId: string,
  votes: Array<{ userId: string; outcome: string; reputation: number }>
): Promise<MatchPrediction> {
  const response = await fetch('http://localhost:8000/predict-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matchId, votes })
  });
  return response.json();
}
```

## Environment Variables (.env)

```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fotnep
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=7d
NODE_ENV=development
PORT=3000

# ML Service
ML_SERVICE_URL=http://localhost:8000

# Optional
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

## Common Development Tasks

### Seed database with test data
```bash
cd ../services/ml-service
python scripts/seed_db.py
```

### Run tests
```bash
npm test                 # All tests
npm test -- --watch     # Watch mode
npm test -- auth        # Specific file
```

### Lint and format
```bash
npm run lint            # Check
npm run lint:fix        # Auto-fix
```

### Build for production
```bash
npm run build
NODE_ENV=production npm start
```

## Testing

- Use **Jest** for unit & integration tests
- Mock ML service in tests (don't call :8000 during tests)
- Use **supertest** for endpoint testing
- Test database: Use separate MongoDB test database in .env.test

Example test structure:
```typescript
describe('POST /api/v1/auth/login', () => {
  it('should return JWT token on valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@fotnep.com', password: 'fotnep2025' });
    
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
```

## Error Handling

All errors return standard format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": {}
}
```

Error codes:
- `INVALID_CREDENTIALS` — Login failed
- `TOKEN_EXPIRED` — JWT expired
- `PLAYER_NOT_FOUND` — Player doesn't exist
- `INVALID_INPUT` — Request validation failed
- `ML_SERVICE_ERROR` — Algorithm computation failed
- `DB_ERROR` — Database operation failed

## Deployment

1. Build: `npm run build`
2. Set production `.env`
3. Run: `NODE_ENV=production npm start`
4. Or use Docker: `docker build -t fotnep-backend .` (requires Dockerfile)

---

**Status:** To be implemented  
**Priority:** High - Backend must run before frontend
