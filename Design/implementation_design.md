# Design Implementation Guidelines

## Overview

This document provides practical guidance on **when** and **how** to apply the design patterns from `DESIGN_GUIDELINES.md`. It focuses on decision-making frameworks to help AI agents and developers make consistent design choices.

**Required Reading**: `DESIGN_GUIDELINES.md` for the complete design tokens and component specifications.

---

## 1. Design Decision Framework

### Core Principles

**Information Hierarchy**
- Most important information should be visually prominent (larger, bolder, darker)
- Use size, weight, and color to create hierarchy—not just position
- Group related information together with consistent spacing

**Progressive Disclosure**
- Show essential information first, hide complexity behind interactions
- Use line-clamp for long text, expand on demand
- Provide empty states when no data exists

**Consistency Over Creativity**
- Use established patterns before inventing new ones
- Match similar components across the app (all cards look similar, all lists look similar)
- Maintain predictable spacing and sizing

**Clarity Over Density**
- Prefer readable spacing over cramming information
- Use whitespace to create visual separation
- When in doubt, add more spacing rather than less

---

## 2. Layout Patterns & When to Use Them

### Page Layout Decision Tree

```
Is this a detail page (single item)?
├─ YES: Use sidebar layout
│  └─ Main content (flex-1) + Sidebar (320px max-width)
│     Example: Topic detail page
│
└─ NO: Is this a list/overview page?
   ├─ YES: Use full-width constrained layout
   │  └─ Max width: 1280px (xl), centered with mx-auto
   │     Example: Topics list, Posts list
   │
   └─ Is this a comparison/analysis page?
      └─ YES: Use full-width grid
         Example: Entity comparison
```

**Page Container Pattern**
```html
<!-- Detail page with sidebar -->
<div class="mx-auto w-full max-w-[95vw] xl:max-w-7xl py-4 px-1 md:px-6 md:py-10">
  <div class="gap-4 sm:gap-8 flex flex-col lg:flex-row">
    <!-- Main content -->
    <div class="flex flex-col gap-4 flex-1 min-w-0">
      <!-- Content here -->
    </div>
    <!-- Sidebar -->
    <div class="w-full lg:max-w-[320px]">
      <!-- Sidebar content -->
    </div>
  </div>
</div>

<!-- List/overview page -->
<div class="mx-auto w-full max-w-7xl px-4 py-8">
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <!-- Cards here -->
  </div>
</div>
```

### Card vs List vs Grid

**Use Cards When:**
- Displaying complex, multi-faceted data (stats, charts, descriptions)
- Items are heterogeneous (different types of content)
- Each item deserves significant visual weight
- Example: Topic cards with metrics, charts, and keywords

```html
<div class="bg-background dark:bg-background-100 rounded-lg border overflow-hidden flex flex-col p-4 gap-4">
  <!-- Card content -->
</div>
```

**Use Lists When:**
- Displaying simple, homogeneous data (all same structure)
- Items are text-heavy or simple key-value pairs
- Vertical space is limited
- Example: Settings list, navigation menu

```html
<div class="divide-y border rounded-lg">
  <div class="px-4 py-3 hover:bg-accent">Item 1</div>
  <div class="px-4 py-3 hover:bg-accent">Item 2</div>
</div>
```

**Use Grid When:**
- Items are uniform in structure and size
- Need to show many items efficiently
- Responsive column layout is beneficial
- Example: Image galleries, topic cards, entity cards

```html
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  <!-- Grid items -->
</div>
```

### Flex vs Grid

**Use Flexbox When:**
- One-dimensional layout (row OR column)
- Content dictates sizing (items grow/shrink dynamically)
- Alignment is primary concern
- Example: Header with logo and buttons, vertical section stacking

```html
<!-- Horizontal flex -->
<div class="flex items-center justify-between gap-2">
  <div>Left content</div>
  <div>Right content</div>
</div>

<!-- Vertical flex -->
<div class="flex flex-col gap-4">
  <div>Section 1</div>
  <div>Section 2</div>
</div>
```

