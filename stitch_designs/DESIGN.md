---
name: Kinetic Blue SaaS
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434655'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0038b1'
  on-primary: '#ffffff'
  primary-container: '#1e4fd8'
  on-primary-container: '#cbd4ff'
  inverse-primary: '#b7c4ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#2d2bbd'
  on-tertiary: '#ffffff'
  tertiary-container: '#4749d5'
  on-tertiary-container: '#d3d2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b4'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.03em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies the **Modern Corporate / SaaS** aesthetic tailored specifically for high-efficiency solopreneurs and freelancers. It pairs utility-first clarity with subtle, high-craft details that evoke competence, speed, and analytical precision.

### Tone & Personality
- **Authoritative yet Approachable:** The visual tone signals dependable enterprise capability without the heavyweight complexity of legacy CRMs.
- **Dynamic Clarity:** The UI feels brisk, frictionless, and lucid. Freelancers should feel instantly unblocked and in total control of their pipeline.
- **Analytical Optimism:** Data density is balanced with generous negative space and precise typography, transforming intimidating cold metrics into clear, actionable progress indicators.

### Key Visual Tenets
- **Surface Elevation Hierarchy:** Pristine pure-white surfaces float over structured cool-slate canvases, framed by whisper-thin borders (`#E2E8F0`).
- **Precision Metrics:** Data tables and numerical displays avoid decorative distraction; high-legibility tabular forms, subtle status badges, and sharp interaction states command focus.

## Colors

The palette utilizes cold-neutral scaffolding grounded by an electric ultramarine anchor and supportive indigo/slate tints.

### Palette Architecture
- **Primary (`#1E4FD8`):** Deep electric blue reserved for primary calls to action, active navigation affordances, selection rings, and high-impact key performance indicators.
- **Secondary (`#475569`):** Slate tone serving as the secondary anchor, muted icon fills, metadata summaries, and structural tab borders.
- **Tertiary (`#6366F1`):** Indigo tint deployed strictly for AI generation highlights, smart recommendations, dynamic lead-scoring tags, and automated task sequences.
- **Neutral Core (`#0F172A`):** Deep obsidian slate for high-contrast typography, active table headings, and terminal indicators. Never use true pitch black `#000000`.

### Backgrounds & Surfaces
- **Canvas Base (`#F8FAFC`):** Primary viewport workspace background.
- **Subtle Recessed (`#F1F5F9`):** Canvas grouping tier, table header bands, and segmented pill backgrounds.
- **Surface Layer (`#FFFFFF`):** High-clarity elevated cards, slide-over sheets, tooltips, and modal surfaces.

### Semantic Tones
- **Success:** `#059669` (Emits positive response/open rates; paired with `#ECFDF5` container fills).
- **Warning:** `#D97706` (Bounces, verification flags; paired with `#FFFBEB`).
- **Critical:** `#DC2626` (Spam detection, unsubscriptions; paired with `#FEF2F2`).

## Typography

Inter serves as the unified typographic engine across all levels to maintain extreme legibility at dense scales.

### Implementation Principles
- **Tabular Figures:** All numeric metrics, percentages, lead counters, and financial conversions must utilize `font-feature-settings: "tnum" 1` to eliminate horizontal jitter during real-time updates.
- **Tracking:** Headlines apply subtle negative tracking (`-0.015em` to `-0.025em`) to consolidate visual weight. Captions and status badges introduce slight positive tracking (`0.01em` to `0.03em`) for scanability at tiny scales.
- **Hierarchy Anchors:** Metric values within dashboard cards leverage `headline-xl` paired with `label-md` captions in muted slate (`#64748B`) to establish immediate data hierarchy.

## Layout & Spacing

The layout is built on a 12-column responsive fluid grid designed around typical dashboard information architecture: persistent left vertical navigation, a contextual utility header, and a flex-wrapping workspace.

### Breakpoints & Fluidity
- **Desktop (>= 1280px):** 12-column layout. Gutter: `1.5rem` (24px), Canvas Margin: `2rem` (32px). Primary fixed-width sidebar dock (260px) alongside flexible main content maxing at 1600px.
- **Tablet (768px - 1279px):** 8-column layout. Sidebar collapses to an icon-only dock (72px). Gutter: `1.25rem` (20px), Margin: `1.5rem` (24px).
- **Mobile (< 768px):** 4-column reflow. Sidebar translates into an off-canvas drawer. Gutter: `1rem` (16px), Margin: `1rem` (16px). Metric cards stack vertically.

### Internal Spacing Cadence
- **Component Tightness (`space-xs` to `space-sm`):** Micro gaps within input elements, icon-to-label distances, and multi-badge groupings.
- **Container Structure (`space-md` to `space-lg`):** Internal padding for stat cards, table cells, and list containers.
- **Section Separation (`space-xl`):** Vertical clearance between analytics charts, data grids, and summary metric groups.

