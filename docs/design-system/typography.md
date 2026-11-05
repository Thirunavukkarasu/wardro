# Typography

Wardro’s typography should feel editorial but highly readable. Use a neutral
interface sans for almost everything, and a serif only for a few editorial
moments (Today greeting/hero, onboarding, featured outfit titles).

## Font families

| Role | Preferred stack | Tailwind class | Fallback |
| --- | --- | --- | --- |
| Interface | Inter | `font-sans` | System (`System`, Roboto, San Francisco) |
| Editorial | Playfair Display | `font-serif` | Georgia, Times New Roman, serif |

The stacks are declared in `mobile-rn/src/theme/tokens.json`. Inter and
Playfair Display are **not bundled yet**, so the app currently renders the
platform system face. When the font assets are added, load them once at the
root layout (for example with `expo-font` + `@expo-google-fonts/inter` and
`@expo-google-fonts/playfair-display`) and keep the same token names.

Do not use the serif for buttons, inputs, metadata, or long body copy.

## Scale

| Token | Size / line height | Tailwind class | Use |
| --- | --- | --- | --- |
| Display | 32 / 38, tracking -0.6 | `text-display` | Editorial hero, large onboarding headline |
| Heading | 26 / 32, tracking -0.4 | `text-heading` | Screen titles (“Your Wardrobe”, “My Closet”) |
| Title | 20 / 26, tracking -0.2 | `text-title` | Card titles, modal titles, section leads |
| Body | 15 / 22 | `text-body` | Default body and primary labels |
| Small | 13 / 18 | `text-small` | Supporting copy, metadata, form labels |
| Caption | 11 / 15 | `text-caption` | Eyebrows, pills, uppercase labels |

The legacy screens use explicit sizes such as `text-[15.5px]` and
`text-[26px]`. New work should use the semantic classes above. Migrate legacy
sizes as screens are touched.

## Weights

| Weight | Tailwind | Use |
| --- | --- | --- |
| 400 | `font-normal` | Body copy, supporting text |
| 500 | `font-medium` | Dense UI labels (use sparingly) |
| 600 | `font-semibold` | Labels, buttons, card titles, form labels |
| 700 | `font-bold` | Screen headings, emphasis |
| 800 | `font-extrabold` | Display headings only |

Keep to three weights per screen. Avoid faux-bold: if a custom family is
loaded, use the matching weight file rather than relying on synthesis.

## Hierarchy rules

1. **One dominant heading per screen.** Today’s editorial greeting/outfit is
   the exception; the rest of the screen steps down quickly.
2. **Metadata is quiet.** Brand, category, price and counts use
   `text-small`/`text-caption` in `text-wardro-text-secondary` or
   `text-wardro-text-disabled`.
3. **Uppercase only for short eyebrows.** Use `tracking-[1px]` and
   `text-caption`; never uppercase long copy.
4. **Line height matters.** Headings use tight line heights (1.15–1.25); body
   copy uses 1.4–1.5.
5. **Numbers align.** Prices and counts should be right-aligned or
   tabular-looking where practical.

## Color pairing

- Headings and body: `text-wardro-text-primary`.
- Supporting copy: `text-wardro-text-secondary`.
- Placeholders/disabled: `text-wardro-text-disabled`.
- White text is only used on `wardro-primary-dark`, `wardro-danger`,
  `wardro-success`, and the charcoal backdrop. Never white on
  `wardro-primary`.

## Examples

```tsx
<Text className="text-caption font-bold uppercase tracking-[1px] text-wardro-text-secondary">
  TODAY
</Text>
<Text className="text-heading font-bold text-wardro-text-primary">
  Your Wardrobe
</Text>
<Text className="mt-1 text-small text-wardro-text-secondary">
  1 collection · 1 item
</Text>
```

```tsx
<Text className="font-serif text-display text-wardro-text-primary">
  Curated for today
</Text>
```

## Font loading status

- Declared tokens: `font-sans` → Inter, `font-serif` → Playfair Display.
- Bundled today: **system fonts only**.
- Next step: add the font packages/assets, call `useFonts` at the root, and
  gate the first render until fonts are ready. This should be a single,
  isolated change; do not replace the token names.
