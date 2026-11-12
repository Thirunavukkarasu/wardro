/**
 * Firebase project and Google OAuth *client* configuration.
 *
 * These are public identifiers — they ship inside every web bundle and APK —
 * but they are not committed here. Set them in `mobile-rn/.env` for local
 * work; the release workflow reads them from repository variables.
 */

/**
 * Hono backend base URL, including the `/api` prefix.
 *
 * Required: set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`).
 */
function requiredEnv(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `${name} is not set. Copy mobile-rn/.env.example to mobile-rn/.env and set it.`,
    );
  }
  return trimmed.replace(/\/+$/, "");
}

function optionalEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

export const firebaseConfig = {
  apiKey: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    "EXPO_PUBLIC_FIREBASE_API_KEY",
  ),
  authDomain: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  ),
  projectId: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  ),
  messagingSenderId: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  ),
  appId: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    "EXPO_PUBLIC_FIREBASE_APP_ID",
  ),
};

/**
 * Google OAuth *client* IDs (not Firebase app IDs).
 *
 * - `web` is the OAuth web client used by signInWithPopup and as the Firebase
 *   server client.
 * - `android` is registered for this app's package
 *   (`com.thirunavukkarasu.mycloset`) and the Play App Signing certificate.
 *   Add the SHA-1 of any local/EAS build key in Firebase and use that
 *   build's Android client ID if Google sign-in is needed there.
 * - `ios` has no client registered yet; native Google sign-in is unsupported
 *   on iOS until an iOS app/client is added to the Firebase project.
 */
export const googleClientIds = {
  web: requiredEnv(
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
  ),
  android: optionalEnv(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
  ios: optionalEnv(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
};

export const apiBaseUrl = requiredEnv(
  process.env.EXPO_PUBLIC_API_URL,
  "EXPO_PUBLIC_API_URL",
);

/**
 * Agent service base URL (wardro-agent). Use the LAN IP instead of localhost
 * when running against a physical device.
 */
export const agentBaseUrl = requiredEnv(
  process.env.EXPO_PUBLIC_AGENT_URL,
  "EXPO_PUBLIC_AGENT_URL",
);

export const requestTimeoutMs = 20_000;
