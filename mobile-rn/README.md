# Wardro — React Native app

The primary Wardro client: Expo (SDK 51) + Expo Router, Firebase
Authentication, Firebase Storage, and the Hono backend. It replaces Clerk and
the old `userId`-in-the-body API with the same Firebase-ID-token model the
Flutter port (`../mobile`) used.

## Running

```bash
npm install
npm run web          # http://localhost:8081
npm start            # dev build (iOS / Android)
npm run ios
npm run android
npx tsc --noEmit     # typecheck
npx expo export --platform web   # bundle check
```

The app defaults to the deployed backend. For local development create
`.env` from `.env.example` and point `EXPO_PUBLIC_API_URL` at
`http://localhost:3000/api` (use `http://10.0.2.2:3000/api` on an Android
emulator).

## Configuration

Every value is public client configuration and is embedded in the bundle.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Hono backend base URL, including `/api` |
| `EXPO_PUBLIC_FIREBASE_*` | Firebase web app config for project `wardo-ce8d5` |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | OAuth web client used by web popup sign-in |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | OAuth client for native Google sign-in on Android |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | OAuth client for iOS (not registered yet) |

Defaults live in `lib/firebase-config.ts`, so the app runs without a `.env`
against project `wardo-ce8d5`.

## Authentication

Identity is owned by Firebase; the app never sends a user id.

- **Email / password** — `lib/auth-context.tsx` wraps
  `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`. Sign-up
  sets the display name and sends a verification **link** (not a 6-digit
  code). The dialog offers Resend / Continue, and verification never blocks
  use of the app.
- **Google on web** — `signInWithPopup(GoogleAuthProvider())`.
- **Google on native** — `expo-auth-session` requests a Google ID token, then
  exchanges it with `signInWithCredential`. The redirect scheme is
  `myapp://oauthredirect` (declared as `scheme` in `app.json`).
- **Session restore** — native persists the session in AsyncStorage
  (`initializeAuth` + `getReactNativePersistence`); web uses the SDK's
  IndexedDB/localStorage persistence. The root layout shows a splash until
  `onAuthStateChanged` settles.

Every API request attaches `Authorization: Bearer <Firebase ID token>`; the
backend verifies it against Google's JWKS (`backend/src/auth.ts`).

### Native Google sign-in setup

