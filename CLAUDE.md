# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project: FotNep - Nepali Football Analytics Platform

**What:** Full-stack analytics app for Nepali football players with 5 ML algorithms  
**Tech Stack:** React 18 + Express.js + MongoDB + FastAPI (Python)  
**Status:** MVP built, Session 3+ in progress (UI refinement)

---

## Commands

```bash
# Start everything
bash START.sh

# Or individually:
cd backend && npm run dev           # Express.js on :3000
cd frontend && npm run dev          # Vite on :3003
cd services/ml-service && python -m uvicorn main:app --reload  # FastAPI on :8000

# Build
cd backend && npm run build
cd frontend && npm run build

# Test
cd backend && npm test
cd frontend && npm test
```

---

## Key Directories

- `backend/src/` — Express controllers, routes, models, middleware
- `frontend/src/` — React pages, components, services, context
- `services/ml-service/` — Python FastAPI + ML algorithms
- `data/` — CSV datasets (102 Nepali players, 2780 European players)

---

## Architecture

### Frontend
- **Pages:** Dashboard, Players, Teams, Matches (4 core pages)
- **State:** Zustand (auth context) + Context API
- **Styles:** Tailwind CSS (dark mode only)
- **Charts:** Recharts
- **Auth:** JWT tokens in localStorage

### Backend
- **Database:** MongoDB Atlas (102 players seeded)
- **Auth:** JWT + bcrypt
- **API:** RESTful (/api/v1/)
- **Cache:** Redis (optional, graceful fallback)

### ML Service
- **5 Algorithms:**
  1. KNN — Player similarity + xG estimation
  2. K-Means — Role clustering
  3. Naive Bayes — Match prediction
  4. ELO — Player ratings
  5. Genetic Algorithm — Squad optimization

---

## Design System

**Colors (dark theme only, no light mode):**
- Dark base: `#0c0d10`
- Card bg: `#151619`
- Border: `#202124`
- Text primary: `#F1F5F9`
- Interactive accent: `#10B981` (emerald)
- Nepal red: `#C8102E` (wins/CTAs only)

**Component Classes:**
- `.card` — Standard card with border
- `.btn-primary` — Emerald CTA button
- `.btn-secondary` — Secondary action
- `.input` — Form input with emerald focus
- `.table-head`, `.table-row` — Table styling
- `.badge-fwd`, `.badge-mid`, `.badge-def`, `.badge-gk` — Position badges
- `.text-stat` — Bold monospace for numbers

**Spacing:** Standard Tailwind (4/8/12/16/24/32/48px)  
**Radius:** `rounded-lg` = 8px, `rounded-xl` = 12px  
**Fonts:** System UI stack (-apple-system, Segoe UI, etc) + mono for numbers

---

## Data

**Players:** 102 Nepali (seeded in MongoDB)
- Name, position, stats, ELO rating, cluster assignment
- Used by: Dashboard, Players page, Teams page

**Matches:** 1 demo match (Nepal vs Bangladesh)
- Used by: Matches page, voting system

**Users:** Admin account seeded
- Email: admin@fotnep.com
- Password: fotnep2025

---

## Sessions Completed

- **Session 1** ✅ Data seeding, cleanup, ELO ratings
- **Session 2** ✅ ML routes, model integration
- **Session 3** 🚧 Backend controllers, voting system
- **Session 3b** 🚧 Voting endpoints, reputation tracking
- **Session 4** 🚧 Frontend pages refinement

---

## Recent Changes (Session 3+)

### UI Refactor Completed
- ✅ Updated Tailwind config: dark tokens (#0c0d10, #151619, #202124)
- ✅ Rewrote CSS component layer (.card, .btn-*, .input, .table-*)
- ✅ Changed primary interactive from red to emerald (#10B981)
- ✅ Removed broken spacing override
- ✅ Deleted UI model reference folder (patterns ported)

### Files Deleted (Cleanup)
- 13 redundant MD files (IMPLEMENTATION_PLAN, SESSION_PLAN, etc)
- UI model folder (design patterns now in main frontend)

---

## Current Focus

**Next:** Complete remaining page refactors (PlayersClean, Navbar) and test visual design.

**Files to Update:**
- `frontend/src/pages/PlayersClean.tsx` — Migrate to new token system
- `frontend/src/pages/Teams.tsx` — Update badge colors
- `frontend/src/pages/Matches.tsx` — Update spinner, styling
- `frontend/src/pages/Login.tsx` — Auto-update from CSS layer
- `frontend/src/components/Navbar.tsx` — Rewrite with clean header

---

## Important Notes

1. **Dark mode only** — No light mode toggle anywhere
2. **Emerald for interactive** — All buttons, focus states, active states use `#10B981`
3. **Nepal red sparingly** — Only for wins and critical CTAs (`#C8102E`)
4. **No AI slop** — Professional dark theme, no harsh gradients or decorative elements
5. **Dense information** — Tables, lists, grids are compact and readable
6. **System fonts only** — No Google Fonts, uses system UI stack + monospace for numbers

---

## Commonly Used Patterns

### Stat Card
```jsx
<div className="card-compact">
  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Label</p>
  <p className="text-stat">42</p>
</div>
```

### Button Primary
```jsx
<button className="btn-primary">Action</button>
```

### Table with Hover
```jsx
<table>
  <thead className="table-head">
    <tr><th>Col</th></tr>
  </thead>
  <tbody>
    <tr className="table-row hover:bg-[#1a1b1f]">
      <td>Data</td>
    </tr>
  </tbody>
</table>
```

### Filter Input
```jsx
<input className="input" placeholder="Search..." />
```

---

## Quick Help

- **Brand colors:** Nepal red `#C8102E`, blue `#003893`
- **Text colors:** Use Tailwind `text-slate-*` classes (500=muted, 200=bright)
- **Component reuse:** Check `frontend/src/components/` before creating new
- **API endpoints:** Base URL is `/api/v1/` on port 3000
- **ML service:** Calls to `/api/v1/estimate-stats`, `/api/v1/predict-match`, etc.
- **Auth:** All endpoints except `/auth/login` and `/auth/register` require JWT

---

**Last Updated:** Session 3+ (Cleanup & UI Refactor)  
**Ready for:** Session 4 Frontend Page Completion
