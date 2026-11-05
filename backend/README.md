# backend

Hono API for Wardro, backed by **Drizzle ORM on plain Postgres** and Firebase
Storage.

## Local development

```sh
bun install
DATABASE_URL=postgresql://user:pass@host:5432/db bun run dev
```

The API listens on `http://localhost:3000`. Requests need a Firebase ID token
in `Authorization: Bearer <token>`. Wardrobe/item requests also carry
`X-Profile-Id: <profile id>`; if it is omitted the account's default profile is
used. Profile endpoints (`/profiles`) are account-level.

### Profile endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/profiles` | List profiles with collection/item counts; ensures a default profile |
| `POST` | `/api/profiles` | Create `{ name, color? }` |
| `PATCH` | `/api/profiles/:id` | Update name/colour |
| `DELETE` | `/api/profiles/:id` | Delete a profile (cascade; the last profile is protected) |

Every wardrobe/item query is scoped to the signed-in account and the active
profile. Profile ownership is verified server-side; the header is never trusted
on its own.

`DATABASE_URL` can point at any Postgres — Neon, Supabase, RDS, a local
container, or Cloud SQL through the proxy/connector. There is no database
provider SDK in the application path; switching providers is a connection
string change.

### Simulation dataset

The checked-in dataset at
[`datasets/wardrobe-simulation/`](../datasets/wardrobe-simulation/README.md)
is served read-only under `http://localhost:3000/demo/...`:

- Images: `/demo/images/<item-key>.jpg`
- Manifest: `/demo/manifest.json`
- Source root: the repository's dataset directory, or `DEMO_IMAGES_DIR` if set.
  Deployment images that do not include the dataset simply return 404s.

Seed the four demo profiles (Tiru, Swati, Arush, Adiran) with the current
owner account:

```sh
DEMO_BASE_URL=http://localhost:3000/demo bun run seed:demo
# inspect what would change without committing:
bun run seed:demo:dry
```

The seeder is additive and idempotent:

- It targets the first user ordered by wardrobe count, or `DEMO_OWNER_UID`.
- It reuses the account's default profile as **Tiru** when that profile is the
  only one or is named after the account holder; otherwise it creates a new
  Tiru profile.
- It moves an existing wardrobe named “Swati's” to the **Swati** profile and
  keeps its items. Nothing is deleted.
- It writes only the columns that exist at the time it runs. New columns are
  used only for items it inserts; existing items are never overwritten.

Use `10.0.2.2:3000` for the Android emulator or your LAN IP for a physical
device. The web app can keep `localhost:3000`.

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

The committed migrations have been applied to the Neon database, so `user`,
`profile`, `wardrobe`, and `wardrobe_item` exist there and match
`src/schema.ts`. Every wardrobe/item row has a `profile_id`; existing data was
backfilled into one default profile per account by
`drizzle/0001_powerful_moon_knight.sql`.
