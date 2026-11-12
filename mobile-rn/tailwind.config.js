const { hairlineWidth } = require("nativewind/theme");
const tokens = require("./src/theme/tokens.json");

const { colors, radius, spacing, fontFamily, fontSize, fontWeight, shadows } =
  tokens;
const iconSizes = Object.fromEntries(
  Object.entries(tokens.iconSizes).map(([key, value]) => [
    `icon-${key}`,
    `${value}px`,
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Wardro semantic tokens — use these in all new code.
        wardro: {
          background: colors.background,
          surface: colors.surface,
          "surface-secondary": colors.surfaceSecondary,
          primary: colors.primary,
          "primary-dark": colors.primaryDark,
          "primary-light": colors.primaryLight,
          accent: colors.accent,
          text: {
            primary: colors.text.primary,
            secondary: colors.text.secondary,
            disabled: colors.text.disabled,
          },
          border: colors.border,
          danger: colors.danger,
          success: colors.success,
          warning: colors.warning,
        },

        // Backward-compatible aliases for screens that have not migrated yet.
        // They point at the Wardro palette so the whole app shares one look.
        brand: {
          DEFAULT: colors.primaryDark,
          deep: colors.primaryDark,
          soft: colors.primaryLight,
        },
        pink: colors.accent,
        canvas: colors.background,
        surface: colors.surfaceSecondary,
        line: colors.border,
        ink: {
          DEFAULT: colors.text.primary,
          secondary: colors.text.secondary,
          muted: colors.text.disabled,
        },
        success: colors.success,
        warning: colors.warning,
        danger: colors.danger,

        // shadcn/radix tokens used by the legacy components/ui primitives.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: radius,
      spacing,
      fontFamily: { ...fontFamily, serif: fontFamily.sans },
      fontSize,
      fontWeight,
      boxShadow: shadows,
      width: {
        ...iconSizes,
        avatar: `${tokens.sizes.avatar}px`,
        fab: `${tokens.sizes.fab}px`,
      },
      height: {
        ...iconSizes,
        avatar: `${tokens.sizes.avatar}px`,
        fab: `${tokens.sizes.fab}px`,
      },
      minWidth: {
        touch: `${tokens.sizes.touchTarget}px`,
      },
      minHeight: {
        touch: `${tokens.sizes.touchTarget}px`,
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
