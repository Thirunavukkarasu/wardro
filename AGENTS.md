# AGENTS.md

Entry point for AI agents and contributors. Read this first, then open the
document for the area you are changing.

The documentation is deliberately split by scope:

- **Root `docs/`** — shared across the repository: design system and research.
- **`mobile-rn/docs/`** — app-specific: screens, navigation, profile behaviour
  and the product-research backlog.

Do not merge the two trees. Link across them instead.

## Documentation map

| Need | Read |
| --- | --- |
| Project overview, repository layout, deployment | [`README.md`](README.md) |
| Product requirements, scope, metrics and roadmap | [`docs/PRD.md`](docs/PRD.md) |
| Shared visual language: colours, type, spacing, components, layouts | [`docs/design-system/README.md`](docs/design-system/README.md) |
| Research index and conclusions | [`docs/research/README.md`](docs/research/README.md) |
| Notion synthesis: AI architecture, taxonomy, corrections | [`docs/research/notion-synthesis.md`](docs/research/notion-synthesis.md) |
| Schema review and phased migration plan | [`docs/research/data-model-assessment.md`](docs/research/data-model-assessment.md) |
| Feature backlog, bulk import and duplicate detection | [`docs/features.md`](docs/features.md) |
| Original Notion exports (reference only) | [`docs/research/sources/README.md`](docs/research/sources/README.md) |
| Four-profile simulation dataset and seed workflow | [`scripts/datasets/wardrobe-simulation/README.md`](scripts/datasets/wardrobe-simulation/README.md) |
| Repo-level tooling and fixtures | [`scripts/README.md`](scripts/README.md) |
| LangChain agent service: status, run, integration gaps | [`wardro-agent/README.md`](wardro-agent/README.md) |
| Manual API requests (Bruno, token setup) | [`backend/api-tests/README.md`](backend/api-tests/README.md) |
| Mobile app setup and architecture | [`mobile-rn/README.md`](mobile-rn/README.md) |
| Play Store listing, data safety and production gate | [`mobile-rn/docs/play-store.md`](mobile-rn/docs/play-store.md) |
| Screen/navigation plan and phasing | [`mobile-rn/docs/screen-architecture.md`](mobile-rn/docs/screen-architecture.md) |
| Household profiles: schema, API, UI, migration | [`mobile-rn/docs/multi-profile.md`](mobile-rn/docs/multi-profile.md) |
| Screen blueprints, inspiration and reference images | [`mobile-rn/docs/design/README.md`](mobile-rn/docs/design/README.md) |
| Product-research backlog (competitors, interviews, privacy) | [`mobile-rn/docs/research/README.md`](mobile-rn/docs/research/README.md) |
| API routes, database, build and deployment | [`backend/README.md`](backend/README.md) |

`mobile-rn/docs/design/` is **not** the design system. It holds screen
blueprints and references; the tokens and shared component rules live in
`docs/design-system/`.

## Project skills

- [`.claude/skills/android-release/`](.claude/skills/android-release/SKILL.md) —
  build, download and publish the signed Android AAB.
- [`.claude/skills/website-interactions/`](.claude/skills/website-interactions/SKILL.md) —
  motion and interaction guidance for the marketing site.

