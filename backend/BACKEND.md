# Backend Service Documentation

**Location:** `/backend/`
**Port:** 3001 (dev, via `PORT=3001`) · 3000 (default)
**API Base:** `/api/v1`

## Quick Start

```bash
cd backend && PORT=3001 npm run dev
```

Or from repo root: `npm run dev` (starts all 3 services together).

## Architecture

```text
src/
├── controllers/
│   ├── authController.ts        # login, register, me
│   ├── playerController.ts      # listPlayers, getPlayer
│   ├── teamController.ts        # listTeams, getTeam, getTeamLineup
│   ├── matchController.ts       # listMatches, getMatch, createMatch, updateMatch, resolveMatch
│   ├── predictionController.ts  # triggerPrediction, getPrediction, comparePlayersProxy, optimizeSquadProxy
│   └── voteController.ts        # castVote, getMatchVotes, leaderboard
├── models/
│   ├── User.ts
│   ├── Player.ts
│   ├── Team.ts
│   ├── Match.ts
│   ├── Vote.ts
│   └── Prediction.ts
├── routes/
│   ├── auth.ts          # /api/v1/auth
│   ├── players.ts       # /api/v1/players
│   ├── teams.ts         # /api/v1/teams
│   ├── matches.ts       # /api/v1/matches
│   ├── votes.ts         # /api/v1/votes
│   ├── predictions.ts   # /api/v1/predict-match
│   ├── comparisons.ts   # /api/v1/compare-players
│   └── squads.ts        # /api/v1/optimize-squad
├── middleware/
│   ├── authMiddleware.ts   # requireAuth() — hard 401 if no token; softAuth() — sets req.userId if token present, always calls next()
│   └── errorHandler.ts    # standard { error, message } response
├── services/
│   └── mlIntegration.ts   # predictMatch, comparePlayers, optimizeSquad → HTTP to :8000
├── config/
│   └── database.ts        # connectDB() via MONGO_URI
└── index.ts               # Express app setup, rate limiting, route mounting
```

## Key Controllers

### authController.ts

- `login(email, password)` → `{ token, user }`
- `register(email, password, name)` → `{ token, user }`
- `me(req)` → User (requires `requireAuth` — reads `req.userId` from JWT)

### playerController.ts

- `listPlayers(position?, search?, gender?, source?, teamId?, limit, offset)` → `{ players[], total }` — team field is populated (`{ _id, name }`); `source` filters `'nepali'|'european'`; `teamId` (ObjectId string) filters by team assignment
- `getPlayer(id)` → Player — team fully populated

### teamController.ts

- `listTeams()` → `{ teams[] }`
- `getTeam(id)` → Team (with players populated)
- `getTeamLineup(id)` → `{ homeFormation, homeLineup }`

### matchController.ts

- `listMatches(status?, search?, limit, offset)` → `{ matches[], total }` — populates homeTeam, awayTeam, homeLineup.playerId, awayLineup.playerId
- `getMatch(id)` → Match (populates teams + lineups + voteCounts)
- `getMatchLineups(id)` → `{ homeFormation, awayFormation, homeLineup, awayLineup }`
- `createMatch(body)` → Match — requires `homeTeam, awayTeam, date, competition`
- `updateMatch(id, body)` → Match — allowed fields: `date, competition, venue, status, homeFormation, awayFormation, result`
- `resolveMatch(id, result)` → `{ match, votesResolved }` — sets `status=completed`, marks each vote `correct`, increments voter `reputation` (+2 correct / −1 wrong) and `predictionsTotal/predictionsCorrect`

### predictionController.ts

- `triggerPrediction(matchId)` → PredictionResult — requires ≥1 vote; 400 if no votes, 503 if ML down
- `getPrediction(matchId)` → PredictionResult | 404
- `comparePlayersProxy(playerAId, playerBId)` → CompareResult (proxies Algorithm 2)
- `optimizeSquadProxy(teamId, availablePlayerIds, formationPreference, constraints)` → SquadResult (proxies Algorithm 3)

