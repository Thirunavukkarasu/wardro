# Wardro — Flutter app

Flutter port of the Wardro wardrobe-management app. This project lives next to
the original React Native app (`../mobile-app`) so both can be run and
compared; nothing in `../mobile-app` was modified.

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

| Endpoint | Used by |
| --- | --- |
| `GET /wardrobes/:userId/summary` | Home stats and per-wardrobe item counts (single request) |
| `GET /wardrobeItems/:wardrobeId` | Wardrobe detail screen |
| `GET /wardrobeItems/user/:userId` | All Items tab |
| `POST /wardrobeItems` | Add item (after the photo is uploaded) |
| `POST /uploads` | Multipart image upload — returns `{ data: { url } }` |
| `GET /uploads/:filename` | Serves the stored image (long cache headers) |
| `POST /wardrobes` | Add wardrobe |
| `DELETE /wardrobeItems/:id` | Delete item + its uploaded photo |
| `DELETE /wardrobes/:id` | Delete wardrobe (cascades its items and their photos) |

The summary/all-items/upload endpoints were added to `../backend` for this app.
The existing routes are unchanged.

Photos are written to `backend/uploads/` (git-ignored, override with
`UPLOAD_DIR`). That is a development store — switch to S3/R2 before deploying,
because most hosts have an ephemeral disk.

## Running

```bash
flutter pub get
flutter run                       # uses the default API URL
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:3000/api
flutter test
flutter analyze
```

`API_BASE_URL` defaults to the ngrok URL the React Native app used, so point it
at your machine while developing locally:

```bash
cd ../backend && bun run dev      # http://localhost:3000/api
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api
```

iOS simulators use the host network directly. On an Android emulator use
`http://10.0.2.2:3000/api`.

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
| iOS | **Pending** — `GoogleService-Info.plist` was not provided |

The Profile screen shows a "Firebase account" badge when the session came from
Firebase, and "Local stub session" when the fallback is active.

Wardrobe data is still keyed to `DEMO_USER_ID` (4). The Firebase identity is
stored as `authId`; mapping Firebase uids to numeric backend users is a
follow-up.

## Configuration

| `--dart-define` | Default | Purpose |
| --- | --- | --- |
| `API_BASE_URL` | ngrok URL from the RN `.env` | Backend base URL incl. `/api` |
| `DEMO_USER_ID` | `4` | User id used for `/wardrobes/:userId` |
| `AUTH_MODE` | `firebase` | `firebase` or `stub` |

## Known gaps

- **Old photos stay blank:** items created before the upload endpoint store
  `blob:` or device-local paths, which cannot be re-rendered. They show the
  placeholder; re-adding the item stores a real URL.
- **Local image store:** `backend/uploads/` is disk-backed. Fine for local
  development; use object storage for anything deployed.
- **Fonts:** the RN app references `font-Jakarta*` classes but ships no Jakarta
  font, so both apps render the system face. Drop Plus Jakarta Sans into
  `assets/fonts/` and register it in `pubspec.yaml` to match the design.
- **OAuth:** the Google button is present but explains that Clerk isn't wired
  up yet, rather than signing in.
