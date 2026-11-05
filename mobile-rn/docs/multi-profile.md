# Multi-profile design

Status: **implemented 2026-11-05** — household account, cascade delete, profile
switcher on Today. This document captures the model, schema, API, client and UI
design, plus what shipped and what is deferred.

## 1. Why

Wardro is most useful when it holds more than one person's clothes: a family,
a couple, or one person with distinct contexts (e.g. “Work capsule” and
“Everyday”). One login should be able to manage several wardrobes without
creating separate accounts or seeing everything mixed together.

Profiles are therefore the **primary data boundary**:

- One account (Firebase user) owns 1..N profiles.
- Every wardrobe, item, outfit and planned outfit belongs to exactly one
  profile.
- Today shows the active profile prominently; switching changes the data
  context everywhere.

## 2. Recommended model

**Household account (recommended):** one login owns multiple profiles, like a
streaming profile picker. Family members share the account; anyone with the
login can access all profiles. This is the smallest model that delivers the
product value.

**Separate accounts with shared family access (later):** each person logs in
with their own Firebase account and joins a household; permissions decide who
can see or edit whose wardrobe. This is a larger feature (invitations,
membership, roles) and should be a later phase if privacy between members is
required.

Do not mix the two in v1. Start with the household account; add a per-profile
PIN later if casual privacy is needed. True privacy requires separate accounts.

## 3. Data model

Current tables: `user`, `wardrobe`, `wardrobe_item`.

### New: `profile`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | serial | PK |
| `owner_uid` | text | FK `user.uid`, `ON DELETE CASCADE`, not null |
| `name` | text | not null |
| `color` | text | hex colour for initials avatar |
| `avatar_url` | text | optional photo URL |
| `is_default` | boolean | default false; one default per owner |
| `created_at` | timestamptz | default now |
| `updated_at` | timestamptz | default now |

Indexes/constraints:

- `profile_ownerUid_idx` on `(owner_uid)`.
- Partial unique index: one default profile per owner.
  `unique index profile_default_owner_idx on profile(owner_uid) where is_default`.

### Add to `wardrobe`

| Column | Type | Notes |
| --- | --- | --- |
| `profile_id` | integer | FK `profile.id`, `ON DELETE CASCADE`, not null |

Indexes: `wardrobe_profileId_idx` on `(profile_id)`, and
`wardrobe_ownerProfile_idx` on `(owner_uid, profile_id)`.

### Add to `wardrobe_item`

| Column | Type | Notes |
| --- | --- | --- |
| `profile_id` | integer | FK `profile.id`, `ON DELETE CASCADE`, not null |

Denormalised so `GET /wardrobeItems` can filter directly without joining
wardrobes. Keep `owner_uid` for defence-in-depth and existing queries.
Indexes: `wardrobe_item_profileId_idx`, `wardrobe_item_ownerProfile_idx`, and
the existing `wardrobe_id` index.

All future tables (`outfits`, `outfit_items`, `planned_outfits`, `wear_logs`)
also get `profile_id` with the same ownership rules.

## 4. Default profile and migration

### Existing data

1. Create `profile`.
2. Insert one default profile per existing `user`:
   ```sql
   INSERT INTO profile (owner_uid, name, color, is_default)
   SELECT uid,
          coalesce(nullif(display_name, ''), split_part(email, '@', 1), 'My Wardrobe'),
          '#4F46E5',
          true
   FROM "user";
   ```
3. Add nullable `profile_id` to `wardrobe` and `wardrobe_item`.
4. Backfill wardrobes from the owner’s default profile.
   ```sql
   UPDATE wardrobe w
   SET profile_id = p.id
   FROM profile p
   WHERE p.owner_uid = w.owner_uid AND p.is_default;
   ```
5. Backfill items from their wardrobe:
   ```sql
   UPDATE wardrobe_item i
   SET profile_id = w.profile_id
   FROM wardrobe w
   WHERE w.id = i.wardrobe_id;
   ```
   Fallback for orphaned items: the owner’s default profile.
6. Set `profile_id` NOT NULL, add FKs and indexes.
7. Rebuild the backend bundle (`npm run bundle`) and run the Drizzle migration.

### New users

`ensureDefaultProfile(uid)` is idempotent:

- If the user has no profile, insert one with `is_default = true`.
- Name from `user.display_name` / email prefix / “My Wardrobe”.
- Called by `GET /profiles` and by the `requireProfile` fallback.

A partial unique index prevents duplicate defaults under concurrent requests;
use `INSERT ... ON CONFLICT DO NOTHING` or a transaction.