**Use Grid When:**
- Two-dimensional layout (rows AND columns)
- Precise control over sizing needed
- Items should align in both directions
- Example: Two-column data lists, card grids

```html
<!-- Two-column data grid -->
<div class="grid grid-cols-[auto_min-content] gap-2">
  <div>Label</div>
  <div>Value</div>
</div>

<!-- Card grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- Cards -->
</div>
```

### Responsive Layout Strategy

**Mobile-First Approach**
1. Start with single column (stack everything vertically)
2. Add `md:` prefix for tablet layout (768px+)
3. Add `lg:` prefix for desktop layout (1024px+)
4. Add `xl:` prefix for large desktop (1280px+)

**Common Responsive Patterns**

```html
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col md:flex-row gap-4">

<!-- 1 column → 2 columns → 3 columns -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

<!-- Hide on mobile, show on desktop -->
<div class="hidden md:block">Desktop only</div>

<!-- Full width on mobile, constrained on desktop -->
<div class="w-full lg:max-w-[320px]">

<!-- Different padding by screen size -->
<div class="px-4 md:px-6 lg:px-8">
```

**Fixed Mobile Header Pattern**
```html
<!-- Mobile sticky header -->
<div class="fixed top-0 left-0 right-0 h-14 z-50 bg-background dark:bg-background-100 border-b md:relative">
  <!-- Mobile header content -->
</div>
```

---

## 3. Spacing Decisions

### Grouping Related Elements

**Rule of Proximity**: Items that are related should be closer together than unrelated items.

**Spacing Hierarchy**
- **Within a component**: `gap-1` to `gap-2` (4px-8px)
- **Between related items**: `gap-2` to `gap-4` (8px-16px)
- **Between sections**: `gap-4` to `gap-6` (16px-24px)
- **Between major sections**: `gap-6` to `gap-8` (24px-32px)

**Example: Card Internal Spacing**
```html
<div class="bg-card rounded-lg border p-4 flex flex-col gap-4">
  <!-- gap-4 (16px) between major sections -->
  
  <div class="flex items-center gap-2">
    <!-- gap-2 (8px) between related inline items -->
    <Icon />
    <span>Title</span>
  </div>
  
  <div class="flex flex-col gap-1">
    <!-- gap-1 (4px) for tightly coupled items -->
    <div>Label</div>
    <div>Value</div>
  </div>
</div>
```

### Tight vs Loose Spacing

**Use Tight Spacing (gap-1, gap-2) When:**
- Items are part of the same conceptual unit
- Space is limited (mobile, sidebar)
- Items are small (badges, icons with labels)
- Example: Icon + text in button, label + value pairs

**Use Loose Spacing (gap-4, gap-6) When:**
- Items are distinct sections
- Readability is paramount
- Creating visual separation between content types
- Example: Between cards, between page sections

**Real Example from Topic Card:**
```html
<div class="flex flex-col py-4 gap-4">
  <!-- gap-4 between major sections -->
  
  <div class="flex px-4 items-center gap-2">
    <!-- gap-2 between thumbnail and text -->
    <ThumbnailGrid />
    <div class="flex flex-col gap-0">
      <!-- gap-0 for stacked text -->
      <Link>Title</Link>
      <p>Subtitle</p>
    </div>
  </div>
  
  <div>Next section</div>
</div>
```

### Section Separation

**Border vs Spacing vs Both**

**Use Border Only** (no extra spacing):
- List dividers: `divide-y` or `border-t`
- Container edges: `border rounded-lg`

**Use Spacing Only** (no border):
- Card grids: `gap-4`
- Vertical section stacking: `space-y-6`

**Use Both Border + Spacing**:
- Internal card sections: `border-t py-2.5` (border top + padding)
- Data list rows: `border-b py-2.5`

```html
<!-- Internal sections with borders -->
<div class="divide-y">
  <div class="py-2.5">Section 1</div>
  <div class="py-2.5">Section 2</div>
</div>
```

### Padding vs Margin

**Use Padding When:**
- Creating internal space within a component
- Space should be part of the clickable/background area
- Most common: `p-3`, `p-4`, `px-4 py-2`

