# Wardro — Flutter app

Flutter port of the Wardro wardrobe-management app. This project lives next to
the original React Native app (`../mobile-rn`) so both can be run and
compared; nothing in `../mobile-rn` was modified.

## Status

Screens ported from the Expo app, plus a few additions:

| React Native | Flutter |
| --- | --- |
| `app/(auth)/welcome.tsx` | `lib/features/auth/welcome_screen.dart` |
| `app/(auth)/sign-in.tsx` | `lib/features/auth/sign_in_screen.dart` |
| `app/(auth)/sign-up.tsx` | `lib/features/auth/sign_up_screen.dart` |
| `app/(root)/(tabs)/home.tsx` | `lib/features/home/home_screen.dart` |
| `app/(root)/(tabs)/wardrobes.tsx` | `lib/features/wardrobes/all_items_screen.dart` |
| `app/(root)/(tabs)/profile.tsx` | `lib/features/profile/profile_screen.dart` |
| `app/(root)/add-wardrobe.tsx` | `lib/features/wardrobe/add_wardrobe_screen.dart` |
| `app/(root)/add-wardrobe-items.tsx` | `lib/features/items/add_item_screen.dart` |
| `components/CustomButton.tsx` | `lib/shared/widgets/app_button.dart` |
| `components/InputField.tsx` | `lib/shared/widgets/app_text_field.dart` |
| `components/CameraComponent.tsx` | `lib/shared/widgets/photo_capture_field.dart` |
| `components/DatePicker.tsx` | `lib/shared/widgets/app_date_field.dart` |
| `app/(root)/(tabs)/_layout.tsx` | `lib/shared/widgets/main_shell.dart` |

Additions not in the React Native app:

| Screen | File |
| --- | --- |
| Wardrobe detail / item photo grid | `lib/features/wardrobe/wardrobe_items_screen.dart` |
| Item detail (photo hero + details) | `lib/features/items/item_detail_screen.dart` |
| Photo tile (shared) | `lib/features/items/widgets/item_photo_tile.dart` |
| Photo renderer with placeholder | `lib/shared/widgets/item_photo.dart` |
| Loading / error / empty states | `lib/shared/widgets/status_views.dart` |
| Counts and state pills | `lib/shared/widgets/app_pill.dart` |

## Backend endpoints used

Every request except `GET /healthcheck` carries
`Authorization: Bearer <Firebase ID token>`. The backend verifies it and derives
the user — **no endpoint accepts a user id from the client**.

| Endpoint | Used by |
| --- | --- |
| `GET /wardrobes/summary` | Home stats: per-wardrobe item count, total value and cover (single request) |
| `GET /wardrobes` | Wardrobe picker in Add Item |
| `GET /wardrobeItems/:wardrobeId` | Wardrobe detail screen (ownership checked) |
| `GET /wardrobeItems` | All Items tab |
| `POST /wardrobeItems` | Add item (after the photo is uploaded) |
| `POST /wardrobes` | Add wardrobe |
| `DELETE /wardrobeItems/:id` | Delete item + its uploaded photo (ownership checked) |
| `DELETE /wardrobes/:id` | Delete wardrobe (cascades its items and their photos) |
| `GET /users/me` | Current user row (informational) |

Identity is verified with `jose` against Google's public JWKS, so **no service
account key is required**. The uid is upserted into the SQL Connect `user` table
on first request (`backend/src/auth.ts`).

Photos are uploaded **directly from the app to Firebase Storage** under
`users/{uid}/items/...` (see `ApiClient.uploadPhoto`); the returned download URL
is stored as `photoUri`. The backend deletes the object when its item or
wardrobe is deleted.

## Running

```bash
flutter pub get
flutter run                       # uses the default API URL
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000/api
flutter test
flutter analyze
```

`API_BASE_URL` defaults to the App Hosting deployment. Point it at your machine
while developing locally:

```bash
cd ../backend && bun run dev      # http://localhost:3000/api
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api
```

iOS simulators use the host network directly. On an Android emulator use
`http://10.0.2.2:3000/api`.

## Design system

One base colour, used across the app and the marketing site.

| Token | Value |
| --- | --- |
| Primary (indigo) | `#4F46E5` |
| Accent (pink, highlights only) | `#EC4899` |
| Canvas / cards / borders | `#F7F7FB` / `#FFFFFF` / `#E7E8EF` |
| Text primary / secondary / muted | `#0F172A` / `#64748B` / `#94A3B8` |
| Success / warning / danger | `#16A34A` / `#D97706` / `#DC2626` |

Typography is intentionally compact: 26/22/20 for headings, 15 body, 13–14
labels, 12.5 secondary, 10.5 uppercase eyebrows.

