# Wardro — screen blueprints

Layout and content guidance for the MVP and supporting screens. For the
navigation model and phasing, see [`../screen-architecture.md`](../screen-architecture.md).
Reference images live in [`references/`](references/).

## Shared shell

- **Header** — title left, optional count/subtitle, primary action right. Pushed
  screens use the shared `AppHeader` (44px back target).
- **Content** — 20px side padding, 120px bottom padding under the tab bar.
- **Forms** — `FormScreen`: fixed header, scrollable body, sticky action footer
  that lifts with the keyboard.
- **Tab bar** — Today · Closet · Create · Calendar · Profile. Create gets a
  slightly more prominent treatment.
- **Actions** — primary actions are filled indigo; destructive actions use the
  danger colour and a confirmation dialog.

---

## Screen 1 — Today (Home)

Highest priority. This is the habit-forming screen.

| Order | Component | Layout |
| --- | --- | --- |
| 1 | Header | Greeting + account avatar |
| 2 | Profile switcher | Horizontal avatars; active profile + “Add profile” |
| 3 | Weather | Compact horizontal card |
| 4 | Today’s outfit | Large featured image |
| 5 | Quick actions | Create outfit / Add clothes |
| 6 | Outfit suggestions | Horizontal cards |
| 7 | Wardrobe insights | Small statistics |
| 8 | Recently added | Horizontal clothing grid |

**The important thing: Today’s outfit should occupy the most visual space.**

Content and interactions:

- Greeting uses the active profile’s name; the account avatar opens Profile.
- Profile switcher is always visible, even with one profile, so multi-profile
  is discoverable. Switching profiles refreshes the entire screen.
- Weather, outfit, suggestions, insights and recent items are all scoped to the
  active profile.
- Weather: compact card with temperature, condition, and a one-line styling
  nudge. Location is opt-in under Settings.
- Today’s outfit: full-width editorial card with outfit image, name, and a
  palette/match summary. Tap to open the outfit. “See alternative” swaps the
  featured suggestion.
- Quick actions: **Create outfit** (primary) and **Add clothes** (secondary).
- Outfit suggestions: horizontally scrolling outfit cards with a match score
  and a short reason (“warm layers for 18°C”).
- Wardrobe insights: compact statistics (items, value, wears this month,
  cost-per-wear). Tap to open Analytics.
- Recently added: horizontal garment cards.

Reference: [`references/today-ai-stylist.png`](references/today-ai-stylist.png) —
editorial cream background, serif display heading, AI stylist prompt, palette
list, and match badges. Borrow the hierarchy and the “What should you wear
today?” prompt; use Wardro’s own branding and a deterministic suggestion engine
initially.

Current status: the dashboard, summary, quick actions, recent items, and
wardrobe preview are built. Weather, today’s outfit, suggestions, and insights
preview are later phases.

---

## Screen 2 — Closet

| Order | Component | Layout |
| --- | --- | --- |
| 1 | Header | My Closet + item count |
| 2 | Search bar | Full-width, sticky under the header |
| 3 | Category chips | Horizontal: All · Tops · Bottoms · Dresses · Shoes · Accessories |
| 4 | Filter / sort | Filters and sort sheet/controls |
| 5 | Garment grid | Two columns, 4:5 images |
| 6 | Add clothing | Floating Add Clothing button |

Content and interactions:

- Category chips filter the grid. Wardrobes can be a second chip row or part of
  the filter sheet (“Manage wardrobes”).
- Each `ClothingCard` shows the image, name, and optional wear count; a “Low
  use” badge highlights neglected items.
- Search matches name, brand, category, colour, and size.
- Empty states: no garments, no search matches, no wardrobe selected.
- The Add Clothing button is camera-first and opens Add clothing.

Reference: [`references/closet-grids.png`](references/closet-grids.png) —
category chips, two-column 4:5 grid, “12 wears” metadata, and a green “Low use”
badge. The current Items screen already has search and wardrobe chips; the next
step is category chips, filter/sort, 4:5 imagery, wear counts, and merging the
separate Wardrobes tab into Closet.

Data dependency: a normalized category taxonomy (Tops, Bottoms, Dresses, Shoes,
Accessories) and a wear count per item.

---

## Screen 3 — Clothing details

Arrangement:

- Large clothing image at the top.
- Item name and category.
- Color, brand, season, occasion.
- Usage statistics.
- Outfits containing this item.
- Edit and Delete actions.

Notes:

- Use the image as the hero, with the details on a rounded sheet beneath it.
- Show the category as a pill and the colour as a swatch + label.
- Usage stats: times worn, last worn, cost per wear.
- “Outfits containing this item” is a horizontal list of outfit cards; tapping
  one opens the outfit.
- Styling notes are free text; keep them visually secondary.
- Make this screen reusable for every category (tops, dresses, shoes, bags).

Reference: [`references/clothing-detail.png`](references/clothing-detail.png) —
large product image, bottom sheet, brand, category chip, color swatch, price,
purchase date, and styling notes.

