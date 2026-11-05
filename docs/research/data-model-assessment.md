# Data-model assessment

**Question:** does the simulation dataset show that the database model needs to
be rebuilt?

**Answer: no.** The existing hierarchy — `user` → `profile` → `wardrobe` →
`wardrobe_item` — is the right backbone, and the profile-scoped API is already
correct. The dataset exposes missing **attributes** and missing **event/history
tables**, not a broken core. Extend the schema additively; do not rename tables
or rewrite the profile relationship.

This assessment uses the 24-item, 4-profile dataset in
[`scripts/datasets/wardrobe-simulation/`](../../scripts/datasets/wardrobe-simulation/). The
seed imports only columns that exist today; the rest of the manifest is the
evidence for the proposals below.

## 1. What the current schema gets right

| Area | Current implementation | Why it holds |
| --- | --- | --- |
| Household ownership | `profile.owner_uid` → `user.uid` | One Firebase account owns many people without giving children logins. |
| Default profile | Partial unique index on `profile.is_default` where true | Guarantees one default per account; `ensureDefaultProfile` is idempotent. |
| Profile scoping | `wardrobe.profile_id` and `wardrobe_item.profile_id`, both `NOT NULL`, both indexed | Every query filters `owner_uid` + `profile_id`; cross-profile reads are rejected. |
| Direct item queries | Items carry `profile_id` as well as `wardrobe_id` | Avoids a join for the common “show my items” query. The API also verifies the target wardrobe belongs to the same profile on create/update. |
| Deletion | Cascade from profile → wardrobe → item | Profile delete is explicit; the API collects Storage photo URLs before the cascade and removes them after. |
| Editability | `PATCH` routes for wardrobes and items | The UI already relies on them. |

The current model is lean because the original product only needed “a photo and
a few facts”. That was a reasonable starting point. The dataset shows where
that stops being enough.

## 2. What the dataset exposes

### 2.1 Profiles

The manifest carries `relationship`, `profileType` and `ageGroup` for each
person:

```json
{
  "name": "Arush",
  "relationship": "child",
  "profileType": "child",
  "ageGroup": "8-10"
}
```

The current `profile` table has only `name`, `color`, `avatar_url` and
`is_default`. The UI can show the names, but it cannot:

- label a profile as a child or spouse,
- filter “show me the kids’ wardrobes”,
- choose age-appropriate styling or size guidance,
- decide whether a profile should be included in adult-only suggestions.

`relationship` and `profile_type` are cheap, stable metadata. `age_group` is
more useful than an exact birth date for styling and is less sensitive.

### 2.2 Wardrobes

The dataset uses wardrobe types (`work`, `casual`, `occasion`, `school`,
`sports`). The current `wardrobe` table has only `name` and `description`.
Type is not required for the app to function, but it makes grouping and
insights (“school wear”, “occasion wear”) queryable instead of string-matched.

### 2.3 Items

The manifest contains these attributes that the current `wardrobe_item` table
cannot store:

| Manifest field | Example | Why it matters |
| --- | --- | --- |
| `subcategory` | `Blazer`, `Ankle boots`, `Track pants` | `category` is too coarse for outfit logic. |
| `material` | `Wool blend`, `Linen`, `Denim` | Season and care recommendations; explains why two navy items behave differently. |
| `pattern` | `Plain`, `Floral`, `Side stripe` | Compatibility scoring; “plain + floral” is a real styling rule. |
| `fit` | `Regular`, `Relaxed`, `Flared` | Fit-sensitive suggestions and size guidance. |
| `sleeve` | `Short`, `Long`, `None` | Layering and weather logic. |
| `seasons` | `["monsoon"]`, `["autumn","winter"]` | “What can I wear in November?” |
| `occasions` | `["office","casual"]` | The single most important filter for recommendations. |
| `styleTags` | `["minimal","layering"]` | User-facing style language and preference matching. |

Examples from the dataset:

- `tiru-navy-blazer` is `Outerwear / Blazer`, `Wool blend`, `office`,
  `all-season`. The current schema knows only “Outerwear, Navy”.
