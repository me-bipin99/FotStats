# Matches Page League Redesign — Design Spec

**Date:** 2026-07-26
**Status:** Approved by user, ready for implementation planning.

## Goal

Redesign the Home tab from its current 2-column layout (match-list sidebar + match details) into a 3-column FotMob-style layout: a league navigator on the left, a date-agnostic Upcoming/Finished schedule in the middle, and the existing match details panel on the right. Clicking a league in the left column swaps it to that league's standings table (A-Division, NSL) or a grouped fixtures list (SAFF Championship — no real group-stage data exists to build a table from) and filters the middle schedule to that league.

Reference screenshots (user-provided): FotMob's league sidebar, match details page, a Premier League standings table, and a Nepal Super League standings table (image #5) whose exact numbers this spec reproduces from real seeded match data.

## Non-goals

- No backend API changes. Standings are computed client-side from matches already fetched by `App.tsx`.
- No Home/Away standings split (FotMob's `All/Home/Away` toggle) — `All` only, v1.
- No real group-stage table for SAFF Championship — the seeded data is all "Nepal vs X" fixtures with no matches between the other opponents, so a computed table would require inventing results between teams that never actually play in this app's data. SAFF gets a fixtures list grouped by competition edition instead.
- `MatchDetails.tsx` (the right column) is unchanged.

## League → competition mapping

A small frontend constant, not stored in the DB:

```ts
const LEAGUE_COMPETITIONS = {
  A_DIVISION: ["Martyr's Memorial A-Division League"],
  NSL: ["Nepal Super League"],
  SAFF: [
    "SAFF Championship 2025",
    "SAFF Championship 2024",
    "SAFF Women's Championship 2025",
    "SAFF Women's Championship 2024",
    "AFC Asian Cup Qualifier",
  ],
} as const;
```

`A_DIVISION` and `NSL` render as standings tables. `SAFF` renders as a fixtures list grouped by each of its 5 competition strings.

## Data seeding: NSL matches

NSL currently has 7 teams (seeded earlier this session, logos in `frontend/public/logos/`) but zero matches. Two additions to `seed_db.py`'s `seed_matches()`:

1. **21 completed matches** — a full single round-robin (every pair of the 7 NSL clubs plays once), competition `"Nepal Super League"`, status `completed`, dated in the past. Scorelines are chosen so the aggregated standings reproduce image #5 exactly:

   | # | Team | P | W | D | L | GF | GA | PTS |
   |---|------|---|---|---|---|----|----|-----|
   | 1 | Lalitpur City FC | 6 | 3 | 3 | 0 | 10 | 6 | 12 |
   | 2 | Dhangadhi FC | 6 | 3 | 2 | 1 | 9 | 5 | 11 |
   | 3 | FC Chitwan | 6 | 3 | 1 | 2 | 8 | 6 | 10 |
   | 4 | Pokhara Thunders | 6 | 2 | 2 | 2 | 7 | 6 | 8 |
   | 5 | Kathmandu Rayzrs | 6 | 2 | 2 | 2 | 6 | 7 | 8 |
   | 6 | Jhapa FC | 6 | 0 | 5 | 1 | 3 | 4 | 5 |
   | 7 | Butwal Lumbini FC | 6 | 0 | 1 | 5 | 1 | 10 | 1 |

   A one-off Python script (run during implementation, not part of the app) does a constrained search over the 21 team-pair fixtures assigning a scoreline to each so per-team aggregates land exactly on this table, then verifies its own output by recomputing standings from the generated match list and diffing against the target before the results are pasted into `seed_db.py` as literal `match(...)` calls (same style already used for A-Division/SAFF fixtures).

2. **4-6 upcoming matches** — a handful of return-leg pairings (reversed home/away from the round-robin), status `upcoming`, dated in the future. These populate NSL's "Upcoming" schedule section without affecting the completed table above.

Requires a full `python scripts/seed_db.py` re-seed to take effect.

## Standings computation

New pure function, `frontend/src/utils/standings.ts`:

```ts
computeStandings(matches: Match[], competitions: string[]): StandingRow[]
```

- Filters to `status === 'FINISHED'` matches whose `competition` is in the given list.
- Accumulates per team: `P, W, D, L, GF, GA`, `PTS = W*3 + D`.
- Sort: `PTS` desc → `GF - GA` desc → `GF` desc → team name asc.
- `Last 5`: that team's 5 most recent finished matches by date, oldest-first for display, each mapped to `W`/`D`/`L`. Teams with fewer than 5 finished matches show only what's available (no padding/placeholder icons).
- Teams with zero finished matches still appear as an all-zero row (relevant to A-Division, which has some thinly-scheduled teams today) — not hidden.

## Components

Flat structure, matching `frontend/src/components/`'s existing convention (no nested subdirectories):

- **`LeagueNav.tsx`** (new) — left column. Default state: the 3-item league list (A-Division, NSL, SAFF Championship). Selected state: renders `LeagueStandings` or `LeagueFixtures` plus a "← All leagues" back control. Stateless — `selectedLeague` and its setter are props from `App.tsx`.
- **`LeagueStandings.tsx`** (new) — presentational table: `# / Team (logo + name) / P / W / D / L / DIFF / GLS / Last 5 / PTS`. Takes `matches` + `competitions`, calls `computeStandings` internally.
- **`LeagueFixtures.tsx`** (new) — SAFF's view. Groups Nepal's matches by competition string (edition), each a compact one-line row (date, opponent, score-or-kickoff-time), Upcoming editions first (soonest first), Finished editions after (most recent first).
- **`MatchFeed.tsx`** (rewritten) — becomes the middle schedule column.
  - Removes the MEN/WOMEN/DOMESTIC category chips entirely (not hidden — deleted; superseded by league navigation).
  - Two stacked sections: **Upcoming** (ascending date) and **Finished** (descending date). A **Live** match, if any, pins above Upcoming.
  - Keeps the existing search box and match-card visuals as-is.
  - Filters to `selectedLeague`'s competition(s) when one is set; shows everything when `null`.
  - Props: `selectedLeague` / `onSelectLeague` replace today's `selectedCategory` / `onSelectCategory`.
- **`MatchDetails.tsx`** — unchanged.

## Layout (`App.tsx`)

Home tab only, 3-column grid:

```
grid-cols-1                        mobile: leagues row → schedule → details, stacked
lg:grid-cols-[220px_1fr]           tablet: leagues column; schedule+details stacked in remaining space
xl:grid-cols-[220px_340px_1fr]     desktop: leagues | schedule | details
```

New state in `App.tsx`: `selectedLeague: 'A_DIVISION' | 'NSL' | 'SAFF' | null`, replacing `selectedCategory`. `null` is the default (all matches, no league selected) — matches today's default "show everything" behavior. Selecting a league filters the middle schedule and swaps the left column's content; it does not change which match is shown on the right (`selectedMatchId` keeps driving that, same as today).

## Error handling / edge cases

- A league with zero matches for its competition(s) (shouldn't happen after seeding, but defensively): empty state message in both the standings/fixtures panel and the schedule column, consistent with `MatchFeed`'s existing "No matching fixtures found" pattern.
- `App.tsx`'s match fetch limit (`getMatches({ limit: 50 })`) gets bumped enough to comfortably cover the new NSL matches: 24 existing + 21 completed NSL + 4-6 upcoming NSL ≈ 50-51 total, right at today's cap — bumping the limit to 100 gives a safe margin.

## Testing / rollout

- `npm run lint` (`tsc --noEmit`) clean.
- Manual `npm run dev` walkthrough: default Home view, each of the 3 leagues (A-Division table, NSL table matching image #5 exactly, SAFF fixtures list), back control, `lg`/`xl` responsive breakpoints.
- Docs updated per this repo's CLAUDE.md rule as part of the implementation plan's tasks: `frontend/FRONTEND.md` (new components, `MatchFeed` behavior change, layout grid), `PLAN.md` / `SEEDING_BENCHMARK.md` (NSL match counts, new `"Nepal Super League"` competition string).
