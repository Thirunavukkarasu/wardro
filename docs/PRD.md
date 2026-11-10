# Wardro — Product Requirements Document

| | |
| --- | --- |
| **Status** | Early access — Android internal testing |
| **Owner** | Product / engineering |
| **Last updated** | 2026-11-10 |
| **Current app release** | `1.0.0` (version code 7), internal testing |
| **Primary platform** | Android |
| **Other surfaces** | Marketing site (Next.js), agent service (pilot) |

This is the single product document. It states the product intent, scope,
requirements and current status, and links to the detailed documentation. Where
this document and a linked source disagree, the linked source is authoritative
for implementation detail; update this document when product scope changes.

## Documentation map

| Topic | Source |
| --- | --- |
| Repository overview, layout and local setup | [`README.md`](../README.md) |
| Agent/contributor rules and architectural invariants | [`AGENTS.md`](../AGENTS.md) |
| Shared visual language, tokens and components | [`docs/design-system/README.md`](design-system/README.md) |
| Feature backlog and the bulk-import/dedupe plan | [`docs/features.md`](features.md) |
| Research index and conclusions | [`docs/research/README.md`](research/README.md) |
| AI architecture, taxonomy and corrections | [`docs/research/notion-synthesis.md`](research/notion-synthesis.md) |
| Schema review and phased migration plan | [`docs/research/data-model-assessment.md`](research/data-model-assessment.md) |
| Original Notion exports (provenance) | [`docs/research/sources/README.md`](research/sources/README.md) |
| Mobile app setup, API client and screens | [`mobile-rn/README.md`](../mobile-rn/README.md) |
| Screen/navigation plan and phasing | [`mobile-rn/docs/screen-architecture.md`](../mobile-rn/docs/screen-architecture.md) |
| Household profiles: schema, API, UI | [`mobile-rn/docs/multi-profile.md`](../mobile-rn/docs/multi-profile.md) |
| Screen blueprints and references | [`mobile-rn/docs/design/README.md`](../mobile-rn/docs/design/README.md) |
| Product-research backlog | [`mobile-rn/docs/research/README.md`](../mobile-rn/docs/research/README.md) |
| API routes, database, build and deployment | [`backend/README.md`](../backend/README.md) |
| Manual API requests (Bruno) | [`backend/api-tests/README.md`](../backend/api-tests/README.md) |
| Simulation dataset and seeding | [`scripts/datasets/wardrobe-simulation/README.md`](../scripts/datasets/wardrobe-simulation/README.md) |
| Repo-level scripts and fixtures | [`scripts/README.md`](../scripts/README.md) |
| Agent service status and limitations | [`wardro-agent/README.md`](../wardro-agent/README.md) |
| Marketing site | [`website/README.md`](../website/README.md) |
| Project skills (release, motion) | [`.claude/skills/README.md`](../.claude/skills/README.md) |

## 1. Product summary

Wardro is a **private, household-aware wardrobe manager**. Each person in a
household gets their own profile with separate wardrobes and garments, while a
single account keeps the household together. A garment is added with a photo;
Wardro can read the photo (or a product page) and pre-fill the details, then the
user reviews and saves it.

The product is deliberately **not** a social feed, a shopping app or a
generic AI catalogue. Answers and outfit suggestions are grounded in the active
profile's real inventory, and photos stay in private storage.

### Product principles

1. **The wardrobe is the source of truth.** AI drafts and suggestions must
   reference real items; the model must not invent inventory.
2. **The user confirms writes.** AI can propose; only the user (through the API)
   creates, edits or deletes items.
3. **Profiles are explicit.** Every wardrobe-scoped request states the active
   profile; data never leaks between profiles.
4. **Less searching, more wearing.** Calm, photo-first UI over dashboards,
   feeds and noise.
5. **Private by default.** Firebase is identity only; photos are private GCS
   objects served through signed API URLs.

## 2. Problem and target users

### Problem

Households own too many clothes to track mentally. People forget what they own,
where it is, whose it is, and what fits an occasion. Spreadsheets and notes go
stale; social/shopping apps optimise for discovery, not for the closet already
in the house.

### Target users

