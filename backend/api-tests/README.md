# Bruno API collection

Manual requests for the Wardro backend. Open this folder as a collection in
[Bruno](https://www.usebruno.com/); `bruno.json` is the collection root.

## Environments

| Environment | Base URL |
| --- | --- |
| `Local` | `http://localhost:3000/api` |
| `Prod` | `https://wardro--wardo-ce8d5.us-east4.hosted.app/api` |

Both environments define:

- `FIREBASE_ID_TOKEN` — a Firebase ID token for a test user (blank by default).
- `PROFILE_ID` — the active profile, sent as `X-Profile-Id`.
- `WARDROBE_ID` / `ITEM_ID` — ids used by the item and delete requests.

## Get a test token

Sign in with the Firebase Auth REST API using the web API key from
`mobile-rn/.env` (`EXPO_PUBLIC_FIREBASE_API_KEY`):

```bash
curl -s \
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"YOUR_PASSWORD","returnSecureToken":true}' \
  | jq -r '.idToken'
```

Paste the result into `FIREBASE_ID_TOKEN` in the selected Bruno environment, or
set it in the Bruno UI. **Do not commit a real token.** The first authenticated
request creates or refreshes the `user` row automatically.

## Typical order

1. `Get Me` — confirms the token and creates the user row.
2. `List Profiles` — read the profile ids; set `PROFILE_ID`.
3. `List Wardrobes` / `Wardrobe Summary` — read wardrobe ids; set `WARDROBE_ID`.
4. `Create Wardrobe` — if the profile is empty.
5. `List Items` / `List Items in Wardrobe` — read item ids; set `ITEM_ID`.
6. `Create Item` / `Update Item` / `Delete Item`.
7. `Delete Wardrobe` — deletes the wardrobe and its items.

Profile endpoints (`/users/me`, `/profiles`) are account-level and do not send
`X-Profile-Id`. Wardrobe and item requests are profile-scoped: the backend
verifies that the profile belongs to the Firebase user and filters every query
by `owner_uid` + `profile_id`.

The `Create Item` example uses a demo photo from the local `/demo` route. Start
the backend and seed the simulation data first if you want that URL to resolve:

```bash
cd backend
bun run dev
# in another terminal
bun run seed:demo
```

See [`../../scripts/datasets/wardrobe-simulation/README.md`](../../scripts/datasets/wardrobe-simulation/README.md)
for the dataset.
