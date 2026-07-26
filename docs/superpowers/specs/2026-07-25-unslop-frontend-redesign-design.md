# Frontend redesign: remove AI-slop tells (color, type, layout)

**Date:** 2026-07-25
**Status:** Approved, ready for implementation plan

## Context

Over the course of this session we installed the `unslop-ui` Claude skill (from
[JCarterJohnson/vibecoded-design-tells](https://github.com/JCarterJohnson/vibecoded-design-tells)),
a data-grounded checklist of the visual cues that make a site read as AI-generated, plus a
scanner (`devibe_scan.py`) that greps a codebase and scores it. Running it against
`frontend/src` gave a "STRONG AI-default look" verdict (vibe score 68, later 44 after a
first radius-scale pass on Header/MatchFeed/MatchDetails/LineupBuilder/PlayerComparison).

The user then asked for a full redesign across all pages. Brainstorming narrowed the scope:
**the primary driver of the AI-slop read is color and font usage, not layout** — the user
explicitly said layout/structure is not the main problem and gave latitude to make
judgment calls on execution, to be reviewed after the fact rather than approved
line-by-line.

## Goal

Remove the remaining AI-default color and typography usage across all four pages
(Home/Matches, Compare, Stats, Lineups) and continue the radius/motion tell cleanup
already started, without a structural layout rewrite. Verify with `tsc --noEmit` and a
`devibe_scan.py` re-run after each page, plus a manual check in the dev server.

## Design language (approved)

**Reference:** sports data terminal, FotMob/Sofascore-adjacent — data-forward, calm
chrome, not Bloomberg-terminal dense.

**Color — new palette, sampled from the Nepal flag (not a generic default):**

| Role | Value | Notes |
| --- | --- | --- |
| Background | `#0a0b0d` | near-black, effectively unchanged from current `#0d0e10` |
| Primary interactive accent | `#1e4fa3` (Nepal flag blue) | replaces `emerald-500` everywhere: buttons, active tabs/links, focus rings, selected states |
| Win / live / critical | `#dc2626` (Nepal flag crimson) | unchanged role — stays rare and meaningful (match wins, LIVE badge) |
| Data accent | `#d97706` (amber) | stat bars, chart series B, rating highlights — visually distinct from the brand accent so "this is data" vs. "this is UI chrome" is legible at a glance |
| Text / neutral ramp | existing slate scale | the broken `slate-850` (see below) gets folded into one real, intentional token instead of being an undefined arbitrary gray |
| Pitch green (LineupBuilder) | unchanged | semantic — it's a literal football pitch, not a brand decision, exempt from the palette swap |
| Rating traffic-light (red/yellow/green/blue) | unchanged | a semantic good→bad scale independent of brand accent, not a decorative default — stays as implemented in `MatchDetails.getRatingColorClass` |

Note: `--color-slate-850` was already added to `index.css`'s `@theme` block in an earlier
pass this session to fix a real bug (undefined color token silently falling back to
`currentColor`, rendering as a stray white border). That token stays; this redesign adds
the new brand tokens alongside it.

**Type:** keep the current pairing — Space Grotesk (display), Open Sans (body),
JetBrains Mono (stats/numbers). Mono-for-figures is already the terminal signal; no
reason to swap fonts for the sake of swapping. No changes planned here beyond auditing
for any leftover default-feeling type usage (e.g. an unconsidered font-weight or size that
reads as a framework default) while touching each page's markup.

**Motion/radius:** continue the radius-scale work already started this session
(panels `rounded-xl`, small badges `rounded-md`, true circles/pills/avatars/status-chips
stay `rounded-full`). Mark the intentional `rounded-full` exceptions found during the
earlier audit with `unslop-ignore` comments so future scans don't re-flag deliberate
choices. Trim the remaining boilerplate hover-grow/fade-in motion (5 scanner hits:
`Header.tsx` dropdown fade+scale-in, `MatchDetails.tsx` player-node hover-scale x2,
`LineupBuilder.tsx` player-bubble hover-scale, remove-button hover-scale) to motion that
communicates a state change, gated behind `prefers-reduced-motion` where Framer Motion is
already in use (Header dropdown).

**Layout:** secondary priority per user feedback. Where a page already has excessive
nested bordered boxes, lighten it opportunistically while doing the color pass (e.g. merge
the MatchDetails scoreboard and vote-panel into one section with an internal divider
instead of two stacked cards), but this is not the primary deliverable and should not turn
into a structural rewrite.

## Per-page notes

**Home (MatchFeed + MatchDetails)**
- Recolor active category/tab/selected-match states, focus rings, and vote-prediction bars
  from emerald to Nepal blue.
- Merge the scoreboard and "Who Will Win?" vote panel into one continuous section with an
  internal divider instead of two stacked bordered cards.
- Match cards: drop the boxed background behind the score/kickoff-time in favor of plain
  text; consolidate the competition-tag + status-badge onto one calmer line.

**Compare (PlayerComparison)**
- Biggest offender for decorative "gamer card" styling (glossy `FUTCard` shine, heavy
  drop-shadow layering). Flatten: keep the avatar/name/position/rating layout, drop the
  radial shine overlay and excess shadow stacking.
- Recolor the two comparison sides: Player A → Nepal blue, Player B → amber (replaces
  emerald vs. white-grey) — consistent with amber's data-accent role.
- Clean up the invisible/blank conditional strings around line 209
  (`player.position === 'FW' ? '' : ...`) — almost certainly leftover emoji unicode not
  caught by the scanner's lexicon.
- Opportunistically consolidate the bio-grid/radar-chart/heatmap/dual-bar sections, which
  currently each sit in their own heavily-bordered box, into fewer panels with internal
  dividers — secondary to the color pass, not a rewrite.

**Stats (PlayerStats)**
- Recolor emerald accents to Nepal blue; attribute progress-bar fills to amber (they're
  data).
- Opportunistically lighten the stat-tile grid, which currently boxes every tile
  individually, in favor of a lighter grid with dividers — secondary to the color pass.

**Lineups (LineupBuilder)**
- Recolor active/selected slot states, controls-bar accents, and the synergy progress bar
  to Nepal blue/amber. Pitch green is exempt (semantic, not brand).
- Opportunistically tighten spacing/borders between the controls bar, pitch canvas, bench,
  and sidebar panel where they sit directly adjacent — secondary to the color pass.

## Verification

Per page: `tsc --noEmit` (must stay clean), `python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src` (vibe score should keep dropping, no new findings introduced), and a manual check of the affected flow in the running dev server (`npm run dev`).

## Explicitly out of scope

- No structural/layout rewrite — this is a color/type/tell-removal pass, not a
  ground-up redesign.
- No changes to the pitch green or the rating traffic-light colors — both are semantic,
  not brand defaults.
- No new component architecture, no new dependencies.
