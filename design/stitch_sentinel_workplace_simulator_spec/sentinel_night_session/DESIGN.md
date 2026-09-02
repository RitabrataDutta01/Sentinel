---
name: Sentinel Night Session
colors:
  surface: '#1a0f20'
  surface-dim: '#1a0f20'
  surface-bright: '#423447'
  surface-container-lowest: '#150a1b'
  surface-container-low: '#231729'
  surface-container: '#271b2d'
  surface-container-high: '#322538'
  surface-container-highest: '#3d3043'
  on-surface: '#f0dcf5'
  on-surface-variant: '#d9c0cf'
  inverse-surface: '#f0dcf5'
  inverse-on-surface: '#392c3e'
  outline: '#a18a99'
  outline-variant: '#54414e'
  surface-tint: '#ffacea'
  primary: '#ffacea'
  on-primary: '#5d0055'
  primary-container: '#c238b0'
  on-primary-container: '#fffaff'
  inverse-primary: '#a71b98'
  secondary: '#ffb4a3'
  on-secondary: '#630f00'
  secondary-container: '#8f1b01'
  on-secondary-container: '#ffa08a'
  tertiary: '#51ddb3'
  on-tertiary: '#00382a'
  tertiary-container: '#008466'
  on-tertiary-container: '#f2fff7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd7f1'
  primary-fixed-dim: '#ffacea'
  on-primary-fixed: '#390034'
  on-primary-fixed-variant: '#840078'
  secondary-fixed: '#ffdad2'
  secondary-fixed-dim: '#ffb4a3'
  on-secondary-fixed: '#3d0600'
  on-secondary-fixed-variant: '#8c1900'
  tertiary-fixed: '#71face'
  tertiary-fixed-dim: '#51ddb3'
  on-tertiary-fixed: '#002117'
  on-tertiary-fixed-variant: '#00513e'
  background: '#1a0f20'
  on-background: '#f0dcf5'
  surface-variant: '#3d3043'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 42px
    fontWeight: '600'
    lineHeight: 52px
  verdict-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
spacing:
  sidebar-width: 260px
  gutter: 1rem
  margin-page: 2rem
  stack-compact: 0.5rem
  stack-default: 1.5rem
---

## Brand & Style
This design system facilitates a high-stakes workplace simulation, evoking the atmosphere of a deep-night monitoring room. The aesthetic is a fusion of **Corporate Modernism** and **Minimalist Cyberpunk**, stripped of all decorative "fluff" like glows or shadows to maintain a focused, high-pressure environment.

The target audience consists of professionals undergoing intense behavioral training. The UI must feel authoritative, secure, and purely functional. By using flat, solid color blocks and precise borders, the interface emphasizes data integrity and the gravity of the "verdicts" being rendered. It is a tool for observation and critical decision-making, not entertainment.

## Colors
The palette is built on a deep, obsidian-purple base to reduce eye strain during "night sessions." 

- **Primary (#C238B0):** Used for core actions and active navigation states.
- **Alerts (#FF6B4A):** Strictly reserved for high-stakes errors, warnings, or critical simulation breaches.
- **Positive (#3FCFA6):** Indicates successful completion, valid data, or "safe" simulation parameters.
- **Borders:** Every UI boundary uses a low-opacity primary tint to create structure without visual noise. 

All colors are applied as flat fills. Gradients, blurs, and glows are strictly prohibited.

## Typography
The system employs a strict typographic hierarchy. **Hanken Grotesk** handles all functional UI elements, navigation, and data entry for a clean, professional finish. **Source Serif 4** is reserved exclusively for "Verdicts" (the outcome of a simulation) and major section titles, providing a literary, authoritative weight to the results.

**Constraint:** Sentence case must be used for all labels, headings, and buttons. Title Case and All Caps are prohibited except for very small labels (label-caps).

## Layout & Spacing
The layout follows a rigid, fixed-grid philosophy. 

- **Title bar:** A custom top-aligned bar featuring three plain dots (no window decorations) and the subtitle "Workplace conversation simulator" center-aligned.
- **Sidebar:** A fixed left-hand navigation column. The bottom contains a compact, two-line footer for the account and organization name.
- **Dashboard:** The primary view features a large "Active case file" hero area. Directly beneath or above it, a thin inline strip houses condensed statistics.
- **Data Visualization:** Charts must use a single solid baseline. No grid lines, no background fills, and no area shadows are permitted. Lines should be 2px solid strokes.

## Elevation & Depth
Depth is communicated through **Tonal Layers** rather than shadows. 
- Level 0: Background Base (#150B18)
- Level 1: Surface (#241531)
- Level 2: Borders (rgba(194, 56, 176, 0.18))

There are no shadows, halos, or blurs. Layers are defined by sharp, 1px solid borders. High-contrast outlines are used to separate the sidebar and the main content area.

## Shapes
The shape language is strictly **Sharp (0px)**. Every button, input field, sidebar, and row must have square corners. This reinforces the "Sentinel" persona—unyielding, precise, and serious. No rounded corners are permitted in any part of the design system.

## Components
- **Buttons:** Solid fills only. "Start" and "Resume session" use the Primary color. "Save changes" and "Invite" use the Positive color. "View" and "Export PDF" use a bordered style with no fill. All text is sentence case.
- **Rows:** Cards are replaced by bordered rows. Each row is separated by a 1px solid border (rgba(194, 56, 176, 0.18)). 
- **Input Fields:** Flat #241531 background with a 1px bottom-border only. On focus, the border color changes to the Primary color.
- **Chips/Status:** Small, square-edged blocks with a solid background and high-contrast text. No icons.
- **Sidebar Footer:** A minimal section at the bottom of the sidebar with 12px Hanken Grotesk text, separated by a top border.
- **Case File:** A large, bordered container that dominates the hero section, utilizing Source Serif 4 for the case title.