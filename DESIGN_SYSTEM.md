# FotNep Design System

## Color Palette

### Primary (Neutral Base)
- **Dark BG**: `#0F172A` — Main background (dark slate)
- **Dark Secondary**: `#1A2332` — Cards, panels
- **Dark Tertiary**: `#2D3E52` — Hover states, borders
- **Text Primary**: `#F1F5F9` — Main text
- **Text Secondary**: `#94A3B8` — Muted labels
- **Border**: `#334155` — Subtle lines

### Nepali Accent Colors (Minimal Use)
- **Victory Red**: `#C8102E` — Wins, positive metrics, CTAs (from Nepal flag)
- **Teams Blue**: `#003893` — Secondary actions, info (from Nepal flag)
- **Alert Yellow**: `#FCD34D` — Warnings, draws
- **Success Green**: `#10B981` — Form validation

### Semantic
- **Draw**: `#FCD34D` → `#78350F` text on dark
- **Loss**: `#EF4444` → faded red
- **Win**: `#C8102E` (Victory Red, bold)
- **Neutral**: `#94A3B8` (muted)

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
```
No decorative fonts. Clean, readable, professional.

### Hierarchy
| Use | Size | Weight | Letter-spacing |
|-----|------|--------|-----------------|
| Page Title | 28px | 700 | -0.5px |
| Section Head | 20px | 600 | 0 |
| Card Title | 16px | 600 | 0 |
| Body | 14px | 400 | 0 |
| Label/Caption | 12px | 500 | 0.25px |
| Stat Value | 24px | 700 | -0.5px |

---

## Spacing System

```
4px, 8px, 12px, 16px, 24px, 32px, 48px
```

Use consistently:
- **Padding inside cards**: 16px / 24px (never 48px)
- **Gap between elements**: 12px / 16px
- **Section margins**: 32px / 48px
- **Page padding**: 24px (mobile), 32px (desktop)

---

## Components

### Cards
- **BG**: `#1A2332`
- **Border**: `1px solid #334155` (subtle, no shadows)
- **Padding**: `16px` or `24px` (never oversized)
- **Radius**: `6px` (clean, not rounded)

### Buttons
- **Primary (Nepal Red)**: Bg `#C8102E`, text white, no shadow
  ```
  hover: #A00824 (darker)
  active: #8B061D
  ```
- **Secondary**: Bg `#2D3E52`, text `#F1F5F9`, border `1px #334155`
- **Minimal**: No bg, text color, underline on hover
- **Size**: `36px` height (not oversized `48px+`)
- **Padding**: `8px 16px` (compact)

### Inputs
- **BG**: `#0F172A` (match page bg)
- **Border**: `1px solid #334155`
- **Text**: `#F1F5F9`
- **Focus**: Border `#003893` (no glow/shadow)
- **Radius**: `4px`

### Tables
- **Header BG**: `#2D3E52`
- **Row BG**: `#1A2332`
- **Row Hover**: `#2D3E52` (subtle)
- **Borders**: `1px #334155` (minimal)
- **Padding**: `12px` per cell (compact)
- **Font**: 12-14px (dense but readable)

### Charts
- **Grid**: `#2D3E52` (faint)
- **Lines**: `#334155` (subtle)
- **Area Fill**: Use Nepali colors sparingly
  - Winners: Victory Red `#C8102E`
  - Comparative: Teams Blue `#003893`
  - Data: White/text-primary
- **Labels**: `#94A3B8` (muted)

### Badge/Pills
- **Sizes**: Small `20px h`, Medium `28px h` (never large)
- **Colors**:
  - FWD: Victory Red `#C8102E`
  - MID: Teams Blue `#003893`
  - DEF: `#10B981` (green)
  - GK: `#94A3B8` (gray)
- **Padding**: `4px 8px` (compact)
- **Radius**: `4px` (square-ish)

---

## Layout Principles

### Grid
- **Desktop**: 12-column grid, 32px gutter
- **Sidebar**: Fixed 260px width (collapsible on mobile)
- **Content**: Max-width 1400px

### No:
- Excessive padding (max 32px)
- Floating elements
- Glassmorphism
- Gradients (except subtle data viz)
- Large rounded corners (max 6px)
- Icon + label overload
- Multiple colors in one view

### Yes:
- Dense information
- Monospace for numbers (stats, player IDs)
- Semantic color (red = win, green = good stat)
- Alignment to grid
- Whitespace purpose (separation, not decoration)

---

## Reference Sites
- **Understat** (understat.com) — Dark mode, minimal cards, data-focused
- **WhoScored** (whoscored.com) — Clear tables, heatmaps, accent colors
- **FBRef** (fbref.com) — Dense tables, professional, no frills
- **Linear** (linear.app) — Minimal, blue accent, clean spacing

---

## Dark Mode Only
No light mode toggle. Football analytics = dark mode by default.

---

## Example Component Code

### Card
```jsx
<div className="bg-dark-secondary border border-dark-tertiary rounded-md p-6">
  <h3 className="text-lg font-semibold text-text-primary">Title</h3>
  <p className="text-sm text-text-secondary mt-2">Content</p>
</div>
```

### Button (Primary)
```jsx
<button className="bg-nepal-red hover:bg-nepal-red-dark text-white px-4 py-2 rounded text-sm font-medium">
  Action
</button>
```

### Badge
```jsx
<span className="bg-nepal-red text-white px-2 py-1 rounded text-xs font-semibold">FWD</span>
```

### Table Header
```jsx
<thead className="bg-dark-tertiary border-b border-dark-tertiary">
  <tr>
    <th className="text-left text-xs font-semibold text-text-secondary px-3 py-2">Name</th>
  </tr>
</thead>
```

---

## Tailwind Config Updates Required
See `frontend/tailwind.config.ts` for color/spacing mappings.