**Use Margin When:**
- Creating external space between components
- Space should be transparent (not part of background)
- Less common: Prefer `gap` in flex/grid instead

**Prefer `gap` Over Margin**
```html
<!-- ✅ GOOD: Use gap in flex/grid -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- ❌ AVOID: Using margins -->
<div class="flex">
  <div class="mr-4">Item 1</div>
  <div>Item 2</div>
</div>
```

---

## 4. Color Application Rules

### Background Colors

**Decision Tree for Backgrounds**

```
What's the context?
├─ Page/main container
│  └─ Use: bg-background
│
├─ Card/elevated surface
│  └─ Use: bg-background dark:bg-background-100
│     (Light mode: white-ish, Dark mode: slightly elevated)
│
├─ Nested container within card
│  └─ Use: bg-background-50 (subtle)
│     or bg-background-100 (more contrast)
│
├─ Hover state
│  └─ Use: hover:bg-accent or hover:bg-background-50
│
└─ Status/semantic
   └─ Use: bg-{color}-500/10
      Example: bg-emerald-500/10, bg-rose-500/10
```

**Real Examples:**

```html
<!-- Page background -->
<body class="bg-background text-foreground">

<!-- Card on page -->
<div class="bg-background dark:bg-background-100 rounded-lg border">

<!-- Nested element with subtle background -->
<div class="bg-background-50 p-3 rounded">

<!-- Status indicator -->
<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
```

### Border Color Selection

**Primary Border: `border` or `border-border`**
- Default for all cards, containers, buttons
- Has subtle opacity, works in light and dark mode
- Most common use case

**Secondary Border: `border-border-secondary`**
- For internal dividers within components
- Subtle separation (like between data rows)
- Less prominent than primary border

**Status Borders: `border-{color}-500/20`**
- For semantic/status indicators
- Always pair with matching background
- 20% opacity for subtle emphasis

```html
<!-- Card with primary border -->
<div class="border rounded-lg">

<!-- Internal divider -->
<div class="border-t border-border-secondary py-2.5">

<!-- Success indicator -->
<div class="border border-emerald-500/20 bg-emerald-500/10">
```

### Text Color Hierarchy

**Primary Text: `text-foreground` or no class**
- Main content, body text
- Default, highest contrast

**Secondary Text: `text-muted-foreground`**
- Labels, captions, helper text
- Supporting information
- Example: "Last activity", field labels

**Small/Meta Text: `text-xs text-muted-foreground`**
- Timestamps, small metadata
- Least prominent text

**Status Text: `text-{color}-600 dark:text-{color}-400`**
- Success, error, warning indicators
- Always include dark mode variant
- Example: `text-emerald-600 dark:text-emerald-400`

```html
<!-- Text hierarchy in a card -->
<div>
  <h3 class="text-lg font-semibold">Main Title</h3>
  <p class="text-sm">Regular content text</p>
  <span class="text-sm text-muted-foreground">Label or caption</span>
  <time class="text-xs text-muted-foreground">2 hours ago</time>
</div>
```

### Semantic Colors Pattern

**Always use the 3-part pattern for status/semantic colors:**

1. **Background**: `bg-{color}-500/10`
2. **Text**: `text-{color}-600 dark:text-{color}-400`
3. **Border**: `border-{color}-500/20`

**Color Meanings:**
- **Emerald/Green**: Success, positive, completed
- **Rose/Red**: Error, negative, critical, danger
- **Amber/Yellow**: Warning, attention needed, medium priority
- **Blue**: Info, neutral highlight, primary action
- **Gray**: Neutral, disabled, inactive

```html
<!-- Success badge -->
<span class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs">
  Success
</span>

<!-- Error message -->
<div class="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 p-3 rounded-lg">
  Error message here
</div>

<!-- Warning badge -->
<span class="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs">
  Warning
</span>

<!-- Info badge -->
<span class="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-xs">
  Info
</span>
```

---

## 5. Typography Hierarchy

### Heading Level Selection

**Use this hierarchy consistently:**

