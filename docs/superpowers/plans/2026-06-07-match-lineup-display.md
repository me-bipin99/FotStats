# Match Lineup Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the actual tactical lineup on the pitch for LIVE/FINISHED matches, and show an ML-predicted starting XI for UPCOMING matches using the team's available players.

**Architecture:** Three layers change together: (1) seed_db.py builds real lineups for live/completed matches, (2) the backend populates those player refs when listing matches, (3) the frontend renders populated lineups directly for LIVE/FINISHED and calls `/optimize-squad` on mount for UPCOMING to get predicted XI, converting both to pitch coordinates via a shared utility.

**Tech Stack:** Python/pymongo (seed), Express/Mongoose (backend), React 19 + TypeScript + Vite + Tailwind v4 (frontend), FastAPI ML service (optimize-squad)

---

## Files Map

| File | Action | What changes |
|------|--------|-------------|
| `frontend/src/utils/pitchCoords.ts` | **Create** | Formation → `{x, y}` pitch coordinate utility |
| `services/ml-service/scripts/seed_db.py` | **Modify** | Add `_build_lineup` helper; populate lineups for live/completed matches; add one live match |
| `backend/src/controllers/matchController.ts` | **Modify** | Populate `homeLineup.playerId` + `awayLineup.playerId` in `listMatches` |
| `backend/src/controllers/playerController.ts` | **Modify** | Add `teamId` query filter |
| `frontend/src/types.ts` | **Modify** | Add `formation` to `Team`; add `homeFormation`/`awayFormation` to `Match` |
| `frontend/src/services/api.ts` | **Modify** | Pass `formation` through `adaptTeam`; add `adaptLineup`; update `adaptMatch`; add `teamId` to `getPlayers` |
| `frontend/src/components/MatchDetails.tsx` | **Modify** | Fetch predicted lineup for UPCOMING matches via `optimizeSquad`; render for all statuses |

---

## Task 1: Pitch coordinate utility

**Files:**
- Create: `frontend/src/utils/pitchCoords.ts`

- [ ] **Step 1: Create the file**

```typescript
// frontend/src/utils/pitchCoords.ts

// Home team occupies left half (x: 3–47%), away mirrors right (x: 53–97%).
// y is top-to-bottom (0–100%). Coordinates are percentage of pitch dimensions.

type Coord = { x: number; y: number };
type SlotMap = Record<string, Coord[]>;

const FORMATION_COORDS: Record<string, SlotMap> = {
  '4-3-3': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 18 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 82 }],
    MF: [{ x: 33, y: 25 }, { x: 33, y: 50 }, { x: 33, y: 75 }],
    FW: [{ x: 44, y: 20 }, { x: 44, y: 50 }, { x: 44, y: 80 }],
  },
  '4-4-2': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 18 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 82 }],
    MF: [{ x: 30, y: 15 }, { x: 30, y: 38 }, { x: 30, y: 62 }, { x: 30, y: 85 }],
    FW: [{ x: 44, y: 30 }, { x: 44, y: 70 }],
  },
  '4-2-3-1': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 18 }, { x: 18, y: 38 }, { x: 18, y: 62 }, { x: 18, y: 82 }],
    MF: [
      { x: 28, y: 35 }, { x: 28, y: 65 },
      { x: 37, y: 18 }, { x: 37, y: 50 }, { x: 37, y: 82 },
    ],
    FW: [{ x: 45, y: 50 }],
  },
  '3-5-2': {
    GK: [{ x: 5, y: 50 }],
    DF: [{ x: 18, y: 25 }, { x: 18, y: 50 }, { x: 18, y: 75 }],
    MF: [{ x: 28, y: 12 }, { x: 28, y: 30 }, { x: 28, y: 50 }, { x: 28, y: 70 }, { x: 28, y: 88 }],
    FW: [{ x: 44, y: 30 }, { x: 44, y: 70 }],
  },
};

const FALLBACK = FORMATION_COORDS['4-3-3'];

/**
 * Given a formation name and ordered array of player positions, returns one {x,y}
 * coordinate per player. Players should be ordered GK → DF → MF → FW.
 * For home (left half) isHome=true; for away (right half) x is mirrored.
 */
export function getFormationCoords(
  formation: string,
  players: Array<{ position: 'GK' | 'DF' | 'MF' | 'FW' }>,
  isHome: boolean,
): Coord[] {
  const slots = FORMATION_COORDS[formation] ?? FALLBACK;
  const used: Record<string, number> = { GK: 0, DF: 0, MF: 0, FW: 0 };

  return players.map((p) => {
    const pos = p.position as string;
    const idx = used[pos] ?? 0;
    used[pos] = idx + 1;
    const list = slots[pos] ?? FALLBACK[pos] ?? [{ x: 25, y: 50 }];
    const coord = list[Math.min(idx, list.length - 1)];
    return isHome ? coord : { x: 100 - coord.x, y: coord.y };
  });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /home/abee/Music/fotnep/frontend && npx tsc --noEmit --strict false 2>&1 | grep pitchCoords
```

