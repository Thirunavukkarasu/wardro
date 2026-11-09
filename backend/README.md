# backend

Hono API for Wardro, backed by **Drizzle ORM on plain Postgres** and Google
Cloud Storage for item photos. Firebase is used only for authentication.

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

### Storage

Item photos live in Google Cloud Storage; Firebase is used only for
authentication. The app uploads to authenticated `POST /api/photos`, the API
writes the object to `GCS_PHOTOS_BUCKET` under `users/{uid}/items/...`, and the
response is a stable `/api/photos/users/{uid}/items/{file}?sig=...` URL stored
as `photoUri`.

`GET /api/photos/*` verifies the HMAC signature (the Secret Manager secret
`PHOTO_URL_SECRET`) and streams the object, so the bucket stays private and
web `<img>` / native `Image` need no Authorization header. Deletes go through
`src/storage.ts` using `@google-cloud/storage`; `firebase-admin` is no longer a
dependency.

The runtime service account needs `roles/storage.objectAdmin` on the bucket and
secret accessor on `PHOTO_URL_SECRET` (see the bootstrap below). For local
uploads and deletes, authenticate the API with Application Default Credentials
(`gcloud auth application-default login`) or point
`GOOGLE_APPLICATION_CREDENTIALS` at a service-account key. Admin and inspection
can use `gcloud storage`:

```sh
gcloud storage ls gs://wardo-ce8d5.firebasestorage.app/users/
```

### Bruno API collection

Manual API requests live in [`api-tests/`](api-tests/). Open that folder as a
Bruno collection; the `Local` environment points at
`http://localhost:3000/api`. The collection covers the current user, profiles,
wardrobes and wardrobe items, with bearer-token auth and `X-Profile-Id` headers.
See [`api-tests/README.md`](api-tests/README.md) for getting a Firebase test
token and the recommended request order.

### Simulation dataset

The checked-in dataset at
[`scripts/datasets/wardrobe-simulation/`](../scripts/datasets/wardrobe-simulation/README.md)
is served read-only under `http://localhost:3000/demo/...`:

- Images: `/demo/images/<item-key>.jpg`
- Manifest: `/demo/manifest.json`
- Source root: `scripts/datasets/wardrobe-simulation`, or `DEMO_IMAGES_DIR` if
  set. When the directory is absent (as in the Cloud Run image), the route is
  not mounted and `/demo/*` returns 404.

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

Production runs on **Cloud Run** in `wardo-ce8d5`, built from
[`Dockerfile`](Dockerfile) and deployed by
[`.github/workflows/deploy-api.yml`](../.github/workflows/deploy-api.yml). The
container runs the API directly on **Bun** (`bun src/index.ts`); Bun executes
the TypeScript and resolves the `@/*` aliases, so there is no build step in the
image. On every push to `main` that touches backend code, the workflow builds
the image, pushes it to Artifact Registry, and deploys a new Cloud Run revision.
It can also be run manually.

The Node bundle is still committed because App Hosting needs it, and the
repository's change checklist expects it:

```sh
# after changing src/
bun run bundle
```

### Workflow configuration

Repository secrets (**Settings → Secrets and variables → Actions → Secrets**):

| Secret | Value |
| --- | --- |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Full provider resource name printed by the bootstrap below |
| `GCP_SERVICE_ACCOUNT` | Deployer email, e.g. `wardro-deployer@wardo-ce8d5.iam.gserviceaccount.com` |

Optional repository variables (same page → **Variables**). The defaults target
the current project, so the first run only needs the two secrets:

| Variable | Default | Purpose |
| --- | --- | --- |
| `GCP_PROJECT_ID` | `wardo-ce8d5` | Project hosting Cloud Run, Artifact Registry and Secret Manager |
| `GCP_REGION` | `asia-south1` | Cloud Run region. Set this to the existing service's region before the first run |
| `CLOUD_RUN_SERVICE` | `wardro-api` | Cloud Run service name |
| `ARTIFACT_REGISTRY_REPOSITORY` | `wardro` | Docker repository in Artifact Registry |
| `CLOUD_RUN_SERVICE_ACCOUNT` | `wardro-api@<project>.iam.gserviceaccount.com` | Runtime identity of the service |
| `GCS_PHOTOS_BUCKET` | `wardo-ce8d5.firebasestorage.app` | Bucket for item photos |
| `CORS_ORIGINS` | `https://wardro-lake.vercel.app` | Extra browser origins, comma-separated |
| `DATABASE_URL_SECRET` | `DATABASE_URL` | Secret Manager secret mapped to `DATABASE_URL` |

The workflow also maps the `PHOTO_URL_SECRET` Secret Manager secret into the
service; create it in the bootstrap below.

> The first run **creates** the service named by `CLOUD_RUN_SERVICE` in
> `GCP_REGION`. If you already created one manually under a different name or
> region, set those two variables to match it, or you will end up with a second
> service.

The deploy step sets the service's environment variables declaratively. Values
added only in the Cloud Run console are replaced on the next deploy; add them
as repository variables above instead.

### One-time GCP bootstrap

Run this once from an account with project Owner (or equivalent). It creates
the Artifact Registry repository, the deployer and runtime service accounts,
the Workload Identity Federation pool, and the secret access the runtime needs.

