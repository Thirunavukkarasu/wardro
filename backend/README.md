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

On App Hosting the database is reached through the Cloud SQL connector; those
variables live in `apphosting.yaml` and `DATABASE_PASSWORD` is a Secret
Manager secret. To move to another Postgres, set `DATABASE_URL` instead and
remove the `CLOUD_SQL_*` / `DB_*` variables.

## Database schema

The Drizzle schema is in `src/schema.ts`. Generate and apply migrations with a
standard Postgres URL:

```sh
DATABASE_URL=postgresql://... bun run db:generate
DATABASE_URL=postgresql://... bun run db:push
```

The current tables (`user`, `wardrobe`, `wardrobe_item`) already exist in the
database and match `src/schema.ts`.
