# Colors

Wardro uses a **Warm Neutral + Muted Olive** palette: warm ivory foundations,
charcoal text, olive actions, sand surfaces, and a taupe accent. The palette is
defined once in `mobile-rn/src/theme/tokens.json` and exposed as `wardro-*`
Tailwind classes.

## Brand palette

| Token | Hex | Tailwind class | Use |
| --- | --- | --- | --- |
| Primary olive | `#858B68` | `wardro-primary` | Brand accents, icons, decorative marks, selected backgrounds (not white-text buttons) |
| Dark olive | `#62694B` | `wardro-primary-dark` | Primary buttons with white text, active tabs, high-emphasis actions |
| Light olive | `#E9EBDD` | `wardro-primary-light` | Selected states, soft icon backgrounds, subtle highlights |
| Accent taupe | `#B8A58A` | `wardro-accent` | Fashion accent, editorial details, secondary emphasis |

## Backgrounds and surfaces

| Token | Hex | Tailwind class | Use |
| --- | --- | --- | --- |
| Background | `#F8F6F1` | `wardro-background` | Main screen background |
| Surface | `#FFFFFF` | `wardro-surface` | Cards, modals, sheets, tab bar |
| Surface secondary | `#F0EDE5` | `wardro-surface-secondary` | Inputs, image placeholders, secondary sections |
| Border | `#E7E2D8` | `wardro-border` | Dividers and card/input borders |

## Typography colors

| Token | Hex | Tailwind class | Use |
| --- | --- | --- | --- |
| Text primary | `#252525` | `wardro-text-primary` | Headings, body, primary icons |
| Text secondary | `#77766F` | `wardro-text-secondary` | Supporting copy, metadata |
| Text disabled | `#AAA79F` | `wardro-text-disabled` | Placeholders, disabled controls, inactive icons |

## Semantic colors

| Token | Hex | Tailwind class | Use |
| --- | --- | --- | --- |
| Success | `#66846B` | `wardro-success` | Saved, completed, positive status |
| Warning | `#C18A48` | `wardro-warning` | Low-use nudges, warnings, attention |
| Danger | `#B85C50` | `wardro-danger` | Destructive actions, errors |

## Usage rules

### Buttons and actions

- **Primary buttons:** `bg-wardro-primary-dark` with `text-wardro-surface`
  (white). This is the only olive that guarantees readable white text.
- **Secondary buttons:** `bg-wardro-text-secondary` with white/ivory text, or a
  bordered `wardro-surface` button for a quieter action.
- **Outline buttons:** transparent background, `border-wardro-border`,
  `text-wardro-text-primary`.
- **Danger:** `bg-wardro-danger` with white text. Always confirm destructive
  actions.
- Do not put white text on `wardro-primary` (`#858B68`); its contrast is too
  low. Use `primary-dark` for text-bearing surfaces and `primary` for icons or
  decoration.

### Surfaces

- Screens use `bg-wardro-background`.
- Cards, sheets, tab bars and modals use `bg-wardro-surface` with a
  `border-wardro-border` hairline.
- Inputs and image placeholders use `bg-wardro-surface-secondary`.
- Avoid stacking more than one shadow level; prefer a hairline border.

### Text

- Headings: `text-wardro-text-primary`.
- Supporting copy and metadata: `text-wardro-text-secondary`.
- Placeholders and disabled labels: `text-wardro-text-disabled`.
- Status text uses the matching semantic color, but prefer a small pill rather
  than coloring a whole row.

### Accent

`wardro-accent` (taupe) is a fashion accent, not an action color. Use it for
small editorial details, profile avatars, dividers with character, or a
highlighted label. Keep it sparing.

## Profile avatars

Profile avatars use a user-selected color from `wardroProfileColors`:

```
primaryDark → primary → accent → success → warning → danger
```

Initials are white; the active profile gets a `border-wardro-primary` ring.
Do not add arbitrary profile colors outside this set.

## Backward-compatible aliases

Existing screens still use `brand`, `canvas`, `surface`, `line`, `ink`, `pink`,
`success`, `warning` and `danger`. Tailwind maps them to the Wardro palette:

| Alias | Maps to |
| --- | --- |
| `brand` / `brand-deep` | `primary-dark` |
| `brand-soft` | `primary-light` |
| `canvas` | `background` |
| `surface` | `surface-secondary` |
| `line` | `border` |
| `ink` | `text-primary` |
| `ink-secondary` | `text-secondary` |
| `ink-muted` | `text-disabled` |
| `pink` | `accent` |
| `success` / `warning` / `danger` | semantic Wardro values |

New code should use `wardro-*`. Do not add a new raw hex value to a component;
add a semantic token to `tokens.json` instead.

## Contrast notes

- `wardro-text-primary` on `wardro-background` and `wardro-surface`: strong.
- White on `wardro-primary-dark`: strong.
- `wardro-text-secondary` on white/ivory: readable for supporting text.
- `wardro-text-disabled` is for non-essential text only, never for required
  information.
- White on `wardro-primary` is not acceptable for text; use it for icons or
  decorative shapes only.

## Source of truth

```
mobile-rn/src/theme/tokens.json   ← values
mobile-rn/tailwind.config.js      ← semantic classes
mobile-rn/src/theme/colors.ts     ← typed values for JS props
```

Do not duplicate the palette in screen files. If a new semantic color is
needed, document it here and add it to the token file.
