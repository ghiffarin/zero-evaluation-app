# Design System Guidelines for AI Agents

## Overview

This document provides comprehensive design guidelines for implementing UI components that match the application's visual style. All values are specified in CSS units (px, rem, etc.) rather than framework-specific classes.

### Preferred Technology Stack

**Primary Framework**: Tailwind CSS (v4+)

This project uses Tailwind CSS as the primary styling framework. When implementing designs:
- Use Tailwind utility classes where possible (e.g., `p-3`, `text-sm`, `rounded-lg`)
- For custom values not in Tailwind, use arbitrary values (e.g., `p-[10px]`, `text-[15px]`)
- Refer to the CSS Design Tokens section below for semantic color usage

When communicating with AI agents unfamiliar with Tailwind, the equivalent CSS values are provided throughout this document.

---

## CSS Design Tokens

The application uses CSS custom properties (variables) defined in `src/app/globals.css`. These tokens ensure consistent theming and automatic dark mode support.

### Core Tokens

**Base Radius**
```css
--radius: 0.625rem; /* 10px - base border radius */
```

**Radius Scale**
```css
--radius-sm: calc(var(--radius) - 4px);  /* 6px */
--radius-md: calc(var(--radius) - 2px);  /* 8px */
--radius-lg: var(--radius);              /* 10px */
--radius-xl: calc(var(--radius) + 4px);  /* 14px */
```

### Semantic Color Tokens

**Base Colors**
```css
--background: Main page background
--foreground: Primary text color
--card: Card background color
--card-foreground: Text color on cards
--popover: Popup/dropdown background
--popover-foreground: Text color in popups
```

**Interactive Colors**
```css
--primary: Primary brand color, main CTAs
--primary-foreground: Text on primary background
--secondary: Secondary actions, less emphasis
--secondary-foreground: Text on secondary background
--accent: Hover states, highlights
--accent-foreground: Text on accent background
--destructive: Error, danger, delete actions
```

**UI Element Colors**
```css
--muted: Subtle backgrounds, disabled states
--muted-foreground: Secondary text, labels
--border: Default border color
--border-secondary: Subtle dividers, inner borders
--input: Input field background/border
--ring: Focus ring color
```

**Background Levels** (Progressive depth)
```css
--background-50: Lightest (hover states)
--background-100: Cards, elevated surfaces
--background-200 to --background-900: Additional levels
```

**Chart Colors**
```css
--chart-1 through --chart-5: Data visualization colors
```

**Sidebar Colors**
```css
--sidebar: Sidebar background
--sidebar-foreground: Sidebar text
--sidebar-primary: Sidebar active items
--sidebar-accent: Sidebar hover state
--sidebar-border: Sidebar borders
--sidebar-ring: Sidebar focus ring
```

### Light Mode Values (Default)

```css
:root {
  --background: 0 0% 100%; /* Pure white */
  --foreground: oklch(0.141 0.005 285.823); /* Near black */
  
  --background-50: hsl(210 15% 98%);
  --background-100: hsl(210 15% 95%);
  
  --border: oklch(0.3039 0.04 213.68 / 0.075);
  --border-secondary: hsl(214 32% 96%);
  
  --primary: oklch(0.21 0.006 285.885);
  --primary-foreground: oklch(0.985 0 0);
  
  --destructive: oklch(0.577 0.245 27.325);
  --ring: oklch(0.705 0.015 286.067);
  
  /* See globals.css for complete list */
}
```

### Dark Mode Values

```css
.dark {
  --background: 0 0% 2%; /* Near black */
  --foreground: 0 0% 98%; /* Near white */
  
  --background-50: hsl(0 0% 6.5%);
  --background-100: hsl(0 0% 9%);
  
  --border: oklch(0.9296 0.007 106.53 / 0.05);
  --border-secondary: hsl(240 4% 12%);
  
  --card: oklch(0.21 0.006 285.885);
  --card-foreground: oklch(0.985 0 0);
  
  /* Dark mode inverts surface hierarchy */
  /* See globals.css for complete list */
}
```

### Using Design Tokens

**In CSS**
```css
.my-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
```

**In Tailwind (Semantic Names)**
```html
<div class="bg-background text-foreground border border-border rounded-lg">
  <div class="bg-card text-card-foreground">Card content</div>
</div>
```