Motion skills vendored from [emilkowalski/skills](https://github.com/emilkowalski/skills)
(MIT) live in `.claude/skills/`; see [`.claude/skills/README.md`](.claude/skills/README.md).

## Repository layout

| Directory | Stack | Status |
| --- | --- | --- |
| `mobile-rn/` | Expo SDK 54 / React Native | Primary app |
| `backend/` | Bun + Hono + Drizzle | API and system of record; runs on Bun in Cloud Run |
| `backend/api-tests/` | Bruno collections | Manual API tests |
| `scripts/` | Node/Bun tooling + fixtures | Seed script and simulation dataset |
| `scripts/datasets/wardrobe-simulation/` | JSON + JPEG fixtures | Demo/test dataset |
| `wardro-agent/` | FastAPI + LangGraph + Ollama | Agent service; deployed on Cloud Run with Firebase auth (Milestone 1) |
| `docs/` | Markdown | Shared design and research |
| `website/` | Next.js 14 | Marketing site |

The Flutter reference port lives on the `flutter-reference` branch, not on
`main`. Do not add it back; the React Native app is the target.

## Commands

```bash
# API → http://localhost:3000
cd backend && bun install && bun run dev

# React Native web → http://localhost:8081
cd mobile-rn && npm install && npm run web

# Native dev build
cd mobile-rn && npm start

# Agent service → http://localhost:8000 (requires Ollama)
cd wardro-agent && uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Typecheck
cd mobile-rn && npm run typecheck
cd backend && bunx tsc --noEmit
cd wardro-agent && uv run ruff check . && uv run pytest

# Deploy the API to Cloud Run (also runs on backend/ pushes to main)
gh workflow run "Deploy API to Cloud Run"
```

The backend has one known, unrelated type error in `src/db.ts`
(`"PUBLIC"` is not assignable to `IpAddressOptions`); do not "fix" it as part
of an unrelated change.

```bash
# Reviewed SQL migrations
cd backend && bunx drizzle-kit generate
```

Never use `drizzle-kit push` against a shared or production database. Review
the generated SQL, test it on a branch, then apply it. Never commit `.env`
files or Firebase/Neon secrets.

### Simulation data

```bash
cd backend
DEMO_BASE_URL=http://localhost:3000/demo bun run seed:demo:dry
DEMO_BASE_URL=http://localhost:3000/demo bun run seed:demo
```

The seeder is additive and idempotent: it reuses/renames the default profile
as **Tiru**, moves the old “Swati’s” wardrobe to **Swati**, and never deletes
rows. The dataset's images are licensed individually; keep
[`scripts/datasets/wardrobe-simulation/ATTRIBUTIONS.md`](scripts/datasets/wardrobe-simulation/ATTRIBUTIONS.md)
with any redistributed copy.

## Architecture invariants

1. **Firebase is the identity source.** Derive the owner uid from the verified
   Firebase token. Never trust an owner id supplied by a client. Firebase is
   used only for authentication: photos live in Google Cloud Storage and all
   records live in Postgres.
2. **Everything wardrobe-scoped is profile-scoped.** Every wardrobe/item query
   filters both `owner_uid` and `profile_id`. `X-Profile-Id` is validated
   server-side; fall back to the account's default profile only when it is
   omitted.
3. **Bun is the only runtime writer.** The database is the system of record.
   If an AI service is added, it reads through authorized APIs and returns
   drafts; it must never insert, update or delete wardrobe rows. User
   confirmation precedes AI-created items. The checked-in seed script is the
   one deliberate development-time exception.
4. **Deterministic retrieval before generation.** Inventory answers and outfit
   candidates must reference real `wardrobe_item.id` rows. The model explains
   or ranks them; it does not invent inventory.
5. **Schema changes are additive and reviewed.** See
   [`docs/research/data-model-assessment.md`](docs/research/data-model-assessment.md).
   Keep the `user → profile → wardrobe → wardrobe_item` hierarchy.
6. **Use design tokens.** No raw hex outside `mobile-rn/src/theme/`; prefer the
   semantic `wardro-*` Tailwind classes.
7. **Do not extend the Flutter app.** The reference port lives on the
   `flutter-reference` branch; the React Native app is the target.
8. **Keep the docs split.** Shared material goes in root `docs/`; app-specific
   material goes in `mobile-rn/docs/`; link, do not duplicate.

## Change checklist

1. Read the relevant doc from the map above.
2. Make the smallest coherent change; preserve unrelated formatting.
3. Run the relevant typecheck.
4. Update the matching doc when behaviour, routes or schema change.
5. Verify the flow (API response, app screen, or seed output) before claiming
   it works.
6. Commit with a focused message. Do not push unless the owner asks.