| Persona | Needs |
| --- | --- |
| **Household organiser** (e.g. Tiru) | One account, several people, clear ownership, fast capture, household-wide visibility |
| **Partner / adult** (e.g. Swati) | Own profile and closet, ask outfit questions, privacy from other profiles |
| **Child / teen** (Arush, Adiran) | Simple wardrobe and school/sports collections; limited complexity |
| **Privacy-conscious tester** | Private photos, no training on personal data, delete account and data |
| **Play reviewer / internal tester** | Installable Android build, clear sign-in, predictable behaviour |

The first real dataset models four profiles: **THIRU**, **Swati**, **AARUSH**
and **AADIRAN**.

### Jobs to be done

- “I want to add a garment in seconds, from a photo.”
- “I want to know which pieces belong to which person.”
- “I want to find what I own by name, brand, category or wardrobe.”
- “I want outfit ideas that use my actual clothes.”
- “I don’t want to add the same garment twice.”
- “I want my photos to stay private.”

## 3. Goals and non-goals

### Goals for early access

1. A household can create profiles and keep their data separate.
2. A user can add a garment with a photo and little typing.
3. A user can find any owned item with search and filters.
4. The assistant answers from the active profile's real inventory.
5. AI drafts save time without creating duplicate or invented inventory.
6. Testers can install and update the Android build through Play internal
   testing.

### Non-goals

- A social network, feed, likes or follower graph.
- Shopping, affiliate commerce or price comparison.
- Extending the Flutter reference app (kept on the `flutter-reference` branch).
- Using Firebase for anything except authentication.
- Letting an AI service write directly to wardrobe tables.
- Full production launch before the internal-testing feedback loop is complete.

## 4. Current scope and status

Status legend: **Shipped**, **Pilot**, **Planned**, **Later**, **Not supported**.

| Area | Capability | Status |
| --- | --- | --- |
| Auth | Email/password and Google sign-in; Firebase ID tokens verified by the API | Shipped |
| Profiles | Household profiles, default profile, switch, edit, cascade delete, last-profile protection | Shipped |
| Wardrobes | Create/edit/delete collections scoped to a profile | Shipped |
| Items | Create/edit/delete garments with photo, name, brand, category, colour, size, price, state, purchase/expiry dates | Shipped |
| Photos | Private GCS upload; bucket-relative path in the DB; signed API URLs for display; delete with item/profile | Shipped |
| AI draft — photo | Vision model drafts garment details; automatic scan on photo selection | Shipped |
| AI draft — URL | Fetch a product page, extract metadata/JSON-LD, draft details, optionally copy the product image to GCS | Shipped |
| Bulk import | Up to 10 photos, 2 drafts at a time, review, include/skip, per-item save | Shipped (minimal) |
| Duplicates | Attribute-based match against the active profile; Skip / Add anyway / Update existing | Shipped (attribute-only) |
| Duplicates | Perceptual photo hash, embeddings, cross-photo semantic matching | Planned |
| Item form | Category/colour/size dropdowns with database values and custom entry; date defaults | Shipped |
| Build diagnostics | Profile → About this build (version, build profile, build time, commit, API URL, package) | Shipped |
| Assistant chat | Inventory-aware questions, outfit ideas and single-image analysis via the FastAPI/LangGraph agent | Pilot |
| Assistant writes | Save analyzed garment, write tools, conversation persistence, production auth proxy | Planned |
| Store purchase import | Import past purchases from online stores (Amazon/SHEIN/ZARA/ASOS) | Later |
| Outfits / calendar / wear history / weather / analytics | Not built | Later |
| iOS | App runs, but native Google sign-in has no client; not a supported target | Not supported |
| Marketing site | Next.js site with product, privacy, account deletion and restrained motion | Shipped |

Detailed feature status and the next slices live in
[`docs/features.md`](features.md).

## 5. User journeys

### 5.1 First run and sign-in

1. User installs Wardro from Play internal testing (opt-in link).
2. Signs in with Google or email/password.
3. The API verifies the Firebase ID token and creates/refreshes the user row.
4. A default profile is created if the account has none.
5. The user lands on Today with the profile rail.