| Level | Size | Weight | Use Case | Tailwind |
|-------|------|--------|----------|----------|
| Page title | 24px | Semibold | Main page heading | `text-2xl font-semibold` |
| Section heading | 20px | Semibold | Major sections | `text-xl font-semibold` |
| Card/sub heading | 14px | Semibold | Card titles, subsections | `text-sm font-semibold` |
| Body text | 14px | Medium | Regular content | `text-sm font-medium` or `text-sm` |
| Small/caption | 12px | Medium | Labels, small text | `text-xs font-medium` or `text-xs` |
| Tiny labels | 10px | Medium | Uppercase labels | `text-[10px] font-medium uppercase` |

**Example Hierarchy in Page:**
```html
<div>
  <!-- Page title -->
  <h1 class="text-2xl font-semibold mb-4">Topic Analysis</h1>
  
  <!-- Section heading -->
  <h2 class="text-xl font-semibold mb-3">Overview</h2>
  
  <!-- Card with heading -->
  <div class="bg-card rounded-lg border p-4">
    <h3 class="text-sm font-semibold mb-2">Executive Summary</h3>
    <p class="text-sm">Regular body text content...</p>
    <span class="text-xs text-muted-foreground">Caption or metadata</span>
  </div>
</div>
```

### When to Bold vs Medium

**Use Semibold (font-semibold) For:**
- All headings (h1, h2, h3)
- Card titles
- Section labels
- Emphasis on key data points

**Use Medium (font-medium) For:**
- Labels in data lists
- Button text
- Regular body text (when not using default)
- Tags/badges

**Use Normal Weight For:**
- Regular paragraphs
- Long-form content
- Less common in this app's design

```html
<!-- Data list with proper weights -->
<div class="grid grid-cols-[auto_min-content] gap-2">
  <span class="text-sm font-medium text-muted-foreground">Label</span>
  <span class="text-sm font-medium">Value</span>
</div>

<!-- Card with heading and content -->
<div>
  <div class="text-sm font-semibold mb-2">Card Title</div>
  <p class="text-sm">Body content with default weight</p>
</div>
```

### Color and Weight Combinations

**Common Patterns:**

1. **Heading**: Semibold + Foreground color
   - `text-lg font-semibold` or `text-2xl font-semibold`

2. **Label**: Medium + Muted color
   - `text-sm font-medium text-muted-foreground`

3. **Value/Data**: Medium + Foreground color
   - `text-sm font-medium`

4. **Caption**: No weight + Muted color
   - `text-xs text-muted-foreground`

5. **Uppercase Label**: Medium + Muted + Uppercase
   - `text-[10px] font-medium text-muted-foreground uppercase tracking-wider`

```html
<!-- Complete data row -->
<div class="grid grid-cols-[auto_min-content]">
  <span class="text-sm font-medium text-muted-foreground whitespace-nowrap">
    Posts Monitored
  </span>
  <span class="text-sm font-medium text-right">
    1,234
  </span>
</div>
```

---

## 6. Component Selection

### Card vs Simple Container

**Use Full Card Pattern When:**
- Content is substantial (multiple data points, chart, description)
- Item needs visual separation from page background
- Hover/click interaction on entire card
- Pattern: `bg-background dark:bg-background-100 rounded-lg border`

**Use Simple Container When:**
- Lightweight grouping needed
- Content is minimal
- Already inside another card
- Pattern: `border rounded-lg p-3`

```html
<!-- Full card -->
<div class="bg-background dark:bg-background-100 rounded-lg border overflow-hidden flex flex-col p-4 gap-4">
  <!-- Complex content -->
</div>

<!-- Simple container -->
<div class="border rounded-lg p-3">
  <!-- Simple content -->
</div>
```

### Badge vs Tag vs Pill

**Badge** (rounded-full, small):
- Status indicators (success, error, warning)
- Counts or numbers
- Compact categorical labels
- Always use semantic color pattern

```html
<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
  Success
</span>
```

**Tag** (slight rounding, subtle):
- Keywords
- Categories without status meaning
- Less prominent than badges
- Usually neutral colors

```html
<span class="text-xs bg-background-100 text-muted-foreground px-1.5 py-0.5 rounded">
  keyword
</span>
```

