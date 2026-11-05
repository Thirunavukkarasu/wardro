# Research

Background research for Wardro, kept separate from the design system and the
implementation docs. The goal of this folder is to preserve useful source
material, separate it from decisions, and make the reasoning auditable.

## Contents

| Document | What it is | Status |
| --- | --- | --- |
| [`notion-synthesis.md`](./notion-synthesis.md) | Distilled architecture, data-model and AI ideas from two Notion exports, with corrections against the shipped code | Reference |
| [`data-model-assessment.md`](./data-model-assessment.md) | Concrete schema review prompted by the simulation dataset; phased, additive migrations | Recommendation |
| [`sources/`](./sources/) | Verbatim Notion exports, kept for provenance | Reference only |
| [`../../datasets/wardrobe-simulation/`](../../datasets/wardrobe-simulation/) | Four-profile, 24-item image dataset with rich metadata | Test fixture |

## The short version

1. **Do not rebuild the data model.** The `user → profile → wardrobe →
   wardrobe_item` hierarchy and profile-scoped API are sound.
2. **Add attributes and events, not tables for their own sake.** Profile
   metadata (`relationship`, `profile_type`, age band), item attributes
   (`subcategory`, material, pattern, fit, sleeve, seasons, occasions, style
   tags), wear history, preferences and manual outfits are the next useful
   layer.
3. **Keep Bun as the only writer.** If an AI service arrives, it reads through
   authorized APIs and returns drafts. Python never writes inventory directly.
4. **Deterministic retrieval before generation.** Inventory answers and outfit
   candidates come from real rows; the model explains or ranks them, it does
   not invent them.
5. **Phasing matters.** Ship the inventory and event capture first; add AI
   analysis and threads only when there is a concrete endpoint to test.

## Sources are not source-of-truth

The Notion exports in [`sources/`](./sources/) were written against an earlier
Flutter client and a `wardrobe_profile` table that does not exist in this
repository. They contain placeholders, assumed route names, and SQL that would
duplicate the current profile table if run verbatim. They are preserved so the
original reasoning is available, not so it can be copied.

When a source and the code disagree, the code wins. Where the source has a
better idea, it is recorded in `notion-synthesis.md` and translated into a
concrete, reviewed migration in `data-model-assessment.md`.

## Using the dataset

The simulation dataset is the evidence behind the schema recommendations. It
contains fields the current app cannot yet store, which makes the gaps
concrete:

```bash
cd backend
DEMO_BASE_URL=http://localhost:3000/demo npm run seed:demo
```

See the [dataset README](../../datasets/wardrobe-simulation/README.md) for the
manifest shape, licensing and seeding details.

## Related documentation

- [Design system](../design-system/README.md) — Warm Neutral + Muted Olive
  tokens, components and screen layouts.
- [Screen architecture](../../mobile-rn/docs/screen-architecture.md) — agreed
  navigation and phases.
- [Multi-profile implementation](../../mobile-rn/docs/multi-profile.md) —
  shipped household-profile behaviour.
- [Mobile research backlog](../../mobile-rn/docs/research/README.md) — open
  product-research topics (competitors, interviews, taxonomy, privacy).

## Adding research

1. Put raw exports or external references in `sources/` with a short provenance
   note.
2. Write a synthesis that states the question, evidence, options,
   recommendation and open questions.
3. Link the resulting decision from an implementation doc or a migration.
4. Keep dates absolute and record the source URL/export date.
