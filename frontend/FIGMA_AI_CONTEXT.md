# FotNep (Football Nepal Hub) — Figma AI Reference & UI Design Specification

This document provides a comprehensive, high-fidelity engineering and design specification of the **FotNep** web application. It serves as direct context for **Figma AI** and UI/UX designers to understand the application layout, component structures, visual tokens, responsive boundaries, and dynamic state transitions.

---

## 1. Application Metas & Visual Identity

* **Name**: `FotNep` (Football Nepal Hub)
* **Description**: A premium, data-driven Nepalese football tracking hub and tactical planner covering Men's national matches, Women's tournaments, and Domestic League matches (Nepal Super League & A-Division). It integrates live match timelines, crowdsourced prediction indexes, historical head-to-head player comparisons, sortable roster stats, and a drag-and-drop tactical lineup simulator.
* **Aesthetic Vibe**: Modern, high-impact sports dashboard styled with a dark, premium aesthetic centered around rich off-blacks, slate grays, and highly-saturated emerald-green accents.

---

## 2. Design System & Visual Tokens

Figma AI can map these design variables directly to design styles, layers, and variables within Figma.

### A. Color Palette (Tailwind CSS Configuration Mapping)
* **Backgrounds**:
  * **App Shell / Canvas Background**: `#151619` (Deep Charcoal Slate)
  * **Card & Panel Backgrounds**: `#111216` (Pitch Slate) / `#12141c` (Deep Dark Navy)
  * **Accent Backdrops / Inner Fields**: `#0A0B0E` (Ultra Black Wood)
  * **Pitch Grass Container Background**: `#081a12` (Tactical Meadow Green Overlay)
* **Brand Accents**:
  * **Primary Action / Highlight Accent**: `#10b981` (`emerald-500` / `#10B981`)
  * **Live Match / Pulsing Highlights**: `#34d399` (`emerald-400` / `#34D399`)
  * **Warm Golds (Trophies & Experts)**: `#f59e0b` (`amber-500` / `#F59e0B`)
  * **Alert / Red Card / Outage**: `#f43f5e` (`rose-500` / `#F43F5E`)
* **Borders & Dividers**:
  * **Structural Borders**: `#202124` / `#1e293b` (`border-slate-800` / `border-slate-850`)
  * **High-contrast divider lines**: `#0C0D10` (Dark Charcoal Ink)
* **Typography & Text Fills**:
  * **Primary Titanium Text**: `#f8fafc` (`slate-50`)
  * **Secondary Titanium Text**: `#cbd5e1` (`slate-300`)
  * **Muted Explanatory Labels**: `#64748b` (`slate-500` / `slate-550`)
  * **Disabled / Non-highlighted Markers**: `#475569` (`slate-600`)

### B. Typography Pairings
* **Primary Sans-Serif Font** (`--font-sans`): **Inter** (Excellent for dense tabular stats, user panels, and UI labels).
* **Headings & Title Accent Font**: **Space Grotesk** / **Outfit** (Employed with `font-extrabold` and `tracking-tight` for a premium, aggressive sports feel).
* **Numbers / Badges / System Timers** (`--font-mono`): **JetBrains Mono** / **Fira Code** (Employed for scores, match minutes, database IDs, and accuracy percentages to preserve numerical column tracking).

### C. Spacing System
* Highly calculated variable margins to promote negative space rhythm:
  * **Outer page margins**: `px-4 md:px-6 py-6`
  * **Card layout columns gap**: `gap-4 sm:gap-6`
  * **Form & detail padding**: `p-4 sm:p-5`
  * **Symmetric borders radius**: `rounded-xl` (`12px`) for main modules; `rounded-lg` (`8px`) for buttons, sub-panels.

---

## 3. App Layout Architecture & Grid Mapping

FotNep is implemented inside a responsive, modular layout frame optimized for both widescreen desktops (1280px Grid) and mobile views (Fluid 100% Flex).

