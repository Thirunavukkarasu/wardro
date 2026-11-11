# Features and backlog

The single product document is [`PRD.md`](PRD.md); this file is the detailed
feature backlog behind it.

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
- **Bulk draft allowance** — `POST /api/ai/item-draft` allows 30 requests per
  minute, enough for a 10-photo batch plus retries.
- **Minimal bulk import** — select up to 10 photos, draft two at a time,
  review cards with include/skip, detect duplicates against the active profile
  using normalized attributes, and choose Skip / Add anyway / Update existing.
  Saves are per item and default dates to today / today + 1 year.
- **Add hub** — `/(root)/add-item` is the front door for creating an item. It
  groups the methods that exist into “One at a time” (camera, photos, website,
  typing) and “Or all at once” (bulk photos). The FAB, Today quick actions and
  the Closet empty state open the hub; wardrobe detail forwards its wardrobe.
  Editing an item still opens the form directly.
- **In-app web importer** — `/(root)/web-import` is a `react-native-webview`
  browser. “Add this page” sends the current URL through the existing
  `POST /api/ai/item-draft` pipeline; “Capture” screenshots the visible page
  and sends it through the vision draft. Both hand a finished draft to the
  item form. Single item only; listing multi-scan is not built.
- **Draft handoff** — the item form accepts a picked photo in memory (camera
  and photo library) or a serialized draft in route params (web importer), so
  the Add hub does not duplicate the form's work.

## Bulk photo import (up to 10) — minimal version shipped

The first version ships the smallest useful flow:

- `expo-image-picker` multi-select, limited to 10 photos.
- Two draft requests in flight; the existing `POST /api/ai/item-draft` is used
  one photo at a time.
- Review cards show the generated name/details, status and a duplicate prompt.
- Duplicate choices: **Skip**, **Add anyway**, **Update existing**.
- Duplicate matching uses normalized attributes (`itemName`, brand, category,
  colour, size) against the active profile and against earlier drafts in the
  same batch.
- Per-item save with a success/error result; purchase date defaults to today
  and expiry to today + 1 year.
- Entry point: Add Item → “Bulk import up to 10 photos”.

Not included yet: photo hashes, embeddings, backfill, inline field editing in
the review screen, server-side batch processing, and hash-based dedupe.

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

### Processing strategy

**Recommended for v1: one request per photo, with 2–3 calls in flight.**

Sending all 10 images in one model call is technically possible — the AI SDK
supports multiple file parts, and the configured model has vision and a 1M
context — but it is a worse fit for this flow:

- **Association:** the model must return exactly 10 drafts in image order. A
  single merge, skip or reorder corrupts the batch.
- **Isolation:** one bad image or one malformed draft fails the whole call.
  Per-photo calls can retry only the failure.
- **Progress:** the UI can show each photo becoming ready. One call gives one
  long wait.
- **Prompt caching:** the shared system prompt is cacheable across the
  per-photo calls, so the repeated prompt is cheap.
- **Cost:** image tokens dominate; 10 separate calls are not meaningfully more
  expensive than one batch call.

If a server-side batch is added later, send 2–3 images per request with an
`imageIndex` in each draft and validate the count and order. Do not start with
10 full-resolution images in one context.

**Optimisations**

- Downscale/compress before sending: ~768–1024 px on the longest side and JPEG
  quality ~0.8 is enough for garment classification. Add
  `expo-image-manipulator` for this.
- Read base64 lazily per photo rather than holding all 10 in memory.
- Concurrency 2–3; do not fire all 10 at once.
- Keep the system prompt static and cacheable; keep the per-photo message short.
- Deduplicate within the batch by photo hash before calling the model.
- Raise the draft endpoint limit to 30 requests/minute (done) to allow 10
  photos plus retries.

## Duplicate detection

**Implemented in the minimal bulk flow:** normalized attribute matching against
the active profile, with Skip / Add anyway / Update existing. The photo-hash
and embedding layers below are the next slice.

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
- When a duplicate is found, present three explicit choices: **Skip**, **Add
  anyway**, or **Update existing**. The app should show the existing item’s
  name/photo and let the user decide; never silently merge or overwrite.

### Scope and save semantics (decided)

- Duplicate checks are scoped to the **active profile only**. The same garment
  may legitimately belong to two profiles.
- Bulk save is **per item**, with a success/error result per card. One failure
  does not discard the rest of the batch.
- Duplicate prompts let the user choose Skip, Add anyway, or Update existing.
- Drafts stay in memory until the user confirms; no DB writes before review.
- Backfill existing item hashes so old photos participate in exact-photo
  matching.

### Backfill

Existing items have no hash. Add a one-off script that reads each managed
photo from GCS, computes the hash and updates the row. Until then, attribute
matching still works; exact-photo matching applies to new imports.

## Proposed: Store purchase import

**Goal:** import past online purchases (Amazon, SHEIN, ZARA, ASOS) as item
drafts, using a store picker similar to the reference flow.

**Feasibility:** the “sign in and navigate to your purchase history” flow is
technically possible with an in-app browser/WebView and visible-page
extraction, but it is fragile and legally sensitive:

- Consumer stores expose no general purchase-history API.
- Login pages use MFA, captcha and bot protection; some block embedded
  browsers or third-party OAuth providers.
- Store HTML changes break per-store parsers.
- Automated extraction may conflict with a store's terms; legal review is
  required.
- Never capture or store store passwords. Use the store's own login page and
  keep the session isolated.

**Recommended order**

1. **Order/product link paste** — share an order or product URL; reuse the
   existing URL-import pipeline. Lowest risk, works today for product pages.
   **The in-app browser now provides the page-side half of this:** “Add this
   page” is the link path, and “Capture” is the fallback when the extractor is
   blocked.
2. **Email receipt import** — a forwarding address or a read-only mailbox
   connection (Gmail/Outlook) with explicit consent. Receipt emails are more
   stable than order-page HTML and can be parsed with the AI model.
3. **Listing multi-scan** — one screenshot of a store page, many detected
   products, review list, bulk add. This is Acloset’s “Auto Scan” behaviour. It
   needs a multi-item vision endpoint (the current draft endpoint returns one
   item) and the review additions listed under the bulk-import open questions.
4. **In-app store purchase-history flow** — the reference screenshot. Pilot one
   store first, user-initiated, no credential capture, visible-order extraction,
   with a clear disclaimer and a manual fallback.
5. **Browser extension** — later, for desktop purchase-history capture.

**Data to add when this lands:** `source_store`, `source_order_id`,
`source_url`, `purchased_at`, `order_total`; dedupe by order id plus item
signature.

**Status:** The in-app browser and single-page import are built; listing
multi-scan, email receipt import and store purchase-history import are not.
The product should not promise four-store support until at least one reliable
path is validated.

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
   per-item save. **(done — attribute-only duplicate check)**
6. Raise the AI draft rate limit for bulk batches. **(done — 30/minute)**
