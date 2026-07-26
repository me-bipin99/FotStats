# Backend Service

**Location:** `backend/`
**Port:** 3001 (dev, set via `PORT=3001`) — 3000 default when PORT is unset
**API Base:** `/api/v1`

## Quick Start

```bash
cd backend && PORT=3001 npm run dev
```

Or from repo root: `npm run dev` starts all three services together.

## Directory Structure

```
src/
├── controllers/
│   ├── authController.ts        # login, register, me
│   ├── playerController.ts      # listPlayers, getPlayer
│   ├── teamController.ts        # listTeams, getTeam, getTeamLineup
│   ├── matchController.ts       # listMatches, getMatch, getMatchLineups, createMatch, updateMatch, resolveMatch
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
│   └── errorHandler.ts    # standard { error, message } response shape
├── services/
│   └── mlIntegration.ts   # predictMatch, comparePlayers, optimizeSquad — thin fetch wrappers to ML service on :8000
├── config/
│   └── database.ts        # connectDB() via MONGO_URI env var
└── index.ts               # Express app setup, CORS, helmet, morgan, rate limiting, route mounting
```

## Controllers

### authController.ts

- `login(email, password)` — returns `{ token, user }` on success; 401 `INVALID_CREDENTIALS` if wrong
- `register(email, password, name)` — returns `{ token, user }` (201); 409 `USER_EXISTS` if email or username already taken (email checked first, then name)
- `me(req)` — returns the authenticated user; requires `requireAuth` middleware; reads `req.userId` from JWT

### playerController.ts

- `listPlayers(position?, search?, gender?, source?, teamId?, sortBy, limit, offset)` — returns `{ players[], total }`; team field populated as `{ _id, name }`; `source` accepts any string (see schema note below); `teamId` accepts an ObjectId string
- `getPlayer(id)` — returns a single Player with team fully populated; 404 if not found

### teamController.ts

- `listTeams()` — returns `{ teams[] }`
- `getTeam(id)` — returns Team with players populated
- `getTeamLineup(id)` — returns `{ homeFormation, homeLineup }`

### matchController.ts

- `listMatches(status?, search?, limit, offset)` — returns `{ matches[], total }`; populates homeTeam, awayTeam, and lineup playerIds; each match includes a `voteCounts` field aggregated live from the Vote collection (overrides the static seeded value so the match list shows real vote totals, matching `getMatch`)
- `getMatch(id)` — returns a single Match with teams, lineups, and a `voteCounts` field appended from the Vote collection
- `getMatchLineups(id)` — returns `{ homeFormation, awayFormation, homeLineup, awayLineup }`
- `createMatch(body)` — requires `homeTeam, awayTeam, date, competition`; returns the new Match document
- `updateMatch(id, body)` — allowed fields: `date, competition, venue, status, homeFormation, awayFormation, result`; returns the updated Match
- `resolveMatch(id, result)` — accepts `result: 'home_win' | 'draw' | 'away_win'`; sets `status: 'completed'` and `outcome: result`; iterates all votes, sets `vote.correct`, increments voter `reputation` (+2 correct / -1 wrong) and `predictionsTotal/predictionsCorrect`; returns `{ match, votesResolved }`

### predictionController.ts

- `triggerPrediction(matchId)` — fetches all votes + voter reputations, calls `mlIntegration.predictMatch()`, upserts result into Prediction collection (explicit field mapping — `prediction`, `confidence`, `voteBreakdown`); 400 if no votes, 503 if ML down
- `getPrediction(matchId)` — returns the latest Prediction document or 404
- `comparePlayersProxy(playerAId, playerBId)` — proxies to Algorithm 2; returns `CompareResult` directly without DB persistence
- `optimizeSquadProxy(teamId, availablePlayerIds, formationPreference, constraints)` — proxies to Algorithm 3; returns `SquadResult` directly without DB persistence

### voteController.ts

- `castVote(matchId, outcome)` — upserts one vote per user per match; outcome: `'home_win' | 'draw' | 'away_win'`; requires `requireAuth`
- `getMatchVotes(matchId)` — returns `{ home_win, draw, away_win, userVote }`; `userVote` is the caller's outcome string or `null`; route uses `softAuth` (no 401 for unauthenticated callers)
- `leaderboard(limit)` — returns Users sorted by reputation descending

