# Spacing, dimensions and layout

Wardro uses a small, consistent spatial scale. Prefer the token classes and
reusable shells over screen-specific measurements.

## Spacing scale

| Value | Tailwind | Typical use |
| --- | --- | --- |
| 4px | `gap-1`, `p-1` | Icon-to-label micro spacing |
| 8px | `gap-2`, `p-2` | Inside pills, tight stacks |
| 12px | `gap-3`, `p-3` | Card internals, button groups |
| 16px | `gap-4`, `p-4` | Default card padding, field gap |
| 20px | `px-gutter` | Screen side gutter |
| 24px | `gap-6`, `py-section` | Section separation |
| 32px | `gap-8`, `py-8` | Large section breaks |
| 40px | `gap-10`, `py-10` | Editorial breathing room |

Custom spacing tokens:

- `gutter` = 20px
- `section` = 24px
- `tab-safe` = 120px (bottom padding under the tab bar + FAB)

## Layout conventions

- **Screen padding:** 20px horizontal (`px-gutter`).
- **Tab screens:** bottom padding of 120px so content clears the tab bar and
  FAB (`pb-tab-safe`).
- **Pushed screens:** use `AppHeader` and 20px horizontal gutters; bottom
  padding 32–40px.
- **Cards:** 16px inner padding; list rows 12–16px vertical.
- **Sections:** 24px between major sections; 12–16px between a heading and its
  content.
- **Web:** the app is confined to a 430px phone column (`PhoneFrame`); do not
  build desktop-width layouts.
- **Safe areas:** use `SafeAreaView`/insets for top and bottom; `AppHeader`
  already handles the top inset.

## Border radius

| Token | Value | Tailwind | Use |
| --- | --- | --- | --- |
| Small | 8px | `rounded-sm` | Small tags, compact controls |
| Button | 12px | `rounded-button` | Buttons, inputs |
| Card | 16px | `rounded-card` | Cards, image tiles, sheets |
| Modal | 24px | `rounded-modal` | Dialogs and bottom sheets |
| Pill | 9999px | `rounded-pill` / `rounded-full` | Chips, filters, avatars |

Avoid mixing radii on the same surface. Cards and image tiles use `card`;
buttons and inputs use `button`.

## Shadows

| Token | Tailwind | Use |
| --- | --- | --- |
| Card | `shadow-card` | Cards that need separation from the ivory canvas |
| Modal | `shadow-modal` | Dialogs, sheets |
| FAB | `shadow-fab` | Floating primary action |

Use shadows sparingly. A 1px `wardro-border` is usually enough; avoid stacking
shadow + heavy border + gradient.

## Component dimensions

| Token | Value | Notes |
| --- | --- | --- |
| Button height | 48px | Primary/secondary/outline actions |
| Input height | 48px | Text fields and selectors |
| Avatar | 40px | Profile rail; 40–58px for headers |
| Tab bar | 64px | Three primary tabs |
| FAB | 56px | Camera / add-item action |
| Touch target | 44px | Minimum for any interactive element |

## Icon sizes

| Token | Value | Use |
| --- | --- | --- |
| sm | 16px | Inline metadata, small buttons |
| md | 20px | Form fields, list rows |
| lg | 24px | Primary actions, tabs |
| xl | 32px | Empty states, hero accents |

Icon color follows text: `wardro-text-primary` for active controls,
`wardro-text-secondary` for supporting icons, `wardro-text-disabled` for
placeholders. Use `wardro-surface` for icons on dark olive/danger/success.

## Borders

- Default: 1px `wardro-border` (`#E7E2D8`).
- Prefer borders to shadows for cards.
- Do not use pure black borders; use the warm border token.

## Motion

- Keep transitions short: 150–250ms, ease-out.
- Use opacity/scale changes for presses; avoid elaborate entrances.
- Respect reduced-motion preferences where the platform exposes them.

## Do / don’t

- **Do** use the 20px gutter and 24px section rhythm on every screen.
- **Do** keep primary actions at 48px height and 44px minimum touch targets.
- **Do** use 16px cards and 12px buttons.
- **Don’t** introduce one-off paddings such as 17px or 22px.
- **Don’t** use more than one shadow level on a screen.
