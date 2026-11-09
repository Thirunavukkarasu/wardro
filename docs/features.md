# Features and backlog

Status values: **Done**, **In progress**, **Proposed**, **Later**.

## Done

- **AI item auto-fill** — `POST /api/ai/item-draft` turns a photo or product
  URL into a validated draft. It never writes wardrobe rows; the user reviews
  and saves through the normal item endpoints.
- **Automatic photo scan** — choosing or taking a photo in Add Item starts the
  vision draft automatically. The Scan photo button remains as a retry.
- **URL import** — public product pages are fetched with SSRF guards, metadata
  and JSON-LD are extracted, and the product image can be copied to GCS.
- **Structured output** — the AI SDK `generateText` + `Output.object` path
  validates the draft against a Zod schema, with a plain-text fallback.
- **Path-only photo storage** — the database stores the GCS object path and API
  responses expand it into a signed photo URL.
- **Build details** — Profile → About this build shows version, build profile,
  build time, commit, API URL and package.
- **Item form options** — category, colour and size dropdowns merge fixed
  values with values already used in the active profile; custom values are
  allowed. New items default to purchase date = today and expiry = today + 1
  year.

## Proposed: Bulk photo import (up to 10)

**Goal:** select 4–10 photos in one action, draft each item, review them, and
save the selected ones without touching the single-item flow.

**Why a separate flow:** bulk needs a review grid, per-photo progress and
duplicate decisions. Adding that to the current Add Item form would make the
single-item path harder to use.

**Flow**

1. Entry point: **Import multiple** from Today/Closet, opening a separate
   `/(root)/bulk-import` route. Keep Add Item as it is.
2. Pick up to 10 photos with `expo-image-picker`:
   `allowsMultipleSelection: true`, `selectionLimit: 10`. The web picker
   supports `multiple` but ignores `selectionLimit`, so the app slices the
   result to 10 and tells the user.
3. Show a card per photo with thumbnail, progress and the generated draft.
4. Process 2–3 photos at a time, each through `POST /api/ai/item-draft`.
   One image per request; no new batch endpoint is required for v1.
5. Run the duplicate check before showing the review (see below).
6. Review: include/exclude each item, edit its fields, and see duplicate
   warnings.
7. Save included items through the existing `POST /wardrobeItems`; upload each
   photo through `/api/photos`. Show a per-item success/error summary.
8. Do not write drafts to the database before confirmation.

**API impact**

- `POST /api/ai/item-draft` already accepts one base64 image; the client can
  fan out with a concurrency limit.
- The current 15 requests/minute limit is too low for 10 photos plus retries.
  Add a bulk allowance or a separate limit for the bulk screen.
- A future `POST /api/ai/item-drafts` batch endpoint could move the fan-out
  server-side; not needed for the first version.

**Limits and risks**

- 10 photos, 10 MB each, 120 seconds per draft.
- Ten vision calls per batch; show progress and allow partial failure.
- Base64 images are memory-heavy on mobile; process a few at a time.
- The app must not silently drop photos if one draft fails.

## Proposed: Duplicate detection

**Goal:** avoid adding the same garment repeatedly under the same profile.

### Signals, cheapest first

1. **Perceptual photo hash (v1)** — compute a 64-bit dHash/pHash for every
   item photo. A Hamming distance of 0–5 means the same or a nearly identical
   image. This catches the same photo being re-selected, uploaded twice, or
   imported twice from the same product image.
2. **Normalized attributes (v1)** — compare trimmed, case-insensitive
   `itemName`, `brand`, `category`, `color` and `size`. Exact matches are
   strong; fuzzy matches (trigram/Levenshtein) can produce a warning.
3. **Normalized source URL (v1)** — for URL imports, strip tracking query
   parameters and compare the canonical product URL.
4. **Image/text embeddings (Later)** — CLIP-style embeddings in pgvector for
   “same garment, different photo” detection. This needs a model, a vector
   column, backfill and threshold tuning. Add it only if pHash + attributes
   leave too many false negatives.

### Storage

We already store the original image in GCS for display. Duplicate detection
does **not** require storing images twice or storing embeddings in v1:

- Add `wardrobe_item.photo_hash` (64-bit hex, text) and
  `photo_hash_algo` (`dhash64`).
- Add `wardrobe_item.source_url` (nullable) for URL imports.
- Optionally add `import_source` (`manual`, `photo`, `url`, `bulk`).
- A hash is 8 bytes per item; embeddings would be ~2 KB each and are deferred.

Additive migration, reviewed before applying. Never use `drizzle-kit push`
against a shared database.

### Computing and checking

- Compute the hash server-side:
  - on `/api/photos` upload, from the uploaded buffer;
  - on `/api/ai/item-draft` for base64 images;
  - on URL import, from the downloaded product image.
- Return `photoHash` with the upload/draft response, and accept it on
  `POST`/`PATCH /wardrobeItems`.
- Add `POST /api/wardrobeItems/duplicate-check` with
  `{ photoHash, itemName, brand, category, color, size, sourceUrl }` returning
  `{ matches: [{ id, itemName, reason, score }] }`.
- For a profile’s current item counts, compare hashes in JS after selecting the
  profile’s rows. An exact-match index on `photo_hash` helps; Hamming scans are
  fine at this scale.
- Within a bulk batch, compare hashes before calling the AI to avoid paying
  for duplicate drafts.

### UX

- **Warn, do not hard-block.** The user can always choose “Add anyway”.
- Exact photo-hash match: “You already have this photo”, with the existing
  item’s name and a default of **Skip**.
- Attribute match: “Possible duplicate”, with the existing item.
- In bulk import, duplicates start unchecked.

### Backfill

Existing items have no hash. Add a one-off script that reads each managed
photo from GCS, computes the hash and updates the row. Until then, attribute
matching still works; exact-photo matching applies to new imports.

## Open questions

- Should a duplicate update the existing item instead of adding a new one
  (for example, refresh price or photo)?
- Should duplicates be checked only within the active profile, or across all
  profiles in the account? Current recommendation: active profile only; the
  same jacket may legitimately belong to two people.
- Should bulk save be one transaction or per-item? Current recommendation:
  per-item, with a clear success/error summary, so one failure does not discard
  the rest.
- Should the duplicate warning show the existing item’s photo and a
  “View item” link? Recommended.
- Do we need semantic embeddings now? Current recommendation: no; ship pHash
  and attribute matching first and measure false negatives.

## Recommended first slice

1. Add `photo_hash` (and `source_url`) with a reviewed migration.
2. Add the server-side hash helper and return `photoHash` from uploads/drafts.
3. Add the duplicate-check endpoint and tests for hash and attribute matches.
4. Add the backfill script for existing photos.
5. Add the bulk-import screen with multi-select, concurrency 2, review and
   per-item save.
6. Raise the AI draft rate limit for bulk batches.