Current status: item hero, pills, details, dates, and delete are built. Edit,
season/occasion, usage stats, outfits-containing, and styling notes are next.

---

## Screen 4a — Add to your closet (hub)

The front door for creating items. It routes; it does not collect details.

| Option | Behaviour |
| --- | --- |
| **Take a photo** | Takes one photo and opens Review items; repeat there to add up to 10 |
| **Choose photos** | Multi-select up to 10 and open Review items |
| **From a website** | Opens the in-app browser; Auto Scan/Capture feed Review items |
| **Type it in** | Opens the blank item form (one item, no photo) |

Copy:

- Title: “Add to your closet”; subtitle: “Up to 10 items, however you add them.”
- Tile captions: “Add up to 10, one at a time”, “Up to 10 at once”, “Scan or
  capture a page”, “One item, no photo”.

Rules:

- There is **no separate batch option**; every source is multi-add up to 10 and
  every source lands in Review items.
- Only methods that exist appear. No Library (no catalog), no email or store
  import until they are real, no “More methods” drawer.
- Editing an item never passes through the hub; it opens the form directly.

---

## Screen 4b — From a website (in-app browser)

| Order | Element | Notes |
| --- | --- | --- |
| 1 | Address bar | Paste a product link or type a store address; clear control |
| 2 | Browser controls | Back, forward, reload; a thin progress bar while loading |
| 3 | Start panel | “Browse a store” with a few store shortcuts |
| 4 | Web page | Rendered in `react-native-webview`, with session cookies and storage |
| 5 | Auto Scan | Sends the current URL through `POST /api/ai/item-draft` |
| 6 | Capture | Screenshots the visible page and sends it through the vision draft |
| 7 | Recently visited | Last eight URLs, stored locally per profile; tap to reopen, Clear to wipe |

Both actions create a row in Review items. “Auto Scan” is primary; “Capture”
is the fallback for pages the server-side extractor cannot read. Both buttons
are always visible; on web, Capture explains that it needs the phone app.

Navigation rules:

- Only `http`/`https` pages load in place. `tel:`, `mailto:`, `intent:` and
  other app schemes are handed to the operating system; downloads (PDF, ZIP,
  APK) open externally.
- Network errors show a retry action; the error clears on the next load.
- Android hardware back walks page history before leaving the screen.

Later: **Auto Scan** for listing pages — one page, many detected products,
review list, add them together. This needs a multi-item extract endpoint and is not part
of the current build.

---

## Screen 4c — Review items

The single confirmation surface for every add source.

| Order | Element | Notes |
| --- | --- | --- |
| 1 | Header | “Review items”, “N of 10 items” |
| 2 | Add items card | Add photos, Take a photo, wardrobe picker |
| 3 | Selection controls | Select all, Delete selected |
| 4 | Rows | Photo, category chip, name, details, include/skip, duplicate choices |
| 5 | Sticky footer | “Add N to closet”, then Done |

Rules:

- Local photos are drafted two at a time; server drafts arrive ready.
- The review holds at most 10 items; Add photos appends up to the remainder.
- Nothing is written until “Add N to closet”; each row reports success or error.
- Duplicate choices are Skip, Add anyway and Update existing, matched on
  normalized name/brand/category/colour/size within the active profile.

Later: per-row detail view, retry and source link.

---

## Screen 4 — Add clothing

| Order | Step | Notes |
| --- | --- | --- |
| 1 | Upload / take photo | Camera and gallery; preview |
| 2 | Image preview | Full-width 4:5 preview with replace/remove |
| 3 | Clothing name | Required |
| 4 | Category | Chips/picker using the shared taxonomy |
| 5 | Color | Swatch picker + custom option |
| 6 | Season and occasion | Multi-select or optional chips |
| 7 | Brand | Optional |
| 8 | Save item | Sticky footer action |

Keep the form simple. The photo is the hero; the fields are compact. Later, add
AI-based category and colour detection as suggestions, not silent decisions.

Reference: [`references/add-clothing.png`](references/add-clothing.png) —
photo-first capture with a compact card form, a color picker sheet, and a save
action. The current Add Item form is longer (price, dates, size); consider
moving those into an “More details” expandable section to keep the first pass
fast.

---

## Screen 5 — Outfit builder

Core product differentiator.

Arrangement:

- Header: Create Outfit.
- Large outfit preview canvas.
- Slots for Top, Bottom, Shoes, and Accessories.
- Select from My Closet.
- Outfit name.
- Occasion and season.
- Save outfit.

**The canvas should be the focus, not the form fields.**

Notes:

- Start with a slot-based canvas: Top, Bottom, Shoes, Accessories. This is
  easier to implement and keeps outfits wearable.
- Each slot opens the Closet picker filtered to the relevant category.
- The canvas preview composes the selected garment images; an optional later
  mode supports freeform drag/scale/rotate collage.
- Keep outfit name, occasion, and season in a compact dock below the canvas.
- Provide clear/remove, rotate (later), and save actions.

