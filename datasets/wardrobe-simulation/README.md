# Wardrobe simulation dataset

A small, license-documented image dataset for exercising the app with a realistic
four-person household. It is intended for local development, UI review and
data-model experiments — not production content.

## What is in it

| Profile | Relationship | Age group | Wardrobes | Items |
| --- | --- | --- | --- | --- |
| Tiru | self | adult | Work, Weekend | 6 |
| Swati | spouse | adult | Everyday, Occasion | 6 |
| Arush | child | 8–10 | School, Play | 6 |
| Adiran | child | 4–6 | Everyday, Sports | 6 |

- **24 items** across **8 wardrobes**.
- Images are 640×800 JPEGs (4:5), cropped from Wikimedia Commons originals.
- Metadata covers the attributes the current product needs (`state`, price,
  brand, size, colour, category) plus attributes proposed by the AI research
  (`subcategory`, `pattern`, `material`, `fit`, `sleeve`, seasons, occasions,
  style tags). The seed script imports only the columns that exist today; the
  extra fields are there for the data-model assessment.

## Layout

```
datasets/wardrobe-simulation/
├── manifest.json          # profiles → wardrobes → items + source metadata
├── ATTRIBUTIONS.md        # per-image creator, license and source page
├── README.md
└── images/
    ├── tiru-black-crew-tshirt.jpg
    ├── …
    └── adiran-blue-sneakers.jpg
```

`manifest.json` top-level shape:

```jsonc
{
  "dataset": "wardrobe-simulation",
  "version": 1,
  "currency": "INR",
  "profiles": [
    {
      "key": "tiru",
      "name": "Tiru",
      "color": "#62694B",
      "relationship": "self",
      "profileType": "adult",
      "ageGroup": "adult",
      "wardrobes": [
        {
          "name": "Work",
          "type": "work",
          "description": "Office and smart-casual pieces",
          "items": [
            {
              "key": "tiru-black-crew-tshirt",
              "itemName": "Black Crew T-Shirt",
              "category": "Tops",
              "subcategory": "T-shirt",
              "brand": "Atelier Nord",
              "color": "Black",
              "size": "M",
              "price": 1200,
              "currency": "INR",
              "state": "in_use",
              "seasons": ["all-season"],
              "occasions": ["office", "casual"],
              "material": "Cotton",
              "pattern": "Plain",
              "fit": "Regular",
              "sleeve": "Short",
              "styleTags": ["minimal", "layering"],
              "notes": "Layers under the navy blazer.",
              "image": "images/tiru-black-crew-tshirt.jpg",
              "sourceKey": "shirt_hanger"
            }
          ]
        }
      ]
    }
  ],
  "sources": {
    "shirt_hanger": {
      "title": "File:…",
      "license": "CC BY-SA 4.0",
      "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0",
      "creator": "…",
      "sourceUrl": "https://commons.wikimedia.org/wiki/File:…",
      "originalUrl": "https://upload.wikimedia.org/…"
    }
  }
}
```

## Using it

The backend serves these files under `/demo` and the seed script imports the
manifest:

```bash
cd backend
DEMO_BASE_URL=http://localhost:3000/demo npm run seed:demo
```

- `DEMO_BASE_URL` must be reachable from the device running the app. Use
  `http://10.0.2.2:3000/demo` for an Android emulator, or your LAN IP for a
  physical device.
- The seed is additive and idempotent: it reuses an existing profile when the
  name matches and skips items it has already imported.
- It also reconciles the original single-profile test data: the default profile
  is renamed to **Tiru**, and the old “Swati’s” wardrobe is moved to the new
  **Swati** profile. No rows are deleted.
- Set `DEMO_OWNER_UID` to target a specific Firebase user; otherwise the first
  user row is used.

## Image sourcing and licensing

- All images come from Wikimedia Commons and are CC0, public domain, CC BY or
  CC BY-SA. No fair-use material was included.
- Each image was cropped to 4:5 and resized to 640×800; no other retouching.
- **Read `ATTRIBUTIONS.md` before redistributing.** CC BY and CC BY-SA images
  require attribution; adapted versions stay under the same license.
- The dataset is for local simulation. Do not present these photos as the
  user's own wardrobe or as product photography for a commercial catalogue.
- Item names, brands, prices and sizes are fictional. Visible labels or logos
  in photos are incidental and do not correspond to the metadata — for
  example, the school backpack photo shows a real bag brand while the manifest
  uses “Little Step”.
- The dataset deliberately avoids images with identifiable private individuals
  in sensitive contexts; people shown are incidental models in ordinary
  clothing photos.

## Why these attributes

The current schema is intentionally lean: items know a name, category, colour,
size, brand, price, state and photo. The AI research in
[`docs/research/`](../../docs/research/) argues for structured attributes so the
recommendation engine can reason about formality, season, material and fit
without re-parsing free text. The manifest includes those fields to make that
discussion concrete and to test whether they belong on `wardrobe_item` or in a
separate `wardrobe_item_analysis` row.

See [`docs/research/data-model-assessment.md`](../../docs/research/data-model-assessment.md)
for the schema recommendations derived from this dataset.