## 5. API design

### Profiles

| Endpoint | Behaviour |
| --- | --- |
| `GET /profiles` | List the account’s profiles with wardrobe/item counts; ensures a default exists |
| `POST /profiles` | Create `{ name, color?, avatarUrl? }` |
| `PATCH /profiles/:id` | Update name/color/avatar |
| `DELETE /profiles/:id` | Delete a profile; reject the last profile; cascade its wardrobes/items/photos |

### Scoping every data request

Add an `X-Profile-Id` request header to all wardrobe/item endpoints.

- `requireProfile` middleware runs after `requireUser`:
  1. Read `X-Profile-Id`.
  2. If absent, resolve the account’s default profile (backward compatibility
     and first-request safety).
  3. Verify the profile row has `id = profileId AND owner_uid = uid`.
  4. Set `c.set('profileId', id)`; return 400/404 when missing or not owned.
- Add `X-Profile-Id` to the backend CORS allow-list.
- Scope every query:
  - Wardrobes: `owner_uid = uid AND profile_id = profileId` on list, summary,
    create, edit, delete.
  - Items: `profile_id = profileId` plus ownership; verify the target wardrobe
    belongs to the same profile.
  - Item updates may move an item only to a wardrobe in the same profile.
  - Deletes clean up only the scoped row’s photos.
- Never trust a profile id in the body; only the verified header/middleware
  value is used.

### Example requests

```http
GET /api/wardrobes/summary
Authorization: Bearer <idToken>
X-Profile-Id: 42
```

## 6. Client architecture

- **`ProfilesProvider`** (new context, nested inside `AuthProvider`):
  - Fetches `GET /profiles` once authenticated.
  - Holds `profiles`, `activeProfile`, `loading`, `error`.
  - `switchProfile(id)`: persists the choice, updates the API header, triggers
    a data refresh.
  - `createProfile`, `updateProfile`, `deleteProfile`.
- **Persistence:** `AsyncStorage` key `wardro.activeProfile.<uid>`; restore on
  launch. If the stored profile no longer exists, fall back to the default.
- **API header:** `ApiClient` exposes `setProfileId(id)`; every request sends
  `X-Profile-Id` when one is set. Do not render data screens until profiles
  have loaded and an active profile exists.
- **Switching:** remount/refetch Today, Closet, and any data screen; clear
  search/category/wardrobe filters. A small toast (“Viewing Swati”) confirms
  the switch.
- **Guards:** if a deep link points to another profile’s item/wardrobe, the
  API returns 403/404 and the screen shows a friendly error. Do not silently
  switch profiles.

## 7. UI design

### Today (main page)

- Greeting uses the **active profile’s name**, with a small “Viewing profile”
  eyebrow if helpful.
- Directly under the greeting: a **horizontal profile rail**:
  - Circular avatar (photo or initials on the profile colour).
  - Active profile: brand ring + check, name bold.
  - Inactive: muted ring.
  - A final “+” tile: “Add profile”.
- The rail is always visible, even with one profile, so the feature is
  discoverable.
- Summary strip, recent items, wardrobes, quick actions all scope to the
  active profile.
- The account avatar (top-right) still opens Profile/account settings.

Visual: initials on a warm neutral card; active ring in the brand colour; keep
the rail one line and horizontally scrollable for large families.

### Profile tab

- Account block (email, sign out).
- **Profiles** section:
  - Cards for each profile: avatar, name, wardrobe/item counts, edit action.
  - “Add profile” row.
  - Delete lives inside edit, with a destructive confirmation.
- Preferences/settings remain account-level.

### Add / edit profile

`FormScreen` with:

- Name (required).
- Colour swatches (default brand, pink, amber, teal, slate).
- Optional photo (reuse the photo picker; upload to
  `users/{uid}/profiles/...`).
- Save.

No relationship field in v1; a free-text label can be added later if useful.

### Scoped screens

- Wardrobe detail header: “Swati’s” / subtitle count.
- Add wardrobe: title “Add to Swati’s” or subtitle “Swati’s wardrobe”.
- Add item: wardrobe picker only shows the active profile’s wardrobes.
- Closet manage screen lists only the active profile’s collections.
- Analytics/outfits/calendar inherit the active profile scope.

### Delete profile

- Confirm with a strong warning that its wardrobes and items (and photos) will
  be removed.
- Prevent deleting the last profile.
- After deletion, switch to the default/first remaining profile and refresh.

## 8. Security and privacy

- Profile ownership is verified server-side on every request; `profileId` alone
  is never trusted.