- `adiran-yellow-raincoat` is `Outerwear / Raincoat`, `PU`, `monsoon`,
  `outdoor`. The current schema cannot answer “show me rainwear for Adiran”.
- `swati-red-trench` is `occasion` and `travel`, not office wear. The current
  schema has no occasion field, so any filter would have to guess from the
  name.

### 2.4 Events the schema cannot represent

The dataset is a snapshot. Real use produces events:

- “Tiru wore the navy blazer on 4 November.”
- “Swati disliked the red trench with the floral dress.”
- “This outfit was saved for a wedding.”
- “Arush has outgrown the 8Y jacket.”

There is nowhere to put those facts today. They are the raw material for
insights, cost-per-wear, duplicate detection and recommendations. Adding them
later is straightforward; retrofitting them after users have months of
uncaptured history is not.

## 3. Recommended target model

```
user
 └── profile                         (person; relationship, type, age band)
      ├── wardrobe                    (collection; type)
      │    └── wardrobe_item          (garment; attributes)
      │         ├── wardrobe_item_analysis      (AI draft, later)
      │         ├── wardrobe_wear_history       (events)
      │         └── wardrobe_outfit_item ──┐
      ├── wardrobe_style_preferences       │
      └── wardrobe_outfit ─────────────────┘
```

Keep the current tables and names. Add the following in phases.

### Phase 1 — profile and item metadata (do first)

**Profile metadata**

```sql
ALTER TABLE profile
    ADD COLUMN relationship text NOT NULL DEFAULT 'self',
    ADD COLUMN profile_type text NOT NULL DEFAULT 'adult',
    ADD COLUMN age_group text,
    ADD COLUMN date_of_birth date;

ALTER TABLE profile
    ADD CONSTRAINT profile_relationship_check
        CHECK (relationship IN ('self', 'spouse', 'child', 'parent', 'other')),
    ADD CONSTRAINT profile_type_check
        CHECK (profile_type IN ('adult', 'child', 'baby', 'other'));

CREATE INDEX profile_owner_relationship_idx
    ON profile (owner_uid, relationship);
```

- Backfill is automatic via the defaults.
- Keep `date_of_birth` nullable and omit it from list responses by default.
  Prefer `age_group` for children unless a real feature needs exact dates.
- `is_default` remains the single source of truth for the default profile;
  `relationship = 'self'` is descriptive, not a uniqueness constraint.

**Wardrobe type**

```sql
ALTER TABLE wardrobe
    ADD COLUMN type text;

ALTER TABLE wardrobe
    ADD CONSTRAINT wardrobe_type_check
        CHECK (type IS NULL OR type IN (
            'work', 'casual', 'occasion', 'school', 'sports', 'travel', 'other'
        ));
```

**Item attributes**

```sql
ALTER TABLE wardrobe_item
    ADD COLUMN subcategory text,
    ADD COLUMN material text,
    ADD COLUMN pattern text,
    ADD COLUMN fit text,
    ADD COLUMN sleeve_length text,
    ADD COLUMN seasons jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN occasions jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN style_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE wardrobe_item
    ADD CONSTRAINT wardrobe_item_seasons_array
        CHECK (jsonb_typeof(seasons) = 'array'),
    ADD CONSTRAINT wardrobe_item_occasions_array
        CHECK (jsonb_typeof(occasions) = 'array'),
    ADD CONSTRAINT wardrobe_item_style_tags_array
        CHECK (jsonb_typeof(style_tags) = 'array');

CREATE INDEX wardrobe_item_core_filter_idx
    ON wardrobe_item (owner_uid, profile_id, category, color);

CREATE INDEX wardrobe_item_seasons_gin_idx
    ON wardrobe_item USING gin (seasons);

CREATE INDEX wardrobe_item_occasions_gin_idx
    ON wardrobe_item USING gin (occasions);

CREATE INDEX wardrobe_item_style_tags_gin_idx
    ON wardrobe_item USING gin (style_tags);
```

Why JSONB arrays first?