**Using Background Levels**
```html
<div class="bg-background-100"><!-- Elevated surface --></div>
<div class="hover:bg-background-50"><!-- Subtle hover --></div>
```

---

## 1. Core Design Principles

### Visual Hierarchy
- Use subtle backgrounds and borders to create depth without heavy shadows
- Maintain consistent spacing to create visual rhythm
- Use font weight and size to establish content hierarchy

### Consistency
- Apply uniform spacing across similar component types
- Use consistent border radius values throughout
- Maintain color palette consistency for semantic meanings

### Accessibility
- Ensure sufficient color contrast (especially in dark mode)
- Use focus states for interactive elements
- Provide visual feedback for all user interactions

---

## 2. Spacing & Layout System

### Base Unit
- **Base unit**: 4px
- All spacing should be multiples of 4px

### Spacing Scale

| Name | Value | Tailwind | Use Case |
|------|-------|----------|----------|
| xs | 2px | `0.5` | Tight internal spacing, icon gaps |
| sm | 4px | `1` | Small gaps between related items |
| base | 6px | `1.5` | Compact padding |
| md | 8px | `2` | Standard gap between elements |
| lg | 12px | `3` | Component internal padding |
| xl | 16px | `4` | Section padding, larger gaps |
| 2xl | 24px | `6` | Major section spacing |
| 3xl | 32px | `8` | Page-level spacing |

**Tailwind Examples**
```html
<!-- Padding -->
<div class="p-3">padding: 12px</div>
<div class="px-4 py-2">padding: 8px 16px</div>

<!-- Gap -->
<div class="flex gap-2">gap: 8px</div>
<div class="space-y-4">margin-bottom: 16px (for children)</div>

<!-- Margin -->
<div class="mb-6">margin-bottom: 24px</div>
```

### Common Patterns

**Card Internal Padding**
- Standard cards: 12px
- Compact cards: 8px
- Spacious cards: 16px

**Section Gaps**
- Between cards: 8px
- Between sections: 16px-24px
- Between major page sections: 32px

**Container Padding**
- Mobile: 4px-16px
- Desktop: 24px-48px

**Grid Gaps**
- Tight grids: 8px
- Standard grids: 16px
- Loose grids: 24px

---

## 3. Typography

### Font Families
- **Primary (Sans-serif)**: Geist Sans (--font-geist-sans) or system default
- **Monospace**: Geist Mono (--font-geist-mono) for code or technical content
- **Grotesk**: Grotesk (--font-grotesk) for special typography needs

**Tailwind Classes**
```html
<div class="font-sans">Geist Sans</div>
<div class="font-mono">Geist Mono</div>
```

### Font Sizes

| Size Name | Value | Line Height | Tailwind | Use Case |
|-----------|-------|-------------|----------|----------|
| xs | 10px | 14px | `text-[10px]` | Uppercase labels, minor metadata |
| sm | 12px | 16px | `text-xs` | Captions, helper text, small labels |
| base | 14px | 20px | `text-sm` | Body text, descriptions, standard content |
| md | 16px | 24px | `text-base` | Emphasized body text, small headings |
| lg | 20px | 28px | `text-xl` | Section headings, card titles |
| xl | 24px | 32px | `text-2xl` | Page headings, major titles |

### Font Weights

| Weight | Value | Tailwind | Use Case |
|--------|-------|----------|----------|
| Normal | 400 | `font-normal` | Body text (rarely used, prefer medium) |
| Medium | 500 | `font-medium` | Standard text, labels |
| Semibold | 600 | `font-semibold` | Headings, emphasized text |

**Tailwind Examples**
```html
<!-- Typography combinations -->
<h1 class="text-2xl font-semibold">Page Title</h1>
<h2 class="text-xl font-semibold">Section Heading</h2>
<p class="text-sm font-medium">Body text</p>
<span class="text-xs text-muted-foreground">Caption</span>
```

### Typography Patterns

**Headings**
- Page title: 24px, semibold (600)
- Section heading: 20px, semibold (600)
- Card heading: 14px, semibold (600)
- Subsection: 14px, semibold (600)

