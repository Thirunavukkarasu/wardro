# Wardro — design inspiration

Reference material collected on **2026-11-05** for the Today / Closet / Create /
Calendar direction. These are third-party screenshots used as research; they
are not Wardro assets.

> **Do not copy** the reference brands, logos, typefaces, copy, illustrations,
> or photography into the product. Borrow layout patterns, hierarchy, and
> interaction ideas only. If this repository is public, consider keeping
> `references/` out of the published tree.

## Index

| Reference | Visible pattern | What to borrow | What to avoid |
| --- | --- | --- | --- |
| [`today-ai-stylist.png`](references/today-ai-stylist.png) | Cream editorial header, AI stylist prompt, “Today’s Curated Look,” palette list, match score | Daily hero hierarchy; a natural-language “What should I wear today?” entry; palette + item breakdown; match/reason badge | The exact AI copy, serif branding, and imagery |
| [`closet-grids.png`](references/closet-grids.png) | “My Wardrobe,” search, category chips, two-column 4:5 grid, “12 wears,” green Low use badge | One inventory screen; category chips; two-column image-first grid; wear metadata; low-use nudge | The exact chip set if our taxonomy differs; the specific UI chrome |
| [`clothing-detail.png`](references/clothing-detail.png) | Large product image, rounded bottom sheet, name, brand, category chip, colour swatch, price/purchase date, styling notes | Image-first detail; bottom-sheet content; colour swatch; usage/styling metadata | The exact typography and spacing; the debug badge |
| [`add-clothing.png`](references/add-clothing.png) | Orange onboarding frame, photo capture, compact Name/Color/Category/Description form, color picker sheet | Photo-first add flow; compact first pass; colour picker; sticky save | The orange theme; the exact form layout |
| [`outfit-builder-canvas.png`](references/outfit-builder-canvas.png) | Dress me / Canvas / Moodboards, large collage canvas, save, rotate, remove, add tray | Canvas-first outfit building; slot/selection tray; save action | Freeform drag/scale as a v1 requirement; the exact chrome |
| [`saved-outfits.png`](references/saved-outfits.png) | Seasonal groups (Summer / Formal / Winter), two-column outfit gallery, add | Saved-outfit library grouped by season/occasion; two-column gallery; simple add | The photographic style and branding |
| [`calendar.png`](references/calendar.png) | Items/Outfits/Collections counters, month grid, outfit thumbnail per day | Fashion-planner calendar; outfit thumbnails; counts; month navigation | Dense business-calendar patterns; the exact layout |
| [`analytics.png`](references/analytics.png) | Utilization ring, category icons/counts, Highest CPW cards, average cost per wear | Utilization %, category breakdown, highest cost-per-wear items, average CPW | The exact visual language and labels |
| [`bottom-navigation.png`](references/bottom-navigation.png) | Today · Closet · Create · Calendar · Profile, Create emphasized | Five destinations; Create as the prominent middle action | If any label doesn’t fit our product model |
| [`proposed-architecture.png`](references/proposed-architecture.png) | Five-tab, 12-screen architecture map (Today, Closet, Create, Calendar, Profile/More) | The screen grouping and the idea of a daily dashboard | Shipping empty tabs; placing Search/Weather/Analytics in a catch-all “More” |

## Screen-by-screen notes

### Today

The strongest reference is `today-ai-stylist.png`. The key idea is that **Today
is an editorial page, not a dashboard of widgets**. The outfit should be the
largest object on the screen, with weather, a stylist prompt, and alternative
looks supporting it. A match score and a palette breakdown make the suggestion
feel intentional.

For Wardro, start deterministic: weather + least-worn items + saved outfits.
Describe the reason in one line (“light layers for 18°C”) rather than claiming
AI.

### Closet

`closet-grids.png` is the clearest reference for the inventory. The two-column
4:5 grid, category chips, and wear counts make the closet feel browsable rather
than administrative. The green “Low use” badge is a strong, low-effort
engagement signal.

Our current search and wardrobe chips are a good base. The next step is the
category taxonomy, 4:5 cards, wear metadata, and merging the separate
Wardrobes/Items tabs.

### Clothing details

`clothing-detail.png` shows the right hierarchy: the garment owns the top half,
and the details live on a rounded sheet. The colour swatch and styling notes
are worth carrying forward. Keep delete secondary and require confirmation.

### Add clothing

`add-clothing.png` keeps the form short: photo, name, colour, category,
description, save. Our current form is longer; move price, purchase date,
expiry, and size behind an optional “More details” section so the first pass
stays fast.

### Outfit builder

`outfit-builder-canvas.png` is a freeform collage. That is a strong later
vision, but the first version should use **slots** (Top / Bottom / Shoes /
Accessories) to keep outfits wearable and the implementation tractable. The
canvas should still dominate the screen; keep name/occasion/season in a compact
dock.

### Saved outfits

`outfitted.png` uses seasonal groups and a two-column gallery. This is a good
model for the saved-outfit library. Add search and occasion filters, and keep
favourites lightweight.

### Calendar

`calendar.png` is deliberately a fashion planner, not a business calendar:
large day cells, outfit thumbnails, and counters. Reuse that idea. Start as a
segment inside Create, then promote it to a tab when planning is substantial.

### Analytics

`analytics.png` gives a compact analytics vocabulary: utilization percentage,
category breakdown, highest cost-per-wear, and average cost per wear. Surface a
small insight on Today and the full view from Profile and Today. Analytics does
not need a permanent tab.

## Brand note

The references use warm cream, editorial serif type, and muted photography.
Wardro currently uses an indigo system. Rather than replacing it, introduce the
warm/editorial feel as a **theme variant** for Today and outfit surfaces, and
keep the indigo system for actions and utility screens. This preserves
consistency while moving toward the “personal fashion assistant” feel.
