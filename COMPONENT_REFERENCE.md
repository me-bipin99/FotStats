# FotNep Component Reference

Use these patterns when building Session 4 frontend pages. **Copy these exactly** to maintain consistency.

---

## Layout Shell

```jsx
export default function DashboardPage() {
  return (
    <div className="bg-dark-primary min-h-screen">
      {/* Sidebar fixed, content scrolls */}
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          {/* Content here */}
        </main>
      </div>
    </div>
  );
}
```

---

## Cards

### Standard Card (for sections)
```jsx
<div className="card">
  <h3 className="text-lg font-semibold text-text-primary mb-4">Section Title</h3>
  <p className="text-sm text-text-secondary">Content</p>
</div>
```

### Compact Card (for stat boxes)
```jsx
<div className="card-compact">
  <p className="text-xs text-text-secondary mb-2">Label</p>
  <p className="text-stat">42</p>
</div>
```

### Card Grid (responsive)
```jsx
<div className="grid grid-cols-responsive">
  <div className="card-compact">Stat 1</div>
  <div className="card-compact">Stat 2</div>
  <div className="card-compact">Stat 3</div>
</div>
```

---

## Buttons

### Primary (Action CTA)
```jsx
<button className="btn-primary">
  Submit
</button>
```

### Secondary (Alternative)
```jsx
<button className="btn-secondary">
  Cancel
</button>
```

### Ghost (Tertiary)
```jsx
<button className="btn-ghost">
  Learn More
</button>
```

### Small Button
```jsx
<button className="btn-sm btn-secondary">
  Edit
</button>
```

### Button Group
```jsx
<div className="flex gap-2">
  <button className="btn-sm btn-primary">Action</button>
  <button className="btn-sm btn-secondary">Cancel</button>
</div>
```

---

## Forms

### Text Input
```jsx
<div className="mb-4">
  <label htmlFor="name">Player Name</label>
  <input
    id="name"
    type="text"
    className="input mt-2"
    placeholder="Enter name"
  />
</div>
```

### Select Dropdown
```jsx
<div className="mb-4">
  <label htmlFor="position">Position</label>
  <select id="position" className="input mt-2">
    <option value="">All Positions</option>
    <option value="GK">Goalkeeper</option>
    <option value="DEF">Defender</option>
    <option value="MID">Midfielder</option>
    <option value="FWD">Forward</option>
  </select>
</div>
```

### Filter Bar (horizontal)
```jsx
<div className="flex gap-4 mb-6">
  <select className="input text-sm py-2 px-3" defaultValue="">
    <option value="">Position</option>
    <option value="FWD">Forward</option>
  </select>
  <input type="text" className="input text-sm py-2 px-3" placeholder="Search..." />
  <button className="btn-sm btn-secondary">Filter</button>
</div>
```

---

## Badges (for positions/roles)

```jsx
// Forward
<span className="badge-fwd">FWD</span>

// Midfielder
<span className="badge-mid">MID</span>

// Defender
<span className="badge-def">DEF</span>

// Goalkeeper
<span className="badge-gk">GK</span>

// Match Results
<span className="badge-win">W</span>
<span className="badge-draw">D</span>
<span className="badge-loss">L</span>
```

---

## Tables

### Basic Table
```jsx
<div className="card">
  <table className="w-full text-sm">
    <thead className="table-head">
      <tr>
        <th>Name</th>
        <th>Position</th>
        <th>Goals</th>
        <th>Assists</th>
      </tr>
    </thead>
    <tbody>
      <tr className="table-row">
        <td>Anjan Bista</td>
        <td><span className="badge-fwd">FWD</span></td>
        <td className="text-stat">13</td>
        <td>5</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Sortable Table Header
```jsx
<th className="cursor-pointer hover:text-nepal-red">
  Name ↓
</th>
```

### Clickable Rows
```jsx
<tr 
  className="table-row hover:bg-dark-tertiary cursor-pointer"
  onClick={() => navigate(`/player/${playerId}`)}
>
  {/* cells */}
</tr>
```

---

## Lists

### Vertical List
```jsx
<div className="space-y-2">
  <div className="flex justify-between items-center border-b border-dark-border pb-3">
    <span className="text-sm text-text-primary">Anjan Bista</span>
    <span className="text-text-secondary">74 Caps</span>
  </div>
  <div className="flex justify-between items-center border-b border-dark-border pb-3">
    <span className="text-sm text-text-primary">Biraj Bohora</span>
    <span className="text-text-secondary">52 Caps</span>
  </div>
</div>
```

---

## Stats Section

### Stat Cards (Grid)
```jsx
<div className="grid grid-cols-4 gap-4 mb-6">
  <div className="card-compact">
    <p className="text-text-secondary text-xs mb-2">Total Players</p>
    <p className="text-stat text-nepal-red">101</p>
  </div>
  <div className="card-compact">
    <p className="text-text-secondary text-xs mb-2">Total Matches</p>
    <p className="text-stat text-nepal-blue">245</p>
  </div>
</div>
```

### Stat Row (horizontal)
```jsx
<div className="flex gap-8 p-4 bg-dark-secondary border border-dark-border rounded">
  <div>
    <p className="text-text-secondary text-xs mb-1">xG</p>
    <p className="text-stat">7.2</p>
  </div>
  <div>
    <p className="text-text-secondary text-xs mb-1">xA</p>
    <p className="text-stat">3.4</p>
  </div>
  <div>
    <p className="text-text-secondary text-xs mb-1">Pass Acc</p>
    <p className="text-stat">78%</p>
  </div>
</div>
```

---

## Charts

### Chart Container
```jsx
<div className="card">
  <h3 className="text-lg font-semibold text-text-primary mb-4">Goals by Position</h3>
  <BarChart data={data} />
