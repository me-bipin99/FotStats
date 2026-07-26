# Frontend AI-Slop Redesign (Color/Type/Tells) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the emerald/generic-AI palette with a deliberate Nepal-flag-sampled palette across all four pages (Home, Compare, Stats, Lineups) and shared chrome (Header, App shell), fix silently-broken Tailwind color-shade classes found during the audit, and finish the radius/motion tell cleanup — without a structural layout rewrite.

**Architecture:** This is a systematic design-token replacement across 7 existing React/TSX files, not new features. Each file gets its own task: locate every occurrence of the old token via an exact `grep` command, apply the deterministic mapping rule below, then verify with `tsc --noEmit` + the `unslop-ui` scanner + a manual dev-server check. No new components, no new dependencies, no test runner exists for this frontend (`npm run lint` = `tsc --noEmit` is the only automated check).

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind v4 (`@theme` tokens in `frontend/src/index.css`, no `tailwind.config.ts`).

**Reference spec:** `docs/superpowers/specs/2026-07-25-unslop-frontend-redesign-design.md`

## Global Constraints

- Primary interactive accent becomes Nepal-flag blue `#1e4fa3` (was `emerald-500`), everywhere brand/interactive: buttons, active tabs/links, focus rings, selected states, primary borders/glows.
- Data-accent role (stat bars, chart series, rating highlights) uses Tailwind's stock `amber` scale (already has all needed real stops — no new token needed).
- Win/live/critical stays `rose`/`red` (unchanged role — stays rare and meaningful).
- The semantic rating traffic-light in `MatchDetails.getRatingColorClass` (red/yellow/green/blue) is UNCHANGED — it's a meaningful good→bad scale independent of the brand accent, not a decorative default.
- The pitch green in `LineupBuilder.tsx` is UNCHANGED — literal football pitch, semantic, not a brand color.
- Keep the current type pairing (Space Grotesk display / Open Sans body / JetBrains Mono stats). No font changes in this plan.
- Layout/structural changes are secondary and scoped exactly to what's listed per task below — no unlisted structural rewrites.
- Every code file edit must be followed by updating `frontend/FRONTEND.md` per this repo's `CLAUDE.md` rule (already the pattern used all session).
- **Shade-normalization rule** (for broken/invalid Tailwind shade numbers found in the audit — e.g. `emerald-450`, `slate-350`): round to the nearest real Tailwind stop (`50,100,200,300,400,500,600,700,800,900,950`); on an exact tie, round up. Example: `450` → `500` (tie, rounds up), `445` → `400` (nearest), `905` → `900` (nearest).
- **Text-pairing rule:** wherever old code pairs `bg-emerald-500` with `text-black` (buttons, active pills, LIVE-style badges), the replacement pairs `bg-brand-500` with `text-white` instead — `#1e4fa3` is a dark blue, black text on it fails contrast. Verify visually in the dev-server check.

---

### Task 1: Add the Nepal-blue brand color scale to the Tailwind theme

**Files:**
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: `bg-brand-{300,400,500,600,800,900,950}`, `text-brand-{...}`, `border-brand-{...}`, `ring-brand-{...}` etc. — every later task's `emerald-{N} → brand-{N}` mapping depends on these existing.

- [ ] **Step 1: Add the `--color-brand-*` tokens to the `@theme` block**

Current `frontend/src/index.css` (from the earlier `slate-850` fix this session):

```css
@theme {
  --font-sans: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --color-slate-850: #172033;
}
```

Replace with:

```css
@theme {
  --font-sans: 'Open Sans', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --color-slate-850: #172033;

  /* Nepal-flag-sampled brand blue — replaces emerald as the primary interactive accent */
  --color-brand-300: #7c9bd9;
  --color-brand-400: #567abb;
  --color-brand-500: #1e4fa3;
  --color-brand-600: #1a438b;
  --color-brand-800: #122f62;
  --color-brand-900: #0d2449;
  --color-brand-950: #091831;
}
```