## Elevation & Depth

Visual depth is achieved through the pairing of crisp hairline borders with faint, ambient multi-stop drop shadows. This prevents UI muddiness and preserves crisp lines on high-DPI displays.

### Elevation Hierarchy
- **Level 0 (Recessed / Canvas Base):** No elevation. Hex `#F8FAFC` or `#F1F5F9`. Flat background planes and inline table filters.
- **Level 1 (Default Card / Container):** Single stroke border `1px solid #E2E8F0` coupled with an ambient shadow: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Hover State / Focused Panels):** Enhanced interactive presence: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`. Border shifts to `#CBD5E1`.
- **Level 3 (Modals / Slide-Over Drawers / Dropdowns):** Floating spatial depth: `box-shadow: 0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.03)`. Border: `1px solid #E2E8F0`.

### Focus Rings
Elevated interactive elements require a high-precision offset focus ring: `box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #1E4FD8`.

## Shapes

The geometric framework is tuned to `roundedness: 2`, delivering a balanced, modern edge profile.

### Corner Radius Mapping
- **Primary Cards & Modals (`rounded-xl`):** `12px` (`0.75rem`). Applied to main dashboard metric boxes, campaign detail cards, settings wrappers, and dynamic panels.
- **Standard Controls & Badges (`rounded-md`):** `6px` to `8px` (`0.375rem` - `0.5rem`). Applied to buttons, search fields, dropdown trigger buttons, and contextual chips.
- **Pill Accents (`rounded-full`):** `9999px`. Reserved for state badges (e.g., "Active", "Bounced"), online indicators, progress avatars, and quick-filter buttons.

## Components

### Buttons
- **Primary Button:** Background `#1E4FD8`, text `#FFFFFF`, border `none`, radius `8px`. Hover: `#163FB5`. Active: `#103294`. Focus: 2px white offset with 2px primary ring.
- **Secondary Button:** Background `#FFFFFF`, text `#0F172A`, border `1px solid #E2E8F0`, radius `8px`. Hover: `#F8FAFC` and border `#CBD5E1`.
- **Tertiary / Ghost Button:** Background transparent, text `#475569`. Hover: background `#F1F5F9`, text `#0F172A`.

### Status & AI Badges
- **Status Badges:** Compact height (22px), `padding: 2px 8px`, `rounded-full`, typography `label-sm`.
  - *Sent / In-Flight:* Background `#EFF6FF`, text `#1E4FD8`, border `1px solid #DBEAFE`.
  - *Replied / Converted:* Background `#ECFDF5`, text `#047857`, border `1px solid #D1FAE5`.
  - *AI Generated / Scoring:* Background `#EEF2FF`, text `#4F46E5`, border `1px solid #E0E7FF`.
- **Service Chips:** Inline rounded capsules (`rounded-md`, 6px) with 12px logos (e.g., Gmail, LinkedIn, Outlook) and 1px borders in `#E2E8F0`.

### Form Controls & Inputs
- **Text Inputs:** Pure white background (`#FFFFFF`), border `1px solid #E2E8F0`, radius `8px`, height 40px, text `body-md` (`#0F172A`). Placeholder text `#94A3B8`.
- **Active State:** Border `#1E4FD8`, ring `0 0 0 1px #1E4FD8`.
- **Checkboxes & Radios:** Size `16px x 16px`, radius `4px` (checkbox) or `full` (radio). Unchecked: border `1.5px solid #CBD5E1`. Checked: background `#1E4FD8`, border `#1E4FD8`, check icon in crisp `#FFFFFF`.

### SaaS Metric Cards
- Surface `#FFFFFF`, border `1px solid #E2E8F0`, radius `12px`, padding `space-lg`.
- Top row: `label-md` uppercase heading (`#64748B`) paired with an icon or micro-trend badge.
- Middle row: `headline-xl` metric value with tabular figures.
- Bottom row: `body-sm` context label paired with directional arrow tags (e.g., `+18.4% this week` in `#059669`).

### Data Tables
- Outer wrap: `1px solid #E2E8F0`, radius `12px`, overflow hidden.
- Table Header (`<th>`): Height 40px, background `#F8FAFC`, border-bottom `1px solid #E2E8F0`, typography `label-sm`, text `#475569`, left-aligned.
- Table Rows (`<tr>`): Height 52px, background `#FFFFFF`, border-bottom `1px solid #F1F5F9`. Hover state shifts to `#F8FAFC`.
- Table Data (`<td>`): Typography `body-md`, vertical alignment center.

### AI Outreach Composer Card
- Surface: `#FFFFFF`, border `1px solid #E0E7FF`, ambient drop shadow level 2.
- Top banner: Subtle gradient tint `#EEF2FF` to `#FFFFFF` featuring AI sequence generation tools and token count badges.