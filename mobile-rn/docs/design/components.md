# Wardro — reusable UI components

Build the core components once, then compose screens from them. This keeps the
product visually coherent and avoids re-implementing cards and empty states.

## Component inventory

| Component | Used in | Responsibility | Status |
| --- | --- | --- | --- |
| `ClothingCard` | Closet, suggestions, recently added | Garment image, name, wear count, status badge | `ItemPhotoTile` is the starting point |
| `OutfitCard` | Today, Create/saved outfits, Calendar | Outfit cover, name, occasion, match/favourite | New |
| `CategoryChips` | Closet, filters | Horizontal single-select category filter | New (wardrobe chips exist as a pattern) |
| `WeatherCard` | Today | Compact weather + styling nudge | New |
| `EmptyState` | All screens | Icon, title, message, next action | `EmptyView` exists |
| `ImageUploader` | Add clothing | Camera/gallery pick, preview, replace/remove | `PhotoCaptureField` exists |
| `OutfitCanvas` | Outfit builder | Slots/collage, selection, remove, save preview | New |
| `UsageStats` | Clothing details, insights | Wears, last worn, cost per wear | New |
| `BottomNavigation` | All main screens | Five destinations, prominent Create | `Tabs` layout exists; needs the new tabs |
| `ProfileAvatar` | Today switcher, Profile list, headers | Initials or photo, colour, active ring | Built |
| `ProfileSwitcher` | Today | Horizontal profile rail with active state and add tile | Built |
| `AppHeader` | All pushed screens | Back target, title, right action | Built |
| `FormScreen` | Add/edit forms | Fixed header, scroll, sticky footer | Built |
| `SearchBar` | Closet | Search input with clear action | Built inside Items; extract |
| `FilterBar` | Closet | Filter/sort controls and active filter count | New |
| `StatCard` | Today insights, Analytics | Label, value, optional trend | New (`SummaryStrip` covers the compact case) |
| `MatchBadge` | Today suggestions, outfit cards | “96% match” / reason label | New |
| `PaletteList` | Today, outfit detail | Colour swatches with item names | New |

## Component specs

### ClothingCard

- **Image** — 4:5, cover, rounded 16–20px, neutral background.
- **Metadata** — name (1 line), optional wear count, optional brand.
- **Badges** — “Low use” / “New” pill in the image corner.
- **Interaction** — whole card opens Clothing details; long-press (later) for
  quick actions.
- **Props** — `item`, `showWears?`, `onPress`, `onLongPress?`.

### OutfitCard

- **Variants** — `hero` (Today’s outfit, full width), `grid` (saved outfits,
  two columns), `compact` (calendar day, small thumbnail), `suggestion`
  (horizontal rail).
- **Content** — cover image or composed collage, name, occasion, optional match
  score/reason, favourite affordance.
- **Props** — `outfit`, `variant`, `onPress`, `onToggleFavourite?`.

### CategoryChips

- Horizontal scroll, single select.
- Options: All · Tops · Bottoms · Dresses · Shoes · Accessories.
- Selected chip: filled brand or ink; unselected: white with a line border.
- **Props** — `categories`, `selected`, `onSelect`, `counts?`.

### WeatherCard

- Compact horizontal card: icon, temperature, condition, location, one-line
  styling nudge.
- Loading skeleton when the location/weather is pending.
- Tap opens Settings if location permission is missing.
- **Props** — `temperature`, `condition`, `location`, `suggestion`, `loading`,
  `onPress`.

### ImageUploader

- Empty state: dashed/solid surface card with camera and gallery actions.
- Selected state: 4:5 preview with replace and remove.
- Handles permission denial with actionable copy.
- **Props** — `photo`, `onPickCamera`, `onPickLibrary`, `onRemove`.
- Existing `PhotoCaptureField` covers most of this; align it to the 4:5 ratio.

### OutfitCanvas

- Start with four slots: Top, Bottom, Shoes, Accessories.
- Each slot shows the selected garment or an “Add” prompt.
- Tap a slot to open a category-filtered Closet picker.
- Remove/clear controls per slot.
- Later: freeform drag/scale/rotate canvas.
- **Props** — `slots`, `onSelectSlot`, `onRemoveSlot`, `onSave`, `editable`.

### UsageStats

- Times worn, last worn, cost per wear.
- Compact inline row for Clothing details; larger cards for Analytics.
- **Props** — `wears`, `lastWorn`, `costPerWear`, `variant`.

### BottomNavigation

- Five destinations: Today, Closet, Create, Calendar, Profile.
- Create uses a slightly more prominent treatment (accent, raised, or a larger
  icon) but remains a tab, not a modal-only FAB.
- The add-clothing camera remains available on Today/Closet.
- **Props** — active tab, onSelect, onCreate.

## Design tokens

Use the existing Tailwind tokens instead of one-off colours:

- Brand: `#4F46E5`; deep `#4338CA`; soft `#EEF0FF`
- Accent: `#EC4899`
- Canvas: `#F7F7FB`; surface `#F1F2F7`; border `#E7E8EF`
- Ink: `#0F172A`; secondary `#64748B`; muted `#94A3B8`
- Success `#16A34A`; warning `#D97706`; danger `#DC2626`

For the warmer editorial direction in the references, introduce a second
neutral palette (cream/sand) as a theme variant rather than replacing the
current indigo system. Keep one accent for primary actions.

## Conventions

- Every icon-only button has an accessible label and a 44px target.
- Cards have one primary tap target; nested actions are explicit buttons.
- Images always have a neutral placeholder and a fallback (see
  `ItemPhotoPlaceholder`).
- Use `AppHeader` and `FormScreen` for all pushed screens.
- Use `EmptyView` with a next action; never ship a blank state.
- Prefer composition over screen-specific one-off cards.

## Existing component map

| Blueprint component | Current file |
| --- | --- |
| `AppHeader` | `components/AppHeader.tsx` |
| `FormScreen` | `components/FormScreen.tsx` |
| `ClothingCard` | `components/ItemPhotoTile.tsx` |
| `ImageUploader` | `components/PhotoCaptureField.tsx` |
| `EmptyState` | `components/StatusViews.tsx` (`EmptyView`) |
| `StatCard` / summary | `components/SummaryStrip.tsx`, `components/AppPill.tsx` |
| Placeholder | `components/ItemPhotoPlaceholder.tsx` |
| Buttons / fields | `components/CustomButton.tsx`, `components/InputField.tsx` |
| Date picker | `components/DateField.tsx`, `components/DateField.web.tsx` |
