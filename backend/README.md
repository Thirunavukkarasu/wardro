# backend

Hono API for Wardro, backed by **Drizzle ORM on plain Postgres** and Firebase
Storage.

## Local development

```sh
bun install
DATABASE_URL=postgresql://user:pass@host:5432/db bun run dev
```

The API listens on `http://localhost:3000`. Requests need a Firebase ID token
in `Authorization: Bearer <token>`.

`DATABASE_URL` can point at any Postgres — Neon, Supabase, RDS, a local
container, or Cloud SQL through the proxy/connector. There is no database
provider SDK in the application path; switching providers is a connection
string change.

## Build and deploy

App Hosting's buildpack runs Node, not Bun, so the Node bundle is committed:

```sh
# after changing src/
bun run bundle
```

The committed `dist/index.js` is what `npm start` runs on App Hosting. Push to
`main` to trigger a rollout for the `wardro` backend.

On App Hosting the database is a Neon Postgres addressed by `DATABASE_URL`,
which `apphosting.yaml` reads from the `DATABASE_URL` Secret Manager secret in
the same project. Create or rotate it with:

```sh
gcloud secrets versions add DATABASE_URL --project wardo-ce8d5 \
  --data-file=- <<<"postgresql://user:pass@host/db"
```

The App Hosting service account needs `roles/secretmanager.secretAccessor` on
that secret. Cloud SQL is still supported as a fallback: set
`CLOUD_SQL_CONNECTION_NAME` plus `DB_USER` / `DB_PASSWORD` / `DB_NAME` instead.

## Database schema

The Drizzle schema is in `src/schema.ts`; migrations are committed under
`drizzle/`.

```sh
DATABASE_URL=postgresql://... bun run db:generate   # after editing schema.ts
DATABASE_URL=postgresql://... bun run db:migrate    # apply committed migrations
```

The committed migration has been applied to the Neon database, so `user`,
`wardrobe`, and `wardrobe_item` exist there and match `src/schema.ts`.