**Pill** (same as badge but for buttons):
- Action buttons that are fully rounded
- Filter chips
- Tab-like selections

```html
<button class="rounded-full border px-3 py-1.5 text-sm hover:bg-accent">
  Filter
</button>
```

### Button Style Selection

**Primary** (`bg-primary text-primary-foreground`):
- Main call-to-action (only 1-2 per screen)
- Most important action
- Example: "Save", "Submit", "Create"

**Outline** (`border bg-background hover:bg-accent`):
- Secondary actions (most common)
- Default choice for most buttons
- Example: "Cancel", "Settings", filter buttons

**Ghost** (`hover:bg-accent`):
- Tertiary actions
- Icon-only buttons
- Minimal visual weight needed

**Destructive** (`bg-destructive/10 text-destructive border-destructive/20`):
- Delete, remove, dangerous actions
- Always confirm before executing

```html
<!-- Button hierarchy in form -->
<div class="flex gap-2">
  <button class="bg-primary text-primary-foreground px-4 py-2 rounded-md">
    Save Changes
  </button>
  <button class="border bg-background hover:bg-accent px-4 py-2 rounded-md">
    Cancel
  </button>
</div>

<!-- Icon button -->
<button class="size-9 inline-flex items-center justify-center rounded-md hover:bg-accent">
  <Icon />
</button>
```

### Button Size Selection

**Small** (`h-8 px-3`):
- Compact UIs, mobile
- Secondary actions in dense layouts
- Icon + text in tight space

**Default** (`h-9 px-4`):
- Standard choice (most common)
- Desktop primary actions
- Forms and dialogs

**Large** (`h-10 px-6`):
- Hero sections
- Mobile primary CTAs
- Rarely used

**Icon-only** (`size-9`, `size-8`, `size-10`):
- Close buttons, more menus
- When space is limited
- Always include aria-label

```html
<!-- Responsive button sizing -->
<button class="h-8 px-3 md:h-9 md:px-4 text-sm rounded-md border">
  Action
</button>

<!-- Icon button with proper size -->
<button class="size-9 inline-flex items-center justify-center rounded-md hover:bg-accent" aria-label="Close">
  <X className="size-4" />
</button>
```

---

## 7. Interactive Elements

### When to Make Something Clickable

**Add Click/Hover When:**
- Element performs an action (button, link)
- Element navigates somewhere
- Element expands/collapses content
- Element selects/toggles state

**Required for Clickable Elements:**
1. `cursor-pointer` class
2. Hover state change
3. Active state (scale-[0.97] for buttons)
4. Focus state (automatic with proper semantic HTML)

```html
<!-- Clickable card -->
<Link 
  href="/topic/123"
  class="block bg-card rounded-lg border hover:bg-accent transition-colors"
>
  <!-- Card content -->
</Link>

<!-- Button with full interactive states -->
<button class="px-4 py-2 rounded-md border bg-background hover:bg-accent active:scale-[0.97] transition-all">
  Click me
</button>
```

### Hover State Rules

**Subtle Hover** (most common):
- Background shifts slightly: `hover:bg-accent` or `hover:bg-background-50`
- Use for: Cards, list items, secondary buttons

**Prominent Hover**:
- Background changes more: `hover:bg-primary/90`
- Use for: Primary buttons, important CTAs

**Underline Hover**:
- Text links: `hover:underline`
- Use for: Inline links, text-only actions

**No Hover**:
- Static text, disabled elements, non-interactive components

```html
<!-- Card hover -->
<div class="border rounded-lg p-4 hover:bg-accent transition-colors">

<!-- Link hover -->
<a href="#" class="text-sm hover:underline">Learn more</a>

<!-- Button hover -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit
</button>
```

### Focus State Requirements

**Automatic Focus (preferred)**:
- Use semantic HTML: `<button>`, `<a>`, `<input>`
- Focus ring applied automatically from globals.css

**Custom Focus** (when needed):
- `focus:ring-2 focus:ring-ring focus:outline-none`
- Use for custom interactive elements