Expected: no output (no errors in the new file).

- [ ] **Step 3: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/utils/pitchCoords.ts
git commit -m "feat: add pitch coordinate utility for formation-based player placement"
```

---

## Task 2: Seed real lineups in seed_db.py

**Files:**
- Modify: `services/ml-service/scripts/seed_db.py`

Add `FORMATION_SLOTS` constant, `_build_lineup` helper, and update `seed_matches` so that live/completed matches have populated lineups; also add one live match.

- [ ] **Step 1: Add `FORMATION_SLOTS` and `_build_lineup` after the `_find_team_id` function (around line 139)**

Open `services/ml-service/scripts/seed_db.py`. After the `_find_team_id` function (ends around line 140), insert:

```python
FORMATION_SLOTS = {
    "4-3-3":   {"GK": 1, "DF": 4, "MF": 3, "FW": 3},
    "4-4-2":   {"GK": 1, "DF": 4, "MF": 4, "FW": 2},
    "4-2-3-1": {"GK": 1, "DF": 4, "MF": 5, "FW": 1},
    "3-5-2":   {"GK": 1, "DF": 3, "MF": 5, "FW": 2},
}


def _build_lineup(db, team_id, formation: str) -> list[dict]:
    """Pick top players by ELO per position slot. Falls back to any nepali player if team pool is thin."""
    slots = FORMATION_SLOTS.get(formation, FORMATION_SLOTS["4-3-3"])
    lineup = []
    shirt = 1
    used_ids = set()

    for pos, count in slots.items():
        # Prefer the team's own players first
        team_players = list(
            db.players.find({
                "team": team_id,
                "position": pos,
                "_id": {"$nin": list(used_ids)},
            }).sort("eloRating", -1).limit(count)
        )
        selected = team_players

        # Fill remaining slots from any nepali player of that position
        if len(selected) < count:
            remaining = count - len(selected)
            fill = list(
                db.players.find({
                    "source": "nepali",
                    "position": pos,
                    "_id": {"$nin": list(used_ids) + [p["_id"] for p in selected]},
                }).sort("eloRating", -1).limit(remaining)
            )
            selected += fill

        for p in selected:
            lineup.append({
                "playerId": p["_id"],
                "position": pos,
                "shirtNumber": shirt,
            })
            used_ids.add(p["_id"])
            shirt += 1

    return lineup
