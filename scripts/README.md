# scripts

Repository-level tooling and fixtures. This folder is not a package and has no
install step of its own; run the scripts from the package that owns the runtime
dependencies.

## Contents

| Path | Purpose |
| --- | --- |
| `seed-demo.mjs` | Seed the four-profile simulation dataset into Postgres through `backend`'s `pg` dependency. |
| `datasets/wardrobe-simulation/` | Licensed image + manifest fixture used by the seed and the `/demo` static route. See its [README](datasets/wardrobe-simulation/README.md). |

## Seed the simulation data

```bash
cd backend
DEMO_BASE_URL=http://localhost:3000/demo bun run seed:demo:dry
DEMO_BASE_URL=http://localhost:3000/demo bun run seed:demo
```

The backend scripts call `../scripts/seed-demo.mjs`. The seeder is additive and
idempotent, and never deletes rows.

## Why the dataset lives here

The simulation data is repository-level test material, not production content.
Keeping it next to the seed script makes the fixture and the tool that consumes
it one unit, and keeps the repository root to application/package folders.

Package-local scripts stay with their package — for example
`mobile-rn/scripts/reset-project.js` is part of the Expo scaffold and is not
moved here.
