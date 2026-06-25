---
name: vengenceui
description: >
  VengenceUI design system integration. Provides animated React components
  (buttons, text effects, interactive elements, backgrounds, layouts, navbars) built
  with Tailwind CSS and Framer Motion. Works with any React project — Next.js, Vite,
  CRA, Remix, etc. Copy-paste model — no npm install needed.
---

# VengenceUI — Skill Guide

**Website**: https://www.vengenceui.com  
**GitHub**: https://github.com/Ashutoshx7/VengenceUI  
**Docs**: https://www.vengenceui.com/docs  
**Core stack**: React · TypeScript · Tailwind CSS · Framer Motion

> VengenceUI is a **copy-paste** component library. There is no npm package.
> All components are sourced directly from the docs site and pasted into your project.
> Works with **any React-based project** — Next.js, Vite, CRA, Remix, Astro, etc.
> Backed by Vercel OSS Program.

---

## Framework Compatibility

| Framework | Compatible | Notes |
|-----------|-----------|-------|
| Next.js (App Router) | YES | Add `"use client"` to Framer Motion components |
| Next.js (Pages Router) | YES | No special changes needed |
| Vite + React | YES | Works out of the box |
| Create React App | YES | Works out of the box |
| Remix | YES | Mark components as client-only if needed |
| Astro (React islands) | YES | Use `client:load` directive |

The **only** framework-specific consideration is Next.js App Router — add `"use client"` at the top of any file using Framer Motion or browser APIs.

---

## Component Catalogue

### Buttons
| Component | URL slug |
|-----------|---------|
| Animated Button | `my-animated-button` |
| Candy Button | `candy-button` |
| Pop Button | `pop-button` |
| Generate Button | `generate-button` |
| Radial Glow Button | `radial-glow-button` |
| Social Flip Button | `social-flip-button` |
| Liquid Metal | `liquid-metal` |
| Creepy Button | `creepy-button` |
| Corner Button | `corner-button` |

### Text & Motion
| Component | URL slug |
|-----------|---------|
| Animated Number | `animated-number` |
| Flip Text | `flip-text` |
| Flip Fade Text | `flip-fade-text` |
| Liquid Text | `liquid-text` |
| Morph Text | `morph-text` |

### Interactive
| Component | URL slug |
|-----------|---------|
| Interactive Book | `interactive-book` |
| Image Trail | `image-trail` |
| Perspective Carousel | `perspective-carousel` |
| Diagonal Carousel | `diagonal-carousel` |
| Pixelated Image Trail | `pixelated-image-trail` |
| Interactive Keyboard | `interactive-keyboard` |
| Typing Keyboard | `typing-keyboard` |

### Layout & Cards
| Component | URL slug |
|-----------|---------|
| Agent Bento Grid | `agent-bento-grid` |
| Expandable Bento Grid | `expandable-bento-grid` |
| Staggered Grid | `staggered-grid` |
| Image Scatter | `image-scatter` |
| Glow Border Card | `glow-border-card` |
| Testimonials Card | `testimonials-card` |

### Tooltip & Marquee
| Component | URL slug |
|-----------|---------|
| Cursor Card | `cursor-card` |
| Elastic Stack | `elastic-stack` |
| Logo Slider | `logo-slider` |
| Stacked Logos | `stacked-logos` |
| Masked Avatars | `masked-avatars` |
| Image Reveal List | `image-reveal-list` |
| FAQ Accordion | `faq-accordion` |
| Shared Tooltip Avatars | `shared-tooltip-avatars` |

### Loaders
| Component | URL slug |
|-----------|---------|
| Kinetic Text Loader | `kinetic-text-loader` |

### Navbar & Docs
| Component | URL slug |
|-----------|---------|
| Glass Dock | `glass-dock` |
| Spotlight Navbar | `spotlight-navbar` |
| Notch Navbar | `notch-navbar` |

### Backgrounds
| Component | URL slug |
|-----------|---------|
| Aurora Hero | `aurora-hero` |
| Fluid Morph Background | `fluid-morph-bg` |
| Twisting Ribbon | `twisting-ribbon` |
| Animated Rays | `animated-rays` |
| Perspective Grid | `perspective-grid` |
| Light Lines | `light-lines` |
| Liquid Ocean | `liquid-ocean` |

