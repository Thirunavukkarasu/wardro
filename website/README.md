# Wardro marketing site

Next.js 14 marketing site for the Wardro app. It uses the same Warm Neutral +
Muted Olive design language as `mobile-rn/`: ivory backgrounds, muted olive
primary actions, warm grey text, serif editorial headlines and generous
whitespace.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Product story, household profiles, features, app screenshots, AI, FAQ and download CTA |
| `/privacy` | Privacy policy for the app and website |
| `/account-deletion` | Account deletion request instructions (required for Google Play) |

The app screenshots in `public/screenshots/` are captured from the running
React Native web app and stored as WebP. They are real product screens, not
mockups.

## Run

```bash
npm install
npm run dev -- -p 3001
```

Open <http://localhost:3001>.

## Build

```bash
npm run build
npm run start -- -p 3001
```

## Design tokens

The site mirrors `mobile-rn/src/theme/tokens.json`:

| Token | Value |
| --- | --- |
| Background | `#F8F6F1` |
| Surface | `#FFFFFF` |
| Surface secondary | `#F0EDE5` |
| Primary | `#858B68` |
| Primary dark | `#62694B` |
| Primary light | `#E9EBDD` |
| Accent | `#B8A58A` |
| Text | `#252525` / `#77766F` / `#AAA79F` |
| Border | `#E7E2D8` |

Use the `wardro-*` Tailwind classes and the `.editorial` serif utility in new
sections. Do not add a separate palette.

## Deployment

The site can be exported as static files and served by Firebase Hosting from
the repository's existing `wardo-ce8d5` project:

```bash
npm run build:static
cd ..
firebase deploy --only hosting --project wardo-ce8d5
```

Expected URLs:

- <https://wardo-ce8d5.web.app>
- <https://wardo-ce8d5.web.app/privacy>
- <https://wardo-ce8d5.web.app/account-deletion>

`firebase.json` serves `website/out` and rewrites unknown routes to the home
page. Google Play requires a **public** privacy policy URL, so deploy before
submitting the app and put the deployed privacy URL into the Play Console. The
current policy references the developer contact email shown on the Play
listing; replace that wording with a dedicated privacy email if one is created.