### A. App Shell Shell
```
+------------------------------------------------------------------------+
|                                HEADER                                  |
| [FotNep Brand]        [Home] [Compare] [Stats] [Lineups]      [SignIn] |
+------------------------------------------------------------------------+
|                      MAIN APP GRID CONTAINER                           |
|                                                                        |
|  (Left Sidebar - 1/3 Width)     |    (Right Main Frame - 2/3 Width)    |
|  [Category Filters Grid]        |    [Active Match Hero Header Panel]  |
|  (Men, Women, Domestic, All)    |    (Live minute switcher & status)   |
|                                 |                                      |
|  [Match Feed Navigation List]   |    [Dynamic View Content Panel]      |
|  Shows Active, Finished, &     |    - Tab 1: Tactical Field View &     |
|  Upcoming games with scores     |             Substitutes / Prediction |
|  and live minute indicators.    |    - Tab 2: Match Stats (Shots, Pos) |
|                                 |    - Tab 3: Venue/Coach Info Panel   |
+------------------------------------------------------------------------+
```

### B. Responsive Adaptation (Breakpoints)
* **Desktop View (`md:grid-cols-3` / `1024px+`)**: Left Sidebar takes `col-span-1` (Match selection & categories); Right main dashboard frame takes `col-span-2` (Active highlights, stats, tactical pitches).
* **Mobile View (`<1024px`)**: Renders stacked layout. Selecting matches in the Match Feed highlights them and auto-scrolls the page smoothly to the Main Match Details Frame.

---

## 4. Primary Components & Layer Structure

Figma AI can construct layers according to this block structure.

### Component 1: `Header.tsx` (Global Navigation & Auth Module)
* **Branding Logo Group**: Left side, contains a styled white vector circle with stylized soccer hexagon geometry, side-by-side with Space Grotesk display font `"FotNep"`.
* **Middle Navigation Hub**: Center-aligned pill menu, containing hover-triggered tooltip markers for Homepage, Compare Player, Player Stats, and Lineup Planner.
* **Gorkhali Reputation Trigger**: Right side. Demonstrates `"Sign In"` or user profile handle `@username` accompanied by a custom profile avatar bubble.
* **Auth & Leaderboard Dropdown**: Activated on clicking the avatar trigger:
  * Contains Tab items (Sign In / Sign Up) for custom profile logging.
  * Shows **Gorkhali Expert Leaderboard** (sorted by reputation index points).
  * Includes a Sign-Out action trigger with rose red hover highlights.

### Component 2: `MatchFeed.tsx` (Match Feed Navigation Sidebar)
* **Category Selection Pill Grid**: Filter buttons for Men's National team, Women's National team, Domestic state leagues, or ALL games.
* **Feed Item Container**: List of matches, each including:
  * Team shorthand abbreviations + Color Circles representing their jersey colors.
  * Status Badge: `LIVE` (pulsing emerald aura), `FINISHED` (dark matte gray), or `UPCOMING` (teal border).
  * Realtime Goal Scorers lists & mini-minute clock indicators for live games.

### Component 3: `MatchDetails.tsx` (Interactive Dashboard & Match Pitch)
* **Dynamic Score Header**: Large display scores showing active goal ticks, competition logos, stadium information, and Referees list.
* **Sub-Navigation Tabs**: Switchers between `Tactical Lineup`, `Team Stats`, and `Venue/Coach Info`.
* **Tactical Grass Pitch Visualizer**:
  * Styled as a vertical half-pitch or full-pitch landscape framed with white field boundaries and center arcs.
  * Starting eleven markers aligned using absolute coordinates (`x%, y%`). Displays:
    * Player jersey circular icon + number.
    * Split-second player name display badge.
  * **Current Match Feature (Predicted Lineup Overlay)**:
    * For **upcoming (scheduled)** matches, the app displays the hypothetical team structure using identical tactical coordinates.
    * An elegant, glowing floating indicator overlay is dynamically positioned centered at the bottom margin of the field with the text: 
      `Predicted Lineup by Machine` accompanied by an emerald pulse indicator (`animate-pulse`).
    * Hovering over starter positions slides up a dynamic detailed performance panel overlay (Pace, Passing, Dribbling, etc.).
* **Weighted Prediction Voting Panel**:
  * Interactive predictions index allowing users to cast prediction votes (Home Win / Draw / Away Win).
  * Weighted voting logic: Computes accuracy multipliers based on user reputational index (e.g. Expert weight index of x4 scales the calculation).
  * Shows real-time percentage progress bars matching user votes dynamically.

