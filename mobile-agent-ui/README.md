# Wardro AI — Expo test client

A small React Native client for exercising the FastAPI agent service from a browser.
It uses Expo's web target, so it is a development test harness rather than the
production mobile app.

## Run it

### 1. Start the backend

From the repository root:

```bash
cd wardro-agent
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check that it is up:

```bash
curl -s http://localhost:8000/health
```

### 2. Start the Expo web client

From the repository root:

```bash
cd mobile-agent-ui
nvm use                 # Node 26 LTS (pinned in .nvmrc)
npm install
cp .env.example .env.local   # optional; defaults match the backend
npm run web
# If the main mobile-rn app is already using 8081:
# npm run web -- --port 8082
```

Open <http://localhost:8081> (or 8082). The header should show **API online · Ollama ready**.

The backend's development CORS defaults already allow any `localhost` or
`127.0.0.1` port. If you serve the client from another origin, add it to
`CORS_ORIGINS` in `wardro-agent/.env` and restart the API.

## What it does

- Sends `POST /api/v1/chat` with the message, thread ID, and development identity.
- Shows the returned intent, agent, model, and `single-turn` metadata.
- Lets you edit the API base URL, user ID, household ID, and profile ID at runtime.
- Checks `/health` and `/health/ollama` on load and on demand.
- Shows an error card with a retry action when the request fails.
- Supports stopping an in-flight request. It does **not** fake token streaming; the
  backend endpoint is still request/response, so the UI waits for the full answer.

## Development identity

The identity fields are sent in the request body because this milestone has no auth
middleware. The backend accepts them only when `APP_ENV=development`; every other
environment rejects body identity with `401`.

Do not treat this client as authenticated. Do not put cloud LLM provider keys in it,
and do not point it at Ollama directly. FastAPI remains the only model caller.

## Configuration

Create `mobile-agent-ui/.env.local` to override the defaults:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_USER_ID=dev-user
EXPO_PUBLIC_HOUSEHOLD_ID=dev-family
EXPO_PUBLIC_PROFILE_ID=dev-profile
```

Expo inlines `EXPO_PUBLIC_*` variables at build time. Restart the dev server after
changing them.

For an Android emulator, set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`, or edit the
API base URL in the Dev context panel. A physical device needs the computer's LAN IP
and the backend listening on `0.0.0.0`.

## Checks

```bash
npm run typecheck
npm run export:web
```

`export:web` writes a static bundle to `dist/`, which is gitignored.

## Known limitations

- The client is a single-turn test console. `thread_id` is generated and sent, but
  the backend has no checkpointer, so conversations do not persist across requests.
- Wardrobe inventory, image upload/vision, authentication, and streaming are not
  implemented yet.
- Markdown rendering is intentionally lightweight (headings, bullets, bold). It is
  not a full markdown renderer.
- Expo web is a testing convenience. A production client will need authentication,
  secure token storage, and a deliberate mobile architecture.
