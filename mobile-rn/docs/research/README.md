# Wardro — research backlog

Longer-form product research that is not yet a design or implementation
decision. Add one focused document per topic here as it is investigated.

## Suggested topics

- **Competitor teardowns** — Whering, INDYX, Outfitted, Acloset, Save Your
  Wardrobe and similar apps: onboarding, closet capture, outfit building,
  planning, retention loops, pricing. Record what to borrow and what to avoid.
- **User interviews** — how people decide what to wear, how they organise
  clothes, laundry/weather constraints, why wardrobes become cluttered, and
  what makes them stop using a wardrobe app.
- **Recommendation logic** — deterministic rules first (weather, dress code,
  least-worn, favourite, recent repeats), then evaluate learned or
  LLM-assisted suggestions. Define what “good” means and how to measure it.
- **Category and colour taxonomy** — the canonical category set (Tops,
  Bottoms, Dresses, Shoes, Accessories and their subtypes) and colour names
  that feed filters, outfit slots, and future AI detection.
- **Image capture** — background removal, product-photo composition, colour
  extraction, and cropping guidance for consistent closet cards.
- **Weather integration** — provider options, location permission flows,
  caching, and graceful degradation when weather/location is unavailable.
- **Cost-per-wear and analytics** — definitions, data requirements, and how to
  present insight without making the app feel like a spreadsheet.
- **Privacy and trust** — photo storage, location permission, analytics, and
  what should never leave the device without explicit consent.
- **Monetization and retention** (if pursued) — premium outfit tools,
  analytics, wardrobe limits, and what must remain free.

## Related research

Architecture and data-model research synthesized from the Notion exports and
the simulation dataset lives in the repository-level
[`docs/research/`](../../../docs/research/README.md). It covers the proposed AI
service boundary, profile/item schema extensions, and the phased migration
plan.

## How to use this folder

1. Create a dated markdown file per topic, e.g.
   `2026-11-10-recommendation-rules.md`.
2. State the question, evidence, options, recommendation, and open questions.
3. Link the resulting design/architecture decision from
   [`../design/`](../design/README.md) or
   [`../screen-architecture.md`](../screen-architecture.md).
