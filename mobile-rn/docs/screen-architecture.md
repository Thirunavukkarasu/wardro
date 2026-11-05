# Wardro — screen architecture

Status: **agreed 2026-11-05**. This is the target information architecture for
the React Native app. It supersedes the current `Home / Wardrobes / Items /
Profile` shell.

The visual direction, per-screen blueprints, component system, and reference
images live in [`design/`](design/README.md). The final five-destination
navigation is **Today · Closet · Create · Calendar · Profile**; the phases below
introduce those destinations only as their features ship.

## 1. Principles

- **Bottom tabs for primary navigation.** No hamburger drawer. Primary
  destinations stay visible and thumb-reachable.
- **3–5 destinations, all real.** Never ship an empty tab; add a destination
  when its feature exists.
- **One inventory.** “Closet” contains garments. Wardrobes are filters /
  collections inside it, not a second top-level inventory tab.
- **Adding clothing is a global action.** The camera FAB on Today/Closet is the
  primary add-clothing action; Add/Edit are flows, not destinations.
- **Create is a creation hub.** In the final navigation it is the prominent
  middle destination: the outfit builder is primary and “Add clothing” is a
  secondary entry. It must never be a vague “+” with no clear job.
- **Search and filters are tools, not screens.** They live in the Closet app
  bar and a filter sheet/chips.
- **Today carries daily value.** Planned outfit, weather, suggestions, recent
  items, and an insights preview.
- **Profile owns account and preferences.** Secondary items go in a clearly
  labelled “More” list; core actions are not buried there.
- **Consistent screen shells.** Pushed screens use `AppHeader` (44px back
  target, title, optional right action). Forms use `FormScreen` (fixed header,
  scrollable content, sticky action footer).

## 2. Target navigation

Final state once outfits and planning exist:

**Today · Closet · Create · Calendar · Profile**

`Create` sits in the middle with a slightly more prominent treatment. Adding a
garment still has a direct camera action on Today/Closet, so it is never hidden
behind the Create tab.

Phased rollout:

| Phase | Tabs | Why |
| --- | --- | --- |
| **1 — Foundations** | Today · Closet · Profile + FAB | Ship only what exists; consolidate the current Home/Wardrobes/Items shell. |
| **2 — Create** | + Create | Add the middle creation tab when the outfit builder and saved-outfit library are real. Calendar starts as a `Library / Calendar` segment inside Create. |
| **3 — Calendar** | + Calendar | Promote outfit planning to its own tab once the calendar is substantial. |
| **4 — Intelligence** | (same tabs) | Weather, outfit suggestions, wear tracking, cost-per-wear and analytics appear as cards/screens on Today, Closet, and Profile. |

### Reference screen map

![Wardro five-tab screen map](design/references/proposed-architecture.png)

The reference map groups **12 screens across 5 destinations**. It is a useful
product map; the last column records where we intentionally place a screen
differently so “Profile / More” does not become a junk drawer.

| # | Reference screen | Destination in map | Wardro placement |
| --- | --- | --- | --- |
| 1 | Home dashboard | Today | Today |
| 2 | Outfit suggestions | Today | Today |
| 3 | Wardrobe grid | Closet | Closet |
| 4 | Clothing details | Closet | Closet |
| 5 | Add / Edit clothing | Closet | Closet (flow) |
| 6 | Outfit builder | Create | Create |
| 7 | Saved outfits | Create | Create |
| 8 | Outfit calendar | Calendar | Calendar (starts as a segment in Create) |
| 9 | Profile and settings | Profile / More | Profile |
| 10 | Wardrobe analytics | Profile / More | Today preview + full screen from Today/Profile |
| 11 | Search and filters | Profile / More | Closet tool (not a destination) |
| 12 | Weather and outfit recommendations | Profile / More | Today card + location setting under Settings |

### Why introduce five tabs gradually

- **Create needs a clear job.** Define it as the outfit builder + creation hub
  (outfit primary, add-clothing secondary). A generic “+” or an ambiguous
  “Create” label would confuse users.
- **Create and Calendar are two views of outfits.** Start with the calendar as
  a segment inside Create; promote it only when planning is substantial.
- **Search & filters, analytics, and weather are not “More” items.** Search is
  a Closet tool, analytics is reachable from Today and Profile (not a tab), and
  weather is a Today card with its location setting under Settings.
- **Empty tabs feel unfinished.** Create and Calendar do not exist yet, so
  Phase 1 launches with Today, Closet, and Profile.

## 3. Screen inventory

