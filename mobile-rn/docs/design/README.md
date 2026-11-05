# Wardro — design direction

Status: working design reference, **2026-11-05**. This folder holds the visual
direction, screen blueprints, reusable component specs, and the reference
images that informed them. It complements
[`../screen-architecture.md`](../screen-architecture.md), which owns the
information architecture and phasing.

## North star

Wardro is a **personal fashion assistant**, not an inventory-management tool.

- Clothing images dominate the screen.
- Keep text minimal and scannable.
- Use warm backgrounds, subtle borders, and generous whitespace.
- Prefer full-width editorial cards for featured outfits.
- Use two-column image grids for garments.
- Keep primary actions reachable with one hand.
- Make the wardrobe feel curated, not like a spreadsheet.

## Navigation

Final five destinations:

**Today · Closet · Create · Calendar · Profile**

- **Create** is the prominent middle destination: the outfit builder is
  primary, with “Add clothing” as a secondary entry.
- Adding a garment still has a direct camera action on Today and Closet, so it
  is never buried behind Create.
- **Analytics** is reachable from Today and Profile; it does not consume a
  permanent navigation slot.
- **Search** and filters live inside Closet, not in a separate destination.
- Introduce Create and Calendar only when the features exist; see the phased
  plan in [`../screen-architecture.md`](../screen-architecture.md).

## MVP screens

The first meaningful product is seven screens:

1. Today
2. Closet
3. Clothing details
4. Add clothing
5. Outfit builder
6. Saved outfits
7. Calendar

Profile and analytics follow. The current app already covers the foundations
of Today, Closet, Clothing details, Add clothing, and Profile; outfits and the
calendar are the next product differentiators.

## Development priority

| Priority | Screens | Reason | Current status |
| --- | --- | --- | --- |
| **P0** | Today, Closet | Main experience | Foundations built; Closet consolidation next |
| **P0** | Add clothing, Clothing details | Core CRUD | Built; edit and richer details next |
| **P1** | Outfit builder, Saved outfits | Main product value | Not built |
| **P1** | Calendar | Outfit planning | Not built |
| **P2** | Profile, Analytics | Supporting experience | Profile built; analytics not built |
| **P2** | Search, filters, recommendations | Enhancement | Search + wardrobe filters built; category filters and recommendations next |

## Documents

| Document | Purpose |
| --- | --- |
| [`screen-blueprints.md`](screen-blueprints.md) | Layout order, content, and interactions for every screen |
| [`components.md`](components.md) | Reusable UI component system and data contracts |
| [`inspiration.md`](inspiration.md) | What to borrow from each reference image, and what not to copy |
| [`references/`](references/) | Reference screenshots (research material only) |
| [`../research/`](../research/README.md) | Research backlog: competitors, interviews, recommendation logic, taxonomy, weather, privacy |

## Reference index

| Image | Screen / pattern |
| --- | --- |
| [`references/today-ai-stylist.png`](references/today-ai-stylist.png) | Today: editorial hero, AI stylist prompt, palette + match score |
| [`references/closet-grids.png`](references/closet-grids.png) | Closet: category chips, two-column grid, wears/low-use badges |
| [`references/clothing-detail.png`](references/clothing-detail.png) | Clothing details: large image, bottom sheet, styling notes |
| [`references/add-clothing.png`](references/add-clothing.png) | Add clothing: photo-first compact form |
| [`references/outfit-builder-canvas.png`](references/outfit-builder-canvas.png) | Outfit builder: canvas-first collage |
| [`references/saved-outfits.png`](references/saved-outfits.png) | Saved outfits: seasonal groups and two-column gallery |
| [`references/calendar.png`](references/calendar.png) | Calendar: fashion planner with outfit thumbnails |
| [`references/analytics.png`](references/analytics.png) | Analytics: utilization, category breakdown, cost-per-wear |
| [`references/bottom-navigation.png`](references/bottom-navigation.png) | Bottom navigation with a prominent Create |
| [`references/proposed-architecture.png`](references/proposed-architecture.png) | The 12-screen map across Today, Closet, Create, Calendar, and Profile |

> **Reference-only material.** These screenshots are third-party inspiration,
> not Wardro assets. Do not reuse their branding, logos, copy, typefaces, or
> artwork in the product. If this repository is made public, consider removing
> `references/` or making the repository private.
