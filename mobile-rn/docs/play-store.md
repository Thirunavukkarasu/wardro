# Play Store submission

Status: **draft**. The Data safety answers below are proposed and have not
been submitted. Production access is gated by Play's closed-testing
requirement.

## Live URLs

- Privacy policy: <https://wardro-lake.vercel.app/privacy>
- Account deletion: <https://wardro-lake.vercel.app/account-deletion>

## Store listing

| Field | Value |
| --- | --- |
| Title | Wardro — Family Wardrobe |
| Short description | Organize your family's wardrobe and get outfit ideas from what you own. |
| Category | Lifestyle |
| Contact email | thirunavukkarasu.sam@gmail.com |
| Default language | English (United Kingdom) |

The full description is in the Play Console draft. Assets:

- App icon: 512×512 (`mobile-rn/assets/images/icon.png`)
- Feature graphic: 1024×500, generated from the brand colours and the
  marketing screenshots in `website/public/screenshots/`
- Phone screenshots: four 1080×1920 PNGs, generated from
  `website/public/screenshots/{today,closet,ask,item}.webp` with cream
  padding to a 9:16 frame.

## Data safety — proposed

Confirm before submitting. This is a legal declaration.

| Data type | Collected | Shared | Purpose |
| --- | --- | --- | --- |
| Name | Yes (required) | Service providers | Account management |
| Email address | Yes (required) | Service providers | Account management / authentication |
| User IDs (Firebase uid) | Yes | Service providers | Account management |
| Photos | Yes (optional) | AI provider + cloud storage | App functionality, personalisation |
| In-app messages (chat) | Yes (optional) | AI provider | App functionality, personalisation |
| App activity (wardrobes, items, profiles) | Yes | Database/hosting + AI provider | App functionality, personalisation |
| Location, contacts, financial, health, device IDs | No | — | — |
| Ads / analytics | No | — | — |

- Encrypted in transit: **Yes**.
- Account deletion: **Yes** — <https://wardro-lake.vercel.app/account-deletion>.
- Sharing recipients: Google Firebase/Cloud, the PostgreSQL provider, and the
  configured AI model provider, as disclosed in the privacy policy.
- Account data is required; photos and chat are optional.

## Content rating and target audience

- Target audience: **18 and over**; not designed for children.
- No violence, sexual content, profanity, controlled substances or gambling.
- No user-to-user interaction or public content sharing.
- **Unrestricted web access: yes** — the in-app browser can open product
  pages. This may produce a Teen or Mature 17+ rating, which is acceptable
  with an 18+ target audience.
- No ads, no in-app purchases.

## Production access gate

The account is personal, so Play requires:

1. Finish the app information and store listing.
2. Publish a **closed testing** release.
3. Get **12 testers opted in**.
4. Run the closed test for **14 continuous days**.
5. Apply for production access.

Current state: Draft app, internal testing only, 0 testers opted in.

The 12 testers must be real Google accounts. Create a closed-testing email
list in Play Console, share the opt-in URL, and keep 12 people opted in for
the full period.

## Reviewer access

A single Wardro test account can be created and entered under **App content →
Sign-in details**. Do not commit test credentials to the repository.

## Release checklist

- [x] Signed versionCode 8 AAB built (`wardro-release-v8.aab`)
- [x] API and agent URLs baked into the bundle
- [x] Privacy policy and account deletion pages live
- [x] Store listing draft saved (title, descriptions, icon, feature graphic,
      four screenshots)
- [ ] Confirm Data safety answers
- [ ] Finish App content (privacy policy, sign-in details, ads, content
      rating, target audience, data safety, government/financial/health)
- [ ] Create reviewer test account
- [ ] Publish closed testing release
- [ ] 12 testers opted in for 14 days
- [ ] Apply for production and submit for review