```html
<!-- Standard button (automatic focus) -->
<button class="px-4 py-2 rounded-md border">
  Button
</button>

<!-- Custom interactive element -->
<div 
  role="button" 
  tabindex="0"
  class="px-4 py-2 rounded-md border focus:ring-2 focus:ring-ring outline-none"
>
  Custom button
</div>
```

### Loading State Patterns

**Skeleton Loaders** (preferred):
- Match the shape of content
- Use muted colors with subtle animation
- Show structure while loading

**Spinner**:
- For buttons during submission
- For small areas
- When skeleton isn't practical

**Disable + Opacity**:
- Buttons during async actions: `disabled:opacity-50 disabled:cursor-not-allowed`

```html
<!-- Skeleton for card -->
<div class="bg-card rounded-lg border p-4">
  <Skeleton className="h-4 w-32 mb-2" />
  <Skeleton className="h-20 w-full" />
</div>

<!-- Loading button -->
<button disabled class="disabled:opacity-50 disabled:cursor-not-allowed">
  <Spinner className="size-4 mr-2" />
  Loading...
</button>
```

---

## 8. Information Display Patterns

### Two-Column Data Lists

**When to Use:**
- Displaying key-value pairs
- Showing statistics/metrics
- Property lists

**Pattern:**
```html
<div class="grid grid-cols-[auto_min-content] gap-x-2 gap-y-2.5">
  <div class="text-sm font-medium text-muted-foreground whitespace-nowrap">
    Label
  </div>
  <div class="text-sm font-medium text-right">
    Value
  </div>
</div>
```

**With Borders (within card):**
```html
<div class="rounded-xl grid grid-cols-[auto_min-content] border px-3 bg-background dark:bg-background-100 py-1">
  <div class="col-span-2 font-semibold text-sm pt-2.5">
    Section Title
  </div>
  
  <div class="col-span-2 grid grid-cols-subgrid border-b py-2.5 border-border-secondary">
    <div class="text-sm font-medium text-muted-foreground whitespace-nowrap">
      Posts Monitored
    </div>
    <div class="text-sm font-medium text-right">
      1,234
    </div>
  </div>
  
  <!-- Repeat rows -->
</div>
```

### Stat/Metric Displays

**Single Stat:**
```html
<div class="flex flex-col">
  <span class="text-2xl font-semibold">1,234</span>
  <span class="text-sm text-muted-foreground">Total Views</span>
</div>
```

**Stat Grid:**
```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="border rounded-lg p-4">
    <div class="text-xl font-semibold">1.2K</div>
    <div class="text-xs text-muted-foreground">Views</div>
  </div>
  <!-- More stats -->
</div>
```

**Inline Stats:**
```html
<div class="flex items-center gap-4">
  <div class="flex items-center gap-1">
    <Icon className="size-4 text-muted-foreground" />
    <span class="text-sm">1,234</span>
  </div>
  <!-- More inline stats -->
</div>
```

### Empty States

**Pattern:**
```html
<div class="p-8 text-center">
  <div class="text-sm text-muted-foreground">
    No data available
  </div>
</div>
```

**With Icon:**
```html
<div class="flex flex-col items-center justify-center p-12">
  <Icon className="size-12 text-muted-foreground mb-4" />
  <div class="text-sm font-medium mb-1">No topics found</div>
  <div class="text-sm text-muted-foreground">Create your first topic to get started</div>
</div>
```

---

## 9. Responsive Design Decisions

### Mobile-First Thinking

**Default State = Mobile**
1. Start with single column layout
2. Stack vertically with `flex-col`
3. Full width elements
4. Larger touch targets (min 44px)

**Then Enhance for Desktop**
1. Add breakpoint prefixes: `md:`, `lg:`, `xl:`
2. Change to row layouts: `md:flex-row`
3. Add columns: `md:grid-cols-2`
4. Constrain widths: `lg:max-w-[320px]`

### What to Hide/Show at Breakpoints

**Hide on Mobile:**
- Secondary navigation
- Sidebar content (move to bottom or modal)
- Desktop-specific toolbars
- Use: `hidden md:block`