The web client ID works for web. For Android, register an **Android OAuth
client** in the Firebase project with this app's package name
(`com.thirunavukkarasu.mycloset`) and the debug/release SHA-1, then put its ID
in `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and rebuild the dev client. The
current default Android client belongs to the Flutter app (`com.om.wardo`),
so native Google sign-in will report `invalid_client` until a client for this
package exists. iOS has no registered client yet; the app shows a clear
message instead of prompting.

## Screens

| Route | Purpose |
| --- | --- |
| `app/(auth)/welcome.tsx` | Onboarding pager |
| `app/(auth)/sign-in.tsx` | Email/password + Google |
| `app/(auth)/sign-up.tsx` | Account creation + verification-link dialog |
| `app/(root)/(tabs)/today.tsx` | Dashboard: greeting, summary, quick actions, recent items, wardrobe preview |
| `app/(root)/(tabs)/closet.tsx` | Searchable, category/wardrobe-filterable garment grid + manage-collections entry |
| `app/(root)/(tabs)/profile.tsx` | Account details and sign-out |
| `app/(root)/wardrobes.tsx` | Manage collections (pushed screen) |
| `app/(root)/add-wardrobe.tsx` | Create or edit a wardrobe |
| `app/(root)/add-wardrobe-items.tsx` | Photo-first garment create/edit |
| `app/(root)/add-profile.tsx` | Create or edit a profile |
| `app/(root)/wardrobe/[id].tsx` | One wardrobe's photo grid, edit and delete |
| `app/(root)/item/[id].tsx` | Item hero, details, edit and delete |

Navigation currently uses three bottom tabs — **Today / Closet / Profile** —
with the camera FAB as the global add-item action. There is deliberately no
hamburger drawer: primary destinations stay visible and thumb-reachable.
`app/(root)/(tabs)/_layout.tsx` owns the tab bar and FAB.

The agreed target adds **Create** and **Calendar** as those features ship. See
[`docs/screen-architecture.md`](docs/screen-architecture.md) for the full
screen inventory, principles, migration plan, and rationale.

**Multi-profile support is implemented:** one account owns several profiles,
Today shows a profile rail, and the Profile tab manages them. Every wardrobe,
item and API request is scoped to the active profile via `X-Profile-Id`. See
[`docs/multi-profile.md`](docs/multi-profile.md) for the model, schema, API and
migration details.

Visual direction, per-screen blueprints, reusable component specs, and the
reference images that informed them are in
[`docs/design/README.md`](docs/design/README.md).

Every pushed screen uses the shared `components/AppHeader.tsx` (44px back
target, title, optional right action). Add forms use
`components/FormScreen.tsx` for a fixed header, scrollable content and a sticky
action footer that lifts with the keyboard. On web,
`components/PhoneFrame.tsx` confines the app to a 430px column, matching the
Flutter `MobileFrame`.

## Roadmap

The agreed target IA, screen inventory, and migration steps live in
[`docs/screen-architecture.md`](docs/screen-architecture.md). In execution
order:

1. **Navigation shell** — shared headers/back buttons, sticky form footers. ✅
2. **Search & filters** — text search plus category/wardrobe chips in Closet. ✅
3. **Closet consolidation** — Home → Today; Wardrobes + Items merged into one
   Closet tab, with collections moved to a pushed management screen. ✅
4. **Edit items & wardrobes** — pre-filled edit modes, photo replacement, and
   ownership-checked `PATCH` endpoints. ✅
5. **Multi-profile foundation** — household account, default profile,
   profile-scoped API, Today switcher, Profile management and cascade delete. ✅
6. **Favorites & wear tracking** — favourite flags and wear logs; the data
   foundation for analytics and suggestions.
7. **Create** — outfit builder + saved library; becomes the prominent middle
   tab when real. Calendar starts as a segment inside Create.
8. **Calendar** — promote outfit planning to a tab when it is substantial.
9. **Weather, suggestions & analytics** — Today cards plus a full analytics
   screen, backed by wear data and an opt-in weather location.

## Backend endpoints used

Every request carries the Firebase ID token.

Wardrobe/item requests also send `X-Profile-Id`; `/profiles` is account-level.

| Endpoint | Used by |
| --- | --- |
| `GET /profiles` | Profile rail + Profile management (ensures a default profile) |
| `POST /profiles` | Add profile |
| `PATCH /profiles/:id` | Edit profile name/colour |
| `DELETE /profiles/:id` | Delete profile (cascade; last profile protected) |
| `GET /wardrobes/summary` | Today stats + covers |
| `GET /wardrobes` | Add/edit-item wardrobe picker |
| `POST /wardrobes` | Add wardrobe |
| `PATCH /wardrobes/:id` | Edit wardrobe name/description |
| `DELETE /wardrobes/:id` | Delete wardrobe (cascades items + photos) |
| `GET /wardrobeItems` | Closet / item-detail refresh |
| `GET /wardrobeItems/:wardrobeId` | Wardrobe detail |
| `POST /wardrobeItems` | Add item |
| `PATCH /wardrobeItems/:id` | Edit item fields and replace its photo |
| `DELETE /wardrobeItems/:id` | Delete item + its photo |

Photos are uploaded directly from the app to Firebase Storage under
`users/{uid}/items/...` (`lib/api.ts`), and the returned download URL is stored
as `photoUri`. Storage rules live in `../storage.rules`.

## Design tokens

Indigo `#4F46E5`, pink accent `#EC4899`, canvas `#F7F7FB`, surface `#F1F2F7`,
border `#E7E8EF`; text `#0F172A` / `#64748B` / `#94A3B8`; status
`#16A34A` / `#D97706` / `#DC2626`. They are registered in
`tailwind.config.js` as `brand`, `pink`, `canvas`, `surface`, `line`, `ink`,
`success`, `warning`, and `danger`.