</div>
```

### Mini Chart (sidebar)
```jsx
<div className="card-sm">
  <p className="text-xs text-text-secondary mb-2">Form</p>
  <LineChart data={formData} height={40} />
</div>
```

---

## Modals / Dialogs

### Simple Overlay Modal
```jsx
{showModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
    <div className="bg-dark-secondary rounded-md p-8 max-w-md w-full">
      <h2 className="text-xl font-semibold text-text-primary mb-4">Modal Title</h2>
      <p className="text-sm text-text-secondary mb-6">Modal content here</p>
      <div className="flex gap-2">
        <button className="btn-primary flex-1">OK</button>
        <button className="btn-secondary flex-1">Cancel</button>
      </div>
    </div>
  </div>
)}
```

---

## Loading States

### Skeleton Loader (for tables)
```jsx
{isLoading ? (
  <div className="space-y-3">
    <div className="skeleton h-12 w-full rounded" />
    <div className="skeleton h-12 w-full rounded" />
    <div className="skeleton h-12 w-full rounded" />
  </div>
) : (
  <table>{/* data */}</table>
)}
```

### Loading Spinner
```jsx
<div className="flex items-center justify-center p-8">
  <div className="animate-spin">
    <div className="h-8 w-8 border-2 border-nepal-red border-t-transparent rounded-full" />
  </div>
</div>
```

---

## Empty States

### No Data Message
```jsx
{data.length === 0 && (
  <div className="text-center py-12">
    <p className="text-text-secondary mb-2">No players found</p>
    <button className="btn-sm btn-secondary">Create Player</button>
  </div>
)}
```

---

## Colors in Context

### Use Nepal Red for:
- Primary CTAs
- Win indicators
- High-value metrics
- Active states

### Use Nepal Blue for:
- Secondary info
- Team colors
- Comparative data
- Links (optional)

### Use White/Gray for:
- Text, backgrounds
- Neutral borders
- Secondary labels

### Never use:
- Multiple colors in one view
- Gradients on backgrounds
- Excessive shadows
- Large rounded corners (stick to `rounded-md`)

---

## Spacing Rules

### Page Layout
```jsx
<main className="p-8">                    {/* 32px padding */}
  <h1 className="mb-8">Title</h1>         {/* 32px below */}
  <div className="grid grid-cols-4 gap-4">  {/* 16px gap */}
    <div className="card">Content</div>   {/* 24px internal padding */}
  </div>
</main>
```

### Card Internal
```jsx
<div className="card">                    {/* 24px padding (default) */}
  <h3 className="mb-4">Title</h3>         {/* 16px below */}
  <p className="mb-3">Text</p>            {/* 12px below */}
</div>
```

### Do NOT:
- Use `p-0`, `p-1`, `p-2`, `p-5`, `p-7` (stick to 3, 4, 6, 8)
- Use `gap-0`, `gap-1`, `gap-3`, `gap-5` (stick to 2, 4, 6, 8)
- Add extra padding to cards (24px is max)

---

## Typography Scale

```jsx
{/* Page Title */}
<h1 className="text-2xl font-bold">Dashboard</h1>

{/* Section Title */}
<h2 className="text-xl font-semibold">Recent Matches</h2>

{/* Card Title */}
<h3 className="text-lg font-semibold">Player Stats</h3>

{/* Body Text */}
<p className="text-sm text-text-secondary">Description</p>

{/* Label */}
<label className="text-xs font-semibold text-text-secondary">Field Name</label>

{/* Stat Value */}
<p className="text-stat">42</p>
```

---

## Common Patterns

### Header + Content + Footer
```jsx
<div className="card">
  <div className="border-b border-dark-border pb-4 mb-4">
    <h3 className="text-lg font-semibold">Title</h3>
  </div>
  <div className="mb-4">
    {/* main content */}
  </div>
  <div className="border-t border-dark-border pt-4 flex gap-2">
    <button className="btn-sm btn-primary">Save</button>
    <button className="btn-sm btn-secondary">Cancel</button>
  </div>
</div>
```

### Sidebar Detail Panel (on list click)
```jsx
<div className="grid grid-cols-3 gap-6">
  <div className="col-span-2">
    {/* main list/table */}
  </div>
  <div>
    {selectedItem && (
      <div className="card sticky top-0">
        <h3 className="text-lg font-semibold mb-4">{selectedItem.name}</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-text-secondary text-xs mb-1">Position</p>
            <p className="text-text-primary">{selectedItem.position}</p>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
```

---

## Do's and Don'ts

✅ **DO:**
- Use `gap-4` and `gap-6` for spacing
- Use `py-3 px-4` for cell padding
- Use `text-xs`, `text-sm`, `text-lg`, `text-2xl`
- Use `border border-dark-border` for subtle divisions
- Use `hover:bg-dark-tertiary` for interactive rows
- Stack vertically first, then grid for responsive
- Use Nepal Red sparingly (only CTAs + wins)

❌ **DON'T:**
- Use giant padding (`p-12`, `p-16`)
- Use excessive borders/shadows
- Use multiple accent colors in one section
- Use `rounded-full` or `rounded-3xl` (max is `rounded-md`)
- Add icons everywhere (only when they add information)
- Use bright gradients
- Center everything (left-align content)
- Add decorative elements

---

## File Structure for Components

```
frontend/src/components/
├── common/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Table.tsx
│   ├── Badge.tsx
│   └── Loading.tsx
├── layout/
│   ├── Sidebar.tsx
│   ├── Navbar.tsx
│   └── Layout.tsx
├── charts/
│   ├── XGChart.tsx
│   ├── HeatmapCanvas.tsx
│   ├── WinProbabilityBar.tsx
│   ├── SynergyMatrix.tsx
│   └── LineupPitch.tsx
```

Use these patterns for all components.