**Hide on Desktop:**
- Mobile hamburger menu
- Mobile-specific header
- Bottom navigation
- Use: `md:hidden`

**Show Different Content:**
```html
<!-- Mobile version -->
<div class="md:hidden">
  Compact mobile content
</div>

<!-- Desktop version -->
<div class="hidden md:block">
  Full desktop content
</div>
```

### Layout Transformations

**Common Transform Patterns:**

```html
<!-- Stack on mobile, row on desktop -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Content 1</div>
  <div class="w-full md:w-1/2">Content 2</div>
</div>

<!-- Full width → Sidebar layout -->
<div class="flex flex-col lg:flex-row gap-4">
  <main class="flex-1">Main content</main>
  <aside class="w-full lg:w-[320px]">Sidebar</aside>
</div>

<!-- Different grid columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <!-- Cards -->
</div>
```

### Touch Target Sizing

**Minimum Interactive Element Size:**
- Mobile: 44px × 44px (use `h-11` or larger)
- Desktop: 36px × 36px (standard `h-9`)

**Responsive Button Sizing:**
```html
<!-- Larger on mobile for touch -->
<button class="h-11 px-6 md:h-9 md:px-4 rounded-md">
  Action
</button>

<!-- Icon button -->
<button class="size-11 md:size-9 rounded-md">
  <Icon className="size-5 md:size-4" />
</button>
```

---

## 10. Common Scenarios with Examples

### Scenario 1: Displaying Statistics/Metrics

**Simple Inline Stats:**
```html
<div class="flex items-center gap-4 text-sm">
  <div class="flex items-center gap-1">
    <Eye className="size-4 text-muted-foreground" />
    <span>1,234 views</span>
  </div>
  <div class="flex items-center gap-1">
    <Heart className="size-4 text-muted-foreground" />
    <span>56 likes</span>
  </div>
</div>
```

**Two-Column Stats Card:**
```html
<div class="rounded-xl grid grid-cols-[auto_min-content] border px-3 bg-background dark:bg-background-100 py-1">
  <div class="col-span-2 font-semibold text-sm pt-2.5 pb-1.5">
    Statistics
  </div>
  
  <div class="col-span-2 grid grid-cols-subgrid border-b py-2.5 border-border-secondary">
    <span class="text-sm font-medium text-muted-foreground">Views</span>
    <span class="text-sm font-medium text-right">1,234</span>
  </div>
  
  <div class="col-span-2 grid grid-cols-subgrid py-2.5">
    <span class="text-sm font-medium text-muted-foreground">Likes</span>
    <span class="text-sm font-medium text-right">56</span>
  </div>
</div>
```

### Scenario 2: Creating Data Cards

**Basic Data Card:**
```html
<div class="bg-background dark:bg-background-100 rounded-lg border overflow-hidden flex flex-col p-4 gap-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-semibold">Card Title</h3>
    <button class="size-8 inline-flex items-center justify-center rounded-md hover:bg-accent">
      <MoreVertical className="size-4" />
    </button>
  </div>
  
  <!-- Content -->
  <div class="text-sm">
    Card content goes here
  </div>
  
  <!-- Footer -->
  <div class="flex items-center justify-between text-xs text-muted-foreground">
    <span>Updated 2h ago</span>
    <span>View details →</span>
  </div>
</div>
```

**Card with Sections:**
```html
<div class="bg-background dark:bg-background-100 rounded-lg border overflow-hidden flex flex-col">
  <!-- Header section -->
  <div class="px-4 py-3 border-b flex items-center justify-between">
    <div class="text-sm font-semibold">Header</div>
    <button>Action</button>
  </div>
  
  <!-- Content section -->
  <div class="p-4 flex-1">
    Main content
  </div>
  
  <!-- Footer section -->
  <div class="px-4 py-3 border-t bg-background-50">
    Footer content
  </div>
</div>
```

### Scenario 3: Building Forms