- [ ] **Step 2: Verify the tokens compile**

Run: `cd frontend && npm run build`
Expected: build succeeds; then run `grep -o -- "--color-brand-500:[^;]*" dist/assets/index-*.css` and confirm it prints `--color-brand-500:#1e4fa3`.

- [ ] **Step 3: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/index.css
git commit -m "Add Nepal-blue brand color scale as the new primary accent token"
```

---

### Task 2: Recolor `App.tsx` and `Header.tsx` (shared chrome, shown on every page)

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/FRONTEND.md`

**Interfaces:**
- Consumes: `brand-{300,400,500,600,800,900,950}` tokens from Task 1.

- [ ] **Step 1: Locate every emerald occurrence in both files**

Run: `cd frontend/src && grep -noE '(bg|text|border|ring|shadow|from|to|via|placeholder|divide)-emerald-[0-9]+' App.tsx components/Header.tsx`

This prints every `file:line:match` — work through each one.

- [ ] **Step 2: Apply the recolor rule to every match**

Rule for these two files (pure UI chrome, no "data" role here — every emerald use is brand/interactive):
- Every `{property}-emerald-{N}` → `{property}-brand-{N}` (same shade number, e.g. `text-emerald-400` → `text-brand-400`), after first applying the shade-normalization rule from Global Constraints if `N` is a broken value (e.g. `text-slate-450` in `App.tsx`'s welcome banner → normalize to `text-slate-500`, a real existing stop, no brand-role since it's a neutral text tint not an accent).
- Apply the **text-pairing rule**: `Header.tsx` has `bg-emerald-500 text-black` on the active "Sign In"/"Sign Up" toggle button — change to `bg-brand-500 text-white`.
- `Header.tsx`'s selection ring/avatar (`ring-emerald-500`, `border-emerald-500/30`, `bg-emerald-500/10` etc. on the logged-in avatar and dropdown) → same `brand` swap.
- Leave any `rose`/`red` classes in both files untouched (there are none in `App.tsx`/`Header.tsx` currently, but if any exist they signal error/logout states — keep as rose/red).

- [ ] **Step 3: Fix the broken `text-slate-450` in `App.tsx`'s welcome banner**

Find (in `App.tsx`, the home-tab welcome banner):
```tsx
<span className="text-slate-450">
```
Replace with:
```tsx
<span className="text-slate-500">
```

- [ ] **Step 4: Gate the Header dropdown's fade-in motion behind `prefers-reduced-motion`**

`Header.tsx` uses Framer Motion (`motion/react`) for the account dropdown. Find:
```tsx
<motion.div
  initial={{ opacity: 0, y: 10, scale: 0.95 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 10, scale: 0.95 }}
  transition={{ duration: 0.15 }}
```
Replace with (Framer Motion respects `prefers-reduced-motion` automatically when `transition` includes a duration and the app doesn't need a manual media-query check — but to make the intent explicit and match the skill's guidance, add `MotionConfig`):

At the top of `Header.tsx`, change the import:
```tsx
import { motion, AnimatePresence } from 'motion/react';
```
to:
```tsx
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
```

Then wrap the `<AnimatePresence>{dropdownOpen && (...)}</AnimatePresence>` block (the dropdown) with `<MotionConfig reducedMotion="user">...</MotionConfig>`, e.g.:
```tsx
<MotionConfig reducedMotion="user">
  <AnimatePresence>
    {dropdownOpen && (
      <motion.div
        ...
      </motion.div>
    )}
  </AnimatePresence>
</MotionConfig>
```
(`reducedMotion="user"` makes Framer Motion automatically respect the OS `prefers-reduced-motion` setting for every animation inside, without a manual `useMediaQuery` hook — this is the documented Framer Motion API for exactly this case.)

- [ ] **Step 5: Verify**

