export const DEFAULT_CATEGORIES = [
  "Tops",
  "Bottoms",
  "Outerwear",
  "Dresses",
  "Shoes",
  "Accessories",
  "Activewear",
  "Other",
];

export const DEFAULT_COLORS = [
  "Black",
  "White",
  "Grey",
  "Navy",
  "Blue",
  "Indigo",
  "Light blue",
  "Red",
  "Green",
  "Olive",
  "Brown",
  "Tan",
  "Beige",
  "Cream",
  "Yellow",
  "Orange",
  "Pink",
  "Purple",
  "Multi",
];

export const DEFAULT_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "3XL",
  "4XL",
  "Free Size",
  "One size",
  "24",
  "26",
  "28",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
];

export interface ItemOptionValues {
  categories: string[];
  colors: string[];
  sizes: string[];
}

/** Fixed choices first, then values already used in the database. */
export function mergeOptions(
  defaults: string[],
  extra: string[] = [],
  current?: string,
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  const values = current
    ? [current, ...defaults, ...extra]
    : [...defaults, ...extra];

  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    merged.push(trimmed);
  }

  return merged;
}
