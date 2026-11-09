# Notion research synthesis

This document distils the two Notion exports in [`sources/`](./sources/) into
decisions the repository can act on. The exports were written against an
earlier Flutter/`wardrobe_profile` design and contain placeholders and assumed
route names. **They are reference material, not a source of truth.** Where they
conflict with the shipped code, the code wins; this page records the
differences and the reasoning.

## Provenance

| File | Original title | Lines |
| --- | --- | --- |
| [`sources/notion-family-wardrobe-intelligence-architect.md`](./sources/notion-family-wardrobe-intelligence-architect.md) | Wardro AI — Family Wardrobe Intelligence Architecture | ~790 |
| [`sources/notion-complete-technical-implementation.md`](./sources/notion-complete-technical-implementation.md) | Wardro AI — Complete Technical Implementation | ~1,650 |

They were exported from Notion on 2026-11-05 and are kept verbatim so future
work can check the original wording. They describe a Flutter client, a
`wardrobe_profile` table, and a Python AI service that does not exist in this
repository yet.

## The useful core

### 1. Product thesis

Wardro's differentiator is not generic outfit generation. It is:

1. **Know what the household owns** — accurate, searchable inventory.
2. **Know what each person actually wears** — wear history and gaps.
3. **Make better use of it** — outfits, insights, and purchase avoidance.

That ordering matters. Inventory accuracy is the foundation; a stylist built on
a wrong inventory is worse than no stylist.

### 2. One household account, many people

- A Firebase account owns the household.
- Profiles represent people, not wardrobes.
- A profile can have several wardrobes (work, casual, festive, seasonal).
- Children do not need separate logins.
- Every profile-scoped read and write must verify both account ownership and
  profile ownership.
- A default `self` profile is created once per account.

This is already implemented. The shipped schema uses `profile`, `name`,
`color`, `avatar_url`, and `is_default` rather than the Notion names
`wardrobe_profile`, `display_name`, `relationship`, and `profile_type`. The
naming difference is harmless; adding `relationship` and `profile_type` is a
small additive migration (see
[`data-model-assessment.md`](./data-model-assessment.md)).

### 3. Bun remains the system of record

The architecture split is sound:

```
mobile / web client
        │  Firebase ID token
        ▼
Bun + Hono + Drizzle  ──────►  PostgreSQL (Neon)
        │  short-lived internal JWT + forwarded Firebase token
        ▼
Python FastAPI + LangGraph  ──►  Ollama (text / vision)
        │
        └── reads existing wardrobe APIs; never writes inventory directly
```

Why not put AI in Bun?

- Python has the mature LangGraph/LangChain and vision ecosystem.
- Ollama clients and local model management are easier in Python.
- Keeping AI out of the API process isolates latency, memory and model failures
  from authentication and inventory writes.

Why not let Python own the database?

- It would duplicate Drizzle authorization logic.
- Two writers make profile scoping and auditability harder.
- The Bun service already has the Firebase middleware and ownership checks.

**Rule:** Bun is the only writer. Python may read through authorized APIs and
may return drafts, but it must never insert, update or delete wardrobe rows.
User confirmation precedes any AI-generated item.

### 4. Internal authentication, not a trusted header

The Notion documents are right that a plain `X-User-Id` header is insufficient.
The recommended flow:

1. Client sends a Firebase ID token to Bun.
2. Bun verifies it with the existing middleware.
3. Bun verifies the selected profile belongs to that uid.
4. Bun signs a short-lived internal JWT (HS256, ~2 minutes, issuer
   `wardro-api`, audience `wardro-ai`, subject = uid, claim = profile id).
5. Bun calls Python with that JWT.
6. Python verifies issuer, audience, expiry and signature before running the
   graph.

Additional hardening the Notion docs mention only briefly:

- Bind the AI service to a private network / service identity; do not expose it
  to the public internet.
- Add request timeouts, body-size limits, rate limits and structured error
  mapping at the Bun proxy.
- Never log the Firebase token or place it in LangGraph checkpoints.
- Treat a LangGraph `thread_id` as a checkpoint key, not as authorization.

### 5. Deterministic retrieval before generation

Inventory questions must be answered by database queries, not by asking a model
to remember what the user owns. The same rule applies to outfits: first build
candidate combinations from real rows, then let the model explain or rank them.

