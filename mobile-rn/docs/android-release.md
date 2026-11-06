# Android release builds

The app is built for Google Play as a signed **Android App Bundle (AAB)**.
There are two viable paths; this repository is set up for **GitHub Actions**,
because the CI runner already has JDK 17 and the Android SDK.

The app now uses **Expo SDK 54 / React Native 0.81**, targets **API 36** and
requires `minSdkVersion 24`. Increment `android.versionCode` for every Play
upload; the current upload is version code **2**.

## Why GitHub Actions

A local build needs:

- JDK 17 (the current machine has Java 19 and 11, not 17)
- Android command-line tools
- A platform, build-tools and NDK
- A release keystore
- Gradle configured for that SDK

GitHub Actions' `ubuntu-latest` runner has the JDK and Android SDK already. It
also gives a reproducible artifact and keeps the upload key out of the
repository.

## Required GitHub Actions secrets

Create these on `Thirunavukkarasu/wardro` under **Settings → Secrets and
variables → Actions**:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | Base64 of the upload keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias, e.g. `wardro-upload` |
| `ANDROID_KEY_PASSWORD` | Key password |

The workflow is [`.github/workflows/android-release.yml`](../../.github/workflows/android-release.yml).
It only runs manually (`workflow_dispatch`), so ordinary pushes do not spend CI
minutes.

## Create the upload keystore

**Keep this file and its passwords safe.** Google Play uses the upload key to
identify future updates. Losing it means an upload-key reset request.

```bash
mkdir -p "$HOME/.wardro"
chmod 700 "$HOME/.wardro"

keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore "$HOME/.wardro/wardro-upload.keystore" \
  -alias wardro-upload \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Wardro, OU=Mobile, O=Wardro, L=Chennai, ST=Tamil Nadu, C=IN"
```

Set the four secrets with the CLI, reading values from prompts or a protected
local file:

```bash
openssl base64 -A -in "$HOME/.wardro/wardro-upload.keystore" \
  | gh secret set ANDROID_KEYSTORE_BASE64 -R Thirunavukkarasu/wardro

gh secret set ANDROID_KEYSTORE_PASSWORD -R Thirunavukkarasu/wardro
gh secret set ANDROID_KEY_ALIAS -R Thirunavukkarasu/wardro
gh secret set ANDROID_KEY_PASSWORD -R Thirunavukkarasu/wardro
```

Do not commit the keystore, passwords, `android/local.properties`, or generated
native directories.

## Run the build

```bash
gh workflow run "Android release AAB" -R Thirunavukkarasu/wardro
gh run watch -R Thirunavukkarasu/wardro
```

Or open **Actions → Android release AAB → Run workflow** in GitHub.

When it succeeds, download the `wardro-release-aab` artifact. The AAB is at:

```text
mobile-rn/android/app/build/outputs/bundle/release/app-release.aab
```

Upload that file to the Play Console internal-testing track.

## Local build alternative

If you later install the Android toolchain locally:

```bash
cd mobile-rn
npx expo prebuild --platform android --clean
# Add the same signing config using scripts/configure-android-signing.mjs
# with ANDROID_KEYSTORE_PATH and the password variables exported.
cd android
./gradlew bundleRelease
```

This is not available on the current machine until JDK 17, the Android SDK
platform/build-tools/NDK and a release keystore are installed.

## Versioning

`mobile-rn/app.json` holds `version` (user-facing) and `android.versionCode`
(monotonic Play upload number). Increment `versionCode` for every Play upload.
