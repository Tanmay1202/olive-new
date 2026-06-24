# Design Tokens & Component Audit

This document summarizes the design system tokens, CSS classes, and UI primitives extracted from the public-facing pages of the resort website, to be reused in the Admin dashboard.

## 1. Color Palette (CSS Variables)

The website uses a dark, premium, olive/gold-themed color scheme:

| Variable | Value | Purpose |
|---|---|---|
| `--ink` | `#11180d` | Body background, deep green-black |
| `--ash` | `#0b1208` | Secondary deep background |
| `--paper` | `#f4f0e4` | Primary text color, light cream |
| `--olive` | `#4f661f` | Brand green, success status indicators |
| `--leaf` | `#c5b35a` | Accent leaf green |
| `--gold` | `#c59b46` | Accent gold, primary buttons, borders, highlights |
| `--wine` | `#741f23` | Warm red/maroon for dining section backdrop |
| `--water` | `#0d2f37` | Blue/dark teal accent |
| `--muted` | `rgba(17, 24, 13, 0.66)` | Muted text color |
| `--light-line` | `rgba(17, 24, 13, 0.16)` | Light borders (for light backgrounds) |
| `--dark-line` | `rgba(244, 240, 228, 0.16)` | Dark borders, table row dividers |
| `--shadow` | `0 30px 90px rgba(0, 0, 0, 0.34)` | Soft shadow for cards, modals |

## 2. Typography

- **Font Family**: `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **Serif Accent**: `Georgia, "Times New Roman", serif` (used for italic emphasis like *celebration*)
- **Labels**: `text-transform: uppercase`, `font-size: 11px` or `12px`, `font-weight: 900`, `letter-spacing: 0.2em`, color `var(--gold)`
- **Headings**: Uppercase, heavy font weight (`950`), line height `0.88` to `0.9`

## 3. Primitives & Form Controls

The public booking form (`.booking-form`) defines the standard for inputs and form UI. We must reuse these styles directly without adding new custom variations.

### Form Card Container (`.booking-form`)
- **Background**: `rgba(244, 240, 228, 0.07)`
- **Border**: `1px solid rgba(244, 240, 228, 0.16)`
- **Backdrop Filter**: `blur(18px)`
- **Box Shadow**: `var(--shadow)`
- **Padding**: `clamp(22px, 4vw, 46px)`

### Form Labels (`.booking-form label`)
- **Display**: Grid layout with a gap of `9px`
- **Label Text (`span`)**: Uppercase, `var(--gold)`, font size `12px`, font weight `950`, letter-spacing `0.14em`

### Input / Select / Textarea
- **Background**: `rgba(17, 24, 13, 0.32)`
- **Border**: `1px solid rgba(244, 240, 228, 0.22)`
- **Border Radius**: `0` (flat corners)
- **Min Height**: `56px`
- **Color**: `var(--paper)`
- **Font Weight**: `700`
- **Placeholder Color**: `rgba(244, 240, 228, 0.45)`
- **Focus Styles**:
  - `border-color: var(--gold)`
  - `background: rgba(17, 24, 13, 0.48)`
  - `box-shadow: 0 0 0 3px rgba(197, 155, 70, 0.18)`

### Dropdowns (`option` element)
- **Background**: `#18210d` (dark background matching the theme)
- **Color**: `var(--paper)`

### Buttons
- **Primary Button (`button[type="submit"]` or `.hero-actions a`)**:
  - **Border**: `2px solid var(--gold)`
  - **Border Radius**: `999px` (fully rounded)
  - **Background**: `var(--gold)`
  - **Color**: `var(--ink)`
  - **Font Weight**: `950`
  - **Min Height**: `58px`
  - **Hover**: Background `#d6b159`, translate up by `2px`
- **Secondary Button (`.hero-actions a + a`)**:
  - **Background**: `rgba(17, 24, 13, 0.28)`
  - **Color**: `var(--paper)`
  - **Border**: None (or inherits border)

### Confirmation / Alert Box (`.booking-confirmation`)
- **Border Left**: `4px solid var(--olive)` (success highlight)
- **Background**: `rgba(244, 240, 228, 0.1)`
- **Color**: `rgba(244, 240, 228, 0.82)`
- **Heading (`strong`)**: Uppercase, `var(--paper)`, font size `21px`, font weight `950`

---

## 4. Admin-Specific UI Components (To Be Built)

Since the public site does not contain tables, dashboard grid cards, or sidebar menus, we will build these components in `src/admin/` by adapting the existing tokens:

### A. Sidebar Navigation
- Will adapt the `MenuOverlay` language:
  - Background: `linear-gradient(135deg, #18210d 0%, #263015 46%, #0b1208 100%)`
  - Links: uppercase, gold color on hover (`var(--gold)`), with simple translation animation on hover.
  - Active links will use a border or indicator of `var(--gold)`.

### B. Admin Cards (Dashboard Metrics)
- Styled using the Form Card styling:
  - Background: `rgba(244, 240, 228, 0.07)`
  - Border: `1px solid rgba(244, 240, 228, 0.16)`
  - Shadow: `var(--shadow)`
  - Highlighted numbers/stats in `var(--gold)` with heavy fonts (`900` or `950`).

### C. Tables (Bookings, Room Types, Availability)
- **Header**: Uppercase text, bold font size `11px`, letter-spacing `0.1em`, color `var(--gold)`.
- **Rows**: Separated by `1px solid var(--dark-line)`.
- **Row Hover**: Light background highlight `rgba(244, 240, 228, 0.03)`.
- **Status Badges**:
  - `confirmed` / `paid`: Green border (`var(--olive)`), text `var(--paper)`, optional light background.
  - `pending` / `unpaid`: Yellow/Gold border (`var(--gold)`), text `var(--paper)`.
  - `cancelled` / `failed`: Red border (`var(--wine)`), text `var(--paper)`.

### D. Modals (Add/Edit Forms)
- Similar to lightbox overlay:
  - Backdrop background: `rgba(17, 24, 13, 0.86)` with blur filter.
  - Modal container: similar to `.booking-form` (centered, backdrop-filter, shadow, max-width).