- The values are small, read-mostly lists.
- GIN indexes support containment queries (`occasions @> '["office"]'`).
- It avoids two join tables before the query patterns are proven.
- If the app needs per-value counts, translations or referential integrity,
  normalize later into `wardrobe_item_occasion` / `wardrobe_item_season`
  lookup tables. That is a mechanical migration, not a redesign.

**Protect the denormalized profile id**

`wardrobe_item.profile_id` is deliberately duplicated from its wardrobe. Add a
composite foreign key so the two cannot drift:

```sql
CREATE UNIQUE INDEX wardrobe_id_profile_unique
    ON wardrobe (id, profile_id);

CREATE UNIQUE INDEX wardrobe_item_id_profile_unique
    ON wardrobe_item (id, profile_id);

ALTER TABLE wardrobe_item
    ADD CONSTRAINT wardrobe_item_wardrobe_profile_fk
    FOREIGN KEY (wardrobe_id, profile_id)
    REFERENCES wardrobe (id, profile_id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED;
```

- `DEFERRABLE INITIALLY DEFERRED` lets a transaction move a wardrobe and its
  items to another profile in one unit (useful for the seed reconciliation and
  future “move person” flows).
- The existing single-column FKs can stay; the composite constraint adds the
  consistency guarantee. If you prefer a smaller schema, drop the redundant
  `wardrobe_item.wardrobe_id` FK and keep the composite one.
- Add an API test that attempts to create an item in a wardrobe belonging to a
  different profile and expects a 4xx.

### Phase 2 — wear history, preferences, manual outfits

These are useful before any AI work and validate the schema cheaply.

**Wear history**

```sql
CREATE TABLE wardrobe_wear_history (
    id bigserial PRIMARY KEY,
    owner_uid text NOT NULL
        REFERENCES "user"(uid) ON DELETE CASCADE,
    profile_id integer NOT NULL
        REFERENCES profile(id) ON DELETE CASCADE,
    wardrobe_item_id integer NOT NULL,
    worn_at timestamptz NOT NULL DEFAULT now(),
    occasion text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (wardrobe_item_id, profile_id)
        REFERENCES wardrobe_item (id, profile_id)
        ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX wear_history_profile_date_idx
    ON wardrobe_wear_history (profile_id, worn_at DESC);

CREATE INDEX wear_history_item_date_idx
    ON wardrobe_wear_history (wardrobe_item_id, worn_at DESC);
```

- Do not make `(item, day)` unique: a person can wear the same jacket twice in
  a day, and a unique constraint would force awkward editing.
- For “last worn” and “unused” queries, aggregate with `max(worn_at)`.
- Cost per wear = item price ÷ wear count; compute on read, do not store.

**Style preferences**

