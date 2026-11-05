const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
const envUserId = process.env.EXPO_PUBLIC_USER_ID;
const envHouseholdId = process.env.EXPO_PUBLIC_HOUSEHOLD_ID;
const envProfileId = process.env.EXPO_PUBLIC_PROFILE_ID;

export const DEFAULT_API_URL = normalizeApiBaseUrl(envApiUrl ?? "");
export const DEFAULT_USER_ID = envUserId?.trim() || "dev-user";
export const DEFAULT_HOUSEHOLD_ID = envHouseholdId?.trim() || "dev-family";
export const DEFAULT_PROFILE_ID = envProfileId?.trim() || "dev-profile";

/** Add a scheme when omitted and remove trailing slashes. */
export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "http://localhost:8000";
  }
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}
