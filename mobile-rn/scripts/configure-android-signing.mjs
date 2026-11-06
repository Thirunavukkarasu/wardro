#!/usr/bin/env node
/**
 * Add the upload-key signing config to the generated Android project.
 *
 * `expo prebuild` generates `android/app/build.gradle` with debug signing for
 * the release variant. This script appends a release signing config that reads
 * credentials from environment variables supplied by GitHub Actions. The
 * keystore and passwords are never written into the repository.
 */
import fs from "node:fs";

const gradlePath = "android/app/build.gradle";
const required = [
  "ANDROID_KEYSTORE_PATH",
  "ANDROID_KEYSTORE_PASSWORD",
  "ANDROID_KEY_ALIAS",
  "ANDROID_KEY_PASSWORD",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

let source = fs.readFileSync(gradlePath, "utf8");
const marker = "// Wardro CI release signing";

if (!source.includes(marker)) {
  source += `

${marker}
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("ANDROID_KEYSTORE_PATH"))
            storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias System.getenv("ANDROID_KEY_ALIAS")
            keyPassword System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
`;
  fs.writeFileSync(gradlePath, source);
}

console.log("Configured Android release signing from environment.");