```sh
PROJECT_ID=wardo-ce8d5
REGION=asia-south1
GITHUB_REPO=Thirunavukkarasu/wardro
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')

gcloud services enable \
  run.googleapis.com artifactregistry.googleapis.com \
  iamcredentials.googleapis.com secretmanager.googleapis.com \
  --project "$PROJECT_ID"

gcloud artifacts repositories create wardro \
  --project "$PROJECT_ID" --location "$REGION" \
  --repository-format docker \
  --description "Wardro API images"

# Identity GitHub Actions uses to deploy.
gcloud iam service-accounts create wardro-deployer \
  --project "$PROJECT_ID" --display-name "Wardro GitHub deployer"

for role in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member "serviceAccount:wardro-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role "$role" --condition=None --quiet
done

# Identity the running API uses.
gcloud iam service-accounts create wardro-api \
  --project "$PROJECT_ID" --display-name "Wardro API runtime"

gcloud iam service-accounts add-iam-policy-binding \
  "wardro-api@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project "$PROJECT_ID" \
  --member "serviceAccount:wardro-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role roles/iam.serviceAccountUser

# The Cloud Run service agent needs to pull the image and act as the runtime
# service account when it creates revisions.
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com" \
  --role roles/artifactregistry.reader --condition=None --quiet

gcloud iam service-accounts add-iam-policy-binding \
  "wardro-api@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project "$PROJECT_ID" \
  --member "serviceAccount:service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com" \
  --role roles/iam.serviceAccountUser

gcloud secrets add-iam-policy-binding DATABASE_URL \
  --project "$PROJECT_ID" \
  --member "serviceAccount:wardro-api@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role roles/secretmanager.secretAccessor

# Signs the stable /api/photos URLs. Rotating this invalidates stored URLs.
openssl rand -hex 32 | gcloud secrets create PHOTO_URL_SECRET \
  --project "$PROJECT_ID" --data-file=-

gcloud secrets add-iam-policy-binding PHOTO_URL_SECRET \
  --project "$PROJECT_ID" \
  --member "serviceAccount:wardro-api@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role roles/secretmanager.secretAccessor

# The bucket holds item photos. The API owns all access, so no Firebase
# Storage rules or client SDK are involved. Create the bucket first if it does
# not exist yet:
#   gcloud storage buckets create gs://wardo-ce8d5.firebasestorage.app \
#     --project "$PROJECT_ID" --location "$REGION" \
#     --uniform-bucket-level-access
gcloud storage buckets add-iam-policy-binding \
  gs://wardo-ce8d5.firebasestorage.app \
  --member "serviceAccount:wardro-api@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role roles/storage.objectAdmin

gcloud iam workload-identity-pools create github \
  --project "$PROJECT_ID" --location global \
  --display-name "GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github \
  --project "$PROJECT_ID" --location global \
  --workload-identity-pool github \
  --display-name "GitHub OIDC" \
  --issuer-uri https://token.actions.githubusercontent.com \
  --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition "assertion.repository=='${GITHUB_REPO}' && assertion.ref=='refs/heads/main'"

gcloud iam service-accounts add-iam-policy-binding \
  "wardro-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project "$PROJECT_ID" \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${GITHUB_REPO}"

gcloud iam workload-identity-pools providers describe github \
  --project "$PROJECT_ID" --location global \
  --workload-identity-pool github \
  --format "value(name)"
```

Copy the last command's output into `GCP_WORKLOAD_IDENTITY_PROVIDER`, and set
`GCP_SERVICE_ACCOUNT` to
`wardro-deployer@wardo-ce8d5.iam.gserviceaccount.com`.

The database is a Neon Postgres addressed by the `DATABASE_URL` Secret Manager
secret in the same project. If it does not exist yet:

```sh
gcloud secrets create DATABASE_URL --project wardo-ce8d5 \
  --replication-policy automatic
gcloud secrets versions add DATABASE_URL --project wardo-ce8d5 \
  --data-file=- <<<"postgresql://user:pass@host/db"
```

Rotate it later with the second command only. Cloud SQL is still supported as
a fallback: set `CLOUD_SQL_CONNECTION_NAME` plus `DB_USER` / `DB_PASSWORD` /
`DB_NAME` instead.

### Deploy

```sh
gh workflow run "Deploy API to Cloud Run" -R Thirunavukkarasu/wardro
gh run watch -R Thirunavukkarasu/wardro
```

Or open **Actions → Deploy API to Cloud Run → Run workflow**.

The workflow prints the service URL. With the default project, service name and
region, the deterministic URL is
`https://wardro-api-251900114942.asia-south1.run.app`; the app's
`EXPO_PUBLIC_API_URL` default already points at
`https://wardro-api-251900114942.asia-south1.run.app/api`. If you change
`GCP_REGION`, `CLOUD_RUN_SERVICE` or `GCP_PROJECT_ID`, update
`mobile-rn/lib/firebase-config.ts` and `mobile-rn/.env.example` to match.

### App Hosting (legacy)

`apphosting.yaml` and the committed `dist/` remain for the old App Hosting
backend. Cloud Run does not use them; the Dockerfile runs `src/index.ts`
directly with Bun. Delete the App Hosting backend once Cloud Run is the only
API.

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