**Acceptance:** no client-supplied owner id is trusted; a signed-in user always
has at least one profile; sign-out returns to the welcome screen.

### 5.2 Add one item with AI auto-fill

1. User opens Add Item.
2. Takes or picks a photo.
3. The app automatically calls `POST /api/ai/item-draft` with the image.
4. The backend asks the configured vision model for a validated draft.
5. The form fills name, brand, category, colour, size, price and dates where
   known.
6. The user reviews/edits, chooses a wardrobe, and saves.
7. The photo is uploaded to GCS; the item stores the object path.

**Acceptance:** the model never writes a row; unknown values stay empty; saving
works if the AI is unavailable (manual entry).

### 5.3 Import a product URL

1. User pastes a product URL.
2. The backend fetches a public page with SSRF protections and extracts
   title/description/price/image/JSON-LD.
3. The text model (or metadata fallback) produces a draft.
4. The product image can be copied to GCS and previewed.
5. The user reviews and saves.

**Acceptance:** blocked/maintenance pages return a clear error, not a bogus
draft; the import is rate-limited; no private hosts are fetched.

### 5.4 Bulk import up to 10 photos

1. User opens Bulk Import from Add Item.
2. Selects up to 10 photos.
3. Two drafts run at a time; each card shows progress and the draft.
4. Duplicate cards are flagged against the active profile and earlier drafts.
5. The user chooses Skip, Add anyway or Update existing.
6. Included items are saved individually with success/error status.
7. New items default to purchase date = today and expiry = today + 1 year.

**Acceptance:** one failed photo does not discard the batch; duplicates are not
silently added; every saved item is visible in the chosen wardrobe.

### 5.5 Browse, search and switch profiles

1. User switches the active profile on Today.
2. The Closet and Today reload for that profile only.
3. Search by name/brand/category and filter by wardrobe.
4. Open item detail, edit or delete.

**Acceptance:** the API always scopes by both owner uid and profile id; switching
profiles never mixes counts or items.

### 5.6 Ask Wardro

1. User opens Chat with an active profile.
2. The app sends the question, thread id and profile id to the agent service.
3. The agent reads the profile's inventory through the API and answers from
   real items (or says it cannot load the wardrobe).
4. The user can attach a photo for structured garment analysis.

**Status:** development pilot. Production auth proxy, persistence and write
actions are not wired.

### 5.7 Delete data

- Deleting an item removes its photo object.
- Deleting a wardrobe cascades its items and photos.
- Deleting a profile cascades its wardrobes/items; the last profile is
  protected.
- Account deletion is **request-based**: the user follows the instructions on
  the website and emails from the account address; the operator removes the
  Firebase account, records and photos. Self-serve deletion is not implemented.

## 6. Functional requirements

Priority: **P0** required for early access, **P1** important, **P2** later.
Status uses the legend above.

### Authentication and account

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| AUTH-01 | Email/password sign-in and sign-up | P0 | Shipped |
| AUTH-02 | Google sign-in on Android and web | P0 | Shipped (Android client fixed in v7) |
| AUTH-03 | API verifies Firebase ID tokens via Google JWKS; owner uid comes from the token | P0 | Shipped |
| AUTH-04 | Sign-out clears the local session | P0 | Shipped |
| AUTH-05 | Account deletion request path is documented on the website | P0 | Shipped (request-based) |

### Profiles and household

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| PROFILE-01 | An account has one or more profiles | P0 | Shipped |
| PROFILE-02 | First use creates a default profile | P0 | Shipped |
| PROFILE-03 | Active profile is explicit and persisted per account | P0 | Shipped |
| PROFILE-04 | Profiles have a name and colour; avatars use initials | P0 | Shipped |
| PROFILE-05 | Delete a profile with cascade and confirmation | P0 | Shipped |
| PROFILE-06 | The last profile cannot be deleted | P0 | Shipped |
| PROFILE-07 | Profile photo, per-profile PIN, separate-account invites | P2 | Later |

