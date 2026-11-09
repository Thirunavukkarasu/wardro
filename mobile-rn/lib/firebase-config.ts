/**
 * Firebase project `wardo-ce8d5` and backend configuration.
 *
 * These values are public client configuration (they ship inside every web
 * bundle). Override them with `EXPO_PUBLIC_*` variables in `.env` when running
 * against another Firebase project.
 */

export const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDpECg48ZPWHQ3LhozoNpAg8uaP2_y_fik",
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "wardo-ce8d5.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "wardo-ce8d5",
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "251900114942",
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    "1:251900114942:web:6d482f04b8b02cc63372af",
};

/**
 * Google OAuth *client* IDs (not Firebase app IDs).
 *
 * - `web` is the OAuth web client used by signInWithPopup and as the Firebase
 *   server client.
 * - `android` is registered for the Flutter app (`com.om.wardo`). Register a
 *   new Android OAuth client for this app's package name before using native
 *   Google sign-in on Android.
 * - `ios` has no client registered yet; native Google sign-in is unsupported
 *   on iOS until an iOS app/client is added to the Firebase project.
 */
export const googleClientIds = {
  web:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    "251900114942-ntfihbiuu1b7og3t79r79oln1tv4rbgb.apps.googleusercontent.com",
  android:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    "251900114942-r6m4shpo2bat27382vnaaatb2agvm3d5.apps.googleusercontent.com",
  ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
};

/**
 * Hono backend base URL, including the `/api` prefix.
 *
 * Required: set `EXPO_PUBLIC_API_URL` in `.env` (see `.env.example`). There is
 * no built-in deployment URL, so the app fails fast when it is missing.
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

export const apiBaseUrl = requiredEnv(
  process.env.EXPO_PUBLIC_API_URL,
  "EXPO_PUBLIC_API_URL",
);

/**
 * Local FastAPI agent base URL (wardro-agent). Use the LAN IP instead of
 * localhost when running on a physical device.
 */
export const agentBaseUrl =
  process.env.EXPO_PUBLIC_AGENT_URL || "http://localhost:8000";

export const requestTimeoutMs = 20_000;
