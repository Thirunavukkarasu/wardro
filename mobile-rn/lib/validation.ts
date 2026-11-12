/**
 * Shared form validation. The API mirrors these rules in its zod schemas, so
 * a value that passes here should also pass server-side.
 */

const NAME_MIN = 2;
const NAME_MAX = 50;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

/** Letters in any script, plus combining marks for scripts that use them. */
const HAS_LETTER = /\p{L}/u;
/** Names may also carry digits (e.g. "Kid 2") but no symbols besides these. */
const NAME_CHARSET = /^[\p{L}\p{M}\p{N} .'’-]+$/u;

export function nameError(value: string, label = "Name"): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < NAME_MIN) {
    return `${label} needs at least ${NAME_MIN} characters.`;
  }
  if (trimmed.length > NAME_MAX) {
    return `${label} must be ${NAME_MAX} characters or fewer.`;
  }
  if (!HAS_LETTER.test(trimmed)) {
    return `${label} must include at least one letter.`;
  }
  if (!NAME_CHARSET.test(trimmed)) {
    return `${label} can only use letters, numbers, spaces, apostrophes and hyphens.`;
  }
  return null;
}

export function emailError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Email is required.";
  if (trimmed.length > EMAIL_MAX) return "That email address is too long.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function passwordError(value: string): string | null {
  if (!value) return "Password is required.";
  if (value.length < PASSWORD_MIN) {
    return `Use at least ${PASSWORD_MIN} characters for your password.`;
  }
  if (value.length > PASSWORD_MAX) {
    return `Keep your password under ${PASSWORD_MAX} characters.`;
  }
  return null;
}

/** Free-text fields such as garment names, where digits and symbols are fine. */
export function textError(
  value: string,
  label: string,
  max = 80,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}

export const FIELD_LIMITS = {
  name: NAME_MAX,
  email: EMAIL_MAX,
  password: PASSWORD_MAX,
  itemName: 80,
} as const;
