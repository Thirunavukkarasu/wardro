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
| `backend/` | Bun + Hono + Drizzle | API with Firebase ID-token verification |
| `website/` | Next.js 14 + Tailwind | Marketing site |
| `api-tests/` | Bruno collections | Manual API testing |

## Running

Each package runs independently:

```bash
# API → http://localhost:3000
cd backend && bun install && bun run dev

# Flutter app (web) → http://localhost:8080
cd mobile && flutter pub get && flutter run -d chrome

# Marketing site → http://localhost:3001
cd website && npm install && npm run dev -- -p 3001
```

See `mobile/README.md` for the app architecture and setup details.

## Technologies

- Flutter + Firebase Authentication
- Bun + Hono + Drizzle ORM
- Neon Postgres
- Next.js + Tailwind CSS
