# Wardro — React Native app

The primary Wardro client: Expo (SDK 54) + Expo Router, Firebase
Authentication, Google Cloud Storage (through the API), and the Hono backend.
It replaces Clerk and the old `userId`-in-the-body API with the same
Firebase-ID-token model the Flutter port (`../mobile`) used.

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

The app requires `EXPO_PUBLIC_API_URL`; `.env.example` points at the deployed
backend. For local development create `.env` from `.env.example` and point
`EXPO_PUBLIC_API_URL` at `http://localhost:3000/api` (use
`http://10.0.2.2:3000/api` on an Android emulator).

## Configuration

Every value is public client configuration and is embedded in the bundle.

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Hono backend base URL, including `/api` |
| `EXPO_PUBLIC_AGENT_URL` | Local FastAPI agent base URL (`http://localhost:8000` for web, `10.0.2.2` for an Android emulator, LAN IP for a device) |
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
| `app/(root)/(tabs)/chat.tsx` | Chat with the local LangGraph agent, scoped to the active profile |
| `app/(root)/(tabs)/profile.tsx` | Account details and sign-out |
| `app/(root)/wardrobes.tsx` | Manage collections (pushed screen) |
| `app/(root)/add-wardrobe.tsx` | Create or edit a wardrobe |
| `app/(root)/add-wardrobe-items.tsx` | Photo-first garment create/edit |
| `app/(root)/add-profile.tsx` | Create or edit a profile |
| `app/(root)/wardrobe/[id].tsx` | One wardrobe's photo grid, edit and delete |
| `app/(root)/item/[id].tsx` | Item hero, details, edit and delete |

Navigation currently uses four bottom tabs — **Today / Closet / Chat /
Profile** — with the camera FAB as the global add-item action on Today and
Closet. There is deliberately no hamburger drawer: primary destinations stay
visible and thumb-reachable. `app/(root)/(tabs)/_layout.tsx` owns the tab bar
and FAB.

Chat is a **local-agent pilot**: it calls the FastAPI `wardro-agent` service in
development and uses the active profile for context. The agent can read the
profile's inventory and build text suggestions from real items. The composer's
image button attaches a garment photo; the vision model classifies it and returns
structured attributes. Inventory cards, saving an analyzed item, editing actions
and streaming are next. The longer-term navigation still plans for **Create** and
**Calendar**; their relationship to Chat is an open product decision. See
[`docs/screen-architecture.md`](docs/screen-architecture.md) for the full
screen inventory, principles, migration plan, and rationale.

### Running chat locally

Start the agent service (and Ollama) before opening the Chat tab:

```bash
cd ../wardro-agent
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The app reads `EXPO_PUBLIC_AGENT_URL`; the default is `http://localhost:8000`.
For the Android emulator use `http://10.0.2.2:8000`, and for a physical device
use the computer's LAN IP. The agent is development-only: it accepts
`user_id`/`profile_id` in the request body and has no Firebase auth or
internal-JWT verification yet.

**Multi-profile support is implemented:** one account owns several profiles,
Today shows a profile rail, and the Profile tab manages them. Every wardrobe,
item and API request is scoped to the active profile via `X-Profile-Id`. See
[`docs/multi-profile.md`](docs/multi-profile.md) for the model, schema, API and
migration details.

Visual direction, per-screen blueprints, reusable component specs, and the
reference images that informed them are in
[`docs/design/README.md`](docs/design/README.md).

The shared visual language — Warm Neutral + Muted Olive, tokens, typography,
spacing and component rules — is documented in
[`../docs/design-system/`](../docs/design-system/README.md). Tokens live in
`src/theme/tokens.json` and are exposed as `wardro-*` Tailwind classes.

Every pushed screen uses the shared `components/AppHeader.tsx` (44px back
target, title, optional right action). Add forms use
`components/FormScreen.tsx` for a fixed header, scrollable content and a sticky
action footer that lifts with the keyboard. On web,
`components/PhoneFrame.tsx` confines the app to a 430px column, matching the
Flutter `MobileFrame`.

## Android release builds

Play-ready signed AABs are built by the manual GitHub Actions workflow
`.github/workflows/android-release.yml`. See
[`docs/android-release.md`](docs/android-release.md) for the required secrets,
keystore backup and local-build alternative.

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
6. **AI chat pilot** — Chat tab, local LangGraph agent client and active-profile
   context. ✅ Auth proxy, real wardrobe tools and persistence are next.
7. **Favorites & wear tracking** — favourite flags and wear logs; the data
   foundation for analytics and suggestions.
8. **Create** — outfit builder + saved library; becomes the prominent middle
   tab when real. Calendar starts as a segment inside Create.
9. **Calendar** — promote outfit planning to a tab when it is substantial.
10. **Weather, suggestions & analytics** — Today cards plus a full analytics
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
| `POST /photos` | Upload a photo; returns the signed `photoUri` |

Photos are uploaded by the app to the authenticated `POST /photos` endpoint;
the API writes them to Google Cloud Storage and returns the signed URL stored
as `photoUri`. Firebase is used only for authentication.

## Agent endpoint used

Chat calls the FastAPI service directly in development:

| Endpoint | Used by |
| --- | --- |
| `POST {EXPO_PUBLIC_AGENT_URL}/api/v1/chat` | Chat tab: `{ message, thread_id, user_id, profile_id, firebase_token?, image_base64?, image_media_type? }` |

The response is `{ thread_id, intent, agent, message, metadata }`. The agent
uses `firebase_token` only to read the active profile's inventory from the Bun
API; it is development-only and is not stored in graph state. When
`image_base64` is present, the request is routed to the vision model and the
response metadata contains the structured `analysis`; the image is not saved.
Production chat will go through the Hono `/api/ai/*` proxy with Firebase auth
and a short-lived internal JWT.

## Design tokens

The Warm Neutral + Muted Olive palette lives in `src/theme/tokens.json` and is
exposed through `tailwind.config.js` as `wardro-*` classes (with legacy
`brand`/`canvas`/`line`/`ink` aliases). Use the semantic classes in new code;
do not add raw hex outside `src/theme/`. The full system — colours, typography,
spacing, components and screen layouts — is documented in
[`../docs/design-system/`](../docs/design-system/README.md).