### Wardrobes and items

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| WARDROBE-01 | Create/edit/delete wardrobes within the active profile | P0 | Shipped |
| WARDROBE-02 | Wardrobe lists and counts are profile-scoped | P0 | Shipped |
| ITEM-01 | Create/edit/delete garments within a wardrobe | P0 | Shipped |
| ITEM-02 | Fields: photo, name, brand, category, colour, size, price, purchase date, expiry date, state | P0 | Shipped |
| ITEM-03 | Item lists/detail are profile- and owner-scoped | P0 | Shipped |
| ITEM-04 | Category/colour/size use dropdowns with fixed values plus values already used in the profile; custom values allowed | P1 | Shipped |
| ITEM-05 | New items default purchase date to today and expiry to +1 year | P1 | Shipped |
| ITEM-06 | Wear history, cost-per-wear and analytics | P2 | Later |

### Photos

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| PHOTO-01 | The app uploads through the authenticated API, not a storage SDK | P0 | Shipped |
| PHOTO-02 | Photos live in a private GCS bucket; Firebase Storage is not used | P0 | Shipped |
| PHOTO-03 | The DB stores the bucket-relative path; API responses expand it to a signed URL | P0 | Shipped |
| PHOTO-04 | Deleting an item/profile removes its objects | P0 | Shipped |
| PHOTO-05 | Accept images up to 10 MB; reject non-images | P0 | Shipped |
| PHOTO-06 | A photo can be replaced; the old object is cleaned up | P0 | Shipped |

### AI item drafts

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| AI-01 | Draft from a base64 photo through a vision model | P0 | Shipped |
| AI-02 | Draft from a public product URL with SSRF guards and metadata extraction | P0 | Shipped |
| AI-03 | Automatically scan a selected photo (manual retry remains) | P1 | Shipped |
| AI-04 | Structured output validated by a Zod schema; plain-text fallback | P0 | Shipped |
| AI-05 | The model can never write wardrobe rows | P0 | Shipped |
| AI-06 | Model/provider configurable by env; unconfigured returns a clear error | P0 | Shipped |
| AI-07 | Rate limit supports a 10-photo batch plus retries (30/min) | P1 | Shipped |
| AI-08 | Drafts survive provider failure with metadata fallback for URLs | P1 | Shipped |

### Bulk import and duplicates

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| BULK-01 | Select up to 10 photos | P0 | Shipped |
| BULK-02 | Draft at most 2 photos at a time | P0 | Shipped |
| BULK-03 | Review cards with include/skip and per-item status | P0 | Shipped |
| BULK-04 | Detect duplicates against the active profile and the batch | P0 | Shipped (attributes) |
| BULK-05 | Offer Skip / Add anyway / Update existing | P0 | Shipped |
| BULK-06 | Save per item; one failure does not discard the rest | P0 | Shipped |
| BULK-07 | Inline field editing in the review screen | P1 | Planned |
| DEDUPE-01 | Perceptual photo hash (dHash/pHash) for same-photo matching | P1 | Planned |
| DEDUPE-02 | Backfill hashes for existing photos | P1 | Planned |
| DEDUPE-03 | CLIP-style embeddings + pgvector for semantic matching | P2 | Later |

### Assistant and diagnostics

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| CHAT-01 | Answer inventory questions from the active profile's real items | P1 | Pilot |
| CHAT-02 | Suggest outfits from real items | P1 | Pilot |
| CHAT-03 | Analyze an attached garment photo without saving it | P1 | Pilot |
| CHAT-04 | Production auth proxy, write tools, persistence | P2 | Planned |
| DIAG-01 | About this build shows version, build profile, time, commit, API URL and package | P1 | Shipped |

### Store purchase import (proposed)

| ID | Requirement | Priority | Status |
| --- | --- | --- | --- |
| IMPORT-01 | Import a draft from a pasted order or product link | P1 | Product URLs shipped; order pages planned |
| IMPORT-02 | Import receipts from a forwarding address or read-only mailbox with explicit consent | P2 | Later |
| IMPORT-03 | In-app store purchase-history flow for Amazon/SHEIN/ZARA/ASOS | P2 | Later; legal/store review required |
| IMPORT-04 | Track `source_store`, `source_order_id`, `source_url`, `purchased_at`, `order_total`; dedupe by order id + item | P2 | Later |