### Component 4: `PlayerComparison.tsx` (Head-to-Head Comparison Tool)
* **Dual Selector Slots**: Two columns matching Slot A and Slot B comparison panels.
* **Bento Roster selectors**: Filterable databases where clicking a star or roster midfielder loads them directly into either slot.
* **Attribute Comparison Grid**: Comparison charts contrasting Age, Weight, Market Value, International Caps, Yellow/Red cards, Preferred Foot, Goals, Assists.
* **Spider/Radar Grid Metrics**: Detailed attribute ratings for Pace, Passing, Dribbling, Defending, Physical, Shooting, and goalkeeper indices (GK Saving, GK Handling). High-performing attributes highlight dynamically in emerald fills.

### Component 5: `PlayerStats.tsx` (Performance Roster Leaderboards)
* **Leaderboards Row Grid**: Three balanced vertical panels showcasing:
  1. **Golden Boot Award (Top Scorers)**.
  2. **Playmaker Award (Top Assists)**.
  3. **Discipline Leaderboard (Yellow & Red cards)**.
* **Detailed Roster Table**: Sortable database table displaying list of all squad players with columns for Position, Team colors, Played Matches, rating out of 10.

### Component 6: `LineupBuilder.tsx` (Custom Tactical Field Planner)
* **Interactive Formation Selection Pill Group**: Custom pre-sets mapping 4-4-2, 4-3-3, 3-5-2 formats. Moving sliders instantly updates defensive, midfield, and forward position arrangements.
* **Drag/Click Position Map**: Interactive green canvas allowing users to click squad positions to assign any global/Nepalese player from a side-scrolling list.
* **Team Synergy Score Gauge**: Multi-variable index counting synthetic team ratings, overall score calculations based on selected active combinations.

---

## 5. Interaction Paradigms & Local Storage Sync

* **Shared Auth Hub**: Signing in via the dropdown triggers custom event frames (`fotnep-auth-change`) which keep predictions, voting weight multipliers, and reputation index meters perfectly synchronized in real-time across multiple components.
* **Match Simulation Fast-Forward Engine**: A custom tool inside upcoming/finished screens allows developers or testers to simulate immediate goals or finish live matches, testing UI updates instantly.
* **Client-side LocalStorage Persistences**:
  * `FOTNEP_LOGGED_IN`: Active logged-in user handle.
  * `FOTNEP_USERS`: List of accounts, expert indicators, and points.
  * `FOTNEP_PREDICTIONS`: User voted items indexed by `matchID`.
  * `FOTNEP_MATCH_OVERRIDES`: Interrupted simulation states.

---

## 6. TypeScript Interface Schemas

These interfaces serve as the definitive "schema of truth" for code-integration in Figma DevMode or Figma AI design files:

```typescript
export interface Team {
  id: string;
  name: string;
  shorthand: string;
  color: string;           // Hex color code (e.g. '#2563EB')
  secondaryColor: string;  // Hex color code for away stripes
  rating: number;          // Out of 10
  fifaRank?: number;
  coach: string;
  stadium: string;
  stadiumCapacity: string;
}

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  gkSaving?: number;       // Conditional for Goalkeepers
  gkHandling?: number;     // Conditional for Goalkeepers
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  positionDetail: string;  // e.g. 'Center Back', 'Striker', 'Central Midfielder'
  rating: number;          // Out of 10
  age: number;
  height: string;
  weight: string;
  marketValue: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
  preferredFoot: 'Right' | 'Left' | 'Both';
  club: string;
  photoUrl?: string;
  attributes: PlayerAttributes;
}

export interface LineupPosition {
  player: Player;
  x: number;               // Width coordinates (0 to 100 percentage layout)
  y: number;               // Height coordinates (0 to 100 percentage layout)
}

export interface TeamLineup {
  formation: string;       // e.g. '4-3-3', '4-4-2'
  starters: LineupPosition[];
  substitutes: Player[];
}

export interface MatchStats {
  possession: [number, number];   // [Home%, Away%]
  shots: [number, number];        // [Home, Away]
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export interface Match {
  id: string;
  category: 'MEN' | 'WOMEN' | 'DOMESTIC';
  competition: string;
  date: string;
  time: string;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING';
  minute?: number;
  venue: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  stats?: MatchStats;
  homeLineup?: TeamLineup;
  awayLineup?: TeamLineup;
  predictionVotes: {
    home: number;
    draw: number;
    away: number;
  };
}
```

---

*This document was generated live to represent current system design parameters and codebase layouts.*