**Body Text**
- Primary: 14px, medium (500)
- Secondary: 14px, medium (500), muted color
- Small: 12px, medium (500)
- Caption: 12px, medium (500), muted color

**Labels**
- Standard: 14px, medium (500)
- Small: 12px, medium (500)
- Uppercase: 10px, medium (500), uppercase, letter-spacing: 0.05em

---

## 4. Color System

### Semantic Color Usage

**Background Levels** (Light → Dark in light mode, Dark → Light in dark mode)
- `background`: Base page background
- `background-50`: Subtle hover state, nested containers
- `background-100`: Cards, elevated surfaces
- `background-200-900`: Reserved for special use cases

**Foreground Colors**
- `foreground`: Primary text color
- `muted-foreground`: Secondary text, labels (reduced opacity/lightness)

**Semantic Colors**
- `primary`: Main brand color, primary actions
- `secondary`: Secondary actions, alternate emphasis
- `accent`: Hover states, subtle highlights
- `destructive`: Errors, dangerous actions
- `border`: Default border color
- `border-secondary`: Subtle borders, dividers

**UI Element Colors**
- `card`: Card background
- `card-foreground`: Text on cards
- `input`: Input field background/border
- `ring`: Focus ring color

### Color with Opacity Patterns

Use opacity to create color variations:
- **10% opacity**: Very subtle backgrounds (e.g., `blue-500` at 10% opacity)
- **20% opacity**: Subtle borders, light backgrounds
- **50% opacity**: Medium emphasis
- **80-90% opacity**: High emphasis, semi-transparent overlays

### Status Colors with Opacity

**Success/Positive**
- Background: `emerald-500` at 10% opacity
- Text: `emerald-600` (light mode), `emerald-400` (dark mode)
- Border: `emerald-500` at 20% opacity

**Warning/Attention**
- Background: `amber-500` at 10% opacity
- Text: `amber-600` (light mode), `amber-400` (dark mode)
- Border: `amber-500` at 20% opacity

**Error/Negative**
- Background: `rose-500` at 10% opacity
- Text: `rose-600` (light mode), `rose-400` (dark mode)
- Border: `rose-500` at 20% opacity

**Info/Neutral**
- Background: `blue-500` at 10% opacity
- Text: `blue-600` (light mode), `blue-400` (dark mode)
- Border: `blue-500` at 20% opacity

**Neutral**
- Background: `gray-500` at 10% opacity
- Text: `gray-600` (light mode), `gray-400` (dark mode)
- Border: `gray-500` at 20% opacity

### Color Pattern Examples

```
High-risk indicator:
  background: rose-500 at 10% opacity
  color: rose-600 (light) / rose-400 (dark)
  border: rose-500 at 20% opacity

Medium-priority badge:
  background: amber-500 at 10% opacity
  color: amber-600 (light) / amber-400 (dark)
  border: amber-500 at 20% opacity

Positive sentiment:
  background: emerald-500 at 10% opacity
  color: emerald-600 (light) / emerald-400 (dark)
  border: emerald-500 at 20% opacity
```

---

## 5. Borders & Radius

### Border Widths
- **Default**: 1px (`border`)
- **Emphasis**: 2px (`border-2`) - rarely used

**Tailwind Examples**
```html
<div class="border">1px border</div>
<div class="border-2">2px border</div>
<div class="border-t">1px top border only</div>
```

### Border Radius Scale

| Name | Value | Tailwind | Use Case |
|------|-------|----------|----------|
| sm | 6px | `rounded-sm` | Small elements, badges |
| base | 8px | `rounded-md` | Standard inputs, small cards |
| md | 8px | `rounded-md` | Buttons, form controls |
| lg | 10px | `rounded-lg` | Cards, containers |
| xl | 12px | `rounded-xl` | Large cards, modals |
| full | 9999px | `rounded-full` | Pills, circular buttons, rounded badges |

**Tailwind Examples**
```html
<!-- Border radius -->
<div class="rounded-lg">10px radius card</div>
<div class="rounded-xl">12px radius large card</div>
<button class="rounded-full">Pill button</button>
<div class="rounded-t-lg">10px radius on top only</div>

<!-- Combined with borders -->
<div class="border rounded-lg">Card with border</div>
<div class="border border-border-secondary rounded-xl">Subtle border card</div>
```

