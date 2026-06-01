# FotNep - Complete Project Context (Sessions 1-6+)

## Project Overview
**FotNep** is a Nepali football analytics platform with:
- React frontend (Vite, TypeScript, Tailwind CSS)
- Express.js backend (TypeScript, MongoDB Atlas, JWT auth)
- 5 ML algorithms (KNN, K-Means, Naive Bayes, ELO, Genetic Algorithm)
- 102 seeded Nepali football players in MongoDB
- Dark mode UI with Nepal flag colors (Red #C8102E, Blue #003893)

**Status:** MVP + UI patterns discovered. Sessions 1-2 complete. Ready to implement voting system and remaining features.

**Sessions Complete:**
- Session 1 ✅ Data seeding, cleanup, ELO ratings
- Session 2 ⏳ ML routes partially implemented
- Session 3 ✅ UI design patterns documented

**Call Protocol:** Hey Abee! before each task to avoid losing context.

---

## UI Design & Components

### Design System (DESIGN_SYSTEM.md)
- **Color Palette:** Dark slate background (#0F172A), Nepal red/blue accents, minimal use
- **Typography:** System font stack (San Francisco, Segoe UI), 4 weight tiers
- **Spacing:** 4px, 8px, 12px, 16px, 24px, 32px, 48px
- **Components:** Cards (16-24px padding), Buttons (36px height), Tables (12-14px font), Badges (position/result)
- **Principle:** Dense information, no gradients/glassmorphism, professional football analytics aesthetic

### Current Pages
1. **Dashboard** - Stats cards, bar chart (top scorers), pie chart (positions), algo badges
2. **Players** - Table with filter, detail panel, XG/heatmap/radar charts
3. **Teams** - Team cards, squad table, lineup pitch, synergy matrix
4. **Matches** - Match list, predictions, formation selector

### Tailwind Config (frontend/tailwind.config.ts)
- Dark color scheme with custom utilities (`.card`, `.btn-primary`, `.badge-*`, etc.)
- `postcss.config.cjs` required for Tailwind compilation
- Text sizes: `text-xs` (12px), `text-sm` (14px), `text-lg` (16px), `text-stat` (24px bold)

---

## Current Work (Session 3+)

### UI Status
✅ Components built with dummy data  
⚠️ Some typos in labels/buttons  
⚠️ Font sizes/weights need refinement  
⚠️ Some element spacing/alignment needs tweaking  

### What Needs Fixing
1. **Typos** - Review all text labels, button text, headings
2. **Fonts** - Standardize text hierarchy (use Tailwind size classes consistently)
3. **Elements** - Adjust padding, alignment, visual polish while keeping design intact

### Design Intent
- Reference sites: Understat, WhoScored, FBRef, Linear (minimal, data-focused, professional)
- No light mode, no decorative elements, no icon overload
- Keep Nepal red (#C8102E) sparingly (CTAs, wins only)
- Dense but readable tables, clear stat hierarchy

---

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS (dark mode only)
- Recharts (data visualization)
- Zustand (state management)
- React Router (navigation)

### Backend
- Express.js + TypeScript
- MongoDB Atlas (cloud)
- Mongoose (ODM)
- JWT + bcryptjs (auth)
- Redis optional (caching)

### Ports
- Frontend: 3003 (or 3001, check QUICK_START.md)
- Backend: 3000
- API base: `http://localhost:3000/api/v1`

---

## Key Files & Paths

### Frontend Components
- `frontend/src/pages/` - 4 main pages (Dashboard, Players, Teams, Matches)
- `frontend/src/components/` - Visualizations (XGChart, HeatmapCanvas, LineupPitch, SynergyMatrix)
- `frontend/tailwind.config.ts` - Color/spacing definitions
- `frontend/postcss.config.cjs` - Tailwind CSS compilation
- `frontend/src/services/api.ts` - API client with mock fallback

### Backend Routes
- `backend/src/controllers/` - 6 controllers (auth, players, teams, matches, insights, predictions)
- `backend/src/routes/` - API route definitions
- `backend/src/models/` - Mongoose schemas

### Documentation
- `DESIGN_SYSTEM.md` - Design guidelines & color palette
- `COMPONENT_REFERENCE.md` - Copy-paste component patterns
- `STATUS.md` - Full project status & features
- `QUICK_START.md` - How to run (one-liner: `bash START.sh`)

---

## Running the App

```bash
# Terminal 1: Start both services
bash START.sh

# Terminal 2: Open browser
http://localhost:3003  # (or 3001, check QUICK_START.md)

# Login
Email: admin@fotnep.com
Password: fotnep2025
```

---

## UI Model Folder - Design Patterns (Session 3+)

A separate `/ui model` folder contains advanced design patterns for:

### 1. **Match Prediction Voting System** (MatchDetails.tsx)
   - **User Reputation-Based Weighting**: Each user's vote power increases with reputation (formula: `max(1, round(1 + reputation/5))`)
   - **Expert Predictions**: 4 hardcoded expert profiles with individual weights (7, 6, 5, 3)
   - **Hybrid Calculation**: 35% crowd simple votes + 65% expert weighted predictions
   - **Result Determination**: '1' = home win, 'X' = draw, '2' = away win
   - **Scoring System**: +3 points for correct prediction, -1 for wrong (tracked in user reputation)
   - **Match Simulation**: Can simulate match results to test prediction accuracy (MatchDetails.tsx:199-246)

### 2. **Lineup Builder Component** (LineupBuilder.tsx)
   - Pitch visualization with 6 formation options (4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3, 4-5-1)
   - Drag-to-assign player system
   - Synergy rating calculation based on roster depth + average player rating
   - Squad value calculation from market values
   - Default preset ("Gorkhali Stars XI") with mock data

### 3. **UI Patterns**
   - **Player Cards**: Show jersey number, match rating (color-coded), player name
   - **Tactical Pitch**: 100x62 aspect ratio, centered formations, interactive player nodes
   - **Statistics Bars**: Left-right split for home/away comparisons (possession, shots, corners, etc.)
   - **Theme Colors**:
     - Dark base: #0c0d10, #151619
     - Emerald accents: #10B981 (home team, positive states)
     - Rose accents: #ef4444 (away team, negative states)
     - Slate greys: #94A3B8 (muted text, borders)
   - **Typography**: Monospace for stats, sans-serif for labels, heavy font weights (bold, extrabold)

### 4. **State Management** (localStorage)
   - `FOTNEP_LOGGED_IN`: Current user username
   - `FOTNEP_USERS`: User list with reputation, correct/wrong predictions
   - `FOTNEP_PREDICTIONS`: Match predictions by user
   - `FOTNEP_MATCH_OVERRIDES`: Simulated match results for testing

---

## Voting System Algorithm - Key Changes
**Previous**: Simple vote counts per option (home/draw/away)
**Current**: 
1. Crowd votes collected unweighted
2. Expert votes added with individual weights
3. User reputation increases vote weight (max multiplier: 1 + rep/5)
4. Final probability = 35% * crowd% + 65% * expert%
5. Prediction accuracy tracked and reputation updated in real-time

---

## Session 3+ Work - Voting System & Predictions

### New Requirements (from UI Model)
1. **Weighted Voting System** - Replace simple vote counting
2. **User Reputation Tracking** - Award/penalize predictions
3. **Expert Consensus** - Combine crowd + expert opinions
4. **Match Simulations** - Test prediction accuracy

### Implementation Path
1. **Session 3b** - Add voting system to Match schema + predictions API
2. **Session 4** - Implement UI for voting + leaderboard
3. **Session 5** - Connect voting to match results + reputation updates
4. **Session 6+** - Full integration & accuracy tracking

---

## Architecture Decisions

### Database
- **MongoDB Atlas** (cloud, seeded with 102 players)
- **Redis** optional (caching, graceful fallback)
- **Collections:** Players, Teams, Matches, Users, Predictions, Votes

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS (dark mode only)
- Recharts for visualizations
- Context API for auth state

### Backend
- Express.js + TypeScript
- JWT authentication
- ML Service integration via Axios

### ML Service
- FastAPI + Python
- 5 algorithms (KNN, K-Means, Naive Bayes, ELO, GA)
- Model caching in memory
- European player dataset for KNN

---

## Notes for Next Sessions

- UI is intentionally "AI slop" placeholder with dummy data → refining now
- Real data from MongoDB (102 players already seeded)
- Design system established; execute & polish
- Keep dark mode only, minimal colors, professional aesthetic
- Test UI changes at each stage (`npm run dev`)
- **UI Model folder** = reference implementation with voting system
- **Main project** = production version, gradually porting patterns
- **Voting system** = NEW priority; port weighted algorithm to backend