Run: `cd frontend && npm run lint` — expect clean (`tsc --noEmit`, no output).
Run: `cd /home/abee/Music/fotnep && python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src` — note the vibe score, confirm the "Boilerplate fade-in" finding no longer includes `Header.tsx:199` (or wherever the `initial=` line now is).
Run: `cd frontend && npm run dev`, open the app, click the account icon in the header — confirm the dropdown still opens/closes correctly and the active Sign In/Sign Up toggle button is legible (white text on the new blue, not black-on-blue).

- [ ] **Step 6: Update `frontend/FRONTEND.md`**

Add a line under the Design System section noting the palette change: primary accent is now `brand-{300..950}` (Nepal-flag blue `#1e4fa3` at 500), replacing `emerald-500`; `amber` is the data-accent role; `rose`/`red` keeps its win/live/error role unchanged.

- [ ] **Step 7: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/App.tsx frontend/src/components/Header.tsx frontend/FRONTEND.md
git commit -m "Recolor App shell and Header from emerald to Nepal-blue brand accent"
```

---

### Task 3: Recolor + declutter `MatchFeed.tsx` (Home sidebar)

**Files:**
- Modify: `frontend/src/components/MatchFeed.tsx`
- Modify: `frontend/FRONTEND.md`

**Interfaces:**
- Consumes: `brand-{300,400,500,600,800,900,950}` tokens from Task 1.

- [ ] **Step 1: Locate every emerald occurrence**

Run: `cd frontend/src && grep -noE '(bg|text|border|ring|shadow|from|to|via|placeholder|divide)-emerald-[0-9]+' components/MatchFeed.tsx`

- [ ] **Step 2: Apply the recolor rule**

All emerald uses in `MatchFeed.tsx` are brand/interactive (category filter active state — note the `WOMEN`/`DOMESTIC` filter buttons currently use `amber`/`emerald` per-category active colors defined in the `cat.activeColor` array; the `MEN` category's `text-rose-400` stays rose, `DOMESTIC`'s `text-emerald-400` → `text-brand-400`, `WOMEN`'s `text-amber-400` stays amber since amber is a real distinct category color here, not a "data" role — this is a pre-existing 3-way category color scheme, not part of the brand/data swap), search input focus ring (`focus:border-emerald-500/50 focus:ring-emerald-500/50` → `focus:border-brand-500/50 focus:ring-brand-500/50`), the `ALL/FINISHED/UPCOMING` active tab (`bg-emerald-500 text-black` → `bg-brand-500 text-white`, applying the text-pairing rule), and the selected-match card border/shadow (`border-emerald-500 shadow-emerald-500/5` → `border-brand-500 shadow-brand-500/5`).

- [ ] **Step 3: Declutter the match card score/kickoff box (spec-listed change)**

Find:
```tsx
<div className="px-2 py-1 text-center bg-[#0d0e10] border border-[#202124] rounded font-mono text-[11px] text-white min-w-[45px]">
```
Replace with (drop the boxed background/border, keep it as plain centered text so the score reads as data, not a UI chrome box):
```tsx
<div className="px-2 py-1 text-center font-mono text-[11px] text-white min-w-[45px]">
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run lint` — expect clean.
Run: `cd /home/abee/Music/fotnep && python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src` — confirm no new findings introduced in `MatchFeed.tsx`.
Run: `cd frontend && npm run dev`, open the Matches tab, confirm: category filter buttons still toggle correctly, the status tabs (All/Finished/Upcoming) show white text on blue when active, the score/time no longer sits in a boxed pill, selected match card border is blue not green.

- [ ] **Step 5: Update `frontend/FRONTEND.md`** — note the score-box declutter and the brand-blue swap for `MatchFeed`'s selected/active states.

- [ ] **Step 6: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/components/MatchFeed.tsx frontend/FRONTEND.md
git commit -m "Recolor MatchFeed to brand-blue accent and declutter score box"
```

---

### Task 4: Recolor + declutter `MatchDetails.tsx` (Home main panel)

**Files:**
- Modify: `frontend/src/components/MatchDetails.tsx`
- Modify: `frontend/FRONTEND.md`