Recommended outfit scoring from the Notion material:

```text
score = colour_match * 0.30
      + occasion_match * 0.30
      + style_match * 0.15
      + user_preference * 0.15
      + availability * 0.10
```

Keep the weighting in code and make it explainable. Every recommended item must
carry a real `wardrobe_item.id`; the model must never invent inventory.

### 6. Image ingestion is a draft workflow

The full lifecycle worth building:

1. User uploads or captures a photo (Google Cloud Storage).
2. Bun checks auth, profile and storage ownership.
3. Python downloads the image through a controlled reference and runs vision.
4. The model returns structured attributes plus confidence.
5. Optional duplicate detection against existing items.
6. The user reviews and edits the draft.
7. The existing `POST /api/wardrobeItems` (or a small extension of it) writes
   the item and its analysis in one transaction.

AI output is a proposal. `verified_by_user` should start `false`; user edits
must not be silently overwritten by a later re-analysis.

### 7. Taxonomy must fit the actual wardrobe

Notion's taxonomy list is the most immediately useful content for an Indian
household:

- **Ethnic:** saree, blouse, lehenga, salwar suit, kurti, kurta, sherwani,
  dupatta.
- **Western:** dress, shirt, T-shirt, top, jeans, trousers, skirt, shorts,
  blazer, jacket, coat.
- **Children:** school uniform, casual, ethnic, romper, baby essentials.
- **Footwear:** sneakers, sandals, boots, heels, flats, formal shoes.
- **Accessories:** bag, backpack, watch, belt, cap, scarf, jewellery.

Do not collapse everything into `top` / `bottom` / `dress`. Keep a normalized
category for filtering and a specific garment type for recommendations. The
simulation dataset's `category` + `subcategory` pairs are a practical first
pass at this split.

### 8. Preferences and feedback are part of the moat

The Notion docs correctly treat feedback as training data:

- like / dislike an outfit,
- "not my style",
- "already wore this recently",
- "prefer something traditional",
- "don't suggest this colour combination".

Store these as profile-scoped preferences and as signals on wear history. Do
not bury them in chat transcripts only; the ranking engine needs queryable
data.

### 9. Phasing

The proposed milestones are a sensible sequence:

1. **Know my wardrobe** — profiles, inventory search, actual item cards.
2. **Add clothes intelligently** — photo → draft → confirmation.
3. **Personal stylist** — outfit generation, occasion filters, feedback.
4. **Wardrobe intelligence** — unused items, duplicates, seasonal planning,
   purchase avoidance.

Ship 1 before 2, and 2 before 3. The current repository is at the end of
milestone 1: profiles, wardrobes and items are working; search is still basic.

## Corrections to the Notion material

These are the places where the documents should not be followed literally.

| Notion assumption | Repository reality | Recommended action |
| --- | --- | --- |
| Table `wardrobe_profile`, columns `display_name`, `relationship`, `profile_type` | Table `profile`, columns `name`, `is_default`, `color`, `avatar_url` | Keep `profile`; add `relationship`, `profile_type`, `date_of_birth` as nullable columns in a later migration. Do not rename tables for cosmetic parity. |
| `wardrobe.profile_id` uses `ON DELETE RESTRICT` | Current FK uses `ON DELETE CASCADE` | Keep cascade only because profile deletion is an explicit, confirmed action and already cleans Storage photos. If hard delete becomes a routine operation, switch to `RESTRICT` and make the API delete children first inside a transaction. |
| Unique index on `relationship = 'self'` | Partial unique index on `is_default` | Current constraint is better: it guarantees exactly one default profile per account without assuming every `self` profile is the default. Add `relationship` separately, without a unique constraint. |
| Filter items by joining `wardrobe_item` to `wardrobe` and checking `wardrobe.profile_id` | Items already carry `profile_id` and every query filters both `owner_uid` and `profile_id`; item updates also verify the target wardrobe belongs to the same profile | Keep the denormalized `profile_id` for direct queries. Add a database-level guarantee that `wardrobe_item.profile_id = wardrobe.profile_id` (composite FK or trigger) so the denormalization cannot drift. |
| Profile has `date_of_birth` | No DOB column | Add it only if age-based sizing or reminders need it. For children, `age_group` + clothing size is often enough and is less sensitive. Prefer `date_of_birth` nullable and never expose it in list responses by default. |
| AI service uses a plain `X-User-Id` / context header | No AI service yet; Bun has Firebase auth | Use the short-lived internal JWT design above when the service is introduced. |
| `POST /api/ai/...` lives on the AI service | Notion later puts the proxy on Bun | Expose `/api/ai/*` on Bun, sign the internal JWT there, and keep the Python service private. |
| `wardrobe_item_analysis` may be part of `wardrobe_item` | No analysis columns exist | Create a separate 1:1 table. Keep user-entered item fields authoritative; store AI predictions and confidence separately. |
| `drizzle-kit push` is a migration path | Repository uses reviewed SQL migrations and a staged backfill | Continue generating/reviewing SQL migrations. Never use `push` against a shared or production database. |
| In-memory LangGraph checkpointer is acceptable in examples | Not safe for restart or multi-worker deployments | Initialize one shared async PostgreSQL checkpointer at FastAPI startup; never per request. |
| Chat thread id identifies the user | Not an authorization mechanism | Add a `wardro_ai_thread` row with `owner_uid` + `profile_id`; verify both on every request. |
| AI can create items directly | Bun must be the only writer | Return a draft, require confirmation, then write through Bun in one transaction. |

