import tokens from "./tokens.json";

/**
 * Wardro design tokens.
 *
 * `tokens.json` is the single source of truth shared with `tailwind.config.js`.
 * Prefer the semantic Tailwind classes (`bg-wardro-primary-dark`,
 * `text-wardro-text-primary`, …) in components; use these values for React
 * Native props that do not accept classes (icons, activity indicators,
 * shadows, native stack options).
 */
export const wardroTheme = tokens;
export const wardroColors = tokens.colors;
export const wardroRadius = tokens.radius;
export const wardroSpacing = tokens.spacing;
export const wardroFontFamily = tokens.fontFamily;
export const wardroFontSize = tokens.fontSize;
export const wardroFontWeight = tokens.fontWeight;
export const wardroShadows = tokens.shadows;
export const wardroSizes = tokens.sizes;
export const wardroIconSizes = tokens.iconSizes;

/**
 * The original default profile colour (indigo). Kept only to normalize rows
 * created before the Warm Neutral palette; do not use for new UI.
 */
export const legacyIndigoProfileColor = "#4f46e5";

export type WardroColor = keyof typeof tokens.colors;
export type WardroIconSize = keyof typeof tokens.iconSizes;

/** Profile avatar palette, in recommended order. */
export const wardroProfileColors = [
  wardroColors.primaryDark,
  wardroColors.primary,
  wardroColors.accent,
  wardroColors.success,
  wardroColors.warning,
  wardroColors.danger,
] as const;
