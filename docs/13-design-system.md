# Part 13: Design System

## Philosophy

Premium, minimal, product-first design language inspired by Linear, Vercel, Stripe, Apple, Anthropic, and Notion. Every UI decision prioritizes clarity, whitespace, and professionalism.

Design tokens live in `frontend/src/index.css`. The unified **oklch** palette is exposed as CSS variables and as Tailwind v4 theme colors, so hand-written CSS, shadcn-style components, and utility classes all share one identity.

---

## 🎨 Color Palette (oklch)

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

> **Note:** `--primary` keeps the legacy meaning of near-white body text. Use `--accent` for the indigo accent.

### Borders & Sidebar

| Token | Value |
|-------|-------|
| `--border` / `--input` | `oklch(0.243 0.03 283.9)` |
| `--border-light` | `oklch(0.294 0.036 284)` |
| `--sidebar` | `oklch(0.166 0.012 285)` |
| `--sidebar-foreground` | `oklch(0.954 0.013 295.3)` |
| `--sidebar-border` | `oklch(0.243 0.03 283.9)` |

---

## 🔤 Typography

| Property | Value |
|----------|-------|
| Primary font | Inter |
| Monospace font | JetBrains Mono |
| Heading weight | 700–800 |
| Body weight | 400–500 |

---

## 📐 Radius

Base token `--radius: 0.75rem`; derived scale (`--radius-sm/md/lg/xl/2xl`) maps to Tailwind's `rounded-*` utilities.

| Element | Radius |
|---------|--------|
| Default (`rounded-lg`) | 0.75rem |
| Cards / buttons / inputs | 0.75rem |
| Badges | 999px (pill) |

---

## 📏 Spacing System

Base unit: 4px. Common values: 4, 8, 12, 16, 24, 32, 48, 64.

---

## 🎬 Animation

- **Library:** Framer Motion
- **Duration:** 150ms / 250ms / 400ms (never exceed 500ms)
- **Easing:** easeOut
- **Animations communicate state, not decoration.**
- `prefers-reduced-motion` is respected globally in each page's CSS.

---

## 🌫️ Atmosphere

- A fixed **film-grain noise** texture (`.sentinel-noise` utility in `index.css`) overlays every screen for a premium, tactile feel.
- Ambient gradient glows are used sparingly on marketing surfaces (Landing, Auth).

---

## 🎨 Component Styling

### Buttons
```css
/* Primary */
.btn-primary { @apply bg-accent text-accent-foreground hover:bg-accent-light; }

/* Outline */
.btn-outline { @apply border border-input bg-background hover:bg-accent hover:text-accent-foreground; }

/* Ghost */
.btn-ghost { @apply hover:bg-accent hover:text-accent-foreground; }

/* Destructive */
.btn-destructive { @apply bg-destructive text-destructive-foreground hover:bg-destructive/90; }
```

### Cards
```css
.card { @apply rounded-[var(--radius)] border bg-card text-card-foreground; }
.card-header { @apply flex flex-col space-y-1.5 p-6; }
.card-title { @apply text-sm font-semibold leading-none tracking-tight; }
.card-content { @apply p-6 pt-0; }
```

### Inputs
```css
.input { @apply flex h-9 w-full rounded-[var(--radius)] border border-input bg-transparent px-3 py-1 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50; }
```

---

## 🌗 Dark/Light Theme

### Dark (Default)
```css
:root {
  --background: oklch(0.147 0.011 285);
  --foreground: oklch(0.954 0.013 295.3);
  --accent: oklch(0.542 0.179 288);
  /* ... */
}
```

### Light
```css
[data-theme="light"] {
  --background: oklch(0.98 0.005 285);
  --foreground: oklch(0.15 0.01 285);
  --accent: oklch(0.45 0.18 288);
  /* ... */
}
```

### Toggle Hook
```javascript
export function useTheme() {
  const [theme, _setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), []);
  return { theme, setTheme, toggle };
}
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Sidebar |
|------------|-------|---------|
| Mobile | < 640px | Hidden (hamburger) |
| Tablet | 640–1024px | Collapsible (64/240px) |
| Desktop | > 1024px | Expanded (240px) |

---

## ♿ Accessibility

| Feature | Implementation |
|---------|----------------|
| **Semantic HTML** | `<main>`, `<nav>`, `<section>`, `<button>` |
| **ARIA** | `aria-label`, `aria-expanded`, `role` |
| **Focus** | Visible focus rings (`focus-visible:ring`) |
| **Color Contrast** | oklch palette (WCAG AA) |
| **Reduced Motion** | `prefers-reduced-motion` respected |
| **Keyboard** | All interactive elements reachable |

---

## 🎯 Component Library

### shadcn-style Components (`components/ui/`)

| Component | Key Props |
|-----------|-----------|
| `Button` | `variant` (default/destructive/outline/secondary/ghost/link), `size` (default/sm/lg/icon), `asChild` |
| `Card` | `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| `Input` | Standard HTML + `cn()` styling |
| `Textarea` | Auto-resize, `rows` prop |
| `Select` | Radix Select, `onValueChange` |
| `Switch` | Radix Switch, `checked`, `onCheckedChange` |
| `Label` | `htmlFor`, accessible |
| `Tooltip` | Radix Tooltip, `content` prop |
| `Separator` | Horizontal/Vertical, `orientation` |
| `Badge` | `variant` (default/secondary/destructive/outline) |
| `ScrollArea` | Radix ScrollArea, custom scrollbar |
| `Tooltip` | Radix Tooltip |
| `Sonner` | Toast notifications |

### Custom Components

| Component | Purpose |
|-----------|---------|
| `PageHero` | Eyebrow + title + subtitle + actions |
| `StatTile` | Stat card (label, value, sub, tone) |
| `ScoreRing` | Animated SVG progress ring |
| `verdictStyle()` | Verdict badge CSS classes |
| `moodColor()` | Mood → color interpolation |
| `moodLabel()` | Mood → label text |

---

## 🎨 Mood Colors

```javascript
export function moodColor(mood) {
  const cold = [168, 80, 66];      // --danger-base
  const neutral = [156, 143, 125]; // --text-secondary
  const warm = [126, 191, 142];    // --success-base
  const t = Math.max(1, Math.min(10, mood));
  const [a, b, mix] = t <= 5 
    ? [cold, neutral, (t - 1) / 4]
    : [neutral, warm, (t - 5) / 5];
  const rgb = a.map((v, i) => Math.round(v + (b[i] - v) * mix));
  return `rgb(${rgb.join(',')})`;
}

export function moodLabel(mood) {
  if (mood <= 2) return 'hostile';
  if (mood <= 4) return 'frustrated';
  if (mood <= 6) return 'guarded';
  if (mood <= 8) return 'engaged';
  return 'impressed';
}
```

---

## 🎬 Animations

| Pattern | Usage |
|---------|-------|
| `initial={{ opacity: 0, y: 8 }}` | Fade + slide up |
| `animate={{ opacity: 1, y: 0 }}` | Enter |
| `exit={{ opacity: 0, height: 0 }}` | Collapse |
| `transition={{ duration: 0.2 }}` | Standard timing |
| `AnimatePresence` | Mount/unmount |

---

*Next: [Testing & QA →](./14-testing-qa.md)*