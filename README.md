# Wardro

Wardro is a wardrobe management app that helps users to keep track of their clothes and outfits. Users can add, edit, and delete clothes, create outfits, and view their clothes and outfits in a calendar view. Wardro also provides a weather forecast for the next 7 days to help users plan their outfits.

## Features

- Add, edit, and delete clothes
- Create outfits
- View clothes and outfits in a calendar view
- Analyze usage of clothes

## Repository layout

| Directory | Stack | Status |
| --- | --- | --- |
| `mobile/` | Flutter 3.47 | Primary app — Firebase auth, per-user data, photo-first UI |
| `mobile-rn/` | Expo SDK 51 / React Native | Legacy original app, kept for reference |
| `backend/` | Bun + Hono + Drizzle, built to Node | API with Firebase ID-token verification; deployed to App Hosting |
| `website/` | Next.js 14 + Tailwind | Marketing site |
| `api-tests/` | Bruno collections | Manual API testing |

## Running

Each package runs independently:

```bash
# API → http://localhost:3000
cd backend && bun install && bun run dev

# Flutter app (web) → http://localhost:8080
cd mobile && flutter pub get && flutter run -d chrome \
  --dart-define=API_BASE_URL=http://localhost:3000/api

# Marketing site → http://localhost:3001
cd website && npm install && npm run dev -- -p 3001
```

The API talks to Postgres through Drizzle, so local development only needs a
`DATABASE_URL` (any Postgres). See `mobile/README.md` for the app architecture
and `backend/README.md` for build/deploy details.

## Deployment

- **Database** — Drizzle ORM on plain Postgres. The runtime only needs
  `DATABASE_URL`, so Neon, Supabase, RDS, local Postgres, or Cloud SQL all work
  without code changes. App Hosting currently reaches the Cloud SQL instance
  through the Cloud SQL connector (`CLOUD_SQL_CONNECTION_NAME` + DB credentials).
- **Storage** — item photos are uploaded by the app to
  `users/{uid}/items/...`; rules live in `storage.rules`. Deploy with
  `firebase deploy --only storage`.
- **App Hosting** — the `wardro` backend builds `backend/` from GitHub on every
  push to `main` and serves the API at
  `https://wardro--wardo-ce8d5.us-east4.hosted.app`.

## Technologies

- Flutter + Firebase Authentication
- Bun + Hono API (bundled to a Node server)
- Drizzle ORM + Postgres (provider-agnostic)
- Firebase Storage
- Firebase App Hosting
- Next.js + Tailwind CSS
