# Project Design System Rules

## Active Design System

This project uses a **three-layer design system** composed of:

1. **ui-ux-pro-max skill** — Master design intelligence (styles, palettes, typography, UX guidelines)
2. **VengenceUI** — Animated React component library (https://www.vengenceui.com)
3. **Antigravity capabilities** — AI-powered code generation, image generation, and research

---

## Design System Rules

### Always follow this workflow for UI/UX work:

1. **Read the `ui-ux-pro-max` SKILL.md** first and run the design system generator
2. **Identify VengenceUI components** that match the required UI elements
3. **Fetch component source** live from `https://www.vengenceui.com/components/<slug>` before implementing
4. **Combine** — use ui-ux-pro-max tokens for colors/spacing/type, VengenceUI for animated components

### Technology Defaults (when not specified by user)

- **Framework**: Works with any React project — Next.js, Vite, CRA, Remix, Astro
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion (required for VengenceUI components)
- **Icons**: Lucide React (used by VengenceUI)
- **Fonts**: Orbitron (headings) + Inter (body) from Google Fonts

### VengenceUI Component Rules

- VengenceUI components work in **any React project** — not Next.js exclusive
- Store VengenceUI components in `components/ui/` or `components/vengenceui/`
- Fetch fresh component code from the website — never rely on memorized code
- Only add `"use client"` directive when the project is specifically Next.js App Router
- Dark mode is the primary design target; always test light mode if needed

### Combined System Priority

| Design Decision | Authority |
|----------------|-----------|
| Color palette | ui-ux-pro-max |
| Layout structure | ui-ux-pro-max |
| Typography system | ui-ux-pro-max (Orbitron as display override) |
| UX patterns & accessibility | ui-ux-pro-max |
| Animated components | VengenceUI |
| Hero sections & backgrounds | VengenceUI |
| Navigation | VengenceUI (Glass Dock / Notch Navbar preferred) |
| Motion & micro-interactions | VengenceUI + Framer Motion |

### Aesthetic Baseline

All UI delivered in this project should:
- Be **dark-first** with zinc/neutral tones (per VengenceUI aesthetic)
- Use **Orbitron** for brand/display text, **Inter** for body
- Include **subtle motion** on all interactive elements (150–300ms)
- Feature **glass morphism** or subtle blur effects on overlays
- Have **no emoji icons** — use Lucide React SVGs exclusively
- Include proper `cursor-pointer` on all interactive elements

---

## Skill References

- ui-ux-pro-max: `D:\olive-new\.agent\skills\ui-ux-pro-max\SKILL.md`
- vengenceui: `D:\olive-new\.agent\skills\vengenceui\SKILL.md`
