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
| Wardrobe detail / item list | `lib/features/wardrobe/wardrobe_items_screen.dart` |
| Item card (shared) | `lib/features/items/widgets/item_card.dart` |
| Loading / error / empty states | `lib/shared/widgets/status_views.dart` |
| Counts and state pills | `lib/shared/widgets/app_pill.dart` |

## Backend endpoints used

| Endpoint | Used by |
| --- | --- |
| `GET /wardrobes/:userId/summary` | Home stats and per-wardrobe item counts (single request) |
| `GET /wardrobeItems/:wardrobeId` | Wardrobe detail screen |
| `GET /wardrobeItems/user/:userId` | All Items tab |
| `POST /wardrobes`, `POST /wardrobeItems` | Add wardrobe / add item |

The two read endpoints above were added to `../backend` for this app; they only
read data and leave the existing routes untouched.

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

## Authentication

Auth is **stubbed** for now (`StubAuthService`):

- any email/password signs in,
- sign-up accepts any 6-digit verification code,
- the session is persisted with `shared_preferences`.

The screens never touch the stub directly — they go through `AuthService` /
`AuthController` (`lib/features/auth/`). To switch to Clerk:

1. Add the SDK: `flutter pub add clerk_flutter` (community-maintained beta,
   requires Flutter >= 3.27.4).
2. Implement `AuthService` in `lib/features/auth/clerk_auth_service.dart` using
   `ClerkAuth.of(context).attemptSignIn` / `attemptSignUp` / `sessionToken`,
   and persist the session token in `flutter_secure_storage`.
3. Select it in `lib/main.dart` instead of `StubAuthService`.

No backend change is needed: the token from `clerk_flutter` is the same Clerk
JWT that `@clerk/backend` already verifies. Add it to requests in
`lib/core/network/api_client.dart`.

## Configuration

| `--dart-define` | Default | Purpose |
| --- | --- | --- |
| `API_BASE_URL` | ngrok URL from the RN `.env` | Backend base URL incl. `/api` |
| `DEMO_USER_ID` | `4` | User id used for `/wardrobes/:userId` |
| `AUTH_MODE` | `stub` | Reserved for the Clerk implementation |

## Known gaps

- **No image upload endpoint:** `photoUri` is stored as an opaque string, so a
  device-local path is sent as-is. Uploading bytes to storage is a backend
  change, not a client one.
- **No "all items" endpoint:** the backend only exposes items per wardrobe
  (`GET /wardrobeItems/:wardrobeId`), so the Wardrobes tab mirrors the RN
  screen's empty state.
- **Fonts:** the RN app references `font-Jakarta*` classes but ships no Jakarta
  font, so both apps render the system face. Drop Plus Jakarta Sans into
  `assets/fonts/` and register it in `pubspec.yaml` to match the design.
- **OAuth:** the Google button is present but explains that Clerk isn't wired
  up yet, rather than signing in.