Two more corrections that matter in practice:

- **Do not send the whole household wardrobe to the model.** Retrieve only the
  candidate items for the current profile and query.
- **Do not treat the Notion migrations as runnable as written.** They assume
  table and column names that differ from the repository and would create
  duplicate profile tables. Use the additive plan in
  [`data-model-assessment.md`](./data-model-assessment.md).

## What to adopt now, and what to defer

### Adopt now (low risk, high value)

1. Add optional profile metadata: `relationship`, `profile_type`, `age_group`.
   These make the household UI more expressive and cost nothing at read time.
2. Add a small set of item attributes that users can enter today:
   `subcategory`, `material`, `pattern`, `fit`, `sleeve_length`, `seasons`,
   `occasions`, `style_tags`. They can start as nullable columns or a JSONB
   `attributes` object; prefer columns if the app will filter on them.
3. Add `wardrobe_wear_history` and a simple "wore this today" action. This is
   the highest-value signal for future recommendations and is cheap to build.
4. Add `wardrobe_style_preferences` with profile-scoped JSONB arrays.
5. Add `wardrobe_outfit` + `wardrobe_outfit_item` for saved looks, even before
   AI generation. Manual outfits validate the schema and give users value.
6. Add `wardro_ai_thread` when the first AI endpoint lands, not before.

### Defer until the AI service exists

- `wardrobe_item_analysis` (vision output), `confidence`, `model_name`,
  `prompt_version`, `verified_by_user`.
- LangGraph checkpointer, internal JWT, Python service, Ollama deployment.
- Duplicate detection via embeddings.
- Automated outfit scoring and feedback loops.

### Explicitly avoid

- Renaming shipped tables to match the Notion draft.
- Duplicating profile ownership logic in Python.
- Letting the model write to the database.
- Using `drizzle-kit push` on shared databases.
- Storing exact children's birth dates unless a feature genuinely needs them.

## Open questions

1. **Where should item attributes live?** Separate
   `wardrobe_item_analysis` keeps AI output quarantined; direct columns are
   simpler for user-entered data. A hybrid — user attributes on the item,
   AI suggestions in the analysis table — is the recommended path.
2. **How much profile metadata is enough?** `relationship`, `profile_type` and
   an age band cover the household UI. Exact DOB is a privacy cost with little
   styling benefit.
3. **What is the first AI slice?** The highest-leverage first step is
   inventory search ("show me blue shirts for Arush"), which needs no vision
   model and proves the profile-scoped retrieval path.
4. **Manual outfits or AI outfits first?** Build manual outfits first; they
   exercise the same tables and constraints without model latency.

See [`data-model-assessment.md`](./data-model-assessment.md) for the concrete
schema plan and [`../../scripts/datasets/wardrobe-simulation/`](../../scripts/datasets/wardrobe-simulation/)
for the dataset used to test it.
