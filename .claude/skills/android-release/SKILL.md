---
name: android-release
description: Build a signed Android AAB from mobile-rn, verify it, and publish it to Google Play internal testing with Kimi WebBridge. Use for release builds, version-code bumps, and Play publication.
---

# Android release and Play publish

## Preconditions

- Work from the repository root on `main` (or a release branch the user
  names). Check `git status`; the tree must be clean before building.
- The signed AAB workflow uses the repository secrets
  (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
  `ANDROID_KEY_PASSWORD`). Never print them.
- The AAB is signed with the Play upload key. Do not replace it with an
  EAS-managed APK when publishing to Play.
- Publishing to Play is outward-facing. Only click the final **Save and
  publish** when the user has explicitly asked to publish this release; ask
  otherwise.

## 1. Bump the version code

Edit `mobile-rn/app.json` → `expo.android.versionCode` to the next integer.
Version names stay `1.0.0` unless the user asks otherwise.

```sh
git add mobile-rn/app.json
git commit -m "chore(mobile-rn): bump Android version code to <N>"
git push origin main
```

## 2. Build the AAB

```sh
gh workflow run "Android release AAB" --ref main
gh run list --workflow android-release.yml --limit 1
```

Watch the run:

```sh
gh run watch <run-id> --exit-status --interval 15
```

The build takes roughly 15–25 minutes. It uploads the artifact
`wardro-release-aab`.

## 3. Download and verify

```sh
rm -rf /tmp/wardro-aab
mkdir -p /tmp/wardro-aab
gh run download <run-id> -n wardro-release-aab -D /tmp/wardro-aab
cp /tmp/wardro-aab/app-release.aab ~/Downloads/wardro-release-v<N>.aab
```

Verify the bundle contains the production API URL and build metadata:

```sh
unzip -p /tmp/wardro-aab/app-release.aab base/assets/index.android.bundle \
  | strings | grep -E 'wardro-api-251900114942|github-aab|EXPO_PUBLIC'
```

Check the deployed API is healthy:

```sh
curl -sS -o /dev/null -w '%{http_code}\n' \
  https://wardro-api-251900114942.asia-south1.run.app/api/healthcheck
```

## 4. Publish to Play internal testing

Use the `kimi-webbridge` skill with the user's logged-in browser. The app is:

- Developer account: **Thirunavukkarasu M**
- App: **Wardro** (`com.thirunavukkarasu.mycloset`)
- Track: **Internal testing**

Steps:

1. Open Play Console → Wardro → **Testing → Internal testing**.
2. Click **Create new release**.
3. Upload the downloaded `wardro-release-v<N>.aab`.
4. Wait for the bundle optimization to finish; confirm the version code is
   `<N>` and the version name is `1.0.0`.
5. Add release notes under the default language, for example:
   `<en-GB>` / a one-line summary / `</en-GB>`.
6. Click **Next** → review the warning (a missing deobfuscation file is
   non-blocking) → **Save and publish**.
7. Confirm the dialog and wait for “Available to internal testers”.

Report the run URL, the local AAB path, the version code, and the Play release
state. Do not claim success until the Play page shows the new version.

## Notes

- Play rejects a reused version code; always bump it.
- A brand-new app may require the first AAB and app-content declarations to be
  uploaded manually in Play Console.
- The EAS `preview` APK uses a different signing key; it is for direct install,
  not Play publication.
- Related: `.github/workflows/android-release.yml`, `mobile-rn/eas.json`,
  `docs/features.md`.