### Border Patterns

**Cards**: 10-12px radius (`rounded-lg` or `rounded-xl`) with 1px border (`border`)
**Buttons**: 6px radius (`rounded-md`) 
**Pill Buttons**: 9999px radius (`rounded-full`)
**Inputs**: 6-8px radius (`rounded-md`)
**Badges**: 9999px radius (`rounded-full`) - pill-shaped
**Small Tags**: 4-6px radius (`rounded` or `rounded-md`)

---

## 6. Component Patterns

### Cards

**Standard Card**
```
Background: background-100 color
Border: 1px solid border color
Border radius: 12px
Padding: 12px
Shadow: None or very subtle
```

**Compact Information Card**
```
Display: Grid with 2 columns [label | value]
Padding: 12px
Border radius: 12px
Internal spacing:
  - Row padding: 10px (between items)
  - Section borders: 1px border-secondary
  - Title padding: 10px 0
```

**Hover State**
```
Background: Slight shift to accent color
Cursor: pointer
Transition: background 150ms ease
```

### Buttons

**Size Variants**

Small button:
- Height: 32px
- Padding: 8px 12px (with text), 10px (icon only)
- Font size: 12px
- Border radius: 6px
- Gap (icon + text): 4-6px

Default button:
- Height: 36px
- Padding: 8px 16px (with text), 12px (icon only)
- Font size: 14px
- Border radius: 6px
- Gap (icon + text): 8px

Large button:
- Height: 40px
- Padding: 8px 24px (with text), 16px (icon only)
- Font size: 14px
- Border radius: 6px

Icon button (square):
- Small: 32px × 32px
- Default: 36px × 36px
- Large: 40px × 40px

**Style Variants**

Primary:
- Background: primary color
- Text: primary-foreground color
- Border: none
- Hover: Reduce opacity to 90%

Outline:
- Background: background color (with slight transparency)
- Text: foreground color
- Border: 1px solid border color
- Hover: background-50 color

Ghost:
- Background: transparent
- Text: foreground color
- Border: none
- Hover: accent color

Pill/Rounded:
- Border radius: 9999px (fully rounded)
- All other properties same as variant

**Tab-style Buttons**
```
Default state:
  Background: background color
  Border: 1px transparent
  
Active state:
  Background: blue-500 at 10% opacity
  Color: blue-500
  Border: 1px solid blue-500
```

### Badges

**Standard Badge**
```
Display: inline-flex
Padding: 2px 8px
Font size: 12px
Font weight: 500
Border radius: 9999px (pill shape)
Border: 1px
Text: capitalize
Whitespace: nowrap
Gap (with icon): 4px
```

**Badge Variants** (use semantic color pattern)
- Default: neutral background, foreground text
- Success: emerald background at 10%, emerald text, emerald border at 20%
- Warning: amber background at 10%, amber text, amber border at 20%
- Error: rose background at 10%, rose text, rose border at 20%
- Info: blue background at 10%, blue text, blue border at 20%

### Data Lists

**Two-Column Data Grid**
```
Display: grid
Grid template: [label | value]
Column gap: 8px
Row gap: 10px
Row border: 1px border-secondary between rows
Row padding: 10px 0

Label:
  Font size: 14px
  Font weight: 500
  Color: muted-foreground
  White-space: nowrap

Value:
  Font size: 14px
  Font weight: 500
  Color: foreground
  Text align: right
```

### Carousel/Scrollable Lists

**Horizontal Scroll Container**
```
Display: flex
Gap: 8px
Overflow-x: auto
Scroll behavior: smooth
Scroll snap type: x mandatory
Hide scrollbar

Item:
  Scroll snap align: start
  Flex shrink: 0
  Width: Full (mobile), calc((100% - 8px) / 2) (tablet), calc((100% - 16px) / 3) (desktop)
```

**Navigation Buttons**
```
Position: absolute bottom-right
Size: 32px × 32px
Border radius: 9999px (circular)
Background: background color at 80% opacity with backdrop blur
Shadow: medium
Hover: increase background opacity to 90%
Disabled: opacity 50%
```

### Forms