```

- [ ] **Step 2: Replace `seed_matches` function (starting at line 340) with the updated version**

Replace the entire `seed_matches` function with:

```python
def seed_matches(db):
    db.matches.drop()
    t = {team["name"]: team["_id"] for team in db.teams.find()}
    now = datetime.utcnow()

    def match(home, away, comp, days, status, venue, hf="4-3-3", af="4-3-3",
               result=None, votes=None):
        h, a = t.get(home), t.get(away)
        if not h or not a:
            print(f"  Warning: team not found — {home!r} or {away!r}")
            return None
        # Only build real lineups for live/completed matches; upcoming stays empty
        home_lineup = _build_lineup(db, h, hf) if status != "upcoming" else []
        away_lineup = _build_lineup(db, a, af) if status != "upcoming" else []
        return {
            "homeTeam": h, "awayTeam": a,
            "date": now + timedelta(days=days),
            "competition": comp, "status": status, "venue": venue,
            "homeLineup": home_lineup, "awayLineup": away_lineup,
            "homeFormation": hf, "awayFormation": af,
            **({"result": result} if result else {}),
            "voteCounts": votes or {"home_win": 0, "draw": 0, "away_win": 0},
        }

    matches_raw = [
        # --- 5 upcoming matches (lineups empty — ML predicts on frontend load) ---
        match("Nepal National Team", "Machhindra FC",
              "SAFF Championship", 3, "upcoming", "Dashrath Rangasala",
              "4-3-3", "4-4-2"),
        match("Machhindra FC", "Manang Marshyangdi Club",
              "A-Division League", 7, "upcoming", "Dashrath Rangasala",
              "4-4-2", "4-3-3"),
        match("Three Star Club", "Tribhuvan Army Club",
              "A-Division League", 10, "upcoming", "Pokhara Stadium",
              "4-2-3-1", "4-3-3"),
        match("New Road Team", "APF FC",
              "Martyr's Memorial A-Division League", 14, "upcoming", "ANFA Complex",
              "4-4-2", "4-3-3"),
        match("Nepal Women's National Team", "Nepal National Team",
              "SAFF Women's Championship", 5, "upcoming", "Dashrath Rangasala",
              "4-4-2", "4-3-3"),
        # --- 1 live match (lineups populated from team players) ---
        match("Nepal National Team", "APF FC",
              "Martyr's Memorial A-Division League", 0, "live",
              "Dashrath Rangasala", "4-3-3", "4-3-3",
              votes={"home_win": 18, "draw": 5, "away_win": 7}),
        # --- 3 completed matches (lineups populated) ---
        match("Manang Marshyangdi Club", "Nepal National Team",
              "A-Division League", -5, "completed", "Halchowk Stadium",
              "4-3-3", "4-3-3",
              result={"homeScore": 2, "awayScore": 1},
              votes={"home_win": 14, "draw": 4, "away_win": 9}),
        match("Nepal National Team", "Three Star Club",
              "Martyr's Memorial A-Division League", -12, "completed",
              "Dashrath Rangasala", "4-3-3", "4-2-3-1",
              result={"homeScore": 3, "awayScore": 0},
              votes={"home_win": 22, "draw": 3, "away_win": 4}),
        match("Machhindra FC", "New Road Team",
              "A-Division League", -20, "completed", "Dashrath Rangasala",
              "4-4-2", "4-4-2",
              result={"homeScore": 1, "awayScore": 1},
              votes={"home_win": 10, "draw": 8, "away_win": 7}),
    ]

    valid = [m for m in matches_raw if m]
    db.matches.insert_many(valid)
    print(f"  Inserted {len(valid)} matches")
    for m in valid:
        hc = len(m.get("homeLineup", []))
        ac = len(m.get("awayLineup", []))
        print(f"    {m['status']:9s}  home lineup: {hc} players  away: {ac}")
```

- [ ] **Step 3: Run the seeder and verify output**

```bash
cd /home/abee/Music/fotnep/services/ml-service
source venv/bin/activate
python scripts/seed_db.py
```

Expected output includes lines like:
```
  Inserted 9 matches
    upcoming   home lineup: 0 players  away: 0
    upcoming   home lineup: 0 players  away: 0
    ...
    live       home lineup: 11 players  away: 11
    completed  home lineup: 11 players  away: 11
    completed  home lineup: 11 players  away: 11
    completed  home lineup: 11 players  away: 11