### voteController.ts

- `castVote(matchId, outcome)` → Vote — unique per user per match (upserts on re-vote)
- `getMatchVotes(matchId)` → `{ home_win, draw, away_win, userVote }` — `userVote` is the caller's outcome string or `null`; route uses `softAuth` (no 401 if unauthenticated)
- `leaderboard(limit)` → User[] sorted by reputation desc

## Database Models

### User

```typescript
{
  email: string           // unique, lowercased
  passwordHash: string    // bcrypt
  name: string
  reputation: number      // 0–100, default 50
  predictionsCorrect: number
  predictionsTotal: number
}
```

### Player

```typescript
{
  name: string
  position: 'FW' | 'MF' | 'DF' | 'GK'
  nationality: string
  age: number
  gender: 'M' | 'F'
  height?: number                        // cm — imputed by Algorithm 4a at seed time
  weight?: number                        // kg — imputed by Algorithm 4b at seed time
  preferredFoot?: 'Right' | 'Left' | 'Both'  // imputed by Algorithm 4c at seed time
  marketValue?: number                   // € — imputed by Algorithm 4d (CatBoost) at seed time
  team: Team._id
  stats: { pace, shooting, passing, dribbling, defending, physical }  // 0–100
  careerStats: { appearances, goals, assists, yellowCards, redCards }
  eloRating: number       // default 1600
  source: 'nepali' | 'european'
}
```

### Team

```typescript
{
  name: string
  country: string
  color: string           // hex
  stadium?: string
  coach?: string
  players: [Player._id]
  formation: string       // default '4-3-3'
  founded?: number
}
```

### Match

```typescript
{
  homeTeam: Team._id
  awayTeam: Team._id
  date: Date
  competition: string
  status: 'upcoming' | 'live' | 'completed'
  venue?: string
  homeLineup: [{ playerId, position, shirtNumber }]
  awayLineup: [{ playerId, position, shirtNumber }]
  homeFormation: string
  awayFormation: string
  result?: { homeScore: number; awayScore: number }
}
```

### Vote

```typescript
{
  userId: User._id
  matchId: Match._id
  outcome: 'home_win' | 'draw' | 'away_win'
  correct: boolean | null   // null until resolveMatch() is called
  timestamp: Date
  // unique compound index: (userId, matchId)
}
```

### Prediction

```typescript
{
  matchId: Match._id
  prediction: { homeWinProb, drawProb, awayWinProb }  // 0–1
  confidence: number   // 0–100
  voteBreakdown: { homeWin, draw, awayWin }
  timestamp: Date
}
```

## Security

- **Auth:** JWT via `Authorization: Bearer <token>`. `requireAuth` middleware validates and sets `req.userId`.
- **Rate limiting:** Auth routes (`/api/v1/auth`) — 20 requests per 15 minutes via `express-rate-limit`.
- **Passwords:** bcrypt with 12 salt rounds.

## Environment Variables (.env)

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/fotnep1
JWT_SECRET=fotnep_dev_secret_change_in_prod
JWT_EXPIRY=7d
ML_SERVICE_URL=http://localhost:8000
```

## Error Response Format

```json
{ "error": "ERROR_CODE", "message": "Human readable message" }
```

Key error codes: `INVALID_CREDENTIALS` · `TOKEN_MISSING` · `TOKEN_EXPIRED` · `RATE_LIMITED` · `MATCH_NOT_FOUND` · `PLAYER_NOT_FOUND` · `NO_VOTES` · `ML_UNAVAILABLE` · `INVALID_RESULT`

## Available Scripts

```bash
npm run dev          # tsx watch — hot reload on :3001
npm run build        # tsc → dist/
npm start            # run compiled dist/index.js
npm run type-check   # TypeScript check without emitting
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm test             # Jest
```

---

**Status:** Fully implemented. All 6 controllers active, rate limiting enabled, match resolution + reputation scoring live.
