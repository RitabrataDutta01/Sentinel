---
name: Sentinel Case Review
colors:
  surface: '#fff7fb'
  surface-dim: '#ead2ed'
  surface-bright: '#fff7fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ffefff'
  surface-container: '#fde7ff'
  surface-container-high: '#f9e0fc'
  surface-container-highest: '#f3dbf6'
  on-surface: '#241629'
  on-surface-variant: '#51424c'
  inverse-surface: '#3a2b3f'
  inverse-on-surface: '#feebff'
  outline: '#84727d'
  outline-variant: '#d6c1cd'
  surface-tint: '#973988'
  primary: '#5d0055'
  on-primary: '#ffffff'
  primary-container: '#7a1f6e'
  on-primary-container: '#fc90e4'
  inverse-primary: '#ffacea'
  secondary: '#ab351d'
  on-secondary: '#ffffff'
  secondary-container: '#ff7255'
  on-secondary-container: '#6d0f00'
  tertiary: '#003827'
  on-tertiary: '#ffffff'
  tertiary-container: '#00513a'
  on-tertiary-container: '#71c5a2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd7f1'
  primary-fixed-dim: '#ffacea'
  on-primary-fixed: '#390034'
  on-primary-fixed-variant: '#7a1f6e'
  secondary-fixed: '#ffdad3'
  secondary-fixed-dim: '#ffb4a4'
  on-secondary-fixed: '#3e0500'
  on-secondary-fixed-variant: '#891d07'
  tertiary-fixed: '#9ef4cf'
  tertiary-fixed-dim: '#82d7b3'
  on-tertiary-fixed: '#002115'
  on-tertiary-fixed-variant: '#00513a'
  background: '#fff7fb'
  on-background: '#241629'
  surface-variant: '#f3dbf6'
typography:
  display-title:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  verdict-text:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 32px
  sidebar-width: 260px
---

## Brand & Style
The design system adopts a restrained, archival aesthetic inspired by printed legal records and institutional correspondence. The personality is clinical, objective, and authoritative, evoking the gravity of workplace investigations. 

The visual style is a blend of **Minimalism** and **Modern Corporate**, executed with an "ink-on-paper" philosophy. It rejects modern UI trends like glows, blurs, and shadows in favor of flat, high-fidelity layouts that prioritize legibility and structured information density. Every element is designed to feel like a physical artifact—a printed page within a permanent file.

**Key Principles:**
- **Sentence case only:** All headers, labels, and buttons must follow sentence case to maintain a calm, human-centric tone.
- **Flat execution:** No gradients, shadows, or inner glows. Depth is communicated solely through color-blocking and borders.
- **Physical Metaphor:** The UI mimics a case file folder. The background acts as the desk surface, while the primary workspace acts as the paper record.

## Colors
The palette is centered on a cool, lavender-tinted "paper" background (`#EEEAF2`), which reduces eye strain and distinguishes the digital interface from standard white-screen software. 

- **Primary (`#7A1F6E`):** A deep plum used for key navigational markers and primary actions. It represents the "Sentinel" authority.
- **Alert/Burnt Rust (`#B23A22`):** Reserved for critical warnings, high-risk conversations, or urgent flags.
- **Positive (`#1F7A5C`):** Used for resolved cases, successful simulations, and status indicators.
- **Borders:** To maintain the printed feel, borders are thin and utilize a low-opacity version of the primary plum, creating a soft but defined structure without the harshness of pure black.

## Typography
This design system employs a functional hierarchy. **Work Sans** is used for the majority of the UI—navigation, inputs, and meta-data—due to its professional, neutral, and grounded character. 

**Source Serif 4** is reserved exclusively for major titles and "verdicts" (the output of simulations and final case summaries). This serif inclusion signals a shift from "system interaction" to "authoritative record," mimicking the look of printed legal findings. 

**Formatting Rules:**
- Everything is sentence case (e.g., "Start session," not "Start Session").
- Use heavy weights sparingly, primarily for the serif titles.

## Layout & Spacing
The layout follows a strict **Fixed Grid** approach for the sidebar and a fluid, constrained column for the main content area to ensure a document-like reading experience.

- **Title Bar:** A custom, minimal bar at the very top contains three plain, non-colored dots on the far left. It houses the app subtitle "Workplace conversation simulator" centered in small, secondary text.
- **Sidebar:** A fixed-width vertical bar on the left. It contains the primary navigation and a compact footer for account and organization details. No top-right utility icons (bell/avatar) are allowed; all user context is housed in the sidebar footer.
- **Dashboard:** The main view features a "Large Case File" hero area. Beneath this, a thin inline strip contains condensed statistics. 
- **Charts:** Visualizations must be minimalist. Use a single solid baseline. No background grids, no area fills, and no gradients. Lines should be thin and sharp.

## Elevation & Depth
In keeping with the printed-record aesthetic, this design system completely eschews shadows and blurs.

- **Flat Layering:** Depth is created by placing white surfaces (`#FFFFFF`) on top of the lavender background (`#EEEAF2`). 
- **Bordered Rows:** Do not use cards. Group related content using horizontal bordered rows. A 1px border (`border_subtle`) should separate list items, creating a ledger-like appearance.
- **Active State:** The active case file or selected item is indicated by a subtle fill or a 2px vertical "accent bar" on the left edge of the row, rather than an elevation change.

## Shapes
Shapes are functional and conservative. A **Soft (0.25rem)** roundedness is used for buttons and input fields to prevent the UI from feeling too aggressive, but large containers and row items should remain sharp or minimally rounded to maintain the structural integrity of a formal document.

## Components
- **Buttons:** All buttons use flat, solid fills. 
    - *Primary (Start, Resume session, Save changes):* Solid Plum (`#7A1F6E`) with White text.
    - *Secondary (View, Invite):* Transparent background with Plum border and Plum text.
    - *Tertiary (Export PDF):* Small, underline-only or subtle label style.
- **Input Fields:** Rectangular with a 1px border. No shadows. Focus state is a 2px solid border in the primary plum.
- **Chips/Status:** Small, rectangular labels with a very light background tint (10% opacity) of their respective functional color (e.g., Red for high risk, Green for resolved).
- **Sidebar Footer:** A condensed area at the bottom of the sidebar. It displays the user's name and the organization name in `label-sm` typography, separated by a thin horizontal line from the navigation.
- **Lists/Tables:** Use the "Bordered Row" approach. Header labels should be `label-sm` in `text_secondary`. Data should be `body-md` in `text_primary`.