The reference “sign in and navigate to purchase history” flow is possible with
an in-app browser, but consumer stores expose no purchase-history API, pages use
MFA/captcha/bot protection, and extraction may conflict with store terms. Do not
store store credentials. Prefer order/product links first, then email receipts,
then a one-store in-app pilot. The detailed plan and risks are in
[`docs/features.md`](features.md).

## 7. Data model

Current hierarchy:

```
user (Firebase uid)
 └── profile (person / context)
      └── wardrobe (collection)
           └── wardrobe_item (garment)
```

| Table | Key fields |
| --- | --- |
| `user` | `uid` PK, email, display name, created at |
| `profile` | id, owner uid, name, colour, avatar URL, default flag, timestamps |
| `wardrobe` | id, owner uid, profile id, name, description, created at |
| `wardrobe_item` | id, owner uid, profile id, wardrobe id, `photo_uri`, name, brand, category, colour, size, price, state, purchase/expiry dates, created at |

- `photo_uri` stores a bucket-relative object path such as
  `users/{uid}/items/{file}`; the API expands it into a signed URL.
- Item states: `newly_purchased`, `in_use`, `faded`, `expired`, `archived`.
- Planned additive tables/columns (analysis, wear history, outfits,
  preferences, `photo_hash`, `source_url`) are assessed in
  [`docs/research/data-model-assessment.md`](research/data-model-assessment.md)
  and [`docs/features.md`](features.md).
- Migrations are additive and reviewed. Never use `drizzle-kit push` against a
  shared or production database.

## 8. Architecture

```
Expo / React Native app
  ├── Firebase Auth (identity only)
  ├── Hono API (Bun on Cloud Run)
  │     ├── PostgreSQL (Drizzle; Neon in production)
  │     ├── Google Cloud Storage (private photos, signed API URLs)
  │     └── Ollama Cloud / Vercel AI SDK (item drafts)
  └── FastAPI + LangGraph agent (pilot; reads inventory through the API)
Next.js marketing site (Vercel)
```

### Invariants

1. **Firebase is the identity source.** The owner uid comes from the verified ID
   token, never the client. Firebase is used only for authentication.
2. **Everything wardrobe-scoped is profile-scoped.** Queries filter owner uid
   and profile id; `X-Profile-Id` is validated server-side.
3. **The Bun API is the only runtime writer.** The database is the system of
   record. AI services read through authorized APIs and return drafts; user
   confirmation precedes AI-created items.
4. **Deterministic retrieval before generation.** Inventory answers and outfit
   candidates reference real `wardrobe_item.id` rows; the model explains or
   ranks them, it does not invent inventory.
5. **Schema changes are additive and reviewed.**
6. **Use design tokens.** No raw hex outside the theme; prefer semantic
   `wardro-*` classes.
7. **The Flutter app is reference only**, kept on the `flutter-reference`
   branch; the React Native app is the target.
8. **Keep the docs split.** Shared product/design/research in root `docs/`;
   app-specific material in `mobile-rn/docs/`.

### Surfaces

- **Android app** — Expo SDK 54, Expo Router, Firebase JS Auth, API client.
- **API** — Bun + Hono + Drizzle; Firebase JWKS verification with `jose`;
  `@google-cloud/storage`; Vercel AI SDK + Ollama.
- **Database** — plain Postgres; any provider.
- **Photos** — private GCS bucket, path-only storage, HMAC-signed API URLs.
- **Agent** — FastAPI + LangGraph; pilot, read-only inventory, no writes.
- **Website** — Next.js 14 on Vercel.
- **Release** — GitHub Actions builds a signed AAB to Artifact Registry and
  Play internal testing; EAS preview APK for direct install.

## 9. API surface (summary)

Field-level details live in [`backend/README.md`](../backend/README.md) and
[`mobile-rn/README.md`](../mobile-rn/README.md).

| Area | Endpoints |
| --- | --- |
| Health | `GET /api/healthcheck` |
| Profiles | `GET/POST /api/profiles`, `PATCH/DELETE /api/profiles/:id` |
| Wardrobes | `GET /api/wardrobes`, `GET /api/wardrobes/summary`, `POST/PATCH/DELETE` |
| Items | `GET /api/wardrobeItems`, `GET /api/wardrobeItems/:wardrobeId`, `GET /api/wardrobeItems/options`, `POST/PATCH/DELETE /api/wardrobeItems/:id` |
| Photos | `POST /api/photos`, `GET /api/photos/*` |
| AI drafts | `POST /api/ai/item-draft` |

