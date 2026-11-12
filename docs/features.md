# Features and backlog

The single product document is [`PRD.md`](PRD.md); this file is the detailed
feature backlog behind it.

Status values: **Done**, **In progress**, **Proposed**, **Later**.

## Done

- **AI item auto-fill** — `POST /api/ai/item-draft` turns a photo or product
  URL into a validated draft. It never writes wardrobe rows; the user reviews
  and saves through the normal item endpoints.
- **Automatic photo scan** — choosing or taking a photo in Add Item starts the
  vision draft automatically. A "Try again" action appears in the scan status
  row if the model fails.
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
- **Universal review** — every add source produces rows in
  `/(root)/review` (the “Review items” screen): camera, photo library,
  web Capture, web Auto Scan, and later email. Local photos are drafted two at
  a time; server drafts arrive ready with a `photoPath`. The review supports
  include/skip, select all, delete selected, duplicate choices (Skip / Add
  anyway / Update existing) and one “Add N to closet” commit with per-item
  results. Dates default to today / today + 1 year.
- **Add hub** — `/(root)/add-item` is the front door for creating items. It
  offers Take a photo (one at a time), Choose photos (up to 10 at once), From a
  website and Type it in. There is no separate bulk option: every source feeds
  the same review list. The FAB, Today quick actions and the Closet empty state
  open the hub; wardrobe detail forwards its wardrobe. Editing an item still
  opens the form directly.
- **In-app web importer** — `/(root)/web-import` is a `react-native-webview`
  browser. “Auto Scan” sends the current URL through the existing
  `POST /api/ai/item-draft` pipeline; “Capture” screenshots the visible page
  and sends it through the vision draft. Both land in the shared review list.
  The browser validates addresses, keeps session cookies and storage, shows
  loading progress, supports back/forward/reload, opens non-web schemes and
  downloads in the system browser, and clears errors on the next load. The
  start screen keeps the last eight visited URLs locally, per profile, with a
  Clear action. Single item per action; listing multi-scan is not built.
- **Review handoff** — sources hand rows to the review through an in-memory
  store (`lib/pending-review.ts`) because photos carry base64; server drafts
  also carry a bucket `photoPath`.

## Review and add (up to 10)

- `expo-image-picker` multi-select, limited to 10 items per review.
- Every source lands here: camera, photo library, web Capture, web Auto Scan.
- Two draft requests in flight for local photos; the existing
  `POST /api/ai/item-draft` is used one photo at a time.
- Server-drafted rows (Auto Scan) arrive ready with a `photoPath`.
- Review cards show the generated name/details, status and a duplicate prompt.
- Duplicate choices: **Skip**, **Add anyway**, **Update existing**.
- Duplicate matching uses normalized attributes (`itemName`, brand, category,
  colour, size) against the active profile and against earlier drafts in the
  same review.
- Select all, delete selected, and one “Add N to closet” commit with a
  success/error result per item; purchase date defaults to today and expiry to
  today + 1 year.
- Entry points: Add hub → Take/Choose photos; web importer → Capture or Auto
  Scan; “Add photos” / “Take a photo” in the review appends up to 10.

Not included yet: photo hashes, embeddings, backfill, inline field editing in
the review screen, server-side batch processing, hash-based dedupe, and the
DOM-based listing scan.

**Why a review:** one photo or ten needs the same draft, duplicate and
confirmation step, so every add source uses the same review screen instead of
branching between a form and a batch flow.

**Flow**

1. The Add hub opens a source: camera, photo library, website or typing.
2. Every source creates rows (up to 10) in `/(root)/review`.
3. Local photos are drafted 2 at a time through `POST /api/ai/item-draft`;
   server drafts (Auto Scan) arrive ready with a `photoPath`.
4. Run the duplicate check before showing the review (see below).
5. Review: include/skip, select all, delete and duplicate choices.
6. “Add N to closet” saves the included rows through `POST /wardrobeItems` and
   uploads local photos through `/api/photos`; show a per-item summary.
7. Do not write drafts to the database before confirmation.

**API impact**

- `POST /api/ai/item-draft` already accepts one base64 image; the client can
  fan out with a concurrency limit.
- The current 15 requests/minute limit is too low for 10 photos plus retries.
  Add a review allowance or a separate limit for the review screen.
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
- In the review, duplicates start unchecked.
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
   item) and the review additions listed under the review open questions.
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

## Proposed: Outfit split and two-phase cutout

**Status:** Proposed, not implemented. One photo produces one draft today;
the review has no split or cutout step.

**Goal:** a worn photo can produce several item rows (top, pants, footwear)
with a usable item photo, without asking the user to take three pictures. The
split is automatic and synchronous; a clean cutout is optional and on demand.

### Phase 1 — synchronous split

Extend `POST /api/ai/item-draft` (or add `POST /api/ai/item-drafts`) to return
a list. One vision call per photo, not one call per item.

Each returned item adds:

```ts
bbox?: { x: number; y: number; w: number; h: number } // normalized 0–1
sourcePhotoKey?: string
```

The model also returns an explicit item count and a `lowerWearSeparate` flag,
so a dress or jumpsuit is not split into top + pants. Ask it to split only
mostly visible garments, and cap items per photo at 4.

Client behaviour:

- Crop each `bbox` from the **original** local file with
  `expo-image-manipulator`, adding ~6% padding. Detect on the downscaled copy;
  crop from the original so the crop does not inherit the downscale.
- One selected photo may create several rows. Cap total rows at `MAX_ITEMS`
  (10), not picked photos.
