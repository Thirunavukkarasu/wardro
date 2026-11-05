# Wardro

Wardro is a wardrobe management app that helps users to keep track of their clothes and outfits. Users can add, edit, and delete clothes, create outfits, and view their clothes and outfits in a calendar view. Wardro also provides a weather forecast for the next 7 days to help users plan their outfits.

New contributors and AI agents should start at [`AGENTS.md`](AGENTS.md), which maps every area of the repository to its documentation and records the architectural invariants.

## Features

- Add, edit, and delete clothes
- Create outfits
- View clothes and outfits in a calendar view
- Analyze usage of clothes

## Repository layout

| Directory | Stack | Status |
| --- | --- | --- |
| `mobile-rn/` | Expo SDK 51 / React Native | Primary app — Firebase auth (email/password + Google), per-user data, photo-first UI |
| `backend/` | Bun + Hono + Drizzle, built to Node | API with Firebase ID-token verification; deployed to App Hosting |
| `backend/api-tests/` | Bruno collections | Manual API testing |
| `scripts/` | Bun/Node tooling + fixtures | Seed script and four-profile simulation dataset |
| `wardro-agent/` | Python 3.12 + FastAPI + LangGraph + Ollama | Agent service (Milestone 1; not yet wired to live wardrobe data) |
| `mobile-agent-ui/` | Expo web | Agent-service test console |
| `website/` | Next.js 14 + Tailwind | Marketing site |
| `mobile/` | Flutter 3.47 | Port kept for reference — same Firebase auth and API, no longer the target app |

## Running

Each package runs independently:

```bash
# API → http://localhost:3000
cd backend && bun install && bun run dev

# React Native app (web) → http://localhost:8081
cd mobile-rn && npm install && npm run web

# React Native app (iOS / Android dev build)
cd mobile-rn && npm start

# LangChain agent service → http://localhost:8000 (requires Ollama)
cd wardro-agent && uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Agent test console → http://localhost:8082 (use a free port if 8081 is taken)
cd mobile-agent-ui && npm install && npm run web -- --port 8082

# Marketing site → http://localhost:3001
cd website && npm install && npm run dev -- -p 3001
```

The API talks to Postgres through Drizzle, so local development only needs a
`DATABASE_URL` (any Postgres). The React Native app reads its Firebase and API
configuration from `mobile-rn/.env` (see `mobile-rn/.env.example`); see
`mobile-rn/README.md` for the app architecture,
`mobile-rn/docs/screen-architecture.md` for the agreed navigation/screen
structure and phasing, and `mobile-rn/docs/design/` for screen blueprints,
component specs, and design references. The shared visual language (Warm
Neutral + Muted Olive) is documented in [`docs/design-system/`](docs/design-system/README.md).
Research notes and the Notion synthesis live in [`docs/research/`](docs/research/README.md);
the four-profile simulation dataset is in
[`scripts/datasets/wardrobe-simulation/`](scripts/datasets/wardrobe-simulation/README.md).
`backend/README.md` covers build/deploy details, and
`wardro-agent/README.md` covers the LangChain agent service and its current
integration status.

## Deployment

- **Database** — Drizzle ORM on plain Postgres. The runtime only needs
  `DATABASE_URL`, so Neon, Supabase, RDS, local Postgres, or Cloud SQL all work
  without code changes. App Hosting uses a Neon Postgres via the `DATABASE_URL`
  Secret Manager secret; the Cloud SQL connector remains as a fallback
  (`CLOUD_SQL_CONNECTION_NAME` + DB credentials).
- **Storage** — item photos are uploaded by the app to
  `users/{uid}/items/...`; rules live in `storage.rules`. Deploy with
  `firebase deploy --only storage`.
- **App Hosting** — the `wardro` backend builds `backend/` from GitHub on every
  push to `main` and serves the API at
  `https://wardro--wardo-ce8d5.us-east4.hosted.app`.

## Technologies

- React Native (Expo Router) + Firebase Authentication + Firebase Storage
- Bun + Hono API (bundled to a Node server)
- Drizzle ORM + Postgres (provider-agnostic)
- Python 3.12 + FastAPI + LangGraph agent service (local Ollama inference)
- Firebase Storage
- Firebase App Hosting
- Next.js + Tailwind CSS
