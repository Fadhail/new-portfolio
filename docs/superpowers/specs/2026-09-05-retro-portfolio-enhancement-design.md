# Retro Portfolio Enhancement Design Spec

**Date:** 2026-09-05
**Topic:** FADEL-OS 95 portfolio enhancement
**Base:** Existing 90s Retro-Tech portfolio (Windows 95 theme)

---

## Overview

Enhance the existing static Windows 95-themed portfolio with three
feature groups chosen by the owner: **Visual & Animasi**,
**Interaktivitas**, and **Modernisasi Mobile**.

The implementation stays vanilla (HTML + CSS + JavaScript), consistent
with the current codebase. No build tools. Sound is synthesized with the
Web Audio API (no external audio files). All effects are progressive:
disabled or reduced for touch devices, small screens, and users with
`prefers-reduced-motion`.

---

## Architecture

Components added:

```
index.html      Boot screen overlay, context menu, sound toggle (taskbar), 
                new SVG/emoji assets, script tags
css/retro.css   Boot screen, glitch, cursor, particles, context menu,
                drag states, swipe/snap, reduced-motion, mobile refinements
js/effects.js   Boot sequence, audio engine, drag system, context menu,
                swipe navigation, sound toggle, particles
```

All state stays client-side. Preferences persist in `localStorage`.

### Boot Sequence

- Full-screen overlay rendered once per session (per `sessionStorage`).
- Sequence: CRT static noise (~600ms) → "FADEL-OS 95" splash with a
  Windows 95 progress bar (~1.4s total) → fade out overlay.
- Click/tap/keypress skips the sequence immediately.
- Respects `prefers-reduced-motion` (skips straight to visible).

### Audio Engine (Web Audio API)

- Singleton `AudioContext`, lazy-initialized on first user gesture
  (required by browsers).
- Sounds synthesized with oscillators/filters, no assets:
  - `click` (e.g. buttons, icons)
  - `openWindow` / `closeWindow` (short sweep + noise burst)
  - `error` (classic Windows beep, descending square wave)
  - `boot` (power-on hum + chime)
- Global enabled/disabled toggle stored in `localStorage` key
  `fadelos-sound`. Toggle button placed in the taskbar (near clock).
- All playback guarded so exceptions never break the page.

### Draggable Windows

- Drag initiated on the window title bar (not on the buttons).
- Vanilla pointer events (`pointerdown/move/up`) with `setPointerCapture`.
- Window position clamped inside the desktop area; z-index raised on
  drag start (reuses existing `focusWindow`).
- Disabled when:
  - `window.matchMedia('(max-width: 767px)').matches` (mobile)
  - the window is `.is-maximized`
- Stored position persists only for the session (no localStorage).

### Desktop Context Menu

- Right-click on the desktop area (not inside a window) opens a
  Windows 95 style menu.
- Items: "New Window" (opens Profile), "Refresh Desktop" (re-runs the
  desktop icon entrance animation), separator, "About FADEL-OS 95"
  (small dialog), separator, "Close Menu".
- Closes on: click anywhere, Escape, scroll, window blur.
- Position clamped within viewport.
- Desktop only: not offered on touch devices (native long-press default
  is preserved).

### Desktop Background & Particles

- The existing Win95 dither background gets a slow animated opacity
  drift (CSS keyframes).
- A lightweight canvas layer behind the windows emits a small number of
  floating ASCII/emoji particles (e.g. `*`, `·`, `0`, `1`). Pointer
  events disabled (`pointer-events: none`).
- Particle count scales down with viewport width; canvas is paused when
  the tab is hidden (IntersectionObserver / `visibilitychange`) and
  stopped entirely under `prefers-reduced-motion`.

### Glitch Effect

- `HELLO WORLD!` heading and focused window title bars get an
  occasional glitch (CSS keyframes with clip-path slicing + RGB split
  via text-shadow) triggered at random intervals.
- Subtle: runs a short duration (120–200ms), spaced ~6–10s apart.
- Not applied under `prefers-reduced-motion` or on mobile.

### Custom Retro Cursor

- CSS custom cursor built with an inline SVG (pixel-style arrow) applied
  to `body`, with a `pointer` variant for interactive elements.
- Disabled (falls back to default) under `prefers-reduced-motion`,
  touch devices, and very small screens where a custom cursor is
  pointless.

### Swipe Navigation (mobile)

- On touch devices (<768px), horizontal swipe on the workspace area
  switches between open windows: left → next, right → previous.
- Implemented with pointer events and a threshold (~40px) before a swipe
  is recognized, to avoid conflicting with window inner scrolling.
- Only acts on the topmost window; no effect when the window content is
  itself scrollable in the swipe direction (checked via
  `scrollWidth`/`clientWidth`).

---

## Error Handling

- Audio failures are silently caught (no console spam, no crash).
- Missing localStorage access (private mode) falls back to in-memory.
- All new JS is defensive: element lookups check existence before use,
  matching the existing file's style.
- Drag logic clamps coordinates so a window can never be dragged fully
  off-screen.

---

## Accessibility & Responsive

- `prefers-reduced-motion` disables: boot static, glitch, particles,
  custom cursor, background drift, slide-in animations.
- Touch / coarse pointers get larger hit areas, no hover-only effects,
  no custom cursor, no drag, no context menu.
- Mobile (<768px): swipe navigation enabled, boot screen still shows
  (with skip), sound toggle remains available.
- Keyboard: Escape closes context menu and skips boot screen.

---

## Testing

- Manual verification in browser DevTools:
  - Desktop viewport: drag windows, right-click menu, cursor, glitch,
    particles, boot screen, sound toggle.
  - Mobile emulation (<768px, touch): swipe navigation, no drag/context
    menu, reduced effects, taskbar layout intact.
  - `prefers-reduced-motion: reduce` via DevTools: all animations and
    heavy effects disabled.
  - Konami code still triggers Matrix rain (no regression).
  - Windows minimize/maximize/close/taskbar still work (no regression).

---

## Out of Scope

- No build tooling, no new dependencies.
- No new content sections (timeline, certificates, testimonials).
- No SEO/meta overhaul.
- No changes to existing contact form behavior beyond audio feedback.