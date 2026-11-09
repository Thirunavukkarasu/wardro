import fs from "node:fs";

/**
 * EAS build hook: EAS exposes build metadata as environment variables, but
 * Expo only inlines `EXPO_PUBLIC_*` values. Write them into `.env` before
 * Metro bundles the app, so the About section can show the real build.
 */
const entries = {
  EXPO_PUBLIC_BUILD_PROFILE: process.env.EAS_BUILD_PROFILE,
  EXPO_PUBLIC_GIT_SHA: process.env.EAS_BUILD_GIT_COMMIT_HASH?.slice(0, 7),
  EXPO_PUBLIC_BUILD_TIME: new Date().toISOString(),
};

const lines = Object.entries(entries)
  .filter(([, value]) => value)
  .map(([key, value]) => `${key}=${value}`);

if (lines.length > 0) {
  fs.appendFileSync(
    ".env",
    `\n# Generated at build time by EAS.\n${lines.join("\n")}\n`,
  );
}
