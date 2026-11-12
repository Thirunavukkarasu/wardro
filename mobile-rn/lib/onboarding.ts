import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_SEEN_KEY = "wardro.onboarding.seen";

/** Whether the signed-out onboarding carousel has already been shown. */
export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_SEEN_KEY)) === "true";
  } catch {
    // Treat an unreadable store as "not seen": the carousel is harmless.
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
  } catch {
    // Visibility of the carousel is a nicety; never block sign-in on it.
  }
}
