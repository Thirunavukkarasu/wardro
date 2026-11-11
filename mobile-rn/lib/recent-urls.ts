import AsyncStorage from "@react-native-async-storage/async-storage";

export interface RecentUrl {
  url: string;
  title: string | null;
  visitedAt: number;
}

export const MAX_RECENT = 8;

function keyFor(profileId: number | null): string {
  return `wardro.recent-web.${profileId ?? "default"}`;
}

function normalize(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function getRecentUrls(
  profileId: number | null,
): Promise<RecentUrl[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(profileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentUrl[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export async function recordRecentUrl(
  profileId: number | null,
  url: string,
  title: string | null,
): Promise<void> {
  const normalized = normalize(url);
  if (!normalized) return;

  try {
    const current = await getRecentUrls(profileId);
    const next: RecentUrl[] = [
      {
        url: normalized,
        title: title?.trim() || null,
        visitedAt: Date.now(),
      },
      ...current.filter((entry) => entry.url !== normalized),
    ].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(keyFor(profileId), JSON.stringify(next));
  } catch {
    // History is a convenience; never block the browser on it.
  }
}

export async function clearRecentUrls(profileId: number | null): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(profileId));
  } catch {
    // Ignore storage failures.
  }
}