**Form Field Pattern:**
```html
<div class="flex flex-col gap-1.5">
  <label class="text-sm font-medium">
    Field Label
  </label>
  <input 
    type="text"
    class="h-9 px-3 py-2 text-sm border rounded-md bg-background focus:ring-2 focus:ring-ring outline-none"
    placeholder="Enter value..."
  />
  <span class="text-xs text-muted-foreground">
    Helper text here
  </span>
</div>
```

**Complete Form:**
```html
<form class="flex flex-col gap-4">
  <div class="flex flex-col gap-1.5">
    <label class="text-sm font-medium">Name</label>
    <input type="text" class="h-9 px-3 py-2 border rounded-md" />
  </div>
  
  <div class="flex flex-col gap-1.5">
    <label class="text-sm font-medium">Description</label>
    <textarea class="px-3 py-2 border rounded-md min-h-[100px]"></textarea>
  </div>
  
  <div class="flex gap-2 justify-end">
    <button type="button" class="px-4 py-2 border rounded-md hover:bg-accent">
      Cancel
    </button>
    <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
      Save
    </button>
  </div>
</form>
```

### Scenario 4: Status Indicators

**Badge Status:**
```html
<!-- Success -->
<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
  Completed
</span>

<!-- Warning -->
<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
  Pending
</span>

<!-- Error -->
<span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
  Failed
</span>
```

**Alert/Notice:**
```html
<div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
  <Info className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
  <div class="flex flex-col gap-1">
    <div class="font-medium text-sm text-blue-600 dark:text-blue-400">
      Information
    </div>
    <div class="text-sm">
      This is an informational message.
    </div>
  </div>
</div>
```

### Scenario 5: Navigation Patterns

**Tabs:**
```html
<div class="flex items-center gap-2 pb-1">
  <button class="rounded-full border bg-blue-500/10 text-blue-500 border-blue-500 hover:bg-blue-500/20 px-3 py-1.5 text-sm">
    Overview
  </button>
  <button class="rounded-full border border-transparent hover:bg-background-50 bg-background px-3 py-1.5 text-sm">
    Posts
  </button>
  <button class="rounded-full border border-transparent hover:bg-background-50 bg-background px-3 py-1.5 text-sm">
    Entities
  </button>
</div>
```

**Segmented Control:**
```html
<div class="flex items-center bg-background p-0.5 gap-0.5 rounded-lg w-fit border">
  <button class="text-xs font-medium h-7 px-3 rounded-md bg-background-100 border-border">
    Active
  </button>
  <button class="text-xs font-medium h-7 px-3 rounded-md hover:bg-background-50">
    Inactive
  </button>
</div>
```

### Scenario 6: Modal/Dialog Usage

**Dialog Pattern:**
```html
<Dialog>
  <DialogContent class="bg-card rounded-xl p-6 max-w-md">
    <DialogHeader class="mb-4">
      <DialogTitle class="text-base font-semibold">
        Dialog Title
      </DialogTitle>
    </DialogHeader>
    
    <div class="text-sm mb-6">
      Dialog content goes here...
    </div>
    
    <div class="flex gap-2 justify-end">
      <button class="px-4 py-2 border rounded-md hover:bg-accent">
        Cancel
      </button>
      <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
        Confirm
      </button>
    </div>
  </DialogContent>
</Dialog>
```

---

## Decision Making Cheat Sheet

### Quick Reference for Common Decisions

**"Should I use a card or a list?"**
- Complex/varied data → Card
- Simple/uniform data → List

**"What spacing should I use?"**
- Same component: gap-1 to gap-2
- Related items: gap-2 to gap-4
- Sections: gap-4 to gap-6

**"What text color should I use?"**
- Main content → text-foreground or no class
- Labels → text-muted-foreground
- Status → text-{color}-600 dark:text-{color}-400

**"What button style should I use?"**
- Primary action → bg-primary
- Secondary action → outline (border)
- Tertiary → ghost

**"How do I show status?"**
- Use 3-part pattern: bg-{color}-500/10 + text-{color}-600 + border-{color}-500/20

**"What border should I use?"**
- Container edges → border
- Internal dividers → border-border-secondary
- Status indicators → border-{color}-500/20

---

*End of Design Implementation Guidelines*

