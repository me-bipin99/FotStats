# Frontend Service Documentation

**Location:** `/frontend/`  
**Port:** 3000 (dev server)  
**Framework:** React 19 + TypeScript + Vite + Tailwind CSS v4

## Quick Start

```bash
cd frontend
npm install
npm run dev      # Starts on :3000
```

## Current Implementation State

The frontend is a **dark-themed SPA** with tab-based navigation (no React Router). It currently uses mock data from `src/data/mockData.ts` and has no backend connection yet.

**Active tabs:**
- `home` — Match center: MatchFeed sidebar + MatchDetails main panel
- `compare` — PlayerComparison (Algorithm 2 UI)
- `stats` — PlayerStats (Algorithm 3 UI)
- `lineups` — LineupBuilder (Algorithm 3 UI)

## Architecture

```
src/
├── components/            # All UI components (flat, not nested)
│   ├── Header.tsx         # Navigation + auth (localStorage-based)
│   ├── MatchFeed.tsx      # Match list sidebar with category filter
│   ├── MatchDetails.tsx   # Match scoreboard, prediction, pitch view
│   ├── PlayerComparison.tsx  # Algorithm 2: Side-by-side player compare
│   ├── PlayerStats.tsx    # Player stats display
│   └── LineupBuilder.tsx  # Algorithm 3: Squad optimizer UI
├── data/
│   └── mockData.ts        # Mock teams, players, matches (replace with API)
├── App.tsx                # Root component, tab state, layout grid
├── types.ts               # TypeScript interfaces (Team, Player, Match, etc.)
├── index.css              # Tailwind v4 import + custom animations + scrollbar
└── main.tsx               # Vite entry point
```

## Design System (Dark Theme)

**Colors:**
- Background: `#0d0e10` (near-black)
- Card surfaces: `#151619`
- Text primary: `#cbd5e1` (slate-200)
- Text secondary: `#64748b` (slate-500)
- Interactive: `#10b981` (emerald-500)
- Critical/Win: `#dc2626` (Nepal red)
- Borders: `#1e293b` (slate-800)

**Typography (Google Fonts — loaded in index.css):**
- Body: `Open Sans`
- Display/headings: `Space Grotesk`
- Monospace/stats: `JetBrains Mono`

**Animation:** Uses `motion/react` (Framer Motion) for transitions.

**Tailwind v4:** Configured via `@tailwindcss/vite` plugin (no `tailwind.config.ts`). Theme tokens set inside `@theme {}` in `index.css`.

## Navigation & State

`App.tsx` manages all top-level state:
```typescript
const [activeTab, setActiveTab] = useState<'home' | 'compare' | 'stats' | 'lineups'>('home');
const [selectedMatchId, setSelectedMatchId] = useState<string>('m1');
const [comparisonPlayers, setComparisonPlayers] = useState<Player[]>([...]);
```

No React Router — tab switching is done via `setActiveTab`.

## Auth (Current Implementation)

Auth state lives in `Header.tsx` using `localStorage`:
- `FOTNEP_LOGGED_IN` — stores logged-in username
- `FOTNEP_USERS` — stores user list JSON

This is demo auth. Replace with JWT + `authContext.ts` when backend is ready.

## Types (src/types.ts)

Key interfaces:
```typescript
Player      // id, name, number, position, rating, attributes (pace/shooting/passing/dribbling/defending/physical)
Team        // id, name, shorthand, color, fifaRank, coach, stadium
Match       // id, category, status, homeTeam, awayTeam, homeLineup, predictionVotes
LineupPosition  // player, x, y (pitch coordinates as %)
MatchStats  // possession, shots, shotsOnTarget, corners, fouls, cards
```

## Switching from Mock Data to Backend API

When backend is ready:
1. Create `src/services/api.ts` — HTTP client with JWT auth header
2. Replace `mockData.ts` imports in components with `useEffect` + API calls
3. Move auth from `Header.tsx` localStorage to `authContext.ts` + JWT
4. Add `VITE_API_BASE_URL=http://localhost:3000/api/v1` to `.env.local`

## Available Scripts

```bash
npm run dev        # Vite dev server on :3000 with HMR
npm run build      # Production build to /dist
npm run preview    # Preview production build locally
npm run lint       # TypeScript check (tsc --noEmit)
npm run clean      # Remove dist/ and server.js
```

> **Note:** No test runner is configured yet. Add Vitest when needed.

## Environment Variables (.env.local — not committed)

```
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_AUTH_TOKEN_KEY=fotnep_token
GEMINI_API_KEY=your_key_here        # If using @google/genai features
```

## Key Implementation Patterns

### Pitch coordinate system (MatchDetails, LineupBuilder)
Players positioned with `x, y` as percentage of pitch dimensions (0–100). Home team occupies top half, away team bottom half.

### Category filtering
Matches have `category: 'MEN' | 'WOMEN' | 'DOMESTIC'`. MatchFeed filters by selected category, auto-selects first match of category.

### Prediction votes
`Match.predictionVotes: { home, draw, away }` stores vote counts. MatchDetails renders bar charts from these numbers.

---

**Status:** Core UI implemented (dark theme, mock data)  
**Next:** Connect to backend API, replace localStorage auth with JWT
