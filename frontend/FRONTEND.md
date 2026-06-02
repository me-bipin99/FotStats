# Frontend Service Documentation

**Location:** `/frontend/`  
**Port:** 3001  
**Framework:** React 18 + TypeScript + Vite + Tailwind CSS

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Architecture

```
src/
├── pages/                 # Page components (full page layouts)
│   ├── Dashboard.tsx      # Overview, stats, algorithm previews
│   ├── Players.tsx        # Player list, search, details panel
│   ├── Teams.tsx          # Team cards, squad management
│   ├── Matches.tsx        # Match list, voting, predictions
│   ├── Login.tsx          # Auth page
│   └── NotFound.tsx       # 404 page
├── components/            # Reusable UI components
│   ├── Layout/
│   │   ├── Header.tsx     # Navigation navbar
│   │   └── Sidebar.tsx    # Match feed sidebar
│   ├── Player/
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerStats.tsx
│   │   ├── PlayerComparison.tsx  # Algorithm 2 UI
│   │   └── PlayerTable.tsx
│   ├── Team/
│   │   ├── TeamCard.tsx
│   │   └── LineupBuilder.tsx     # Algorithm 3 UI
│   ├── Match/
│   │   ├── MatchCard.tsx
│   │   ├── MatchDetails.tsx
│   │   └── MatchVoting.tsx       # Algorithm 1 voting UI
│   ├── Forms/
│   │   ├── LoginForm.tsx
│   │   ├── SearchBar.tsx
│   │   └── FilterPanel.tsx
│   ├── Common/
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── ErrorBoundary.tsx
│   └── Charts/
│       ├── StatsChart.tsx
│       └── PredictionChart.tsx
├── services/              # API client & helpers
│   ├── api.ts            # HTTP client with JWT auth
│   ├── comparisonEngine.ts
│   ├── squadOptimizer.ts
│   └── utils.ts
├── types/                # TypeScript interfaces
│   ├── index.ts         # Generated from OpenAPI (heyapi)
│   └── custom.ts        # App-specific types
├── context/              # Global state (Context API)
│   ├── authContext.ts   # JWT token, user auth
│   └── dataContext.ts   # Shared data (players, teams, matches)
├── styles/               # CSS & Tailwind
│   ├── index.css        # Global utilities
│   └── tailwind.config.ts
├── hooks/                # Custom React hooks
│   ├── useAuth.ts       # Authentication
│   ├── usePlayer.ts     # Player data fetching
│   ├── useMatch.ts      # Match data fetching
│   └── useApi.ts        # Generic API hook
├── App.tsx              # Root component with routing
├── main.tsx             # Vite entry point
└── vite-env.d.ts        # Vite type definitions
```

## Generated Types (from OpenAPI)

Run before development to generate API types:

```bash
npm run gen:api
```

This generates `/src/gen/` with auto-generated:
- `types.ts` — All request/response types (Player, Match, Prediction, etc.)
- `services/` — API client methods with proper typing

## Page Components

### Dashboard.tsx
- Display overall stats (total players, teams, matches)
- Show 3 algorithm overview cards
- Recent predictions and votes
- Top voted players

### Players.tsx
- Table/card list of all players
- Filters: position (FW, MF, DF, GK), search by name
- Sort by: eloRating (top priority), appearances, goals, assists
- Click to show player detail panel with full stats

### Teams.tsx
- Cards for each team
- Show team players count
- Current formation
- Click to see full squad with lineup builder (Algorithm 3)

### Matches.tsx
- Upcoming matches at top
- Live matches in middle
- Completed matches below
- Each match card shows:
  - Teams, date, venue
  - Prediction badge (if Algorithm 1 run)
  - Voting widget (Algorithm 1 input)
  - Current vote breakdown

### Login.tsx
- Simple form: email + password
- Submit → JWT token stored in localStorage
- Redirect to Dashboard on success

## Component Details

### MatchVoting.tsx (Algorithm 1 Interface)
```
Input: matchId
Output: User selects home_win/draw/away_win
Displays:
  - Current vote breakdown (pie chart or bars)
  - Current prediction (if available)
  - User's own vote
  - Confidence score
```

### PlayerComparison.tsx (Algorithm 2 Interface)
```
Input: Pick 2 players (dropdown or search)
Output: Side-by-side comparison
Displays:
  - Player stats (6 attributes)
  - Similarity score (0-100%)
  - Tactical pairing insights
  - Strengths/weaknesses
```

### LineupBuilder.tsx (Algorithm 3 Interface)
```
Input: Team + available players + formation preference
Output: Recommended starting XI
Displays:
  - Formation diagram (visual pitch)
  - 11 starting positions
  - Bench recommendations
  - Confidence score
  - Tactical insights
  - Ability to rerun with different formations
```

## Services