- Keep `sourcePhotoKey` and `bbox` on the row for recrop and phase 2.
- A single-item photo (flat-lay, hanger, product page) keeps the existing
  one-row path and is not cropped.

Why sync here: the VLM call already dominates (2–10 s), cropping is local and
free, and the review screen already tolerates a few seconds with a progress
state. No new infrastructure.

### Phase 2 — cutout API (on demand)

`POST /api/ai/cutout` receives the **crop**, not the full-body photo:

```ts
// request
{ imageBase64: string, contentType: string, cropHash: string }
// response
{
  cutoutBase64: string,
  contentType: "image/png",
  width: number,
  height: number,
  maskBox: { x: number; y: number; w: number; h: number }
}
```

- Return base64 for v1. It matches how local photos are held in memory until
  commit and avoids orphaned pending objects in GCS.
- Timeout 30 s, 10 requests/minute per user, concurrency 2 for batch actions.
- Cache by `cropHash`; a repeated tap returns the cached result.
- The Bun backend calls `wardro-agent` (`POST /vision/cutout`) or a serverless
  GPU provider. The AI service returns an image; it never writes wardrobe rows
  (invariant 3).

Clean the mask server-side before returning: keep the largest connected
component, drop components touching the crop border (background leakage), and
feather alpha 1–2 px. Without this, the cutout can look worse than the crop.

Model candidate: `sayeed99/segformer_b3_clothes` (SegFormer-B3, MIT). A
2026-11-11 test on a real worn photo found the top/upper-clothes masks agree at
IoU 0.975 and pants at 0.915, with ~2.5 s per image on CPU. `fashn-human-parser`
agreed closely but has no shoe class and inherits the NVIDIA Source Code
License; use it for QA only, not as a shipped dependency without a license
review.

### Review UX

- Tapping a row thumbnail opens a full-screen sheet with pinch, pan and
  double-tap zoom. Do **not** run the cutout on open, pinch or zoom.
- Bottom bar: **Adjust crop** (local, instant) and **Cut out** (server). Use
  `Crop` and `Scissors`/`Wand2` from `lucide-react-native`, with 44 px tap
  targets and accessibility labels.
- After a successful cutout show an **Original | Cutout** toggle and a **Use
  original** action. Never replace the crop silently.
- While the cutout runs, keep the original visible and the row usable. On
  failure keep the original and show an inline retry; never block the commit.
- Show a small "Cutout" badge on the row after success. Surface the action
  prominently only for rows that carry a `bbox` (split rows); keep it
  secondary for single-item photos.
- "Cut out all" in the review header is a later addition: only when at least
  two split rows exist, processed 2 at a time.

### Data model (additive)

- `wardrobe_item.original_photo_path` (text, nullable) — the pre-cutout crop.
- `wardrobe_item.photo_crop` (jsonb, nullable) — normalized `{ x, y, w, h }`.
- Optional `wardrobe_item.photo_source` (`split`, `manual`, `url`, `bulk`) for
  provenance.
- `photoPath` remains the displayed photo: the cutout when chosen, otherwise
  the crop.
- `PendingReviewItem` / `ReviewRow` add `cutout`, `sourcePhotoKey` and `bbox`.
- Hash the **crop**, not the shared source photo, so three items from one
  capture do not falsely match each other. Keep a separate source hash only if
  re-import detection is needed.

The migration is additive and reviewed; never use `drizzle-kit push`. See
[`docs/research/data-model-assessment.md`](research/data-model-assessment.md).

### Privacy

Phase 2 sees only the item crop. Keep the full-body source in GCS only when
provenance needs it, treat it as sensitive, and default to retaining it only
when the user keeps the source photo.

### Rejected alternatives

- **Generic cloud vision** (Google Vision, AWS Rekognition, Azure AI Vision):
  object boxes and coarse labels, not garment masks or garment taxonomy.
- **Product background-removal APIs** (remove.bg, Photoroom, Clipping Magic):
  they cut out one subject and do not separate a top from pants. Useful only
  after a crop.
- **ML Kit Subject Segmentation**: on-device and private, but person-level. A
  person wearing three garments is one subject, with no labels and no prompt.
  Useful for foreground isolation, not splitting.
- **Segmentation inside the sync request**: ~2.5 s CPU plus the torch runtime
  and cold starts, for a result that only improves the thumbnail. Keep it out
  of the critical path.

### First slice

1. Phase 1: list response with `bbox` and the client-side crop from the
   original.
2. Review rows grouped by source photo, with recrop.
3. `POST /api/ai/cutout` with mask cleanup and caching.
4. Expanded-photo sheet with Adjust crop / Cut out and the Original | Cutout
   toggle.
5. "Cut out all" only after the on-demand path is proven.

### Acceptance criteria

1. One worn photo with a top and pants creates two review rows with separate
   crops; a dress creates one.
2. A single-item photo behaves exactly as it does today.
3. `POST /api/ai/cutout` returns a transparent PNG for a crop, and the user can
   revert to the original.
4. A failed cutout leaves the row and the commit intact.
5. Three rows from the same source photo do not trip duplicate detection.
6. No database row is written before the user confirms.

### Open questions for this feature

- Should the source photo be retained after the split, and for how long?
- Does the cutout replace the item photo for display, or sit beside it?
- Is "Cut out all" worth the cost, or should every cutout be deliberate?

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
5. Add the review screen with multi-select, concurrency 2, review and
   per-item save. **(done — attribute-only duplicate check)**
6. Raise the AI draft rate limit for bulk batches. **(done — 30/minute)**