```sql
CREATE TABLE wardrobe_style_preferences (
    profile_id integer PRIMARY KEY
        REFERENCES profile(id) ON DELETE CASCADE,
    preferred_colors jsonb NOT NULL DEFAULT '[]'::jsonb,
    preferred_styles jsonb NOT NULL DEFAULT '[]'::jsonb,
    preferred_occasions jsonb NOT NULL DEFAULT '[]'::jsonb,
    disliked_colors jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Manual outfits**

```sql
CREATE TABLE wardrobe_outfit (
    id serial PRIMARY KEY,
    owner_uid text NOT NULL
        REFERENCES "user"(uid) ON DELETE CASCADE,
    profile_id integer NOT NULL
        REFERENCES profile(id) ON DELETE CASCADE,
    name text NOT NULL,
    occasion text,
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX wardrobe_outfit_id_profile_unique
    ON wardrobe_outfit (id, profile_id);

CREATE INDEX wardrobe_outfit_profile_idx
    ON wardrobe_outfit (profile_id, created_at DESC);

CREATE TABLE wardrobe_outfit_item (
    outfit_id integer NOT NULL,
    wardrobe_item_id integer NOT NULL,
    profile_id integer NOT NULL,
    PRIMARY KEY (outfit_id, wardrobe_item_id),
    FOREIGN KEY (outfit_id, profile_id)
        REFERENCES wardrobe_outfit (id, profile_id)
        ON DELETE CASCADE,
    FOREIGN KEY (wardrobe_item_id, profile_id)
        REFERENCES wardrobe_item (id, profile_id)
        ON DELETE CASCADE
);
```

The redundant `profile_id` in `wardrobe_outfit_item` is what makes “all items
belong to the same profile as the outfit” a database guarantee instead of an
application convention.

### Phase 3 — AI analysis and threads (when the AI service lands)

Do not add these before there is a service to write them; unused tables rot.

**Item analysis**

```sql
CREATE TABLE wardrobe_item_analysis (
    wardrobe_item_id integer PRIMARY KEY
        REFERENCES wardrobe_item(id) ON DELETE CASCADE,
    garment_type text,
    subcategory text,
    primary_color text,
    secondary_colors jsonb NOT NULL DEFAULT '[]'::jsonb,
    pattern text,
    material text,
    fit text,
    sleeve_length text,
    occasions jsonb NOT NULL DEFAULT '[]'::jsonb,
    seasons jsonb NOT NULL DEFAULT '[]'::jsonb,
    style_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
    confidence jsonb NOT NULL DEFAULT '{}'::jsonb,
    model_name text,
    prompt_version text,
    verified_by_user boolean NOT NULL DEFAULT false,
    analyzed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wardrobe_analysis_type_idx
    ON wardrobe_item_analysis (garment_type);

CREATE INDEX wardrobe_analysis_color_idx
    ON wardrobe_item_analysis (primary_color);
```

- Keep user-entered values on `wardrobe_item`; AI predictions live here.
- Never overwrite user corrections with a later analysis run.
- `verified_by_user` starts `false`; the UI promotes a draft only after
  confirmation.
- `confidence` is JSONB because different fields can have different scores.

**AI threads**

```sql
CREATE TABLE wardro_ai_thread (
    id uuid PRIMARY KEY,
    owner_uid text NOT NULL
        REFERENCES "user"(uid) ON DELETE CASCADE,
    profile_id integer NOT NULL
        REFERENCES profile(id) ON DELETE CASCADE,
    title text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wardro_ai_thread_profile_idx
    ON wardro_ai_thread (profile_id, updated_at DESC);
```

- Generate the UUID in the application (or enable `pgcrypto` and use
  `gen_random_uuid()`).
- Verify `owner_uid` and `profile_id` on every chat request. The LangGraph
  thread id is not an authorization token.
- Do not store Firebase tokens or raw image bytes here.

### Phase 4 — later, only if needed

- `wardrobe_item_photo` for multiple photos per item (primary + ordered
  alternates). Current single `photo_uri` is enough for the simulation.
- Duplicate detection via image embeddings.
- A taxonomy lookup table with translations and aliases.
- Normalized occasion/season tables if JSONB filtering becomes insufficient.

## 4. API implications

### Profiles

Extend the existing `GET/POST/PATCH /api/profiles` payloads with
`relationship`, `profileType`, `ageGroup` and optional `dateOfBirth`. Keep
`isDefault` and the current delete protections. Do not expose exact birth dates
in list responses unless a screen needs them.

### Items

`POST/PATCH /api/wardrobeItems` should accept the new attributes. Validation
should use a shared taxonomy module so the mobile app and backend agree on
allowed values. Start permissive (free text for `subcategory`, `material`,
`pattern`, `fit`, `sleeve_length`) and tighten later; do not block imports on a
new enum.

Suggested filters for `GET /api/wardrobeItems`:

```
?wardrobeId=&category=&subcategory=&color=&season=&occasion=&styleTag=&q=
```

- `season` / `occasion` / `styleTag` map to JSONB containment.
- `q` searches `item_name`, `brand` and `notes`; add a trigram index if it
  becomes slow.

### Wear history

```
POST /api/wardrobeItems/:id/wear
GET  /api/profiles/:id/wear-history?from=&to=
```

The POST body: `{ wornAt?, occasion?, notes? }`. The server derives
`owner_uid` and `profile_id` from auth + `X-Profile-Id`, and verifies the item
belongs to that profile. Return the item’s wear count and last-worn date.

### Insights

```
GET /api/profiles/:id/insights
```

Start with deterministic aggregates:

- item count by category,
- total wardrobe value,
- items never worn,
- items not worn in 90 days,
- cost per wear for the top items,
- count by season/occasion.

### Outfits

```
GET/POST/PATCH/DELETE /api/outfits
POST /api/outfits/:id/items
DELETE /api/outfits/:id/items/:itemId
```

Build manual outfits first. They exercise the constraints and give the AI a
real target format later.

### AI (later)

Proxy `/api/ai/*` through Bun. Bun verifies Firebase auth and profile
ownership, signs a short-lived internal JWT, and calls the Python service.
Never expose the Python service publicly. Every AI response that proposes an
item or outfit is a draft; the write goes through the existing Bun APIs.

## 5. Migration and rollout

1. **Branch and back up.** Generate SQL with `drizzle-kit generate`, review it,
   and apply it to a Neon branch first. Do not use `drizzle-kit push` against
   shared or production data.
2. **Apply Phase 1** (profile metadata, wardrobe type, item attributes,
   consistency constraint). All new columns are nullable or defaulted; no
   backfill is required.
3. **Update Drizzle schema and TypeScript types** in the same change.
4. **Extend the API validators** and the mobile forms. Keep old clients working
   by treating missing fields as `null` / `[]`.
5. **Seed/verify with the simulation dataset.** The manifest supplies values
   for every new field; the seed script only writes columns that exist, so
   expand it as the migrations land.
6. **Apply Phase 2** (wear history, preferences, outfits) and add the
   “wore this today” action.
7. **Add Phase 3** only when the AI service is ready.

### Acceptance checks

- `profile` still has exactly one default per owner after the migration.
- No `wardrobe_item` has a `profile_id` different from its wardrobe’s.
- Existing wardrobes/items counts are unchanged.
- Creating an item in another profile’s wardrobe returns 4xx.
- Filtering by `occasion=office` returns only matching items.
- Wear history for a profile never returns another profile’s items.
- An outfit cannot contain an item from another profile.
- Deleting a profile still cascades and removes its Storage photos.
- The mobile item form can save and reload the new attributes.

## 6. Risks and trade-offs

| Risk | Mitigation |
| --- | --- |
| Denormalized `profile_id` drifts | Composite FK, as above; add a test. |
| Free-text taxonomy becomes inconsistent | Shared validation module now; lookup table later. |
| JSONB arrays are hard to join | GIN indexes for containment; normalize only if per-value joins are needed. |
| Exact children’s birth dates are sensitive | Prefer `age_group`; keep DOB nullable and out of list responses. |
| Cascade delete removes a person’s history | Keep delete explicit and confirmed; archive/export can be added later. |
| AI writes bypass profile checks | Bun-only writes; internal JWT; Python has no DB credentials. |
| Migration locks a large table | Neon branch test; add columns with defaults is metadata-only in modern Postgres; create indexes concurrently if the table is large. |

## 7. Verdict

- **Keep** the `user` → `profile` → `wardrobe` → `wardrobe_item` hierarchy.
- **Keep** `profile_id` on both wardrobes and items, but add the composite FK
  that makes the duplication safe.
- **Add** profile metadata and item attributes in Phase 1.
- **Add** wear history, preferences and manual outfits in Phase 2. These are
  the highest-value additions and do not depend on AI.
- **Defer** `wardrobe_item_analysis`, AI threads and the Python service until
  there is a concrete AI endpoint to test.
- **Do not** rename shipped tables to match the Notion draft, and do not let
  AI write directly to the database.

The dataset supports this conclusion: every extra field in the manifest is a
field the current schema cannot express, yet none of them require changing the
core ownership model. This is an additive evolution, not a rebuild.

## Related

- [Notion research synthesis](./notion-synthesis.md)
- [Simulation dataset README](../../scripts/datasets/wardrobe-simulation/README.md)
- [Multi-profile implementation notes](../../mobile-rn/docs/multi-profile.md)
- [Screen architecture](../../mobile-rn/docs/screen-architecture.md)