**Input Fields**
```
Height: 36px
Padding: 8px 12px
Font size: 14px
Border: 1px solid input color
Border radius: 6px
Background: transparent or background color

Focus state:
  Border: 1px solid ring color
  Outline: 3px ring color at 50% opacity

Error state:
  Border: 1px solid destructive color
  Outline: 3px destructive at 20% opacity
```

**Labels**
```
Font size: 14px
Font weight: 500
Margin bottom: 6px
Color: foreground
```

---

## 7. Interactive States

### Hover States

**Buttons**
- Background: Darken/lighten by 10% or shift to related color
- Cursor: pointer
- Transition: all 150ms ease

**Cards**
- Background: Shift to accent color
- Border: Optionally emphasize
- Transition: background 200ms ease

**Links**
- Color: Shift to primary color
- Text decoration: underline
- Transition: color 150ms ease

### Focus States

**All Interactive Elements**
```
Border: ring color (if has border)
Outline: 3px solid ring color at 50% opacity
Outline offset: 0
Transition: box-shadow 150ms ease
```

### Active/Pressed States

**Buttons**
```
Transform: scale(0.97)
Transition: transform 150ms ease-out
```

### Disabled States

**All Interactive Elements**
```
Opacity: 50%
Cursor: not-allowed
Pointer events: none
```

---

## 8. Responsive Design Patterns

### Breakpoints

| Name | Min Width | Use Case |
|------|-----------|----------|
| Mobile | 0px | Default, mobile-first |
| Small | 640px | Large phones, small tablets |
| Medium | 768px | Tablets |
| Large | 1024px | Desktops |
| XL | 1280px | Large desktops |

### Layout Patterns

**Container Width**
- Mobile: 95% viewport width, max 95vw
- Desktop: 95% viewport width, max 1280px (xl breakpoint)

**Padding Adjustments**
- Mobile: 4px-16px
- Medium: 24px
- Large: 40px

**Grid Columns**
- Mobile: 1 column
- Medium: 2 columns
- Large: 3 columns
- XL: 3-4 columns (depending on content)

**Flex Direction**
- Mobile: column (stack vertically)
- Medium+: row (horizontal layout)

**Font Size Scaling**
- Mobile: Use smaller sizes (12px-20px range)
- Desktop: Use full range (12px-24px)

**Navigation**
- Mobile: Fixed header (height: 56px), positioned at top
- Desktop: Sidebar or horizontal navigation

---

## 9. Dark Mode Adaptations

### Color Adjustments

**Backgrounds**
- Light mode: White and light grays (hsl lightness 95-100%)
- Dark mode: Near-black and dark grays (hsl lightness 2-20%)

**Text**
- Light mode: Dark text (near black)
- Dark mode: Light text (near white)

**Borders**
- Light mode: Dark borders with low opacity
- Dark mode: Light borders with low opacity

**Cards**
- Light mode: White or very light background
- Dark mode: Slightly lighter than page background (background-100)

**Semantic Colors**
- Light mode: Darker shades (e.g., emerald-600)
- Dark mode: Lighter shades (e.g., emerald-400)

