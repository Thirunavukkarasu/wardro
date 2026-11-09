---
name: website-interactions
description: Add or review tasteful motion, micro-interactions and UI polish on the Next.js marketing site, guided by Emil Kowalski's public writing. Use when touching website/ animations, transitions, drawers, toasts, hover states, or interaction design.
---

# Website interactions and motion

Apply this when changing `website/` (Next.js 14, Tailwind, Framer Motion,
Radix). It summarises principles from Emil Kowalski's public articles; link to
them rather than copying their text.

## Purpose first

- Motion should explain a change, confirm an action, or direct attention. If it
  does none of those, remove it.
- High-frequency actions should not animate or should animate almost
  imperceptibly. Reserve expressive motion for occasional moments.
- Perceived speed matters more than actual duration. A fast, interruptible
  transition feels better than a slow, polished one.
- Read: [You don't need animations](https://emilkowal.ski/ui/you-dont-need-animations)

## Timing and easing

- UI feedback: ~150–250 ms. Larger reveals: ~250–400 ms. Avoid anything over
  ~500 ms unless it is an intentional storytelling moment.
- Entrances use ease-out; exits use ease-in. Avoid linear except progress
  indicators.
- Springs suit interactive, draggable or press-driven motion; tweens suit
  simple opacity/transform transitions.
- Start from a near-visible state, e.g. `opacity: 0, scale: 0.96`. Do not
  animate from `scale(0)`.
- Scale buttons slightly on press (`0.97`) with a quick spring; never animate
  layout size for press feedback.
- Only the first hover/tooltip gets a delay; subsequent ones open immediately.
- Make transforms origin-aware: open a menu from its trigger, not from the
  centre of the viewport.
- Use blur sparingly, as a fallback when opacity/scale is not enough.
- Read: [7 practical animation tips](https://emilkowal.ski/ui/7-practical-animation-tips)

## Performance

- Prefer `transform` and `opacity`; avoid animating `width`, `height`, `top`,
  `left` or other layout properties.
- Use `clip-path` for reveals that need shape; see
  [The magic of clip-path](https://emilkowal.ski/ui/the-magic-of-clip-path).
- Stagger small groups by ~30–80 ms. Do not stagger large grids or lists.
- Avoid continuous decorative loops; they drain battery and compete for
  attention.
- Test on a mid-range phone and with the CPU throttled, not only on a desktop.

## Accessibility

- Respect `prefers-reduced-motion` (Framer Motion `useReducedMotion` or a CSS
  media query). Provide a static or near-static fallback.
- Never make motion the only signal for a state change; pair it with text,
  colour or focus.
- Keep focus rings and keyboard behaviour intact through transitions.

## Components and taste

- Drawers and sheets: see
  [Building a drawer component](https://emilkowal.ski/ui/building-a-drawer-component)
  and Vaul.
- Toasts: see
  [Building a toast component](https://emilkowal.ski/ui/building-a-toast-component)
  and Sonner.
- Develop taste by studying strong work and articulating why it works; see
  [Developing taste](https://emilkowal.ski/ui/developing-taste).
- When AI generates UI, keep constraints and critique in the loop rather than
  accepting the first shiny result; see
  [Agents with taste](https://emilkowal.ski/ui/agents-with-taste).

## Project rules

- Use `framer-motion` for orchestration and Tailwind transitions for simple
  hover/focus states.
- Use the tokens in `docs/design-system/`; no raw hex outside the theme.
- Keep marketing motion restrained; the wardrobe product itself should feel
  fast and calm.
- Before finishing, check: purpose, duration/easing, reduced motion, mobile
  performance, keyboard/focus, and no layout thrash.