**Interfaces:**
- Consumes: `brand-{300,400,500,600,800,900,950}` tokens from Task 1.

- [ ] **Step 1: Locate every emerald occurrence**

Run: `cd frontend/src && grep -noE '(bg|text|border|ring|shadow|from|to|via|placeholder|divide)-emerald-[0-9]+' components/MatchDetails.tsx`

- [ ] **Step 2: Apply the recolor rule, with two named exceptions**

Exception 1 — `getRatingColorClass` (the red/yellow/green/blue rating scale): leave every `emerald` reference inside this function UNCHANGED (it's the semantic "good" tier of a data scale, not the brand accent).

Exception 2 — the "Finished" status badge. Find:
```tsx
<span className="mt-3 bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase flex items-center gap-1">
  <Check className="w-3 h-3 text-emerald-400" /> Finished
</span>
```
Replace with a neutral slate treatment (matching the `FT` badge already used in `MatchFeed.tsx`'s card list, since "finished" is a status, not a positive/brand signal, and green has no meaning left outside the brand accent and the rating scale):
```tsx
<span className="mt-3 bg-slate-800/60 border border-slate-700/60 text-slate-300 text-[10px] font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase flex items-center gap-1">
  <Check className="w-3 h-3 text-slate-300" /> Finished
</span>
```

Everywhere else, apply the standard swap: `{property}-emerald-{N}` → `{property}-brand-{N}`. This includes: the "Who Will Win?" vote panel's bars/buttons/percentages, the vote-cast confirmation state, the H2H rating text accents, the "Predicted Lineup by Machine" badge and its pulsing dot, and any focus/hover states on the vote buttons. Apply the **text-pairing rule** wherever `bg-emerald-500` pairs with `text-black`.

Leave unchanged: the LIVE badge (`bg-emerald-500 text-black ... LIVE`) — wait, per the rule this DOES need the brand swap too since LIVE-in-progress is not the "win/live/critical" crimson role in this codebase (crimson is reserved for match *result* — the win/red team color — not the live-in-progress indicator); check the actual current color: if it's `bg-emerald-500`, swap to `bg-brand-500 text-white`. If instead it already uses `rose`/`red`, leave it — re-verify against the live file since colors may differ slightly from earlier session reads.

- [ ] **Step 3: Fix the broken `emerald-450` occurrences**

Run: `cd frontend/src && grep -n 'emerald-450\|emerald-445\|emerald-350' components/MatchDetails.tsx`

For each match, apply the shade-normalization rule (450→500, 445→400, 350→400) and then the brand swap (unless it's inside `getRatingColorClass`, in which case normalize the shade number but keep it as `emerald`, e.g. `text-emerald-450` → `text-emerald-500` if found in that function).

- [ ] **Step 4: Declutter — merge the scoreboard and vote panel (spec-listed change)**

Find the two adjacent top-level containers (the scoreboard/team-header block and the "Who Will Win?" vote block):
```tsx
      {/* Stadium and Venue info footer */}
        ...
      </div>
    </div>

      {/* 2. "Who Will Win?" Prediction Vote (Simplified & De-cluttered) */}
      <div className="m-4 p-5 bg-[#101115] border border-slate-800/80 rounded-xl relative overflow-hidden shadow-xl">
```
(Read the current file around these two blocks first — they are two separate top-level bordered `<div>`s stacked with a gap.) Change the vote panel's wrapper so it no longer has its own full border/shadow/rounded-xl treatment; instead make it a continuation of the scoreboard container using a top divider:
```tsx
      {/* 2. "Who Will Win?" Prediction Vote — same panel as scoreboard, divided not boxed */}
      <div className="mx-4 mb-4 pt-5 border-t border-slate-800/60 relative overflow-hidden">
```
This requires moving this block to be a direct child of the scoreboard's outer container rather than a sibling `<div>` — read the surrounding JSX structure in the live file first to confirm nesting before making this change, since exact indentation/closing-tag placement must match the current structure.

- [ ] **Step 5: Add `motion-safe:` to the player-node hover-scale**

Find (appears twice, home and away player nodes):
```tsx
className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs cursor-pointer shadow-lg transition-all duration-300 hover:scale-120 ${
```
Replace `hover:scale-120` with `motion-safe:hover:scale-120` in both occurrences (Tailwind's built-in `motion-safe:` variant only applies when the OS does not request reduced motion — no JS needed).

- [ ] **Step 6: Verify**

Run: `cd frontend && npm run lint` — expect clean.
Run: `cd /home/abee/Music/fotnep && python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src` — confirm score keeps dropping, no new findings.
Run: `cd frontend && npm run dev`, open a FINISHED match and an UPCOMING match on the Matches tab — confirm: "Finished" badge reads in neutral slate not green, vote panel now reads as one continuous section with the scoreboard (visible divider, not two separate boxes), rating badges on the pitch still show red/yellow/green/blue correctly (unchanged), player-node hover-scale still works with reduced-motion off and is suppressed with OS reduced-motion on (check via browser devtools "Emulate CSS prefers-reduced-motion: reduce").

- [ ] **Step 7: Update `frontend/FRONTEND.md`** — note the brand-blue swap (with the "Finished" badge and rating-scale exceptions called out explicitly), the scoreboard/vote-panel merge, and the `motion-safe:` gating.

- [ ] **Step 8: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/components/MatchDetails.tsx frontend/FRONTEND.md
git commit -m "Recolor MatchDetails to brand-blue accent, merge scoreboard/vote panel, gate hover motion"
```

---

### Task 5: Recolor + flatten `PlayerComparison.tsx` (Compare page)

**Files:**
- Modify: `frontend/src/components/PlayerComparison.tsx`
- Modify: `frontend/FRONTEND.md`

**Interfaces:**
- Consumes: `brand-{300,400,500,600,800,900,950}` tokens from Task 1.

- [ ] **Step 1: Locate every emerald occurrence and every broken shade**

Run:
```bash
cd frontend/src
grep -noE '(bg|text|border|ring|shadow|from|to|via|placeholder|divide)-emerald-[0-9]+' components/PlayerComparison.tsx
grep -noE '(bg|text|border|ring|shadow)-(slate|amber|rose)-(250|350|450|550|750|905)' components/PlayerComparison.tsx
```

- [ ] **Step 2: Apply the recolor rule, splitting brand vs. data role**

This file has a genuine two-role split (unlike the chrome files): the FUTCard rating badge, attribute progress bars (`DualComparativeBar`'s `colorA`), and radar-chart Player-A series are "Player A" → these become `brand` (blue). The `colorB` / Player-B series, which currently defaults to a soft white-grey (not emerald), stays as-is OR — per spec — becomes amber to make it visually distinct as the second comparison side. Apply:
- `DualComparativeBar`'s default props `colorA = '#10b981'` (emerald hex) → `colorA = '#1e4fa3'` (brand-500 hex, matches Task 1's token).
- Leave `colorB = '#e2e8f0'` as-is UNLESS the call sites pass an explicit override — check call sites with `grep -n 'DualComparativeBar' components/PlayerComparison.tsx` and if a caller passes `colorB` explicitly as an emerald hex, change it to `'#d97706'` (amber-600, the data-accent hex) instead.
- Every other emerald use (borders, badges, buttons, focus rings, the "Play Direction" legend chip, the two radar-chart legend pills) → standard `emerald-{N} → brand-{N}` swap, EXCEPT where the surrounding code is specifically comparing/labeling "Player B" or a second-series data point — those become `amber-{N}` instead of `brand-{N}` (same shade number).
- Apply the shade-normalization rule first for any broken shade (`emerald-350`, `emerald-445`, `emerald-450`, any `slate-250/350/450/550/750/905`), then apply the brand/amber/slate swap as appropriate.
- Apply the text-pairing rule wherever `bg-emerald-500` pairs with `text-black`.

- [ ] **Step 3: Flatten the `FUTCard` decorative shine (spec-listed change)**

Find:
```tsx
        {/* Subtle radial shine overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
```
Delete this line entirely (the radial shine is the "glossy FIFA card" tell — the card keeps its avatar/name/badge content, just without the decorative light-sweep overlay).

- [ ] **Step 4: Remove the leftover emoji artifacts near line 209**

Find:
```tsx
          <span className="text-[10px] filter saturate-50 shrink-0" role="img" aria-label="club element">
            {player.position === 'FW' ? '' : player.position === 'GK' ? '' : ''}
          </span>
```
This entire `<span>` renders invisible/empty content for every branch (leftover emoji unicode that didn't survive being pasted into the plan or the source — confirm by opening the actual file in an editor that renders emoji, since a plain-text read tool may show them as blank). Delete the whole `<span>...</span>` block — it contributes nothing visible and the `aria-label="club element"` on empty content is also meaningless to screen readers.

- [ ] **Step 5: Verify**

Run: `cd frontend && npm run lint` — expect clean.
Run: `cd /home/abee/Music/fotnep && python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src` — confirm score keeps dropping.
Run: `cd frontend && npm run dev`, open the Compare tab, select two players — confirm: Player A styling is blue, Player B is amber/white as decided, FUTCard no longer has the diagonal shine sweep, no invisible/broken glyphs near the position badge.

- [ ] **Step 6: Update `frontend/FRONTEND.md`** — note the brand/amber two-role split for Compare, the FUTCard shine removal, and the emoji-artifact cleanup.

- [ ] **Step 7: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/components/PlayerComparison.tsx frontend/FRONTEND.md
git commit -m "Recolor PlayerComparison with brand/amber two-side split, flatten FUTCard, remove emoji artifacts"
```

---

### Task 6: Recolor + declutter `PlayerStats.tsx` (Stats page)

**Files:**
- Modify: `frontend/src/components/PlayerStats.tsx`
- Modify: `frontend/FRONTEND.md`

**Interfaces:**
- Consumes: `brand-{300,400,500,600,800,900,950}` tokens from Task 1.

- [ ] **Step 1: Locate every emerald occurrence**

Run: `cd frontend/src && grep -noE '(bg|text|border|ring|shadow|from|to|via|placeholder|divide)-emerald-[0-9]+' components/PlayerStats.tsx`

- [ ] **Step 2: Apply the recolor rule, splitting brand vs. data role**

The attribute progress-bar fill (`bg-emerald-500` inside the `Object.entries(displayPlayer.attributes).map(...)` block) is a data element → `bg-amber-600`. Everything else (buttons, borders, focus states, the male/female gender-badge accent that uses emerald for male) → `brand-{N}`.

- [ ] **Step 3: Declutter the stat-tile grid (spec-listed change)**

Find the pattern used for each stat tile (there are 4, per the earlier scanner read at lines 208/212/223/227):
```tsx
<div className="bg-slate-900/35 border border-slate-850/50 p-3 rounded-lg text-center">
```
Replace the per-tile border+background with a lighter, divided treatment — remove the individual `border` and `bg-slate-900/35`, keep padding/rounding, and add a single `divide-x divide-slate-800/60` on the tiles' shared parent grid container instead (locate the parent `<div className="grid ...">` wrapping these 4 tiles and add the divide classes there). Each tile becomes:
```tsx
<div className="p-3 text-center">
```

- [ ] **Step 4: Verify**

Run: `cd frontend && npm run lint` — expect clean.
Run: `cd /home/abee/Music/fotnep && python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src` — confirm score keeps dropping.
Run: `cd frontend && npm run dev`, open the Stats tab, select a player — confirm: attribute bars are amber, everything else brand-blue, the 4 stat tiles read as one divided row instead of 4 separate boxes.

- [ ] **Step 5: Update `frontend/FRONTEND.md`** — note the brand/amber split and the stat-tile decluttering.

- [ ] **Step 6: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/components/PlayerStats.tsx frontend/FRONTEND.md
git commit -m "Recolor PlayerStats to brand/amber split and declutter stat-tile grid"
```

---

### Task 7: Recolor + declutter `LineupBuilder.tsx` (Lineups page), and mark intentional `rounded-full` exceptions

**Files:**
- Modify: `frontend/src/components/LineupBuilder.tsx`
- Modify: `frontend/FRONTEND.md`

**Interfaces:**
- Consumes: `brand-{300,400,500,600,800,900,950}` tokens from Task 1.

- [ ] **Step 1: Locate every emerald occurrence and broken shade**

Run:
```bash
cd frontend/src
grep -noE '(bg|text|border|ring|shadow|from|to|via|placeholder|divide)-emerald-[0-9]+' components/LineupBuilder.tsx
grep -noE '(bg|text|border|ring|shadow)-(amber|rose|slate)-(450|905)' components/LineupBuilder.tsx
```

- [ ] **Step 2: Apply the recolor rule, splitting brand vs. data role, exempting the pitch**

Exempt entirely (leave unchanged): the pitch surface color (`bg-[#1a3824]` and the pitch-line/marking colors using `white/*` opacity), since it's a literal football field, not a brand element.

Data role → `amber-{N}`: the player rating pill (`text-amber-400 ... rating`, `text-amber-450` normalized to `text-amber-500`), the "Synergy Index" progress bar fill.

Brand role → `brand-{N}`: everything else — the formation `<select>` focus border, the player-filter toggle buttons' active state, the "Clear Draft" button hover, the selected-slot rings, the assigned-player bubble gradient (`from-emerald-600 to-emerald-400` → `from-brand-600 to-brand-400`), the bench slot selected state, the "Bench" label badge.

- [ ] **Step 3: Fix `rose-450`**

Run: `grep -n 'rose-450' components/LineupBuilder.tsx` — apply the shade-normalization rule (450 → 500), so `rose-450` becomes `rose-500` (this one stays rose — it's the remove/delete button's icon color, an error/destructive action, not brand or data).

- [ ] **Step 4: Mark the intentional `rounded-full` exceptions with `unslop-ignore`**

These were judged as legitimately circular during the earlier radius-scale pass and should stay `rounded-full`, but get an inline `unslop-ignore` comment so the scanner stops flagging a deliberate choice. In `LineupBuilder.tsx`, find each of:
- The pitch center-circle marking (`w-28 h-28 border-2 border-white/20 rounded-full`)
- The player jersey-number bubble (`w-11 h-11 md:w-12 md:h-12 rounded-full border-2 ...`)
- The remove/X icon buttons (both the on-pitch and bench versions, `bg-black/80 rounded-full p-1 text-red-400 ...`)
- The empty-slot placeholder circles (both pitch and bench versions)
- The decorative blur orb (`w-24 h-24 bg-emerald-500/5 blur-xl rounded-full` — after Step 2 this becomes `bg-brand-500/5`)
- The synergy progress-bar track/fill `rounded-full` pair

For each, add a trailing JSX comment on the same logical element, e.g.:
```tsx
{/* unslop-ignore: literal circular avatar/button, not a decorative pill default */}
```
placed directly above the `<div>`/`<button>` it applies to.

Repeat the same `unslop-ignore` marking pass on the equivalent circular elements already identified in `MatchDetails.tsx` (LIVE badge, ping dots, pitch center circle, hover rings, "Predicted Lineup by Machine" badge, player-number discs) and `PlayerStats.tsx`/`App.tsx`'s decorative blur orbs and progress-bar tracks, using the same comment convention. (This step touches those other files too — do it as part of this task since it's the last file task in the plan and this is a single mechanical sweep across the codebase, not new design work.)

- [ ] **Step 5: Declutter — tighten adjacent panel borders (spec-listed change)**

The controls bar (`rounded-xl` from the earlier radius pass), pitch canvas, and bench section sit directly stacked with `mb-6`/`mt-6` gaps and each has its own full border. Reduce the controls bar's border to a bottom-only divider against the pitch canvas it sits inside:
Find:
```tsx
<div className="w-full flex justify-between items-center bg-slate-950 border border-slate-850 p-3 rounded-xl mb-6 z-10 gap-3 flex-wrap">
```
Replace with:
```tsx
<div className="w-full flex justify-between items-center bg-slate-950 border-b border-slate-850 pb-3 mb-6 z-10 gap-3 flex-wrap">
```
(drops the box-around-the-whole-bar in favor of a bottom rule, since it already lives inside the pitch canvas's own bordered container from Task 1's earlier radius pass — no need for a border-within-a-border).

- [ ] **Step 6: Verify**

Run: `cd frontend && npm run lint` — expect clean.
Run: `cd /home/abee/Music/fotnep && python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src` — confirm the "Large rounded corners" finding count drops to near-zero (only genuinely un-annotated cases, if any, remain) and the overall vibe score has dropped substantially from the 44 baseline.
Run: `cd frontend && npm run dev`, open the Lineups tab — confirm: formation selector/filter buttons/clear-draft are blue, rating pills and synergy bar are amber, pitch stays green, the controls bar no longer looks double-boxed against the pitch canvas.

- [ ] **Step 7: Update `frontend/FRONTEND.md`** — note the brand/amber split, the `unslop-ignore` sweep (list which elements across which files), and the controls-bar/pitch border consolidation.

- [ ] **Step 8: Commit**

```bash
cd /home/abee/Music/fotnep
git add frontend/src/components/LineupBuilder.tsx frontend/src/components/MatchDetails.tsx frontend/src/components/PlayerStats.tsx frontend/src/App.tsx frontend/FRONTEND.md
git commit -m "Recolor LineupBuilder to brand/amber split, mark intentional rounded-full exceptions app-wide, tighten controls-bar border"
```

---

### Task 8: Final full-app verification

**Files:** none modified — verification only.

- [ ] **Step 1: Type-check the whole frontend**

Run: `cd frontend && npm run lint`
Expected: clean, no errors.

- [ ] **Step 2: Production build**

Run: `cd frontend && npm run build`
Expected: succeeds; spot-check `dist/assets/index-*.css` contains `--color-brand-500:#1e4fa3` (confirms the token survived tree-shaking/minification).

- [ ] **Step 3: Re-run the unslop-ui scanner on the whole app and record the final score**

Run: `cd /home/abee/Music/fotnep && python3 ~/.claude/skills/unslop-ui/scripts/devibe_scan.py frontend/src`
Expected: vibe score meaningfully lower than the 44 recorded after the earlier radius-scale pass; the "Emoji used as icons" and "Large rounded corners" findings should be at or near zero remaining hits (excluding any newly-`unslop-ignore`d, intentional ones); report the final score and any remaining findings to the user.

- [ ] **Step 4: Manual walkthrough of all four tabs in the dev server**

Run: `cd frontend && npm run dev`, then in the browser:
- Matches tab: category filters, status tabs, match card selection, vote panel, pitch rating badges — all should read blue/amber/crimson per the new roles, no lingering emerald.
- Compare tab: pick two players, confirm Player A blue / Player B amber split and the flattened FUTCard.
- Stats tab: select a player, confirm amber attribute bars and the decluttered stat-tile row.
- Lineups tab: assign players, confirm blue UI chrome, amber ratings/synergy bar, green pitch unchanged.
- Toggle OS "reduce motion" (browser devtools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`) and confirm the Header dropdown and pitch player-node hover no longer animate.

- [ ] **Step 5: Report results to the user**

Summarize: starting vibe score (68 → 44 → final), what changed per page, and any exceptions/judgment calls made (e.g. "Finished" badge going neutral-slate, Player B going amber instead of a third accent color) so the user can review and flag anything they want adjusted.
