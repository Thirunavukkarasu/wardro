# Screen layout principles

Wardro screens are **image-first, warm and calm**. Every screen uses the warm
ivory background, 20px gutters, and one clear primary action. Detailed layout
order lives in
[`../../mobile-rn/docs/design/screen-blueprints.md`](../../mobile-rn/docs/design/screen-blueprints.md).

## Global rules

- Background: `bg-wardro-background`.
- Cards: `bg-wardro-surface` with a `wardro-border` hairline.
- Headings: `text-heading font-bold text-wardro-text-primary`.
- Supporting copy: `text-small text-wardro-text-secondary`.
- One primary action per screen; everything else is outline/secondary.
- Bottom padding: `pb-tab-safe` on tab screens; 32–40px on pushed screens.
- Photography dominates; leave generous whitespace between sections.
- No decorative gradients, no full-screen bright color blocks.

## Today (Home)

Purpose: decide what to wear and see the wardrobe at a glance.

Order:

1. Greeting + account avatar.
2. **Profile switcher rail** (avatars, active olive ring, Add tile).
3. Compact weather card.
4. **Today’s outfit** — the largest object on the screen, full-width editorial
   card with a photo/collage, title, palette and reason/match.
5. Quick actions: Create outfit / Add clothes.
6. Outfit suggestions — horizontal cards.
7. Wardrobe insights — compact statistics.
8. Recently added — horizontal garment cards.

Rules:

- The outfit card must dominate; keep other cards compact.
- The profile rail is always visible, even with one profile.
- Use `font-serif` only for the greeting/editorial title once the font is
  loaded.
- Empty profile: show an inviting “add your first item” card, not a blank page.

## Closet

Purpose: browse and find garments quickly.

Order:

1. Large “Closet” heading + item count, 20px gutter.
2. Search field.
3. Category chips (All, Tops, Bottoms, Dresses, Shoes, Accessories).
4. Wardrobe filter chips + Manage entry.
5. Two-column garment grid with 4:5 images.
6. Floating Add Clothing action.

Rules:

- Images dominate; cards have minimal borders and no heavy shadows.
- Name and optional wear count sit under or over the image.
- Use a “Low use” badge sparingly in `wardro-success`/`wardro-warning`.
- Search and filters stay visible above the grid.
- Switching profiles clears filters and reloads the closet.

## Outfit builder

Purpose: compose an outfit from the closet.

- Header: Create Outfit.
- **Large preview canvas occupies most of the screen.**
- Slots: Top, Bottom, Shoes, Accessories (v1).
- Tap a slot to open a category-filtered Closet picker.
- Name, occasion and season in a compact dock below the canvas.
- Save as the primary action; remove is secondary.
- The canvas—not form fields—is the focus.

## Calendar

Purpose: plan outfits by date.

- Month/Week toggle.
- Fashion-planner calendar, not a business calendar: large day cells, outfit
  thumbnails, minimal event text.
- Selected date shows the planned outfit and actions (assign/replace/clear).
- Today is clearly marked.
- Warm surfaces and editorial typography; avoid dense grids of text.
- Assign outfit opens the saved-outfit picker.

## Clothing details

Purpose: inspect and manage one garment.

- Large photo hero at the top (full-width, dark scrim for white title).
- Item name + brand/category beneath.
- Category, colour, size, season/occasion as compact pills/rows.
- Usage stats: wears, last worn, cost per wear.
- Outfits containing this item — horizontal outfit cards.
- Styling notes in a quiet card.
- Edit and delete accessible from the header; delete confirms.

Rules:

- Metadata hierarchy: name → key attributes → usage/outfits → notes.
- Keep destructive actions visually secondary until confirmed.
- Use the warm placeholder if the photo is missing.

## Profile

Purpose: account, profiles and preferences.

- Account block (avatar, name, email, sign out).
- **Profiles** management: active profile, counts, add/edit/delete.
- Analytics entry.
- Preferences: weather location, notifications, units.
- Help/About.

Rules:

- Account identity first; profiles and settings follow.
- Do not hide core profile management under a generic “More”.
- Analytics is reachable here and from Today; it is not a tab.

## Web presentation

- The app is confined to a 430px phone column on a charcoal backdrop
  (`PhoneFrame`).
- Use the same mobile layout; do not build desktop-only grids.
- Keep side padding 20px inside the frame.

## Motion and states

- Use short, quiet transitions (150–250ms).
- Show loading with the olive spinner and a short message.
- Every empty state offers a next action.
- Every error state offers Retry and a short explanation.
