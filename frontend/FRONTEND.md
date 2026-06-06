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

Or from repo root: `npm run dev` (starts all 3 services together).

## Current Implementation State

The frontend is a **fully API-connected dark-themed SPA** with tab-based navigation (no React Router). All mock data has been removed — every component fetches from the Express backend on `:3001`.

**Active tabs:**

- `home` — Match center: MatchFeed sidebar + MatchDetails main panel
- `compare` — PlayerComparison (Algorithm 2 UI)
- `stats` — PlayerStats (player search + stat tables)
- `lineups` — LineupBuilder (Algorithm 3 UI)

## Architecture

```
src/
├── components/            # All UI components (flat, not nested)
│   ├── Header.tsx         # Navigation + auth via useAuth()
│   ├── MatchFeed.tsx      # Match list sidebar with category filter
│   ├── MatchDetails.tsx   # Match scoreboard, voting, Algorithm 1 prediction
│   ├── PlayerComparison.tsx  # Algorithm 2: side-by-side player compare
│   ├── PlayerStats.tsx    # Live player search + stat tables
│   └── LineupBuilder.tsx  # Algorithm 3: squad optimizer UI
├── context/
│   └── AuthContext.tsx    # JWT auth provider (login/register/logout + session restore)
├── services/
│   └── api.ts             # Typed HTTP client — all backend calls
├── App.tsx                # Root component: tab state, match list fetch, layout
├── types.ts               # TypeScript interfaces (Team, Player, Match, etc.)
├── index.css              # Tailwind v4 @theme tokens + Google Fonts + animations
└── main.tsx               # Vite entry point — wraps app with <AuthProvider>
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
const [selectedCategory, setSelectedCategory] = useState<'MEN' | 'WOMEN' | 'DOMESTIC' | 'ALL'>('ALL');
const [matches, setMatches] = useState<Match[]>([]);
const [matchesLoading, setMatchesLoading] = useState(true);
const [matchesError, setMatchesError] = useState<string | null>(null);
const [selectedMatchId, setSelectedMatchId] = useState<string>('');
const [comparisonPlayers, setComparisonPlayers] = useState<Player[]>([]);
```

On mount, `App.tsx` calls `getMatches({ limit: 50 })` from `api.ts` and auto-selects the first match. No React Router — tab switching is done via `setActiveTab`.

## Auth

Auth state lives in `src/context/AuthContext.tsx` using real JWT:

- `AuthProvider` wraps the app in `main.tsx`
- On mount, reads `FOTNEP_TOKEN` from `localStorage`, calls `GET /auth/me`, and restores the user — session survives page refresh
- `useAuth()` hook exposes `{ user, isLoggedIn, login, register, logout }`
- Token is stored under key `FOTNEP_TOKEN` in localStorage

## Types (src/types.ts)

Key interfaces:

```typescript
Player      // id, name, number, position, rating, attributes (pace/shooting/passing/dribbling/defending/physical)
Team        // id, name, shorthand, color, coach, stadium
Match       // id, category, status, homeTeam, awayTeam, predictionVotes
LineupPosition  // player, x, y (pitch coordinates as %)
MatchStats  // possession, shots, shotsOnTarget, corners, fouls, cards
```

## Available Scripts

```bash
npm run dev        # Vite dev server on :3000 with HMR
npm run build      # Production build to /dist
npm run preview    # Preview production build locally
npm run lint       # TypeScript check (tsc --noEmit)
npm run clean      # Remove dist/ and server.js
```

## Environment Variables (.env.local — not committed)

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

## Key Implementation Patterns

### API data flow

All data fetched via `src/services/api.ts`. Raw API shapes (`ApiPlayer`, `ApiMatch`, etc.) are adapted to frontend types (`Player`, `Match`) via `adaptPlayer()` / `adaptMatch()` adapters in `api.ts`.

### Pitch coordinate system (MatchDetails, LineupBuilder)

Players positioned with `x, y` as percentage of pitch dimensions (0–100). Home team occupies top half, away team bottom half.

### Category filtering

Matches have `category: 'MEN' | 'WOMEN' | 'DOMESTIC'` derived from the competition name. `MatchFeed` filters by selected category and auto-selects the first matching match.

### Prediction votes

`Match.predictionVotes: { home, draw, away }` stores vote counts. `MatchDetails` renders bar charts from these numbers and allows authenticated users to cast votes via `castVote()`.

---

**Status:** Fully connected to backend API. Mock data removed. Auth persists across page refresh.
