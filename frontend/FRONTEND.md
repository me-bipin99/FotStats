# Frontend Service Documentation

**Location:** `/frontend/`
**Port:** 3000 (dev server)
**Framework:** React 19 + TypeScript + Vite + Tailwind CSS v4
**Favicon:** `frontend/public/football-game.png` served at `/football-game.png` (Vite `public/` root). Declared in `index.html` as `<link rel="icon" type="image/png" href="/football-game.png" />`.

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
│   └── LineupBuilder.tsx  # Algorithm 3: squad optimizer UI — player pool filter + auto-fill
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
Player      // id, name, number, position, nationality?, rating, attributes (pace/shooting/passing/dribbling/defending/physical)
Team        // id, name, shorthand, color, coach, stadium, formation (e.g. '4-3-3')
Match       // id, category, status, homeTeam, awayTeam, homeFormation, awayFormation, homeLineup?, awayLineup?, predictionVotes
LineupPosition  // player, x, y (pitch coordinates as %)
MatchStats  // possession, shots, shotsOnTarget, corners, fouls, cards
```

**Lineup display logic in `MatchDetails.tsx`:**
- LIVE/FINISHED: renders `match.homeLineup` / `match.awayLineup` (populated by backend from seed data)
- UPCOMING: on mount, fetches players by teamId (`getPlayers({ teamId, source:'nepali' })`), calls `optimizeSquad` for both teams in parallel, converts result via `squadToLineup()` helper; shows "Predicting Lineup…" spinner while loading, then renders predicted XI with green "Predicted Lineup by Machine" badge
- Falls back to "Lineups Unavailable" placeholder if ML returns no result

**Pitch coordinate utility:** `src/utils/pitchCoords.ts` — `getFormationCoords(formation, players, isHome)` maps GK→DF→MF→FW ordered players to `{x,y}` percentage coordinates. Home team occupies left half (x: 3–47%), away mirrors right (x: 53–97%). Supports `4-3-3`, `4-4-2`, `4-2-3-1`, `3-5-2`; falls back to `4-3-3`.

**`Player.nationality`** is the raw string from the DB — either `"Nepali"` (Nepali players) or `"xx XXX"` format (European dataset, e.g. `"us USA"`, `"eng ENG"`). `adaptPlayer()` in `api.ts` passes it through directly. The `club` field is set to the populated team name, or `'—'` when no team is available (nationality no longer bleeds into the club field).

`PlayerComparison.tsx` exposes a `shortClubName(club)` helper that strips common prefixes (`FC`, `AC`, `AS`, `RB`, `VfL`, etc.) and returns the first meaningful word — used in both the FUTCard footer and the player-picker dropdown. The dropdown hides the club token entirely when no club is available (i.e. `shortClubName` returns `''`). `PlayerStats.tsx` shows the full `player.club` string in the detail pane — no truncation.

`adaptPlayer()` resolves `club` with this priority: (1) populated `team.name` from the DB ref, (2) `currentClub` raw string stored on the player document (present for both Nepali and European players from the seed CSVs), (3) `'—'` fallback. This means European players (e.g. Harry Kane → "Bayern Munich") display correctly even without a Team document in the DB.

`ApiPlayer` now includes four imputed physical fields (all optional): `height` (cm), `weight` (kg), `preferredFoot` (`'Right' | 'Left' | 'Both'`), `marketValue` (€). `adaptPlayer()` surfaces them with graceful fallbacks: `height` → `"178 cm"` or `'—'`; `weight` → `"71 kg"` or `'—'`; `marketValue` → `"€18,400"` or `'—'`; `preferredFoot` → value from DB or `'Right'` default. These fields are populated at seed time by Algorithm 4 (`services/ml-service/models/attribute_imputer.py`).

**`src/utils/nationality.ts`** — shared `getCountryDisplay(nationality?)` utility. Parses the raw DB nationality string and returns `{ flag: string; code: string }` — a Unicode flag emoji + 3-letter country code. Used by both `PlayerComparison.tsx` and `PlayerStats.tsx`. Special cases handled: `eng/sco/wal/nir` → 🇬🇧, `Nepali/Nepal` → 🇳🇵, standard ISO alpha-2 prefixes → emoji via Regional Indicator codepoints.

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

### LineupBuilder player pool filter

The controls bar exposes three toggle buttons — **All Men**, **Nep Men**, **Nep Women** — that control which player pool is available for manual drafting. Each filter has its own independent lineup state. Clicking a filter (`handleFilterChange`):

1. Snapshots `assignedPlayers` into `savedLineups[currentFilter]`.
2. Restores `savedLineups[newFilter]` into `assignedPlayers` (empty `{}` on first visit).
3. Sets `playerFilter`, clears `selectedSlotId`, fetches the new pool into `allPlayers`.

`savedLineups` is `Record<PlayerFilter, Record<number, Player>>` initialised to `{}` per key. This means switching between **Nep Men** and **All Men** preserves each tab's draft independently — including any auto-fill result from "Fill Default Stars XI".

**Position-balanced pool fetch (`fetchBalancedPool`):** Each filter fetches 4 parallel `getPlayers` calls — one per position — then merges the results. This guarantees GKs are always in the pool regardless of ELO distribution (the backend sorts by ELO desc, so a flat limit excluded low-ELO GKs for "All Men"). Limits: GK 20, DF 60, MF 75, FW 60.

Effective query params per filter:

- `all-men` → `{ gender: 'M', position: <each> }` per position bucket (all sources)
- `nep-men` → `{ source: 'nepali', gender: 'M', position: <each> }`
- `nep-women` → `{ source: 'nepali', gender: 'F', position: <each> }`

The active filter is highlighted in emerald. `loadingFilter` tracks which button is fetching (spinner on that button only); `autoFilling` tracks Algorithm 3 separately. Both disable the filter buttons while in-progress. The sidebar "Fill Default Stars XI" button triggers Algorithm 3 (`optimizeSquad`) with the currently loaded pool and updates `assignedPlayers` for the active filter (saved on next switch).

**Pitch + bench colors:** Driven by `playerFilter === 'nep-women'` (not `isFemalePlayer()`). Nep Women filter → pink gradients for pitch bubbles and bench cards + female avatar. All Men / Nep Men → emerald. The `isFemalePlayer` helper is retained only for the synergy cohesion calculation.

**Drafting list deduplication:** The player picker shown when a slot is selected excludes any player already assigned to another slot on the pitch or bench. `assignedPlayerIds` (a `Set` of ids from `assignedPlayers`) is computed before filtering and used as the first filter predicate.

**Position-priority sort:** When a pitch slot is selected, the picker sorts players by positional relevance first, then by rating descending within each group. Priority order per slot role (defined in `POSITION_PRIORITY` constant): FW → MF,DF,GK | MF → FW,DF,GK | DF → MF,FW,GK | GK → DF,MF,FW. Sub slots have no role constraint — sorted by rating only.

### Prediction votes

`Match.predictionVotes: { home, draw, away }` stores vote counts. `MatchDetails` renders bar charts from these numbers and allows authenticated users to cast votes via `castVote()`.

**Voting UX behaviour:**
- On mount, `triggerPrediction` is called automatically if there are any existing votes (from any user), so Algorithm 1 shows even before the current user votes.
- Clicking a vote button applies an **optimistic update** instantly — `voteOutcome` and `voteCounts` update in state before the API call completes, making bars animate immediately. On error the update rolls back.
- The Algorithm 1 · ML Consensus row is rendered **outside** the voted/unvoted branch — it appears at the bottom of the prediction card for any upcoming/live match whenever `predResult` is available.
- Pre-vote: live crowd vote bars (read-only preview) are shown above the vote buttons whenever `cv1 + cvX + cv2 > 0`.
- Vote buttons are labelled **Win (1) / Draw (X) / Win (2)** — both team wins use "Win".

---

**Status:** Fully connected to backend API. Mock data removed. Auth persists across page refresh.
