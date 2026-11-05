# Component guidelines

Components should consume the semantic `wardro-*` tokens. Do not hard-code
palette values in component files; use `wardroColors` from
`mobile-rn/src/theme/colors.ts` only for props that cannot take a class (icons,
ActivityIndicator, native shadows).

## Buttons

| Variant | Classes | Text | Use |
| --- | --- | --- | --- |
| Primary | `bg-wardro-primary-dark border-wardro-primary-dark` | `text-wardro-surface` | The one main action on a screen |
| Secondary | `bg-wardro-text-secondary border-wardro-text-secondary` | `text-wardro-background` | Alternative action |
| Outline | `border-wardro-border bg-transparent` | `text-wardro-text-primary` | Quiet/secondary action |
| Danger | `bg-wardro-danger border-wardro-danger` | `text-wardro-surface` | Destructive actions, with confirmation |
| Success | `bg-wardro-success border-wardro-success` | `text-wardro-surface` | Positive completion |

- Height: 48px (`py-3` + body line height).
- Radius: `rounded-button` (12px).
- Label: `text-body font-semibold`, one line, centered.
- Disabled: `opacity-60`; never remove the label.
- Loading: spinner in the text color, keep the button width stable.
- One primary button per view; additional actions are outline/secondary.

Existing: `mobile-rn/components/CustomButton.tsx`.
Docs: [colors.md](colors.md).

## Inputs and selectors

- Container: `rounded-button border border-wardro-border bg-wardro-surface-secondary px-4`.
- Label: `text-small font-semibold text-wardro-text-primary`, 6–8px above.
- Input text: `text-body font-semibold text-wardro-text-primary`.
- Placeholder: `text-wardro-text-disabled`.
- Focus: `border-wardro-primary` (web: `outline-none`).
- Error: `border-wardro-danger` and a small danger message below.
- Leading icon: 20px, `wardro-text-disabled`.
- Height: 48px.
- Date/select controls follow the same surface, radius and height.

Existing: `mobile-rn/components/InputField.tsx`,
`components/DateField.tsx`, `components/DateField.web.tsx`.

## Cards and surfaces

```tsx
<View className="rounded-card border border-wardro-border bg-wardro-surface p-4">
```

- Default card: white surface, 1px warm border, 16px radius, 16px padding.
- Optional `shadow-card`; do not use both a strong shadow and a heavy border.
- Image cards: image first, 4:5 for garments, rounded 16px, metadata overlaid
  on a dark scrim or placed below.
- Section surfaces: `bg-wardro-surface-secondary`.
- Avoid nested cards; use spacing and dividers instead.

Existing: `WardrobeCard`, `SummaryStrip`, `ItemPhotoTile`, `ItemPhotoPlaceholder`.

## Chips and pills

- Pill radius: `rounded-full`.
- Default: `bg-white border border-wardro-border text-wardro-text-primary`.
- Selected: `bg-wardro-primary-light border-wardro-primary text-wardro-primary-dark`
  or `bg-wardro-primary-dark text-wardro-surface` for a stronger selected state.
- Counts/status: `text-caption font-semibold`.
- Keep chips to one line; horizontally scroll when needed.

Existing: `AppPill`, filter chips in `app/(root)/(tabs)/closet.tsx`.

## Headers

- Pushed screens: `AppHeader` — 44px back target, centered title, optional
  right action, white surface, bottom `wardro-border` hairline.
- Title: `text-[17px] font-bold text-wardro-text-primary`; subtitle:
  `text-caption text-wardro-text-secondary`.
- Tab screens: large left-aligned heading (`text-heading font-bold`) with 20px
  gutter, no app bar border.
- Icon-only actions: 44px target, `wardro-text-primary` or
  `wardro-text-secondary`.

Existing: `mobile-rn/components/AppHeader.tsx`.

## Forms

Use `FormScreen` for all create/edit flows:

- Fixed `AppHeader` with a back button.
- Scrollable content with 20px padding.
- Sticky footer above the safe area with the primary action.
- Inline error above the footer action.
- Destructive actions live in the content (with confirmation), not beside Save.

Existing: `mobile-rn/components/FormScreen.tsx`, `ConfirmDialog.tsx`.

## Avatars and profiles

- Default avatar: 40px circle, `wardroProfileColors` background, white initials.
- Active profile: 2px `wardro-primary` ring.
- Profile rail: 68px wide items, 44px avatar, 10.5px label, active label bold
  olive; final “Add” tile with a dashed border.
- Account avatar may use a photo; profile avatars use initials/colour in v1.

Existing: `ProfileAvatar`, `ProfileSwitcher`.

## Tab bar and FAB

- Tab bar: white surface, 1px `wardro-border` top, 64px height, active
  `wardro-primary-dark`, inactive `wardro-text-disabled`, 11px labels.
- FAB: 56px, `bg-wardro-primary-dark`, white icon, `shadow-fab`, 20px from the
  right, above the tab bar.
- Three tabs now: Today, Closet, Profile; Create/Calendar are phased in.

Existing: `app/(root)/(tabs)/_layout.tsx`.

## Empty, loading and error states

- Empty: `EmptyView` — soft olive circle icon, `text-title` heading,
  `text-small` message, one action.
- Loading: centered `ActivityIndicator` in `wardro-primary-dark`, optional
  `text-small` message.
- Error: `ErrorView` — `wardro-danger` icon/tint, a short message, a Retry
  action.
- Every empty state must offer the next step (add item, create wardrobe, clear
  filters).

Existing: `mobile-rn/components/StatusViews.tsx`.

## Images

- Garment cards: 4:5, `resizeMode="cover"`, `rounded-card`.
- Hero images: full-width, editorial, dark gradient scrim for white text.
- Placeholder: `bg-wardro-surface-secondary`, olive icon, item initial.
- Loading: keep the placeholder; avoid layout jumps.
- Use the existing `ItemPhoto` / `ItemPhotoPlaceholder` on web and native.

## Dialogs

- Use `ConfirmDialog` for destructive actions.
- Modal surface: white, `rounded-modal` (24px), `shadow-modal`, 20–24px padding.
- Confirm label names the action (“Delete”, “Remove”); cancel is quiet.
- Never use a destructive color for a non-destructive action.

## Accessibility

- Icon-only controls need an accessible label; 44px target.
- Do not rely on color alone for status; pair with text.
- Keep text over images legible with a scrim.
- Maintain contrast per [colors.md](colors.md).

## Do / don’t

- **Do** use `wardro-*` classes and shared components.
- **Do** keep one primary action per screen.
- **Do** prefer borders and whitespace over shadows.
- **Don’t** use purple/blue SaaS accents, neon, or heavy gradients.
- **Don’t** introduce a new radius or spacing value.
- **Don’t** put white text on the light olive (`wardro-primary`).