Reference: [`references/outfit-builder-canvas.png`](references/outfit-builder-canvas.png) —
Dress me / Canvas / Moodboards, a large collage canvas, save, rotate, remove,
and an add tray. Borrow the canvas-first hierarchy; start with slots rather
than freeform drag-and-drop.

Data dependency: `outfits`, `outfit_items` (with a slot/position), and
optional cover image. See the backend schema notes below.

---

## Screen 6 — Saved outfits

Arrangement:

- Header: My Outfits.
- Search and occasion filters.
- Two-column outfit gallery.
- Favourite outfits.
- Tap to see outfit details.

Notes:

- Group by season or occasion (Summer / Formal / Winter) with collapsible
  sections, as in the reference.
- Each `OutfitCard` shows the cover/collage, name, occasion, and a favourite
  affordance.
- The primary action is “Create outfit”, which opens the builder.
- Empty state: “No outfits yet — build one from your closet.”

Reference: [`references/saved-outfits.png`](references/saved-outfits.png) —
seasonal groups and a two-column photo gallery with a simple add action.

---

## Screen 7 — Calendar

Arrangement:

- Month / Week toggle.
- Calendar dates.
- Outfit thumbnail on planned days.
- Selected date details below.
- Assign outfit button.

**Avoid making this a traditional business calendar. It should look like a
fashion planner.**

Notes:

- Month view uses large day cells with outfit thumbnails, not dense event
  text.
- Tapping a date shows the planned outfit and actions: assign/replace/clear.
- Assign outfit opens the saved-outfits picker.
- Show “today” clearly and keep the palette warm and editorial.
- Week view is a horizontal strip for quick planning.
- Calendar starts as a segment inside Create; promote it to its own tab when it
  has enough depth.

Reference: [`references/calendar.png`](references/calendar.png) — a
fashion-planner calendar with outfit thumbnails per day and
Items/Outfits/Collections counters. Borrow the visual treatment, not the exact
layout or branding.

Data dependency: planned outfits by date (`planned_outfits` with `date`,
`outfitId`, `ownerUid`).

---

## Screen 8 — Profile

- Profile picture and name.
- **Profiles management** (family members / contexts).
- Wardrobe summary.
- Analytics entry.
- Preferences.
- Weather location.
- Notifications.
- Settings.

Notes:

- Keep the account block first; profiles, statistics and preferences follow.
- Profiles section: avatar, name, counts, edit; “Add profile”; delete inside
  edit with confirmation. Never allow deleting the last profile.
- Profile switching is also available on Today; this section is for managing
  them.
- Analytics is reachable from here and from the Today insights card; it is not
  a tab.
- Weather location and notifications are opt-in with clear permission copy.
- Sign out stays at the bottom with a destructive confirmation.

Reference: [`references/analytics.png`](references/analytics.png) — utilization
ring, category breakdown, highest cost-per-wear items, and average cost per
wear. Use this as the Analytics screen design, not the Profile layout itself.

---

## Cross-screen guidance

- **Images** — garment cards use a 4:5 aspect ratio; hero outfit cards are
  full-width and editorial.
- **Text** — short labels, one-line subtitles, no dense paragraphs on primary
  screens.
- **Colour** — warm neutral canvas, near-black text, a single brand accent, and
  semantic green/amber/red for status.
- **Empty states** — always include a next action (add clothing, create outfit,
  assign a date).
- **One-handed use** — primary actions live at the bottom or in the header’s
  right edge; the FAB sits above the tab bar.
- **Accessibility** — 44px touch targets, accessible labels on icon buttons,
  and text that remains legible over photography.

## Current implementation mapping

| Blueprint | Current implementation |
| --- | --- |
| Today | `app/(root)/(tabs)/today.tsx` dashboard + profile rail |
| Closet | `app/(root)/(tabs)/closet.tsx` + `app/(root)/wardrobes.tsx` manager |
| Clothing details | `app/(root)/item/[id].tsx` |
| Add / Edit clothing | `app/(root)/add-wardrobe-items.tsx` |
| Profiles | `components/ProfileSwitcher.tsx`, `components/ProfileAvatar.tsx` |
| Add / Edit profile | `app/(root)/add-profile.tsx` |
| Outfit builder | Not built |
| Saved outfits | Not built |
| Calendar | Not built |
| Profile | `app/(root)/(tabs)/profile.tsx` (account + profiles) |
| Analytics | Not built |

## Backend additions required by these blueprints

- `outfits` — id, owner uid, name, occasion, season, cover/canvas data,
  favourite flag, created/updated timestamps.
- `outfit_items` — outfit id, wardrobe item id, slot (top/bottom/shoes/
  accessory), position/scale/rotation for the canvas.
- `planned_outfits` — owner uid, date, outfit id.
- `wear_logs` — item id, worn date, optional outfit id (feeds usage stats and
  cost-per-wear).
- Item fields for season, occasion, and styling notes.
- Analytics queries for utilization, category breakdown, and cost-per-wear.