- One account can access all its profiles. This is intentional for a household
  account; document it in the UI if family members share a login.
- Storage rules add `users/{uid}/profiles/{file}` for avatar uploads; item
  photos keep `users/{uid}/items/...`.
- Deleting a profile cascades only rows owned by that account/profile.
- Consider a per-profile PIN later for casual privacy; true isolation needs
  separate accounts.

## 9. Edge cases

- No profiles yet → backend creates the default; client shows a loading gate.
- Stored active profile deleted → fall back to the default and toast.
- Request before profiles load → wait; never send a stale profile header.
- Profile switch while an edit form is open → block or warn; simplest is to
  close/reset the form when the active profile changes.
- Duplicate names are allowed; avatars/colours disambiguate.
- Deleting the last profile is rejected.
- Item/wardrobe deep link from another profile → 404/403 + friendly error.
- Counts: summary/list are profile-scoped; account-level totals are optional
  and should be labelled clearly if added later.

## 10. Implementation phases

1. **Schema + migration:** `profile`, `profile_id` columns, backfill, indexes,
   default-profile insert; rebuild the backend bundle.
2. **Profiles API:** CRUD, `ensureDefaultProfile`, `requireProfile`, scoping all
   wardrobe/item routes, CORS header.
3. **Client state:** `ProfilesProvider`, API `setProfileId`, AsyncStorage
   persistence, loading gate.
4. **Today switcher:** profile rail, active styling, switch refresh, add tile.
5. **Profile management:** list, add/edit, delete with confirmation; scope the
   add wardrobe/item flows to the active profile.
6. **Docs/tests:** update blueprints and architecture; test two profiles with
   separate wardrobes/items, switching, deletion and the migration.

## 11. Implementation status (2026-11-05)

Shipped:

- **Database:** `profile` table; `profile_id` on `wardrobe` and
  `wardrobe_item`; default-profile backfill; FKs/indexes. Migration
  `backend/drizzle/0001_powerful_moon_knight.sql` applied to the Neon database.
- **API:** `/profiles` list/create/update/delete; `X-Profile-Id` middleware;
  every wardrobe/item query scoped to the verified profile; CORS allows the
  header; backend bundle rebuilt.
- **Client:** `ProfilesProvider`; API profile header; active profile persisted
  per account; Today profile rail with active ring and Add tile; Profile tab
  Profiles section; Add/Edit Profile form with colour swatches; cascade delete
  with confirmation and last-profile protection.
- **Verified:** default profile created automatically; create → switch →
  delete a test profile; data stayed scoped; deleting returned to the default
  profile; counts updated.

Deferred:

- Profile photo uploads (initials + colour are used in v1).
- Per-profile PIN / private profiles.
- Account-level analytics (all insights are profile-scoped).
- Separate accounts/household invites (the later model if per-person privacy is
  required).

## 12. Files touched

Backend:

- `backend/src/schema.ts` — profile table, profile_id columns, indexes.
- `backend/src/types/index.ts` — profile schemas.
- `backend/src/modules/profiles.ts` — new CRUD routes.
- `backend/src/auth.ts` or `src/profile.ts` — `requireProfile`,
  `ensureDefaultProfile`.
- `backend/src/modules/wardrobes.ts`, `wardrobeItems.ts` — scope every query.
- `backend/src/routes.ts` — mount `/profiles`.
- `backend/src/index.ts` — CORS allow `X-Profile-Id`.
- `backend/dist` — rebuild.

Mobile:

- `lib/profiles-context.tsx` — new provider.
- `lib/api.ts` — profile header setter.
- `app/_layout.tsx` — nest provider, gate data.
- `app/(root)/(tabs)/today.tsx` — profile rail, active name.
- `app/(root)/(tabs)/profile.tsx` — profiles management.
- `app/(root)/add-profile.tsx` (or edit-profile) — form.
- `components/ProfileAvatar.tsx`, `ProfileSwitcher.tsx`.
- `app/(root)/add-wardrobe.tsx`, `add-wardrobe-items.tsx` — active profile
  labels and scoped wardrobe list.
- `docs/` — architecture, blueprints, this doc.

## 13. Decisions

1. **Model:** household account — one login owns multiple profiles. ✅
2. **Deletion:** cascade with confirmation; the last profile is protected. ✅
3. **Avatars:** initials + colour in v1; photo upload later.
4. **Privacy:** shared account visibility in v1; a per-profile PIN is a later
   option. True isolation needs separate accounts.
5. **Account-level analytics:** out of scope; all insights are profile-scoped.