```

If any live/completed match shows fewer than 11 players, there aren't enough nepali players in those position groups — that's acceptable at this stage (fallback fill from any nepali player runs first).

- [ ] **Step 4: Commit**

```bash
cd /home/abee/Music/fotnep
git add services/ml-service/scripts/seed_db.py
git commit -m "feat: seed real lineups for live/completed matches; add live demo match"
```

---

## Task 3: Backend — populate lineup players in listMatches

**Files:**
- Modify: `backend/src/controllers/matchController.ts:14-22`

Currently `listMatches` populates only teams. Add lineup player population so the frontend receives full player objects inside each match's lineup arrays.

- [ ] **Step 1: Update the query in `listMatches`**

In `backend/src/controllers/matchController.ts`, replace the `Match.find` chain in `listMatches` (lines 14–22):

```typescript
// BEFORE:
const [matches, total] = await Promise.all([
    Match.find(filter)
      .populate('homeTeam')
      .populate('awayTeam')
      .sort({ date: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .lean(),
    Match.countDocuments(filter),
  ]);
```

With:

```typescript
// AFTER:
const [matches, total] = await Promise.all([
    Match.find(filter)
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('homeLineup.playerId')
      .populate('awayLineup.playerId')
      .sort({ date: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .lean(),
    Match.countDocuments(filter),
  ]);
```

- [ ] **Step 2: Type-check backend**

```bash
cd /home/abee/Music/fotnep/backend && npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/abee/Music/fotnep
git add backend/src/controllers/matchController.ts
git commit -m "feat: populate lineup player refs in listMatches"
```

---

## Task 4: Backend — add teamId filter to listPlayers

**Files:**
- Modify: `backend/src/controllers/playerController.ts:4-19`

The frontend will call `GET /players?teamId=<id>` to fetch a team's available players for the ML prediction call.

- [ ] **Step 1: Add `teamId` extraction and filter**

Replace the entire `listPlayers` function:

```typescript
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Player } from '../models/Player';

export async function listPlayers(req: Request, res: Response): Promise<void> {
  const { position, search, gender, source, teamId, sortBy = 'eloRating', limit = '50', offset = '0' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (position) filter.position = position;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (gender) filter.gender = gender;
  if (source) filter.source = source;
  if (teamId) filter.team = new mongoose.Types.ObjectId(teamId);

  const players = await Player.find(filter)
    .populate('team', 'name')
    .sort({ [sortBy]: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  res.json({ players, total: await Player.countDocuments(filter) });
}

export async function getPlayer(req: Request, res: Response): Promise<void> {
  const player = await Player.findById(req.params.id).populate('team').lean();
  if (!player) {
    res.status(404).json({ error: 'PLAYER_NOT_FOUND', message: 'Player not found' });
    return;
  }
  res.json(player);
}
```

- [ ] **Step 2: Add the `mongoose` import** (it's not currently imported in playerController.ts)

Verify the import at the top of the file is:

```typescript
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Player } from '../models/Player';
```

- [ ] **Step 3: Type-check**

```bash
cd /home/abee/Music/fotnep/backend && npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /home/abee/Music/fotnep
git add backend/src/controllers/playerController.ts
git commit -m "feat: add teamId filter to listPlayers endpoint"
```

---

## Task 5: Frontend types — add formation fields

**Files:**
- Modify: `frontend/src/types.ts`

Add `formation` to `Team` and `homeFormation`/`awayFormation` to `Match` so components can pass the right formation to `optimizeSquad`.

- [ ] **Step 1: Update `Team` interface**

In `frontend/src/types.ts`, add `formation` to the `Team` interface:

```typescript
export interface Team {
  id: string;
  name: string;
  shorthand: string;
  logoUrl?: string;
  color: string;
  secondaryColor: string;
  rating: number;
  fifaRank?: number;
  coach: string;
  stadium: string;
  stadiumCapacity: string;
  formation: string;  // e.g. '4-3-3'
}
```

- [ ] **Step 2: Update `Match` interface**

In `frontend/src/types.ts`, add formation fields to `Match`:

```typescript
export interface Match {
  id: string;
  category: 'MEN' | 'WOMEN' | 'DOMESTIC';
  competition: string;
  competitionLogo?: string;
  date: string;
  time: string;
  status: 'LIVE' | 'FINISHED' | 'UPCOMING';
  minute?: number;
  venue: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  homeFormation: string;  // e.g. '4-3-3'
  awayFormation: string;
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

- [ ] **Step 3: Lint check**

```bash
cd /home/abee/Music/fotnep/frontend && npm run lint 2>&1 | head -30
```

Expected: errors pointing to `adaptTeam` and `adaptMatch` in `api.ts` missing the new required fields — that's expected and will be fixed in Task 6.

- [ ] **Step 4: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/types.ts
git commit -m "feat: add formation fields to Team and Match types"
```

---

## Task 6: Update api.ts — wire lineups end-to-end

**Files:**
- Modify: `frontend/src/services/api.ts`

Three changes: (1) pass `formation` through `adaptTeam`, (2) add `adaptLineup` that converts populated backend lineup to `TeamLineup` with pitch coords, (3) update `adaptMatch` to include formations and lineups, (4) add `teamId` param to `getPlayers`.

- [ ] **Step 1: Update `adaptTeam` to pass formation through**

Replace the `adaptTeam` function (around line 119):

```typescript
export function adaptTeam(t: ApiTeam): Team {
  return {
    id: t._id,
    name: t.name,
    shorthand: teamShorthand(t.name),
    color: t.color || '#DC2626',
    secondaryColor: '#94a3b8',
    rating: 7.0,
    coach: t.coach || '—',
    stadium: t.stadium || '—',
    stadiumCapacity: '—',
    formation: t.formation || '4-3-3',
  };
}
```

- [ ] **Step 2: Add `getFormationCoords` import at the top of api.ts**

At line 1, add the import alongside the existing types import:

```typescript
import type { Match, Player, Team } from '../types';
import { getFormationCoords } from '../utils/pitchCoords';
```

- [ ] **Step 3: Add `adaptLineup` helper after `adaptPlayer`**

Insert this function right after `adaptPlayer` (after line ~166):

```typescript
function adaptLineup(
  entries: { playerId: ApiPlayer | string; position: string; shirtNumber: number }[],
  formation: string,
  isHome: boolean,
): import('../types').TeamLineup | undefined {
  // Only use entries where playerId was populated by Mongoose (i.e. is an object)
  const populated = entries.filter(
    (e): e is typeof e & { playerId: ApiPlayer } =>
      typeof e.playerId === 'object' && e.playerId !== null,
  );
  if (populated.length === 0) return undefined;

  const ordered = [...populated].sort((a, b) => {
    const order = { GK: 0, DF: 1, MF: 2, FW: 3 };
    return (order[a.position as keyof typeof order] ?? 4) - (order[b.position as keyof typeof order] ?? 4);
  });

  const positionedPlayers = ordered.map((e) => ({
    player: adaptPlayer(e.playerId as ApiPlayer),
    position: e.position as 'GK' | 'DF' | 'MF' | 'FW',
    shirtNumber: e.shirtNumber,
  }));

  const coords = getFormationCoords(
    formation,
    positionedPlayers.map((p) => ({ position: p.position })),
    isHome,
  );

  return {
    formation,
    starters: positionedPlayers.map((p, i) => ({
      player: { ...p.player, number: p.shirtNumber },
      x: coords[i].x,
      y: coords[i].y,
    })),
    substitutes: [],
  };
}
```

- [ ] **Step 4: Update `adaptMatch` to include formations and lineups**

Replace the `adaptMatch` function (around line 168):

```typescript
export function adaptMatch(m: ApiMatch): Match {
  const d = new Date(m.date);
  const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const votes = m.voteCounts ?? { home_win: 0, draw: 0, away_win: 0 };
  return {
    id: m._id,
    category: deriveCategory(m.competition),
    competition: m.competition,
    date: dateStr,
    time: timeStr,
    status: normalizeStatus(m.status),
    venue: m.venue || '—',
    homeTeam: adaptTeam(m.homeTeam),
    awayTeam: adaptTeam(m.awayTeam),
    homeScore: m.result?.homeScore,
    awayScore: m.result?.awayScore,
    homeFormation: m.homeFormation || '4-3-3',
    awayFormation: m.awayFormation || '4-3-3',
    homeLineup: adaptLineup(m.homeLineup, m.homeFormation || '4-3-3', true),
    awayLineup: adaptLineup(m.awayLineup, m.awayFormation || '4-3-3', false),
    predictionVotes: {
      home: votes.home_win,
      draw: votes.draw,
      away: votes.away_win,
    },
  };
}
```

- [ ] **Step 5: Add `teamId` param to `getPlayers`**

Update the `getPlayers` function signature and query string builder (around line 224):

```typescript
export async function getPlayers(params?: {
  position?: string;
  search?: string;
  gender?: 'M' | 'F';
  source?: 'nepali' | 'european';
  teamId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ players: Player[]; total: number }> {
  const qs = new URLSearchParams();
  if (params?.position) qs.set('position', params.position);
  if (params?.search) qs.set('search', params.search);
  if (params?.gender) qs.set('gender', params.gender);
  if (params?.source) qs.set('source', params.source);
  if (params?.teamId) qs.set('teamId', params.teamId);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const raw = await request<{ players: ApiPlayer[]; total: number }>(`/players?${qs}`);
  return { players: raw.players.map(adaptPlayer), total: raw.total };
}
```

- [ ] **Step 6: Lint check**

```bash
cd /home/abee/Music/fotnep/frontend && npm run lint 2>&1 | head -40
```

Expected: no errors. If there are errors about `formation` missing in existing callers of `adaptTeam` or `adaptMatch`, they will show here — most should already be satisfied by the default values.

- [ ] **Step 7: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/services/api.ts
git commit -m "feat: adapt match lineups + formation fields through api.ts; add teamId filter to getPlayers"
```

---

## Task 7: MatchDetails — predicted lineup for upcoming matches

**Files:**
- Modify: `frontend/src/components/MatchDetails.tsx`

Add predicted lineup state, a `squadToLineup` helper, and a `useEffect` that fires for UPCOMING matches to fetch each team's player pool and call `optimizeSquad` for both teams in parallel.

- [ ] **Step 1: Add imports at the top of MatchDetails.tsx**

Update the imports block (lines 1–8):

```typescript
import { useState, useEffect } from 'react';
import { Match, Player, TeamLineup } from '../types';
import {
  MapPin, Users, Calendar, AlertCircle, Info,
  CheckCircle2, Award, Flame, Check, Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  castVote, getMatchVotes, getPrediction, triggerPrediction, PredictionResult,
  getPlayers, optimizeSquad, SquadResult,
} from '../services/api';
import { getFormationCoords } from '../utils/pitchCoords';
```

- [ ] **Step 2: Add predicted lineup state after the existing state declarations (after line 26)**

```typescript
const [predictedHome, setPredictedHome] = useState<TeamLineup | null>(null);
const [predictedAway, setPredictedAway] = useState<TeamLineup | null>(null);
const [lineupLoading, setLineupLoading] = useState(false);
```

- [ ] **Step 3: Add `squadToLineup` helper before the component's return statement (between state and return, around line 77)**

```typescript
function squadToLineup(squad: SquadResult, playerPool: Player[], isHome: boolean): TeamLineup {
  const byId = Object.fromEntries(playerPool.map((p) => [p.id, p]));

  const ordered = [...squad.startingXI].sort((a, b) => {
    const order = { GK: 0, DF: 1, MF: 2, FW: 3 };
    return (order[a.position as keyof typeof order] ?? 4) - (order[b.position as keyof typeof order] ?? 4);
  });

  const starters = ordered.map((xi, i) => ({
    player: byId[xi.playerId]
      ? { ...byId[xi.playerId], number: i + 1 }
      : {
          id: xi.playerId, name: xi.playerName, number: i + 1,
          position: xi.position as 'GK' | 'DF' | 'MF' | 'FW',
          positionDetail: xi.position, rating: 6.5, age: 0,
          height: '—', weight: '—', marketValue: '—',
          goals: 0, assists: 0, matchesPlayed: 0,
          yellowCards: 0, redCards: 0, preferredFoot: 'Right' as const,
          club: '—',
          attributes: { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 },
        },
    position: xi.position as 'GK' | 'DF' | 'MF' | 'FW',
  }));

  const coords = getFormationCoords(
    squad.formation,
    starters.map((s) => ({ position: s.position })),
    isHome,
  );

  return {
    formation: squad.formation,
    starters: starters.map((s, i) => ({ player: s.player, x: coords[i].x, y: coords[i].y })),
    substitutes: squad.bench.map((b) =>
      byId[b.playerId] ?? {
        id: b.playerId, name: b.playerName, number: 0,
        position: b.position as 'GK' | 'DF' | 'MF' | 'FW',
        positionDetail: b.position, rating: 6.0, age: 0,
        height: '—', weight: '—', marketValue: '—',
        goals: 0, assists: 0, matchesPlayed: 0,
        yellowCards: 0, redCards: 0, preferredFoot: 'Right' as const,
        club: '—',
        attributes: { pace: 60, shooting: 60, passing: 60, dribbling: 60, defending: 60, physical: 60 },
      }
    ),
  };
}
```

**Important:** `squadToLineup` must be defined OUTSIDE the `MatchDetails` component (above it, after the imports) to avoid re-creating it on every render. Place it after the imports, before `export default function MatchDetails`.

- [ ] **Step 4: Add predicted lineup useEffect**

After the existing `useEffect` (which ends around line 43), add a new one:

```typescript
useEffect(() => {
  if (match.status !== 'UPCOMING') return;
  setPredictedHome(null);
  setPredictedAway(null);
  setLineupLoading(true);
  let cancelled = false;

  (async () => {
    try {
      const [{ players: homePlayers }, { players: awayPlayers }] = await Promise.all([
        getPlayers({ teamId: match.homeTeam.id, source: 'nepali', limit: 50 }),
        getPlayers({ teamId: match.awayTeam.id, source: 'nepali', limit: 50 }),
      ]);

      const homeIds = homePlayers.map((p) => p.id);
      const awayIds = awayPlayers.map((p) => p.id);

      const [homeSquad, awaySquad] = await Promise.all([
        homeIds.length
          ? optimizeSquad({ teamId: match.homeTeam.id, availablePlayerIds: homeIds, formationPreference: match.homeFormation })
          : Promise.resolve(null),
        awayIds.length
          ? optimizeSquad({ teamId: match.awayTeam.id, availablePlayerIds: awayIds, formationPreference: match.awayFormation })
          : Promise.resolve(null),
      ]);

      if (cancelled) return;
      if (homeSquad) setPredictedHome(squadToLineup(homeSquad, homePlayers, true));
      if (awaySquad) setPredictedAway(squadToLineup(awaySquad, awayPlayers, false));
    } catch {
      // silently fall through — pitch shows unavailable placeholder
    } finally {
      if (!cancelled) setLineupLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, [match.id, match.status, match.homeTeam.id, match.awayTeam.id, match.homeFormation, match.awayFormation]);
```

- [ ] **Step 5: Add lineup resolution vars before the return statement**

Just before `return (` add:

```typescript
const homeLineup = match.homeLineup ?? predictedHome;
const awayLineup = match.awayLineup ?? predictedAway;
const isPredicted = match.status === 'UPCOMING' && !match.homeLineup;
```

- [ ] **Step 6: Update the lineup tab render to use resolved lineup vars**

In the `{activeTab === 'lineup' && (...)}`  block (around line 434), replace:

```tsx
{match.homeLineup && match.awayLineup ? (
```

with:

```tsx
{homeLineup && awayLineup ? (
```

And replace all occurrences of `match.homeLineup` / `match.awayLineup` inside that block with `homeLineup` / `awayLineup`:

- Line 466: `{match.homeTeam.shorthand} ({match.homeLineup.formation})` → `{match.homeTeam.shorthand} ({homeLineup.formation})`
- Line 469: `{match.awayTeam.shorthand} ({match.awayLineup.formation})` → `{match.awayTeam.shorthand} ({awayLineup.formation})`
- Line 475: `{match.homeLineup.starters.map(...)` → `{homeLineup.starters.map(...)`
- Line 520: `{match.awayLineup.starters.map(...)` → `{awayLineup.starters.map(...)`
- Line 565–570: The "Predicted Lineup by Machine" badge condition — change to show for predicted lineups regardless of status:

```tsx
{isPredicted && (
  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 backdrop-blur-sm shadow-md shadow-black/50 select-none z-20">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
    Predicted Lineup by Machine
  </div>
)}
```

- [ ] **Step 7: Replace the `else` branch (unavailable placeholder) with a loading state**

Replace the `else` block (around line 604–611):

```tsx
) : lineupLoading ? (
  <div className="py-12 text-center text-slate-500 border border-slate-850 border-dashed rounded-xl">
    <Loader2 className="w-7 h-7 text-emerald-500 mx-auto mb-2 animate-spin" />
    <p className="text-sm font-semibold text-slate-300">Predicting Lineup...</p>
    <p className="text-xs text-slate-500 mt-1">Machine is selecting the optimal XI from available players.</p>
  </div>
) : (
  <div className="py-12 text-center text-slate-500 border border-slate-850 border-dashed rounded-xl">
    <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
    <p className="text-sm font-semibold text-slate-300">Lineups Unavailable</p>
    <p className="text-xs text-slate-500 mt-1">Starting rosters will be announced usually 1 hour before kickoff.</p>
  </div>
)}
```

- [ ] **Step 8: Lint check**

```bash
cd /home/abee/Music/fotnep/frontend && npm run lint 2>&1 | head -50
```

Expected: no errors. Fix any TypeScript type errors before continuing.

- [ ] **Step 9: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/components/MatchDetails.tsx
git commit -m "feat: show predicted XI for upcoming matches, actual lineup for live/finished"
```

---

## Task 8: End-to-end verification

- [ ] **Step 1: Start all services**

```bash
cd /home/abee/Music/fotnep
npm run dev
```

Confirm all three start: `[backend]`, `[ml]`, `[frontend]` in the output.

- [ ] **Step 2: Verify a completed match shows real lineup**

Open `http://localhost:3000`. Click on one of the completed matches (e.g. "Manang Marshyangdi Club vs Nepal National Team"). Click the **Tactical Lineup** tab. Expected: pitch renders with player nodes for both teams; nodes show shirt numbers and rating badges; no "Predicted by Machine" badge visible.

- [ ] **Step 3: Verify a live match shows real lineup**

Click on the live match "Nepal National Team vs APF FC" (LIVE badge visible). Click **Tactical Lineup**. Expected: pitch renders with both teams' lineups; no "Predicted by Machine" badge.

- [ ] **Step 4: Verify an upcoming match shows predicted lineup**

Click on any upcoming match (e.g. "Nepal National Team vs Machhindra FC"). Click **Tactical Lineup**. Expected: brief "Predicting Lineup..." spinner, then pitch renders with both teams' predicted XI; green "Predicted Lineup by Machine" badge visible at pitch bottom.

- [ ] **Step 5: Verify different upcoming match formations differ**

Click "Three Star Club vs Tribhuvan Army Club" (Three Star uses 4-2-3-1). Expected: Three Star's predicted lineup has a visibly different shape — two defensive midfielders clustered near center-left, one striker up top.

- [ ] **Step 6: Final commit if any minor fixes were made**

```bash
cd /home/abee/Music/fotnep
git add -p   # stage only intentional fixes
git commit -m "fix: lineup display edge cases from e2e verification"
```

---

## Self-Review Checklist

- **Spec coverage:**
  - ✅ LIVE/FINISHED: actual lineup from seeded data rendered on pitch
  - ✅ UPCOMING: ML-predicted full 11 rendered with "Predicted by Machine" badge
  - ✅ Players seeded in each team via `_build_lineup` fallback
  - ✅ Loading spinner while ML prediction fires

- **Type consistency:**
  - `getFormationCoords` returns `Coord[]` — used consistently in `adaptLineup` (api.ts) and `squadToLineup` (MatchDetails.tsx)
  - `TeamLineup.formation` written in Task 1, read in Task 6 and Task 7
  - `match.homeFormation` / `match.awayFormation` added in Task 5, populated in Task 6, consumed in Task 7
  - `squadToLineup` uses `SquadResult` from api.ts — same shape returned by `optimizeSquad`
  - `isPredicted` flag drives badge visibility — defined in Task 7 Step 5, used in Task 7 Step 6

- **No placeholders:** All steps contain actual code with exact file paths and commands.
