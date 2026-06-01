# 🧪 FotNep Integration Test Checklist

Complete these steps to verify the entire application works end-to-end.

---

## ✅ Prerequisites

- [ ] All 3 services ready (Backend, ML Service, Frontend)
- [ ] MongoDB running and seeded with 101 players
- [ ] Redis running for caching
- [ ] TypeScript compilation passing (`npm run type-check`)
- [ ] No console errors in browser DevTools

---

## 🔑 1. Authentication

- [ ] **Login Page Displays**
  - Dark theme applied
  - Email/password fields present
  - Submit button clickable
  
- [ ] **Demo Login Works**
  - Email: `admin@fotnep.com`
  - Password: `fotnep2025` (or any password)
  - Redirects to Dashboard
  - Token stored in localStorage

- [ ] **JWT Token Attached**
  - Open DevTools Network tab
  - Make any API request
  - Check `Authorization: Bearer <token>` header present

---

## 📊 2. Dashboard Page

- [ ] **Stats Cards Display**
  - [ ] Total Players: 101
  - [ ] Total Teams: ≥2
  - [ ] Total Matches: ≥1
  - [ ] Prediction Accuracy: Calculated correctly

- [ ] **Bar Chart (Top Scorers)**
  - [ ] Recharts BarChart renders
  - [ ] X-axis shows player names
  - [ ] Y-axis shows goal counts
  - [ ] Nepal Red (#C8102E) bars visible
  - [ ] Tooltip works on hover

- [ ] **Pie Chart (Position Distribution)**
  - [ ] Shows GK/DEF/MID/FWD breakdown
  - [ ] Colors match design system
  - [ ] Legend displays position labels
  - [ ] Tooltip shows counts on hover

- [ ] **Algorithm Badges**
  - [ ] All 5 algorithms listed: KNN, K-Means, Naive Bayes, ELO, Genetic Algorithm
  - [ ] Grid layout responsive
  - [ ] Badge styling correct (dark theme)

---

## 👥 3. Players Page

- [ ] **Table Displays**
  - [ ] All columns: Name, Position, Caps, Goals, ELO, Role
  - [ ] 20 players per page (pagination)
  - [ ] Data from backend/mock data visible

- [ ] **Position Filter Works**
  - [ ] Dropdown shows: All Positions, GK, DEF, MID, FWD
  - [ ] Selecting filter updates table
  - [ ] Player count updates correctly
  - [ ] Pagination resets to page 1

- [ ] **Row Click Selects Player**
  - [ ] Clicking row highlights it
  - [ ] Detail panel appears on right
  - [ ] Sticky positioning works (stays visible on scroll)

- [ ] **Detail Panel Shows Stats**
  - [ ] Player name and position badge
  - [ ] Caps, Goals, Assists, ELO Rating
  - [ ] All stats formatted correctly

- [ ] **RadarChart Displays**
  - [ ] 5-axis radar: Goals, Assists, Caps, ELO, Pass Acc
  - [ ] Poland angles visible
  - [ ] Fill color: Nepal Red with opacity

### 🆕 Session 5: XGChart & HeatmapCanvas

- [ ] **XGChart Component**
  - [ ] Bar chart: Actual Goals vs xG
  - [ ] Nepal Red (#C8102E) for actual, Nepal Blue (#003893) for xG
  - [ ] Similar players list below (5 players max)
  - [ ] Click another player updates all charts

- [ ] **HeatmapCanvas Component**
  - [ ] Canvas renders position-based heatmap
  - [ ] Green→Red gradient based on intensity
  - [ ] SVG pitch overlay visible (lines, circles, boxes)
  - [ ] Position-based zones correct:
    - [ ] GK: top center
    - [ ] DEF: upper rows spread
    - [ ] MID: middle rows centered
    - [ ] FWD: lower rows

---

## 🏟️ 4. Teams Page

- [ ] **Team Cards Display**
  - [ ] All teams listed as cards (3-column grid)
  - [ ] Team name, city, squad size visible
  - [ ] Cards clickable and responsive

- [ ] **Click Team = Load Squad**
  - [ ] Selected team card highlighted (border change)
  - [ ] Squad table appears below
  - [ ] All squad players listed
  - [ ] Loading spinner during fetch

- [ ] **Squad Table Columns**
  - [ ] Name, Position, Caps, Goals, Assists
  - [ ] Position badges color-coded
  - [ ] Data populated correctly

### 🆕 Session 5: LineupPitch & SynergyMatrix

- [ ] **LineupPitch Component**
  - [ ] SVG soccer field renders (green background)
  - [ ] 11 player circles positioned in 4-3-3 formation
  - [ ] Player names labeled below circles
  - [ ] Position colors correct: GK gray, DEF green, MID blue, FWD red
  - [ ] Legend shows position colors

- [ ] **SynergyMatrix Component**
  - [ ] Player pair grid displays
  - [ ] High synergy pairs: green badge
  - [ ] Medium synergy pairs: yellow badge
  - [ ] Low synergy pairs: gray badge
  - [ ] K-Means description at bottom

---

## ⚽ 5. Matches Page

- [ ] **Match Table Displays**
  - [ ] Columns: Date, Home, Away, Status, Score
  - [ ] Data populated (≥2 matches)
  - [ ] Dates formatted (MM/DD/YYYY)
  - [ ] Status badges: scheduled/live/completed (correct color)

- [ ] **Status Filter Works**
  - [ ] Dropdown: All Status, Scheduled, Live, Completed
  - [ ] Filtering updates table
  - [ ] Match count updates
  - [ ] Pagination resets

- [ ] **Row Click Shows Prediction**
  - [ ] Detail panel displays selected match
  - [ ] Match info: date, teams, status

- [ ] **Prediction Probabilities Display**
  - [ ] Win probability bar: 3 colors (red/yellow/red)
  - [ ] Percentages shown: Home Win %, Draw %, Away Win %
  - [ ] Confidence score visible
  - [ ] Narrative/description present

- [ ] **Formation Selector Works**
  - [ ] Dropdown: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2
  - [ ] Changing formation re-runs prediction
  - [ ] Lineup updates (if LineupPitch wired)

---

## 🎨 6. Design System Verification

- [ ] **Dark Mode Only**
  - [ ] No light theme toggle
  - [ ] Background: `#0F172A` (dark slate)
  - [ ] Cards: `#1A2332`
  - [ ] Text: `#F1F5F9`

- [ ] **Minimal Aesthetic**
  - [ ] No gradients on backgrounds
  - [ ] No excessive shadows
  - [ ] No oversized buttons/cards
  - [ ] Rounded corners: max `6px` (rounded-md)

- [ ] **Nepal Colors (Minimal Use)**
  - [ ] Red (#C8102E) for wins, goals, CTAs only
  - [ ] Blue (#003893) for info/secondary only
  - [ ] Neutral text/borders elsewhere

- [ ] **Spacing Correct**
  - [ ] No excessive padding (max 32px)
  - [ ] Gap between elements: 4/8/12/16/24/32px
  - [ ] Cards properly spaced from each other

---

## 🔄 7. API Integration

- [ ] **Real Backend (if running)**
  - [ ] All requests to `http://localhost:3000/api/v1`
  - [ ] JWT token attached to all requests
  - [ ] MongoDB data fetched correctly
  - [ ] Redis caching working (2nd request faster)

- [ ] **Mock Data Fallback (if backend offline)**
  - [ ] Login works without backend
  - [ ] All pages load with mock data
  - [ ] Dashboard shows 6 mock players
  - [ ] Teams show mock team
  - [ ] Matches show 2 mock matches

---

## ⚠️ 8. Error Handling

- [ ] **503 Backend Unavailable**
  - [ ] If backend down, mock data used
  - [ ] Error messages shown (if needed)
  - [ ] App doesn't crash

- [ ] **Network Timeout**
  - [ ] Slow requests show loading spinner
  - [ ] 3-second timeout doesn't hang UI
  - [ ] Error handled gracefully

- [ ] **Invalid Data**
  - [ ] Missing fields don't crash components
  - [ ] Default values shown (—, 0, etc)
  - [ ] No console errors logged

---

## 🎯 9. Algorithms Visibility

Verify all 5 ML algorithms are demonstrated:

- [ ] **1. KNN (K-Nearest Neighbors)**
  - [ ] Used in: XGChart similar players list
  - [ ] Shows 3-5 similar European players
  - [ ] Displays goal/assist counts

- [ ] **2. K-Means Clustering**
  - [ ] Used in: SynergyMatrix
  - [ ] Shows player synergy pairs
  - [ ] Groups by cluster

- [ ] **3. Naive Bayes**
  - [ ] Used in: Matches prediction probabilities
  - [ ] Shows home/draw/away win %
  - [ ] Probability adds to ~100%

- [ ] **4. ELO Rating System**
  - [ ] Used in: Players table ELO column
  - [ ] Used in: Player detail panel ELO stat
  - [ ] Numbers in range ~1600-1900

- [ ] **5. Genetic Algorithm**
  - [ ] Used in: LineupPitch (optimized lineup)
  - [ ] Shows best 11-player formation
  - [ ] Proper position distribution

---

## 📱 10. Responsive Design

- [ ] **Desktop (1920px+)**
  - [ ] 3-4 column grids display correctly
  - [ ] Detail panels align to right
  - [ ] No horizontal scroll

- [ ] **Tablet (768px - 1024px)**
  - [ ] Grids adapt to 2 columns
  - [ ] Detail panels stack below
  - [ ] No overflow

- [ ] **Mobile (< 768px)**
  - [ ] Single column layout
  - [ ] All interactive elements tap-friendly
  - [ ] No text overflow

---

## 🐛 11. Browser Console

- [ ] **No Errors**
  - [ ] Open DevTools Console
  - [ ] Navigate all pages
  - [ ] Click all buttons
  - [ ] Zero red error messages

- [ ] **No Warnings**
  - [ ] React warnings absent
  - [ ] Deprecation warnings absent
  - [ ] Console clean

---

## 📝 12. Performance

- [ ] **Page Load < 2 seconds**
  - [ ] Dashboard loads in <2s
  - [ ] Players table in <2s
  - [ ] Teams page in <2s
  - [ ] Matches page in <2s

- [ ] **Charts Render Smoothly**
  - [ ] BarChart/PieChart no lag
  - [ ] RadarChart smooth
  - [ ] Tooltips instant

- [ ] **Pagination Works**
  - [ ] Next/Prev buttons instant
  - [ ] No flicker on page change
  - [ ] Data updates correctly

---

## ✨ Final Check

- [ ] All 4 pages work (Dashboard, Players, Teams, Matches)
- [ ] All 5 algorithms demonstrated
- [ ] Dark mode applied throughout
- [ ] Minimal aesthetic (no SaaS template look)
- [ ] No console errors
- [ ] Responsive on desktop
- [ ] Ready for demo/presentation

---

## 🚀 Sign Off

**Tester Name:** _______________  
**Date:** _______________  
**Status:** ☐ PASS ☐ FAIL (if fail, list issues below)

**Issues Found:**
- 
- 
- 

**Ready for Production:** ☐ YES ☐ NO