## 10. Non-functional requirements

### Security and privacy

- Photos are private GCS objects; the bucket is not public.
- The API streams photos through signed URLs; no client storage credential.
- The API derives identity from Firebase tokens and validates profile access.
- Secrets live in Secret Manager / environment, never in the repo.
- Photos are not used to train models; this is stated in the app and website.
- Account/profile/item deletion removes the corresponding photos.
- URL imports restrict hosts to public HTTP(S), ports 80/443, private/reserved
  IPs blocked, redirects/time/size limits.

### Performance

| Target | Goal |
| --- | --- |
| CRUD API p95 | < 500 ms excluding AI |
| Health check | < 200 ms |
| AI draft | Typically < 30 s; hard timeout 120 s |
| Photo display | Signed URL cached; no visible placeholder for valid photos |
| Bulk import | 10 photos processed 2 at a time; progress visible |
| Android cold start | Acceptable on a mid-range device; no blocking AI call before UI |

Targets are goals; product analytics and latency instrumentation are not yet
wired.

### Reliability

- One failed AI draft or one failed bulk save must not fail the rest.
- AI drafts never write; the user can always save manually.
- A missing photo object shows a placeholder, not a crash.
- Cloud Run health check must return 200 after every deploy.

### Accessibility and responsiveness

- Interactive controls have accessibility labels.
- Text has sufficient contrast against the Warm Neutral palette.
- The Android tab bar and FAB respect system navigation insets.
- Web motion honours `prefers-reduced-motion`; no essential content depends on
  animation.
- Layout works on phones and web; tablets are not a primary target yet.

### Platforms

- **Android** — primary; Play internal testing.
- **Web** — app and marketing site for evaluation; not the primary product.
- **iOS** — app can run, but native Google sign-in has no client; not supported.

## 11. Design and UX

- Visual language: Warm Neutral + Muted Olive; editorial serif headings; calm
  surfaces. See [`docs/design-system/README.md`](design-system/README.md).
- Current navigation: **Today · Closet · Chat (pilot) · Profile**, with Add Item
  as a flow/FAB.
- Target navigation once outfits and planning exist:
  **Today · Closet · Create · Calendar · Profile**. Chat placement is an open
  decision. See [`mobile-rn/docs/screen-architecture.md`](../mobile-rn/docs/screen-architecture.md).
- Empty, loading and error states exist for the main screens.
- Motion: restrained, marketing only; see the `website-interactions` and
  official Emil Kowalski skills.

## 12. Metrics and instrumentation

No product analytics SDK is wired yet. The following are the recommended
first events and targets for the early-access cohort.

| Area | Event / metric | Why |
| --- | --- | --- |
| Activation | sign-up → first item saved within 24 h | Is the core loop working? |
| Capture | add-item time; AI draft shown/accepted/edited | Is AI actually saving time? |
| Bulk | bulk started → completed; items saved per batch | Does batch import earn its complexity? |
| Dedupe | duplicate prompts shown; Skip/Add/Update chosen | Is matching trusted and useful? |
| Photos | upload success; photo load success | Are private photos reliable? |
| Assistant | questions asked; answers with inventory; no-inventory responses | Is the agent grounded and useful? |
| Retention | weekly active profiles; items added per active profile | Early product-market signal |
| Quality | crash-free sessions; API 5xx rate; AI error rate | Guardrails |

Success targets for the first cohort are to be set after instrumentation; do not
claim metrics that are not measured.

## 13. Release and operations

- **Android app** — `1.0.0` (version code 7), internal testing track, released
  10 Nov 2026. The signed AAB is built by the `Android release AAB` GitHub
  Actions workflow; the EAS preview APK is for direct install.
- **Backend** — Cloud Run service `wardro-api` in `asia-south1`; image in
  Artifact Registry; database on Neon; photos in
  `gs://wardo-ce8d5-wardrobe-photos`.
