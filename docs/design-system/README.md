# Wardro Design System

Status: **foundation implemented 2026-11-05**. This is the visual language for
the React Native app (`mobile-rn`). It is deliberately warm, editorial, and
photo-first: Wardro should feel like a personal fashion assistant, not an
inventory dashboard.

## Brand direction

- Premium fashion/lifestyle, inspired by editorial magazines, Zara and
  Pinterest-style image-led layouts.
- Warm ivory foundations, charcoal text, muted olive actions, sand surfaces,
  taupe accents.
- Clothing photography is the primary visual element.
- Minimal chrome: restrained borders, soft shadows, no neon, no generic SaaS
  purple/blue, no decorative gradients.
- Calm and welcoming, but still easy to scan and operate one-handed.

## Core principles

1. **Photo first.** Garments and outfits dominate; UI recedes.
2. **Warm neutrals, one accent.** Olive for action, taupe for fashion accents.
3. **Semantic tokens, not raw hex.** Components use `wardro-*` Tailwind classes
   or values from `mobile-rn/src/theme/colors.ts`.
4. **Clear hierarchy.** Large editorial headings, quiet metadata, one primary
   action per screen.
5. **Consistent shells.** `AppHeader` for pushed screens, `FormScreen` for forms,
   the same card/button/input language everywhere.
6. **Accessible by default.** 44px touch targets, readable contrast, labels on
   icon-only controls.

## Implementation

The app uses **NativeWind 4.1.10** with **Tailwind CSS 3.3.5** (package ranges:
`nativewind ^4.0.36`, `tailwindcss 3.3.5`). The existing NativeWind v4 preset and
Metro setup are preserved.

| File | Role |
| --- | --- |
| `mobile-rn/src/theme/tokens.json` | Single source of truth for colors, radii, spacing, typography, shadows, sizes |
| `mobile-rn/src/theme/colors.ts` | Typed exports for React Native props and components |
| `mobile-rn/tailwind.config.js` | Maps tokens to semantic Tailwind classes |
| `mobile-rn/app/+html.tsx` | Web page background (charcoal outside the phone frame) |
| `mobile-rn/components/PhoneFrame.tsx` | Web phone frame with the warm canvas |

### Semantic classes

Use these in new code:

```tsx
<View className="flex-1 bg-wardro-background px-gutter">
  <View className="rounded-card border border-wardro-border bg-wardro-surface p-4">
    <Text className="text-heading font-bold text-wardro-text-primary">
      My Closet
    </Text>
    <Text className="mt-2 text-small text-wardro-text-secondary">
      Your personal wardrobe
    </Text>

    <Pressable className="mt-4 rounded-button bg-wardro-primary-dark px-4 py-3">
      <Text className="text-center text-body font-semibold text-wardro-surface">
        Add Clothing
      </Text>
    </Pressable>
  </View>
</View>
```

### Backward-compatible aliases

The app still contains screens using the earlier token names. They now point at
the Wardro palette so the whole app shares one look:

| Legacy | Now maps to |
| --- | --- |
| `brand` / `brand-deep` | `primary-dark` (`#62694B`) |
| `brand-soft` | `primary-light` |
| `canvas` | `background` |
| `surface` | `surface-secondary` |
| `line` | `border` |
| `ink` / `ink-secondary` / `ink-muted` | `text-primary` / `text-secondary` / `text-disabled` |
| `pink` | `accent` (taupe) |
| `success` / `warning` / `danger` | the semantic Wardro values |

New code should use `wardro-*`. The aliases are a migration bridge, not the
long-term API.

### Typography status

`tokens.json` declares the intended stacks — **Inter** for the interface and
**Playfair Display** for editorial headings — with system fallbacks. The font
assets are not bundled yet, so the app currently renders the platform system
face. See [typography.md](typography.md) for the planned font-loading step.

### Light and future dark theme

V1 is light only. All colors are semantic, so a future dark theme can override
the token values (for example via a `dark` class and a second palette) without
rewriting screens. Do not introduce screen-specific colors; add a semantic
token instead.

## Documentation map

| Document | Contents |
| --- | --- |
| [colors.md](colors.md) | Palette, semantic usage, contrast rules |
| [typography.md](typography.md) | Font stacks, scale, weights, hierarchy |
| [spacing.md](spacing.md) | Spacing, radii, shadows, dimensions, icon sizes |
| [components.md](components.md) | Button, input, card, chip, header, form, avatar, tab guidance |
| [screen-layouts.md](screen-layouts.md) | Home, Closet, Outfit Builder, Calendar, Clothing Details |

Screen blueprints and navigation rationale live in
[`../../mobile-rn/docs/design/`](../../mobile-rn/docs/design/README.md) and
[`../../mobile-rn/docs/screen-architecture.md`](../../mobile-rn/docs/screen-architecture.md).

## Migration notes

- The shared shell and primitives (`AppHeader`, `FormScreen`, `CustomButton`,
  `InputField`, `StatusViews`, `CircleAction`, `ProfileAvatar`,
  `ProfileSwitcher`, photo components) use the new tokens.
- Existing semantic classes across screens are mapped to the new palette via
  the backward-compatible aliases.
- Screen-level inline icon colors that still use hexadecimal values should be
  migrated to `wardroColors` as each screen is touched. Do not add new raw hex
  values.
- Do not extend the Flutter reference port on the `flutter-reference` branch as
  part of this design system.