| Area | Screen | Purpose | Status |
| --- | --- | --- | --- |
| Today | **Today dashboard** | Greeting, summary, quick add, recent items, insights preview | Rename from current Home |
| Today | Today’s outfit | The planned outfit for today | Later (Phase 2/3) |
| Today | Weather card | Small weather summary + relevant suggestion | Later (Phase 4) |
| Today | Outfit suggestions | Rule-based suggestions (weather + least-worn items) | Later (Phase 4) |
| Today | Insights preview | Value, item count, cost-per-wear; opens Analytics | Later (Phase 4) |
| Closet | **Closet grid** | Searchable, filterable garments with wardrobe chips | Merge current Items + Wardrobes |
| Closet | Search & filters | Text search + wardrobe/category/colour/size filters | Search + wardrobe chips already built in Items |
| Closet | Item detail | Photo hero, details, dates, delete, edit, mark worn | Built; Edit/Wear next |
| Closet | Add item | Photo-first capture | Built |
| Closet | Edit item | Pre-filled form + photo replacement | Next |
| Closet | Add / Edit wardrobe | Create or update a collection | Add built; Edit next |
| Closet | Wardrobe detail | One collection’s grid + delete + add | Built |
| Create | **Create hub** | Prominent middle destination: outfit builder primary, add clothing secondary | Later (Phase 2) |
| Create | Outfit builder | Compose an outfit from closet items on a large canvas | Later (Phase 2) |
| Create | Saved outfits | Two-column gallery, search/occasion filters, favourites | Later (Phase 2) |
| Create | Outfit detail | View/edit/plan an outfit | Later (Phase 2) |
| Calendar | Planner / calendar | Month or week view with outfit thumbnails by date | Later (Phase 3; starts as a segment in Create) |
| Profile | Profile | Identity, sign out | Built |
| Profile | Settings | Units, notifications, weather location, privacy | Later |
| Profile | Wardrobe analytics | Full analytics view | Later (Phase 4) |
| Profile | Help / About | Support, version, legal | Later |

## 4. Navigation rules

- **FAB → Add item** from Today and Closet. Hidden on Create, Calendar, and
  Profile unless it gains a contextual create action.
- **Create** — opens the outfit builder; “Add clothing” is available as a
  secondary action. Keep the visual treatment slightly more prominent than the
  other tabs.
- **Closet header** — title, search, category/filter chips, and a “Manage
  wardrobes” entry. Add wardrobe lives here (and in Today quick actions).
- **Item detail** — back, edit, delete; later: mark worn, add to outfit.
- **Wardrobe detail** — back, edit, delete, add item; the count is the
  subtitle, description in the body.
- **Today** — tap today’s outfit → outfit detail; tap a suggestion → builder;
  quick actions for Create outfit / Add clothes.
- **Profile** — identity header, summary, analytics entry, preferences
  (weather location, notifications), settings, help/about, sign out. Keep
  “More” visually secondary to the account section.

## 5. Migration from the current implementation

The app currently ships **Home · Wardrobes · Items · Profile** (4 tabs). To
reach Phase 1:

1. **Rename Home → Today.** Keep the dashboard and greeting; reserve slots for
   today’s outfit, weather, suggestions, and insights as those land.
2. **Merge Wardrobes + Items into Closet.**
   - Closet = current Items screen (search + wardrobe chips + grid).
   - Add a “Manage wardrobes” section/entry; remove the separate Wardrobes tab.
   - Wardrobe detail and Add/Edit wardrobe stay as pushed screens.
3. **Add Edit item / Edit wardrobe.** Requires `PATCH` endpoints and a
   pre-filled form mode; photo replacement reuses `api.uploadPhoto`.
4. **Add Create** as the prominent middle tab when the builder exists; keep
   Calendar inside Create as a segment.
5. **Add Calendar** as a 5th tab when outfit planning is substantial.
6. **Add wear tracking + favourites.** These are the data foundation for
   analytics and suggestions; add “Mark worn” on item/outfit detail.
7. **Add weather + suggestions + analytics** as Today cards and a full
   Analytics screen.

Visual layouts, reusable components, and reference images for each step are in
[`design/`](design/README.md).

## 6. Current state

As of 2026-11-05:

- Firebase auth (email/password + Google), token-authenticated API client, and
  Firebase Storage photo uploads are in place.
- Shared `AppHeader` / `FormScreen` shells, back buttons, and sticky form
  footers are in place.
- Home dashboard, Wardrobes, Items with search and wardrobe filters, item
  detail, wardrobe detail, add item, add wardrobe, and profile are built.
- Not built: edit flows, outfits, calendar, favourites, wear tracking,
  analytics, weather, suggestions.

## 7. Open decisions

- **Create hub composition:** outfit builder primary + add-clothing secondary;
  decide whether the tab opens the builder directly or a small create sheet.
- **Calendar placement:** start as a segment in Create; promote to a 5th tab
  once planning has enough depth and usage.
- **Analytics placement:** Today preview + a full screen reachable from Today
  and Profile; no dedicated tab.
- **Weather provider and location permission:** choose a provider and make
  location opt-in under Settings.
- **Suggestion rules:** start deterministic (weather + least-worn), then
  evaluate smarter recommendations later.
- **Wardrobe management entry:** a “Manage wardrobes” row in Closet vs a
  dedicated collection picker in the header. Prefer the row for discoverability
  with few collections.

## 8. Definition of done per phase

- **Phase 1:** one inventory tab, one daily dashboard, no empty destinations,
  every pushed screen has a back control and consistent spacing.
- **Phase 2:** an outfit can be created from real closet items, saved, viewed,
  edited, and deleted.
- **Phase 3:** outfits can be assigned to dates and viewed in a fashion-planner
  calendar.
- **Phase 4:** wear data drives cost-per-wear/analytics and a deterministic
  suggestion card on Today with an opt-in weather location.