---

## Project Setup

### For any React project (Vite, CRA, etc.)
```bash
# 1. Install Tailwind CSS (if not already)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 2. Install Framer Motion
npm install framer-motion
```

### For Next.js projects
```bash
# Create new project with Tailwind included
npx create-next-app@latest my-app --typescript --tailwind --app --no-src-dir
cd my-app

# Install Framer Motion
npm install framer-motion
```

### For Vite + React
```bash
npx create-vite@latest my-app -- --template react-ts
cd my-app
npm install
npm install framer-motion
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Add Tailwind utilities (all projects)
Follow: https://www.vengenceui.com/docs/add-utilities
Add required custom utilities to your global CSS per component.

### (Optional) VengenceUI CLI
See: https://www.vengenceui.com/docs/cli

---

## How to Use This Skill

When the user requests a VengenceUI component or you decide to use one:

1. **Identify the component** from the catalogue above.
2. **Fetch the source code** live using `read_url_content` on:
   `https://www.vengenceui.com/components/<slug>`
3. **Extract the TSX/JSX code** block from the page.
4. **Create the component file** at `components/ui/<ComponentName>.tsx` (or `.jsx`).
5. **Wire up dependencies**: confirm `framer-motion` is installed, Tailwind config is correct.
6. **Import** the component into the target page/layout.
7. **Next.js App Router only**: add `"use client"` at the top of Framer Motion files.

---

## Design Principles (VengenceUI Aesthetic)

Apply these consistently when using VengenceUI components:

- **Dark-first design**: Dark backgrounds (`#050505`, `#0a0a0b`, `#050608`)
- **Font pairing**: `Orbitron` (headings/brand) + `Inter` (body) — load from Google Fonts
- **Motion**: Framer Motion with `easeInOut`, spring physics, scroll-driven animations
- **Color language**: Zinc palette (`zinc-100` to `zinc-900`) with white/black transparencies
- **Micro-interactions**: Hover states, click feedback, cursor following, parallax
- **Glass effects**: `bg-background/95`, `backdrop-blur`, subtle borders (`border-white/10`)
- **Monochrome-first**: Prefer zinc/neutral tones with selective accent pops
- **Isometric / 3D feel**: SVG-based pseudo-3D, depth shadows, layered z-index effects

---

## Combined Design System (ui-ux-pro-max + VengenceUI + Antigravity)

When used alongside **ui-ux-pro-max** skill:

1. Run `ui-ux-pro-max` design system generation first to get master design tokens
2. Select VengenceUI components that align with the chosen style/palette
3. Adapt VengenceUI component colors to match the master palette (override Tailwind classes)
4. Use VengenceUI for animated sections, interactive elements, and background effects
5. Use ui-ux-pro-max patterns for layout structure, typography system, and UX guidelines

### Priority Matrix
| Need | Use |
|------|-----|
| Animated hero background | VengenceUI (Aurora Hero, Fluid Morph, Animated Rays) |
| Interactive buttons with motion | VengenceUI (Animated Button, Pop Button, Radial Glow) |
| Layout structure & spacing | ui-ux-pro-max design system |
| Typography & font pairing | ui-ux-pro-max (use Orbitron from VengenceUI for headings) |
| Bento grid / card layouts | VengenceUI (Agent Bento Grid, Expandable Bento) |
| Color palette selection | ui-ux-pro-max |
| Text reveal / motion effects | VengenceUI (Flip Text, Morph Text, Liquid Text) |
| Navigation bars | VengenceUI (Glass Dock, Spotlight Navbar, Notch Navbar) |
| UX best practices | ui-ux-pro-max |
| Logo sliders / marquees | VengenceUI (Logo Slider, Stacked Logos) |

---

## Pre-Delivery Checklist (VengenceUI additions)

- [ ] `framer-motion` installed
- [ ] Tailwind CSS configured in the project
- [ ] Orbitron font loaded via Google Fonts for display headings
- [ ] Dark mode tested — VengenceUI components are dark-first
- [ ] Component files in `components/ui/` or `components/vengenceui/`
- [ ] `"use client"` directive added ONLY if using Next.js App Router
- [ ] Tailwind `animate-*` custom utilities added if components require them
- [ ] Component source fetched fresh from vengenceui.com before implementing
