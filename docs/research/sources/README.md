# Source exports

Verbatim exports kept for provenance. **Reference only — not a source of
truth.**

| File | Original filename | Exported |
| --- | --- | --- |
| [`notion-family-wardrobe-intelligence-architect.md`](./notion-family-wardrobe-intelligence-architect.md) | `Wardro AI — Family Wardrobe Intelligence Architect 40eb044142298176810ccb6d4f07a987.md` | 2026-11-05 |
| [`notion-complete-technical-implementation.md`](./notion-complete-technical-implementation.md) | `Wardro AI — Complete Technical Implementation 40eb044142298149b008c08a09da27c2.md` | 2026-11-05 |

These were downloaded from a Notion workspace and are stored here without
edits so the original wording, examples and caveats remain available.

## Before using them

- They were written for an earlier Flutter client and a `wardrobe_profile`
  table. The repository now uses React Native and a `profile` table with
  `name`, `color`, `avatar_url` and `is_default`.
- Route names, method signatures, file paths and SQL are **illustrative**. Do
  not copy them into the codebase without matching the actual implementation.
- The AI service, LangGraph workflow and Ollama setup described here do not
  exist in this repository yet. They are a design proposal.
- The documents themselves say they are design references and that actual
  route/signature matching is required. That is correct.

The actionable extraction is in
[`../notion-synthesis.md`](../notion-synthesis.md); the schema plan is in
[`../data-model-assessment.md`](../data-model-assessment.md).

## Licensing and sharing

These are internal product-design notes, not third-party open-source
documentation. Do not republish them outside the project without checking with
the owner. The image sources used by the simulation dataset are documented
separately in
[`../../../scripts/datasets/wardrobe-simulation/ATTRIBUTIONS.md`](../../../scripts/datasets/wardrobe-simulation/ATTRIBUTIONS.md).