Layout: a Material 3 bottom bar (**Home / Items / Profile**) with labels, plus
a camera FAB as the app's single primary action. Data-heavy screens lead with
a compact summary strip (wardrobes · items · value) before the content.

Tokens live in `lib/core/theme/app_colors.dart` and `app_theme.dart`; the
marketing site's `--primary` in `website/src/app/globals.css` matches.

## Web presentation

The web build always renders in mobile mode. `MobileFrame`
(`lib/shared/widgets/mobile_frame.dart`) wraps `MaterialApp.builder`, so every
route, dialog and snackbar is confined to a **393 px** column (iPhone 15 Pro
logical width) centred on a dark backdrop. On windows narrower than 560 px —
phones, tablets in portrait, narrow browser windows — it renders edge to edge
with no frame.

Because the frame constrains the viewport, the responsive grids collapse to two
columns and `MediaQuery.sizeOf` reports phone dimensions. Change
`MobileFrame.maxWidth` (or `_compactBreakpoint`) to adjust the target device.
`web/index.html` sets the matching viewport meta and page background.

## Authentication

Auth runs on **Firebase Authentication** (email + password), with an automatic
fallback to the local stub when Firebase is not configured.

- `AUTH_MODE=firebase` (default): initialises Firebase from
  `lib/firebase_options.dart`. If the platform's `apiKey`/`appId` are missing
  or initialisation fails, it logs a warning and uses the stub so the app
  still starts.
- `AUTH_MODE=stub`: any email/password signs in, no network required.

Sign-up creates the Firebase account, signs the user in immediately, sets the
display name and sends a verification **link**. Firebase does not issue
6-digit codes, so the old code dialog was replaced by a "Verify your email"
dialog with Resend / Continue; verification never blocks usage.

### Firebase project `wardo-ce8d5`

| Platform | Status |
| --- | --- |
| Android | `android/app/google-services.json` in place, applicationId `com.om.wardo`, Google Services Gradle plugin applied |
| Web | Registered (`1:251900114942:web:6d482f04b8b02cc63372af`), Email/Password provider enabled, config in `lib/firebase_options.dart` |
| iOS | **Out of scope** — see the scope decisions below |

The Profile screen shows a "Firebase account" badge when the session came from
Firebase, and "Local stub session" when the fallback is active.

### Google sign-in

Enabled in the Firebase project. The client flow is:

- **Web:** `FirebaseAuth.signInWithPopup(GoogleAuthProvider())`.
- **Android:** `google_sign_in` `authenticate()` → ID token →
  `FirebaseAuth.signInWithCredential(...)`, using the web OAuth client ID from
  `firebase_options.dart` (`googleServerClientId`).

Requirements already met: the Google provider is enabled and the web/Android
apps are registered. When running on Android, make sure the debug keystore's
**SHA-1/SHA-256** is registered under Project settings → Your Android app,
otherwise Google returns `ApiException: 10`. On web, `localhost` must be in
Authentication → Settings → Authorized domains (Firebase adds it by default).

## Scope decisions

Tracked here so the context isn't lost.

| Item | Decision | Needed to resume |
| --- | --- | --- |
| iOS app | **Out of scope for now** (2026-11-02) | Register the iOS app with bundle ID `com.thirunavukkarasu.wardroMobile`, drop `GoogleService-Info.plist` into `ios/Runner/`, then add iOS options to `firebase_options.dart` |
| Google sign-in | **Working** — verified 2026-11-02 (web) | Android still needs the debug keystore SHA-1/SHA-256 registered |
| Backend auth enforcement | **Working** — Firebase ID token verified via JWKS in `backend/src/auth.ts` | — |
| Per-user data | **Working** — uid scopes every SQL Connect operation via `auth.uid` | — |
| Image storage | **Working** — Firebase Storage, `users/{uid}/items/...` | — |

### Database

The app now uses **Firebase SQL Connect** on Cloud SQL Postgres. The schema and
typed operations live in the repo root under `dataconnect/`; the backend talks
to them with the generated Admin SDK. The old Neon/Drizzle migrations have been
retired.


## Configuration

| `--dart-define` | Default | Purpose |
| --- | --- | --- |
| `API_BASE_URL` | App Hosting URL + `/api` | Backend base URL incl. `/api` |
| `AUTH_MODE` | `firebase` | `firebase` or `stub` |

## Known gaps

- **Fonts:** the RN app references `font-Jakarta*` classes but ships no Jakarta
  font, so both apps render the system face. Drop Plus Jakarta Sans into
  `assets/fonts/` and register it in `pubspec.yaml` to match the design.
- **OAuth:** Google sign-in runs through Firebase (popup on web, native on
  Android). The button reports configuration errors such as
  `unauthorized-domain` when the domain is not allow-listed.
