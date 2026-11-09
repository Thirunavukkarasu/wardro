import Constants from "expo-constants";

import { apiBaseUrl } from "~/lib/firebase-config";

function formatBuiltAt(value: string | undefined): string {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const versionName = Constants.expoConfig?.version ?? "unknown";
const versionCode =
  Constants.expoConfig?.android?.versionCode ??
  Constants.expoConfig?.ios?.buildNumber;

/**
 * Values baked into the installed build. Keep these references to
 * `process.env.EXPO_PUBLIC_*` literal so Expo inlines them at bundle time.
 */
export const buildInfo = {
  versionName,
  versionCode: versionCode ? String(versionCode) : null,
  versionLabel: versionCode ? `${versionName} (${versionCode})` : versionName,
  profile:
    process.env.EXPO_PUBLIC_BUILD_PROFILE ||
    (__DEV__ ? "development" : "unknown"),
  builtAt: formatBuiltAt(process.env.EXPO_PUBLIC_BUILD_TIME),
  gitSha: process.env.EXPO_PUBLIC_GIT_SHA?.slice(0, 7) || "Not recorded",
  apiBaseUrl,
  packageId:
    Constants.expoConfig?.android?.package ??
    Constants.expoConfig?.ios?.bundleIdentifier ??
    "unknown",
  runtime: String(Constants.executionEnvironment),
};