### api.ts
HTTP client with:
- Automatic JWT auth header (`Authorization: Bearer <token>`)
- Error handling & token refresh
- Base URL from `VITE_API_BASE_URL` env var

```typescript
// Usage
const players = await api.get('/players', { position: 'FW' });
const prediction = await api.post('/predict-match', { matchId, votes });
```

### comparisonEngine.ts
Client-side helper for Algorithm 2:
- Format player data for display
- Calculate visual differences
- Generate comparison narratives

### squadOptimizer.ts
Client-side helper for Algorithm 3:
- Format formation diagrams
- Highlight starting XI
- Manage constraint inputs

## State Management (Context API)

### authContext.ts
```typescript
interface AuthContext {
  user: User | null
  token: string | null
  login(email, password): Promise<void>
  logout(): void
  isLoading: boolean
  error: string | null
}
```

### dataContext.ts
```typescript
interface DataContext {
  players: Player[]
  teams: Team[]
  matches: Match[]
  loadPlayers(filters): Promise<void>
  loadMatches(status): Promise<void>
  // etc.
}
```

## Environment Variables (.env.local)

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AUTH_TOKEN_KEY=fotnep_token
```

## Design System

**Colors (Light Mode Only):**
- Background: #ffffff
- Text primary: #000000
- Text secondary: #64748b
- Interactive: #10b981 (emerald)
- Critical: #c8102e (Nepal red, wins only)
- Borders: #e5e5e5
- Cards: #ffffff with #e5e5e5 border

**Component Classes (in index.css):**
- `.card` — Card with border, shadow
- `.btn-primary` — Emerald button
- `.btn-secondary` — Gray button
- `.input` — Text input with emerald focus
- `.badge-fwd`, `.badge-mid`, `.badge-def`, `.badge-gk` — Position badges
- `.table-head`, `.table-row` — Table styling
- `.text-stat` — Bold monospace for stats

## Common Development Tasks

### Generate API types from OpenAPI spec
```bash
npm run gen:api
```

### Run dev server
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm run preview  # Test build locally
```

### Type checking
```bash
npm run type-check
```

### Lint
```bash
npm run lint
npm run lint:fix
```

### Testing
```bash
npm test
npm test -- --watch
```

## Testing

- Use **Vitest** for unit tests
- Use **React Testing Library** for component tests
- Use `/verify` skill for manual E2E testing in browser

Example test:
```typescript
describe('PlayerCard', () => {
  it('displays player name and position', () => {
    const { getByText } = render(<PlayerCard player={mockPlayer} />);
    expect(getByText('Ronaldo')).toBeInTheDocument();
    expect(getByText('FW')).toBeInTheDocument();
  });
});
```

## Routing

```typescript
// src/App.tsx
Routes:
  /login → Login.tsx
  /dashboard → Dashboard.tsx
  /players → Players.tsx
  /teams → Teams.tsx
  /matches → Matches.tsx
  /* → NotFound.tsx
```

Redirect `/` → `/dashboard` if authenticated, else → `/login`

## Key Flows

### 1. Login Flow
1. User enters email/password on Login.tsx
2. `useAuth().login()` calls `api.post('/auth/login')`
3. Backend returns JWT token + User object
4. Store token in localStorage & authContext
5. Redirect to Dashboard

### 2. View Players
1. Players.tsx renders with filters
2. `usePlayer()` hook fetches from `/players?position=FW&search=...&sortBy=eloRating`
3. Display table/cards
4. Click player → show detail panel with full stats

### 3. Algorithm 1: Predict Match
1. User on Matches.tsx sees match card
2. MatchVoting.tsx shows current votes
3. User selects outcome (home_win/draw/away_win)
4. Submit → `api.post('/votes', { matchId, outcome })`
5. Frontend calls `/predict-match` with live votes from backend
6. Display prediction + confidence

### 4. Algorithm 2: Compare Players
1. User navigates to PlayerComparison component
2. Selects 2 players via dropdowns
3. Submit → `api.post('/compare-players', { playerAId, playerBId })`
4. Backend calls ML service
5. Display side-by-side comparison with similarity score

### 5. Algorithm 3: Optimize Squad
1. User on Teams.tsx → click team → LineupBuilder
2. Select formation preference (dropdown)
3. Mark injured/suspended players
4. Submit → `api.post('/optimize-squad', { teamId, availablePlayerIds, formation, constraints })`
5. Backend calls ML service
6. Display recommended XI with tactical insights

## Production Checklist

- [ ] All env vars set correctly
- [ ] Backend running on :3000
- [ ] ML service running on :8000
- [ ] npm run build passes
- [ ] npm run type-check passes
- [ ] npm run lint passes
- [ ] Manual E2E testing complete (use `/verify` skill)
- [ ] No console errors in browser

---

**Status:** To be implemented  
**Priority:** Medium-High (implement after backend scaffold)