- **AI** — Ollama Cloud model `deepseek-v4.1-flash:1017-cloud` via
  `https://ollama.com/v1`; API key in Secret Manager.
- **Website** — Next.js on Vercel.
- **Tester flow** — Play internal testing opt-in link; testers in an email list
  on the internal testing track. A side-loaded APK must be uninstalled before a
  Play install because the signing keys differ.
- **Diagnostics** — Profile → About this build shows the version, build profile,
  build time, commit, API URL and package.
- See the `android-release` project skill and
  [`backend/README.md`](../backend/README.md) for the operational steps.

## 14. Risks and open questions

| Risk / question | Current stance |
| --- | --- |
| AI hallucination or invented inventory | Drafts never write; deterministic retrieval for answers |
| AI availability/cost | Configurable provider; metadata fallback for URL imports; rate limits |
| Duplicate false negatives | Attribute matching shipped; photo hash planned; embeddings later |
| Same photo, different name | Not caught until perceptual hashing lands |
| Store purchase import | No consumer purchase-history APIs; sign-in/scraping is fragile and ToS-sensitive. Start with order/product links and email receipts, then pilot one store |
| Play “Draft app” setup | Internal testing works; production/store listing tasks remain |
| Tester onboarding | Tester email list and opt-in link required; side-loaded APK must be removed |
| iOS Google sign-in | No iOS OAuth client; unsupported |
| Agent production security | Bun→Python auth proxy and persistence not implemented |
| No analytics | Instrumentation is a P1 gap; targets above are provisional |
| Chat as a top-level tab | Pilot; decide placement before the five-tab map is final |
| Calendar/outfits/weather | Not built; see screen architecture phases |
| Flutter code | Reference only on `flutter-reference`; do not extend |

## 15. Roadmap

### Now

- Internal testing feedback on v7 (OAuth fix, safe-area fix, bulk import).
- Fix defects found by testers.
- Confirm Android Google sign-in and photo upload across profiles.

### Next

- Perceptual photo hash + backfill; duplicate-check endpoint.
- Inline editing in the bulk review screen.
- Product analytics events and dashboards.
- Production-readiness tasks for Play (store listing, content declarations,
  privacy policy URL).

### Later

- Photo/embedding-based semantic dedupe.
- Store purchase import: order/product-link paste first, then email receipts;
  an in-app store purchase-history pilot only after legal and store review.
- Outfits, calendar, wear history, weather and insights.
- Assistant write tools with explicit confirmation, persistence and a
  production auth proxy.
- iOS support and profile photos/PIN.

Source of truth for the backlog: [`docs/features.md`](features.md),
[`docs/research/data-model-assessment.md`](research/data-model-assessment.md),
and [`wardro-agent/README.md`](../wardro-agent/README.md).

## 16. Glossary

| Term | Meaning |
| --- | --- |
| **Profile** | A person or context inside one account; owns wardrobes and items |
| **Wardrobe** | A collection inside a profile (e.g. Work, Weekend) |
| **Item** | A garment row with photo and metadata |
| **Draft** | AI-extracted item values, not yet saved |
| **Bulk import** | Selecting multiple photos and saving several drafts in one flow |
| **Duplicate** | An existing item or earlier draft that matches the current one |
| **Signed photo URL** | Stable `/api/photos/...?sig=...` URL backed by a private GCS object |
| **Agent** | The FastAPI + LangGraph assistant service (pilot) |

## 17. Maintaining this document

- Update status, release number and “Last updated” when product scope or
  shipped behaviour changes.
- Prefer linking to the source doc over copying detailed API/schema/design
  content; this PRD should stay readable for sharing.
- Add new shipped features to **Current scope**, the requirements tables and the
  roadmap; add open product decisions to **Risks and open questions**.
- Feature-level detail belongs in [`docs/features.md`](features.md); schema
  detail belongs in the data-model assessment; API detail belongs in the
  backend README.

## Change log

| Date | Change |
| --- | --- |
| 2026-11-10 | Initial PRD. v7 internal testing, bulk import shipped, Android OAuth and safe-area fixes, website motion, current architecture and backlog. Store purchase import documented as a later proposal. |
