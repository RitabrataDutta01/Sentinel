# Sentinel Design System

## Philosophy

Premium, minimal, product-first design language inspired by Linear, Vercel, Stripe, Apple, Anthropic, and Notion. Every UI decision prioritizes clarity, whitespace, and professionalism.

Design tokens live in `frontend/src/index.css`. The unified **oklch** palette (derived from the VibeForge redesign) is exposed as CSS variables and as Tailwind v4 theme colors, so hand-written CSS, shadcn-style components, and utility classes all share one identity.

---

## Color Palette (oklch)

### Surfaces & Text

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.147 0.011 285)` | Page background |
| `--foreground` | `oklch(0.954 0.013 295.3)` | Primary text |
| `--surface` / `--card` | `oklch(0.181 0.014 284.9)` | Card surfaces |
| `--elevated` / `--popover` / `--secondary` | `oklch(0.224 0.023 284.4)` | Elevated surfaces |
| `--hover-surface` | `oklch(0.25 0.026 284.3)` | Hover states |
| `--muted` / `--muted-foreground` | `oklch(0.587 0.03 287.7)` | Secondary/muted text |
| `--dim` | `oklch(0.41 0.027 290.9)` | Dim/placeholder text |

### Accent & Status

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` / `--ring` / `--primary-foreground` | `oklch(0.542 0.179 288)` | Primary accent (indigo) |
| `--accent-light` | `oklch(0.723 0.157 291.6)` | Accent on hover |
| `--accent-dim` | `oklch(0.379 0.144 284.1)` | Accent dim / fills |
| `--mood-warm` | `oklch(0.768 0.148 155.4)` | Positive mood (green) |
| `--mood-neutral` | `oklch(0.731 0.107 75.3)` | Neutral mood (amber) |
| `--mood-cold` / `--destructive` | `oklch(0.609 0.154 22.8)` | Negative mood / danger (red) |

> Note: `--primary` keeps the legacy meaning of near-white body text. Use `--accent` for the indigo accent.

### Borders & Sidebar

| Token | Value |
|-------|-------|
| `--border` / `--input` | `oklch(0.243 0.03 283.9)` |
| `--border-light` | `oklch(0.294 0.036 284)` |
| `--sidebar` | `oklch(0.166 0.012 285)` |
| `--sidebar-foreground` | `oklch(0.954 0.013 295.3)` |
| `--sidebar-border` | `oklch(0.243 0.03 283.9)` |

---

## Typography

| Property | Value |
|----------|-------|
| Primary font | Inter |
| Monospace font | JetBrains Mono |
| Heading weight | 700–800 |
| Body weight | 400–500 |

---

## Radius

Base token `--radius: 0.75rem`; derived scale (`--radius-sm/md/lg/xl/2xl`) maps to Tailwind's `rounded-*` utilities.

| Element | Radius |
|---------|--------|
| Default (`rounded-lg`) | 0.75rem |
| Cards / buttons / inputs | 0.75rem |
| Badges | 999px (pill) |

---

## Spacing System

Base unit: 4px. Common values: 4, 8, 12, 16, 24, 32, 48, 64.

---

## Animation

- Library: Framer Motion
- Duration: 150ms / 250ms / 400ms (never exceed 500ms)
- Easing: easeOut
- Animations communicate state, not decoration.
- `prefers-reduced-motion` is respected globally in each page's CSS.

---

## Atmosphere

- A fixed **film-grain noise** texture (`.sentinel-noise` utility in `index.css`) overlays every screen for a premium, tactile feel.
- Ambient gradient glows are used sparingly on marketing surfaces (Landing, Auth).

---

## Design Rules

- Lots of whitespace
- One accent color (indigo, oklch 0.542 0.179 288)
- Dark theme only
- Consistent spacing
- Clear hierarchy
- Responsive layout

## Never Do

- Rainbow colors
- Glassmorphism everywhere
- Bootstrap-looking layouts
- Stock illustrations
- Giant gradients
- Excessive animations
- More than one accent color