### Key Principles for Dark Mode
1. Reduce contrast (don't use pure black or pure white)
2. Elevate surfaces by making them lighter, not with shadows
3. Use slightly lighter borders in dark mode
4. Adjust semantic colors to lighter variants
5. Maintain sufficient contrast for accessibility

---

## 10. Common UI Patterns

### Page Layout

```
Container:
  Width: 95vw (mobile), max 1280px (desktop)
  Padding: 4px (mobile), 24px (tablet), 40px (desktop)
  Margin: auto (center)
  
Content area:
  Display: flex (row on large, column on mobile)
  Gap: 16px (mobile), 32px (desktop)
  
Main content:
  Flex: 1
  Min width: 0 (prevent overflow)
  Max width: calc(100% - sidebar - gap) on large screens

Sidebar:
  Width: 320px (desktop)
  Width: 100% (mobile)
```

### Section Headers

```
Display: flex
Justify: space-between
Align: center
Margin bottom: 8px
Padding: 0 12px

Title:
  Font size: 14px
  Font weight: 600
  
Action button (optional):
  Size: small
  Variant: outline or ghost
```

### Empty States

```
Padding: 32px
Text align: center
Color: muted-foreground
Font size: 14px
```

### Loading States

Use skeleton loaders matching the content shape:
- Height matches expected content
- Background: muted color with subtle animation
- Border radius: matches content (8-12px for cards)

### Tabs/Segmented Control

```
Container:
  Display: flex
  Gap: 8px
  Padding: 2px
  Background: background color
  Border: 1px solid border
  Border radius: 8px

Tab button:
  Padding: 8px 12px
  Font size: 12px
  Font weight: 500
  Border radius: 6px
  Background: transparent (inactive)
  
Active tab:
  Background: background-100 (or accent)
  Border: 1px solid border (optional)
```

### Modal/Dialog

```
Overlay:
  Background: black at 50% opacity
  Backdrop blur: 4px

Content container:
  Background: card color
  Border radius: 12px
  Padding: 24px
  Max width: 500px (small), 800px (large)
  Shadow: large
  
Header:
  Margin bottom: 16px
  
Title:
  Font size: 16px
  Font weight: 600
```

### Dropdown Menu

```
Container:
  Background: popover color
  Border: 1px solid border
  Border radius: 8px
  Shadow: medium
  Padding: 4px
  Min width: 160px

Item:
  Padding: 8px 12px
  Font size: 14px
  Border radius: 6px
  
Item hover:
  Background: accent color
```

### Tooltip

```
Background: popover color (or inverse of page)
Padding: 6px 12px
Font size: 12px
Border radius: 6px
Border: 1px solid border
Shadow: small
```

---

## 11. Animation & Transitions

### Duration
- Fast: 100-150ms (button presses, toggles)
- Standard: 200-250ms (component transitions)
- Slow: 300-400ms (page transitions, large movements)

### Easing
- Default: ease (general purpose)
- Ease-out: User-initiated actions (buttons)
- Ease-in-out: Smooth transitions (modals, drawers)

### Common Transitions
- `transition: all 150ms ease` (buttons, interactive elements)
- `transition: background-color 200ms ease` (hover states)
- `transition: transform 150ms ease-out` (active states)
- `transition: opacity 200ms ease` (fade in/out)

---

## 12. Best Practices Summary

1. **Consistency**: Use the spacing scale consistently (multiples of 4px / Tailwind scale)
2. **Hierarchy**: Establish clear visual hierarchy with size and weight
3. **Contrast**: Ensure sufficient contrast in both light and dark modes
4. **Feedback**: Provide visual feedback for all interactions
5. **Accessibility**: Include focus states and ensure color contrast
6. **Performance**: Use CSS transforms for animations, not layout properties
7. **Responsive**: Design mobile-first, enhance for larger screens with breakpoint prefixes
8. **Semantic**: Use semantic color names (success, error) not literal colors
9. **Opacity**: Use opacity to create color variations consistently (`/10`, `/20` in Tailwind)
10. **Spacing**: Let content breathe - don't be afraid of whitespace

### Tailwind-Specific Best Practices

1. **Use Semantic Tokens**: Prefer `bg-background` over `bg-white`, `text-foreground` over `text-black`
2. **Dark Mode**: Add `dark:` variants for proper dark mode support (e.g., `text-emerald-600 dark:text-emerald-400`)
3. **Responsive**: Use mobile-first approach, add `md:`, `lg:`, `xl:` prefixes as needed
4. **Opacity Utilities**: Use `/10`, `/20`, `/50`, `/90` for consistent opacity (e.g., `bg-blue-500/10`)
5. **Arbitrary Values**: When needed, use square brackets for custom values (e.g., `text-[15px]`, `p-[10px]`)
6. **Grouping**: Group related classes: layout → spacing → typography → colors → effects
7. **Component Extraction**: For repeated patterns, consider extracting to component classes
8. **CSS Variables**: Use `var(--radius-lg)` or Tailwind's `rounded-lg` for consistent theming

---

## 13. Tailwind CSS Quick Reference

### Most Common Utility Classes

**Layout & Display**
```html
<div class="flex items-center justify-between gap-2">Flexbox</div>
<div class="grid grid-cols-2 gap-4">Grid layout</div>
<div class="hidden md:block">Responsive display</div>
<div class="w-full max-w-7xl mx-auto">Centered container</div>
```

**Spacing (using the scale from section 2)**
```html
<div class="p-3">padding: 12px (all sides)</div>
<div class="px-4 py-2">padding: 8px vertical, 16px horizontal</div>
<div class="mb-6">margin-bottom: 24px</div>
<div class="space-y-4">16px gap between children (vertical)</div>
<div class="gap-2">8px gap in flex/grid</div>
```

**Typography**
```html
<h1 class="text-2xl font-semibold">24px, semibold</h1>
<p class="text-sm font-medium text-muted-foreground">14px, medium, muted</p>
<span class="text-xs uppercase tracking-wider">10px uppercase label</span>
<div class="line-clamp-2">Clamp to 2 lines</div>
<div class="break-all">Break long words</div>
```

**Colors (semantic tokens)**
```html
<div class="bg-background text-foreground">Base colors</div>
<div class="bg-card text-card-foreground">Card</div>
<div class="bg-background-100">Elevated surface</div>
<div class="hover:bg-background-50">Subtle hover</div>
<span class="text-muted-foreground">Secondary text</span>
<div class="border border-border">Default border</div>
<div class="border-border-secondary">Subtle border</div>
```

**Status Colors (with opacity)**
```html
<div class="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Success</div>
<div class="bg-rose-500/10 text-rose-600 border border-rose-500/20">Error</div>
<div class="bg-amber-500/10 text-amber-600 border border-amber-500/20">Warning</div>
<div class="bg-blue-500/10 text-blue-600 border border-blue-500/20">Info</div>
```

**Dark Mode Variants**
```html
<div class="text-emerald-600 dark:text-emerald-400">Auto dark mode text</div>
<div class="bg-background dark:bg-background-100">Auto dark mode bg</div>
```

**Borders & Radius**
```html
<div class="border rounded-lg">1px border, 10px radius</div>
<div class="border-t">Top border only</div>
<button class="rounded-full">Fully rounded</button>
```

**Interactive States**
```html
<button class="hover:bg-accent active:scale-[0.97]">Hover & active</button>
<input class="focus:ring-2 focus:ring-ring">Focus ring</input>
<div class="cursor-pointer">Clickable cursor</div>
<button class="disabled:opacity-50">Disabled state</button>
```

**Shadows & Effects**
```html
<div class="shadow-sm">Subtle shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="backdrop-blur-sm">Backdrop blur</div>
```

**Sizing**
```html
<div class="w-full">Full width</div>
<div class="h-32">height: 128px</div>
<div class="size-8">width & height: 32px (square)</div>
<div class="max-w-7xl">Max width 1280px</div>
<div class="min-h-screen">Minimum full viewport height</div>
```

**Positioning**
```html
<div class="relative">Position relative</div>
<div class="absolute top-0 right-0">Absolute positioning</div>
<div class="fixed bottom-4 right-4">Fixed positioning</div>
<div class="z-50">Z-index 50</div>
```

**Flexbox**
```html
<div class="flex flex-col gap-4">Vertical flex with gap</div>
<div class="flex items-center justify-between">Space between alignment</div>
<div class="flex-1">Flex grow</div>
<div class="shrink-0">Don't shrink</div>
```

**Grid**
```html
<div class="grid grid-cols-2 gap-4">2 columns, 16px gap</div>
<div class="grid grid-cols-[auto_min-content]">Auto & min-content</div>
<div class="col-span-2">Span 2 columns</div>
```

**Overflow & Scrolling**
```html
<div class="overflow-hidden">Hide overflow</div>
<div class="overflow-x-auto">Horizontal scroll</div>
<div class="scrollbar-hide">Hide scrollbar</div>
```

**Responsive Design**
```html
<div class="hidden md:block">Hidden on mobile, visible on tablet+</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">Responsive grid</div>
<div class="flex-col md:flex-row">Stack on mobile, row on tablet+</div>
<div class="text-sm md:text-base">Responsive typography</div>
```

**Transitions**
```html
<div class="transition-all duration-150">Transition everything, 150ms</div>
<div class="transition-colors">Transition colors only</div>
<div class="hover:scale-105 transition-transform">Scale on hover</div>
```

### Component Class Patterns

**Card**
```html
<div class="bg-background dark:bg-background-100 rounded-lg border overflow-hidden flex flex-col p-4 gap-4">
  <!-- Card content -->
</div>
```

**Button (Outline)**
```html
<button class="inline-flex items-center justify-center gap-2 h-9 px-4 py-2 text-sm font-medium rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-all active:scale-[0.97]">
  Button Text
</button>
```

**Button (Primary)**
```html
<button class="inline-flex items-center justify-center gap-2 h-9 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.97]">
  Button Text
</button>
```

**Badge**
```html
<span class="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
  Success
</span>
```

**Input Field**
```html
<input class="h-9 px-3 py-2 text-sm border rounded-md bg-background focus:ring-2 focus:ring-ring outline-none transition-all" />
```

**Two-Column Data List**
```html
<div class="grid grid-cols-[auto_min-content] gap-x-2 gap-y-2.5">
  <span class="text-sm font-medium text-muted-foreground whitespace-nowrap">Label</span>
  <span class="text-sm font-medium text-right">Value</span>
</div>
```

---

## Quick Reference Cheatsheet

### Most Common Values

| CSS Value | Tailwind Class | Use Case |
|-----------|----------------|----------|
| 4px | `1` | Small spacing (p-1, gap-1) |
| 8px | `2` | Standard spacing (p-2, gap-2) |
| 12px | `3` | Common padding (p-3) |
| 16px | `4` | Section spacing (p-4, gap-4) |
| 24px | `6` | Large spacing (p-6, gap-6) |
| 32px | `8` | Major spacing (p-8) |

| Font Size | Tailwind | Common Use |
|-----------|----------|------------|
| 10px | `text-[10px]` | Tiny labels |
| 12px | `text-xs` | Small text, captions |
| 14px | `text-sm` | Body text (most common) |
| 16px | `text-base` | Emphasized text |
| 20px | `text-xl` | Section headings |
| 24px | `text-2xl` | Page titles |

| Border Radius | Tailwind | Use Case |
|---------------|----------|----------|
| 6px | `rounded-sm` or `rounded-md` | Small elements |
| 8px | `rounded-md` | Buttons, inputs |
| 10px | `rounded-lg` | Cards |
| 12px | `rounded-xl` | Large cards |
| 9999px | `rounded-full` | Pills, circular |

**Button Heights**
- Small: 32px (`h-8`)
- Default: 36px (`h-9`)
- Large: 40px (`h-10`)

**Common Patterns**
- Card padding: 12px (`p-3`)
- Section gap: 16-24px (`gap-4` to `gap-6`)
- Grid gap: 8-16px (`gap-2` to `gap-4`)

### Color Pattern Formula

For any semantic color (success, warning, error, info):

**CSS**
- Background: `{color}-500` at 10% opacity
- Text: `{color}-600` (light mode) or `{color}-400` (dark mode)
- Border: `{color}-500` at 20% opacity

**Tailwind**
```html
<!-- Success -->
<div class="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">

<!-- Error -->
<div class="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">

<!-- Warning -->
<div class="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">

<!-- Info -->
<div class="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
```

---

## Implementation Notes

### Working with Tailwind CSS

This project uses **Tailwind CSS v4+** as the primary styling framework. When implementing components:

1. **Start with Tailwind utilities**: Build components using utility classes first
2. **Reference CSS tokens**: Use semantic color tokens (`bg-background`, `text-foreground`, etc.)
3. **Maintain consistency**: Follow the spacing and typography scales defined above
4. **Think responsive**: Add breakpoint prefixes (`md:`, `lg:`) for responsive behavior
5. **Support dark mode**: Include `dark:` variants for color-related classes

### For AI Agents

When generating code:
- Prefer Tailwind utility classes over inline styles
- Use the semantic color tokens defined in globals.css
- Follow the component patterns in section 13 (Tailwind CSS Quick Reference)
- Reference the CSS values provided when Tailwind classes don't exist
- Always include dark mode variants for colors
- Use arbitrary values `[value]` when exact matches aren't available

### File Reference

The complete CSS design tokens are defined in:
- **File**: `src/app/globals.css`
- **Key sections**: `:root` (light mode), `.dark` (dark mode), `@theme inline` (Tailwind theme)

---

*End of Design Guidelines*

