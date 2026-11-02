# backend

Hono API for Wardro, backed by Firebase SQL Connect (Cloud SQL Postgres) and
Firebase Storage.

## Local development

```sh
bun install
bun run dev
```

The API listens on `http://localhost:3000`. Requests need a Firebase ID token
in `Authorization: Bearer <token>`.

Data access uses the Firebase Admin SDK, so local development needs Application
Default Credentials:

```sh
gcloud auth application-default login
```

## Build and deploy

App Hosting's buildpack runs Node, not Bun, so the Node bundle is committed:

```sh
# after changing src/
bun run bundle
```

The committed `dist/index.js` is what `npm start` runs on App Hosting. Push to
`main` to trigger a rollout for the `wardro` backend.

## SQL Connect

The schema and operations live in `../dataconnect`. After changing them:

```sh
cd ..
firebase dataconnect:compile     # validates and regenerates the Admin SDK
firebase deploy --only dataconnect
```

`dataconnect:compile` regenerates `src/generated/dataconnect`, which is
committed and consumed as `@wardro/dataconnect-admin`.
