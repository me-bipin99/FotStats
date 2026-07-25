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

```text
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

**Radius scale (unslop-ui pass):** the app previously reached for `rounded-full`/`rounded-2xl` almost everywhere (an AI-slop tell flagged by the `unslop-ui` skill scanner). Deliberate scale now in use: top-level panels/canvases (comparison panel, pitch canvas, sidebar draft panel) use `rounded-xl`; small text badges/chips that aren't true status indicators (FUTCard rating badge, "Play Direction" legend, radar-chart legend pills, LineupBuilder player rating pill) use `rounded-md`. `rounded-full` is kept only for genuinely circular elements: avatars/player-number discs, status pills (LIVE badge, "Predicted Lineup by Machine" badge), decorative blur orbs, pitch center-circle markings, progress-bar tracks, and small indicator dots — those aren't part of the "everything is maximally rounded" tell, they're supposed to be round.

**`slate-850` custom shade:** `--color-slate-850: #172033` is defined in `@theme {}` (between default `slate-800`/`#1e293b` and `slate-900`/`#0f172a`). It was used throughout the app (`border-slate-850`, `bg-slate-850`, etc. — dozens of call sites) before this token existed; Tailwind v4 silently dropped the undefined utility, and its `border` base class still applied `border-color: currentColor`, which rendered as a stray light/white border in the dark theme (e.g. the LineupBuilder controls bar). Defining the token retroactively fixed every existing `slate-850` usage app-wide in one change — no need to touch individual class strings.

**`brand` color scale (Nepal-flag blue):** `--color-brand-{300,400,500,600,800,900,950}` defined in `@theme {}`, anchored at `brand-500: #1e4fa3` (sampled from the Nepal flag) as the new primary interactive accent — see `docs/superpowers/specs/2026-07-25-unslop-frontend-redesign-design.md`. Being rolled out per-component to replace `emerald-{N}` (same shade number swap, e.g. `text-emerald-400` → `text-brand-400`) wherever the role is brand/interactive rather than data or semantic. `amber` (stock Tailwind scale, no new token needed) is the data-accent role for stat bars/chart series; `rose`/`red` keeps its win/live/error role unchanged. See the per-component notes below as each is converted.

**`App.tsx` / `Header.tsx` converted (brand-blue pass):** every `emerald-{N}` → `brand-{N}` (logo accent, active nav tab + underline, welcome-banner ping dot, account avatar ring, dropdown accents, leaderboard highlight row, Sign In/Sign Up toggle, input focus rings, submit buttons). `App.tsx`'s broken `text-slate-450`/`hover:text-emerald-450` (invalid shade numbers, same bug class as the old `slate-850` issue) normalized to `text-slate-500`/`hover:text-brand-500`. Buttons that pair a `bg-brand-500` background with light text now use `text-white` instead of the old `text-black` (`#1e4fa3` is a dark blue — black text on it fails contrast). Header's account dropdown (`motion.div` fade/scale-in) is now wrapped in `<MotionConfig reducedMotion="user">`, so it automatically respects the OS `prefers-reduced-motion` setting without a manual media-query hook.

**Scrollbar layout shift fix:** `html { overflow-y: scroll; }` is set in `index.css` so the scrollbar gutter is always reserved. Without this, switching from the stats page (tall content, scrollbar visible) to shorter pages caused the sticky navbar to shift ~15px horizontally as the scrollbar appeared/disappeared.

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

`comparisonPlayers` is a two-slot array where index `0` = slot A, index `1` = slot B. `handleClearCompareSlot` nulls out only the specified index — it does **not** shift the other player or call `filter(Boolean)`, so clearing slot A leaves slot B intact at index 1.

On mount, `App.tsx` calls `getMatches({ limit: 50 })` from `api.ts` and auto-selects the first match. No React Router — tab switching is done via `setActiveTab`.

## Auth

Auth state lives in `src/context/AuthContext.tsx` using real JWT:

- `AuthProvider` wraps the app in `main.tsx`
- On mount, reads `FOTNEP_TOKEN` from `localStorage`, calls `GET /auth/me`, and restores the user — session survives page refresh
- `useAuth()` hook exposes `{ user, isLoggedIn, login, register, logout }`
- Token is stored under key `FOTNEP_TOKEN` in localStorage
- **`register` does NOT auto-login** — `AuthContext.register()` calls the API and returns; it discards the token. On success, `Header.tsx` sets `signupSuccess = true`, switches `authMode` to `'signin'`, and shows a "Registered! Account created. Please sign in." banner (no emoji — the 🎉 was removed from both the signup-success and login-success banners as an unslop-ui pass). The user must sign in manually after registering.
- Duplicate email → backend returns 409 `"An account with this email already exists"`. Duplicate username → `"Username is already taken"`. Both surface as `authError` in the signup form.

**Header nav bar:** `navItems` in `Header.tsx` is plain `{ id, label }` — no `icon` field. Nav buttons render label text only (no `lucide-react` icons). The live UTC clock (`systime` state + `setInterval`) has been removed entirely, including its mobile badge and the desktop badge next to the user avatar. Inactive (unselected) nav tab text is `text-slate-300` (brightened from the original `text-slate-500` for legibility now that there's no icon).

## Types (src/types.ts)

Key interfaces:

```typescript
Player      // id, name, number, position, nationality?, rating, attributes (pace/shooting/passing/dribbling/defending/physical)
Team        // id, name, shorthand, color, coach, stadium, formation, logo?, country? (passed through from ApiTeam; used by MatchDetails fetchPool to choose the right player source for ML lineup prediction)
Match       // id, category, status, homeTeam, awayTeam, homeFormation, awayFormation, homeLineup?, awayLineup?, predictionVotes
LineupPosition  // player, x, y (pitch coordinates as %)
MatchStats  // possession, shots, shotsOnTarget, corners, fouls, cards
```

**Lineup display logic in `MatchDetails.tsx`:**

- LIVE/FINISHED: renders `match.homeLineup` / `match.awayLineup` (populated by backend from seed data)
- UPCOMING: always uses ML prediction (`predictedHome` / `predictedAway`) — never uses the pre-seeded lineup from DB, even if one exists. On mount fetches players by teamId, calls `optimizeSquad` for both teams via `Promise.allSettled`, converts result via `squadToLineup()`. Shows "Predicting Lineup…" spinner while loading, then renders predicted XI with green **"PREDICTED LINEUP BY MACHINE"** badge at pitch bottom.
- `isPredicted` is `true` for all UPCOMING matches (badge always shows)
- **No-flicker switching:** lineup state is a single `predCache` object `{ matchId, home, away }`. `predictedHome`/`predictedAway` are derived as `null` whenever `predCache.matchId !== match.id`, and `lineupLoading` is derived as `match.status === 'UPCOMING' && predCache.matchId !== match.id` — so the moment a new match is selected, stale content is never shown and the spinner appears in the same render cycle, not a frame later.
- Falls back to "Lineups Unavailable" only when both ML calls fail
- **Player rating badge on pitch nodes:** only rendered when `!isPredicted` (i.e. LIVE/FINISHED matches with real lineups) — UPCOMING predicted lineups show no rating badge since there's no real match rating yet. When shown, the badge is `text-[10px]` (up from `text-[8px]`) with no `scale-95`, for legibility. Color comes from `getRatingColorClass(rating)`: `< 5` red (`bg-rose-500`), `5–6.9` yellow (`bg-yellow-500`), `>= 7` green (`bg-emerald-500`), perfect `10` blue (`bg-blue-500`).
- **Player name label on pitch nodes:** `text-[10.5px]` (up from `text-[8px]`), `max-w-[80px]` (up from `70px`), for legibility.
- **Hovered player detail card** renders inside a fixed `h-14` wrapper below the pitch — the wrapper always occupies space so the card appearing/disappearing on hover does not cause layout shift (page shake).
- **UPCOMING predicted lineup fallback:** `fetchPool(team)` queries by `teamId` first; if fewer than 11 players are returned it falls back using `team.country`: Nepal teams fall back to `source: 'nepali'`; international teams (India, Bhutan, etc.) fall back to `source: team.country.toLowerCase()` (e.g. `'india'`, `'bhutan'`). This matches how `seed_missing_players.py` stores player source values. Both `getPlayers` and the backend `listPlayers` accept any string for `source`.

**Pitch coordinate utility:** `src/utils/pitchCoords.ts` — `getFormationCoords(formation, players, isHome)` maps GK→DF→MF→FW ordered players to `{x,y}` percentage coordinates. Home team occupies left half (x: 3–47%), away mirrors right (x: 53–97%). Supports `4-3-3`, `4-4-2`, `4-2-3-1`, `3-5-2`; falls back to `4-3-3`.

**`Player.nationality`** is the raw string from the DB — either `"Nepali"` (Nepali players) or `"xx XXX"` format (European dataset, e.g. `"us USA"`, `"eng ENG"`). `adaptPlayer()` in `api.ts` passes it through directly. The `club` field is set to the populated team name, or `'—'` when no team is available (nationality no longer bleeds into the club field).

`PlayerComparison.tsx` — the two player slot blocks (`CANDIDATE A` / `CANDIDATE B`) both have `min-h-[270px]` on their outer wrapper. The empty dashed placeholder also uses `h-full min-h-[270px]` so both empty and populated states occupy the same height, preventing layout shift when a player is selected or deselected.

`PlayerComparison.tsx` bio grid (`renderBioGrid`) no longer shows the 👤 icon box before the player name, and the `SoccerJersey` SVG has been removed. In its place is a small circular X button (top-right of the bio row) that calls `onClearSlot('A'|'B')` to deselect the player and return the slot to the empty picker state.

`PlayerComparison.tsx` exposes a `shortClubName(club)` helper that strips common prefixes (`FC`, `AC`, `AS`, `RB`, `VfL`, etc.) and returns the first meaningful word — used in both the FUTCard footer and the player-picker dropdown. The dropdown hides the club token entirely when no club is available (i.e. `shortClubName` returns `''`). `PlayerStats.tsx` shows the full `player.club` string in the detail pane — no truncation.

`adaptPlayer()` resolves `club` with this priority: (1) populated `team.name` from the DB ref, (2) `currentClub` raw string stored on the player document (present for both Nepali and European players from the seed CSVs), (3) `'—'` fallback. This means European players (e.g. Harry Kane → "Bayern Munich") display correctly even without a Team document in the DB.

`ApiPlayer` now includes four imputed physical fields (all optional): `height` (cm), `weight` (kg), `preferredFoot` (`'Right' | 'Left' | 'Both'`), `marketValue` (€). `adaptPlayer()` surfaces them with graceful fallbacks: `height` → `"178 cm"` or `'—'`; `weight` → `"71 kg"` or `'—'`; `marketValue` → `"€18,400"` or `'—'`; `preferredFoot` → value from DB or `'Right'` default. These fields are populated at seed time by Algorithm 4 (`services/ml-service/models/attribute_imputer.py`).

**`src/utils/nationality.ts`** — shared `getCountryDisplay(nationality?)` utility. Parses the raw DB nationality string and returns `{ flag: string; code: string }` — a Unicode flag emoji + 3-letter country code. Used by both `PlayerComparison.tsx` and `PlayerStats.tsx`. Maintains a `TO_ISO2` lookup table covering ~80 3-letter football/FIFA prefixes (e.g. `esp`→`ES`, `ger`→`DE`, `fra`→`FR`, `ned`→`NL`, `hrv`→`HR`, `dnk`→`DK`, UK home nations→`GB`, etc.) so that generated players stored as `"esp ESP"` or `"ger GER"` resolve to the correct flag emoji. 2-letter ISO prefixes (e.g. `"es ESP"`, `"fr FRA"`) are handled directly without a table lookup.

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

Matches have `category: 'MEN' | 'WOMEN' | 'DOMESTIC'` derived from the competition name. `MatchFeed` filters by selected category and auto-selects the first matching match. The category buttons are text-only (`Men's` / `Women's` / `Domestic`) — the custom cartoon SVG icons (`MensShootIcon`, `WomensFootballPlayerIcon`, `DomesticSoccerPlayerIcon`) have been removed.

**Match card (MatchFeed):** team logo `<img>`s are shown when `match.homeTeam.logo` / `match.awayTeam.logo` is set, falling back to the color-coded shorthand-letter badge on load error (`onError` swaps to the sibling badge div). The per-card "Votes: N" footer badge (`predictionVotes` total) has been removed.

**`MatchFeed.tsx` converted (brand-blue pass):** every `emerald-{N}` → `brand-{N}`: the `DOMESTIC` category filter's active/hover color (its broken `hover:text-emerald-350` also normalized in the same swap), search-input focus ring, the `ALL/FINISHED/UPCOMING` active status tab (`bg-brand-500 text-white`, not `text-black` — see the text-pairing note above), selected match-card border/shadow, the LIVE badge, the upcoming-match date text, and the winning-team score highlight. The `MEN`'s `rose` and `WOMEN`'s `amber` category colors are unchanged — that's a pre-existing 3-way category scheme, not part of the brand/data swap. The score/kickoff-time box's background+border was also dropped in favor of plain centered text (declutter pass, same visual role as the earlier logo/vote-count cleanup).

**Status filter tabs (MatchFeed):** the `LIVE` tab has been removed from the filter row — only `All` / `Finished` / `Upcoming` are shown, since live-match tracking is not yet implemented. `FilterStatus` type still includes `'LIVE'` (matches can still carry that status and show the pulsing live badge on their card), but it's no longer a selectable filter tab.

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

**"Tactics Dashboard Active" idle state:** When no slot is selected the sidebar shows this heading, a description, and the Auto Pick XI button. The icon box that previously held a `Clipboard` icon has been removed. The `showNotification` toast banner (showed formation + confidence % after auto-fill) has been removed — the auto-fill result is visible directly on the pitch with no extra UI.

**Drafting panel player list height:** The scrollable player list uses `max-h-[calc(100vh-290px)]` (viewport-relative) instead of a fixed `max-h-[350px]`, so it fills the available panel height on any screen size.

**Drafting list deduplication:** The player picker shown when a slot is selected excludes any player already assigned to another slot on the pitch or bench. `assignedPlayerIds` (a `Set` of ids from `assignedPlayers`) is computed before filtering and used as the first filter predicate.

**Position-priority sort:** When a pitch slot is selected, the picker sorts players by positional relevance first, then by rating descending within each group. Priority order per slot role (defined in `POSITION_PRIORITY` constant): FW → MF,DF,GK | MF → FW,DF,GK | DF → MF,FW,GK | GK → DF,MF,FW. Sub slots have no role constraint — sorted by rating only.

### PlayerStats empty search state

When a search returns no results, `PlayerStats.tsx` keeps the sidebar (search input + filter buttons) fully visible and shows a "No player available for that name" message in the detail panel instead of replacing the whole component. The early-return fallback that hid everything was removed; the detail panel now uses a ternary — empty state when `!selectedPlayer`, full profile when a player is selected.

### PlayerStats category filter

The filter bar in `PlayerStats.tsx` has three buttons — **All**, **Nep Men's**, **Nep W** — mapped to internal state `'ALL' | 'MEN' | 'WOMEN'`.

| Button    | API params                                                       |
| --------- | ---------------------------------------------------------------- |
| All       | `{ gender: undefined, source: undefined }` — all players         |
| Nep Men's | `{ gender: 'M', source: 'nepali' }` — Nepali male players only   |
| Nep W     | `{ gender: 'F', source: 'nepali' }` — Nepali female players only |

### Prediction votes

`Match.predictionVotes: { home, draw, away }` stores vote counts. `MatchDetails` renders bar charts from these numbers and allows authenticated users to cast votes via `castVote()`.

**Voting UX behaviour:**

- On mount, `triggerPrediction` is called automatically if there are any existing votes (from any user), so Algorithm 1 shows even before the current user votes.
- Clicking a vote button applies an **optimistic update** instantly — `voteOutcome` and `voteCounts` update in state before the API call completes, making bars animate immediately. On error the update rolls back.
- The Algorithm 1 · ML Consensus row is rendered **outside** the voted/unvoted branch — it appears at the bottom of the prediction card for any upcoming/live match whenever `predResult` is available.
- Pre-vote: live crowd vote bars (read-only preview) are shown above the vote buttons whenever `cv1 + cvX + cv2 > 0`.
- The vote-restore effect (`getMatchVotes` → `userVote` → `voteOutcome`) depends on `[match.id, auth.user?.id]` — re-fetches when the logged-in user changes (login/logout) without a page reload, so "Prediction Registered" reflects the current user's stored vote immediately, not just on refresh or match switch.
- Vote buttons are labelled **Win (1) / Draw (X) / Win (2)** — both team wins use "Win".

---

**Status:** Fully connected to backend API. Mock data removed. Auth persists across page refresh.