## Database Models

### User

```typescript
{
  email: string           // unique, lowercased
  passwordHash: string    // bcrypt, 12 rounds
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
  height?: number                   // cm — imputed by Algorithm 4a at seed time
  weight?: number                   // kg — imputed by Algorithm 4b at seed time
  preferredFoot?: 'Right' | 'Left' | 'Both'  // imputed by Algorithm 4c at seed time
  marketValue?: number              // EUR — imputed by Algorithm 4d (CatBoost) at seed time
  team: Team._id
  stats: { pace, shooting, passing, dribbling, defending, physical }  // 0–100
  careerStats: { appearances, goals, assists, yellowCards, redCards }
  eloRating: number                 // default 1600; computed as 1600 + (avg_attr - 50) * 4
  source: string                    // 'nepali' | 'european' | 'india' | 'bhutan' | 'bangladesh' | 'pakistan'
}
```

Note: the TypeScript interface declares `source` as `'nepali' | 'european'` but the seed scripts write `country.toLowerCase()` for international opponent teams (e.g. `'india'`, `'bhutan'`). The data stores correctly because seed uses pymongo directly (bypasses Mongoose validation). The TypeScript enum should be widened to `string` before production.

### Team

```typescript
{
  name: string
  country: string
  color: string       // hex
  stadium?: string
  coach?: string
  logo?: string       // URL
  players: [Player._id]
  formation: string   // default '4-3-3'
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
  result?: { homeScore: number; awayScore: number }  // set via PATCH /matches/:id after the match
  outcome?: 'home_win' | 'draw' | 'away_win'         // set by resolveMatch(); used for vote scoring
}
```

`result` holds the numeric score (set via `updateMatch`). `outcome` holds the string outcome set by `resolveMatch()` and used to mark votes correct or incorrect. These are separate fields to avoid writing a string to a typed `{ homeScore, awayScore }` subdocument.

### Vote

```typescript
{
  userId: User._id
  matchId: Match._id
  outcome: 'home_win' | 'draw' | 'away_win'
  correct: boolean | null  // null until resolveMatch() is called
  timestamp: Date
  // unique compound index: (userId, matchId)
}
```

### Prediction

```typescript
{
  matchId: Match._id
  prediction: { homeWinProb: number; drawProb: number; awayWinProb: number }  // 0–1
  confidence: number   // 0–100
  voteBreakdown: { homeWin: number; draw: number; awayWin: number }
  timestamp: Date
}
```

## Middleware

- `requireAuth` — validates `Authorization: Bearer <token>` header; sets `req.userId`; returns 401 `TOKEN_MISSING` or `TOKEN_EXPIRED` on failure
- `softAuth` — same JWT validation but always calls `next()`; sets `req.userId` only when token is valid; used on routes that return extra data for authenticated users (e.g. `getMatchVotes` returns `userVote`)

## Security

- JWT signed with `JWT_SECRET`; default expiry `7d`; validated in `requireAuth` and `softAuth`
- Rate limiting on `/api/v1/auth` — 20 requests per 15 minutes via `express-rate-limit`
- Passwords hashed with bcrypt, 12 rounds
- CORS currently uses `cors()` with no origin restriction — must be locked down before production deployment

## Environment Variables

```
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

Key error codes: `INVALID_CREDENTIALS`, `USER_EXISTS`, `TOKEN_MISSING`, `TOKEN_EXPIRED`, `RATE_LIMITED`, `MATCH_NOT_FOUND`, `PLAYER_NOT_FOUND`, `NO_VOTES`, `ML_UNAVAILABLE`, `INVALID_RESULT`

## Available Scripts

```bash
npm run dev          # tsx watch — hot reload on PORT (default 3000, set PORT=3001 for dev)
npm run build        # tsc to dist/
npm start            # run compiled dist/index.js
npm run type-check   # TypeScript check without emitting
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm test             # Jest
```
