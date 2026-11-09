# Wardro AI — Agent Service

Local-first, family wardrobe management and AI styling. This directory contains the
Python AI agent service: a FastAPI application that routes chat requests through a
LangGraph workflow to specialised agents backed by local Ollama models.

**No cloud LLM providers are used.** All inference runs against a local Ollama server.

## Where this fits

This is the LangChain service in the architecture described in
[`docs/research/notion-synthesis.md`](../docs/research/notion-synthesis.md): a
separate Python process for intent routing, styling and vision, called by Bun
after Firebase authentication. Bun remains the system of record. This service
must not write wardrobe data; it reads through authorized backend APIs and
returns drafts that the user confirms.

| Capability | Milestone 1 status |
| --- | --- |
| FastAPI API, LangGraph workflow, four agents, Ollama provider | Implemented |
| Intent classification, deterministic routing, structured errors | Implemented |
| Health, model availability, 68 tests, Ruff checks | Implemented |
| Firebase auth / internal JWT from Bun | Not wired — development-only body identity |
| Profile-scoped inventory read | Implemented for development via the Firebase token passthrough |
| Inventory-aware styling | Implemented in text (agents receive the profile inventory) |
| Single-image garment analysis | Implemented — attach a photo in chat; the vision model returns structured attributes |
| Saving an analyzed garment | Not implemented — the analysis is returned to chat, not written to the wardrobe |
| Conversation persistence | Not wired — checkpointer returns `None` |
| Bun proxy at `/api/ai/*` | Not implemented |

The fixture for the first real inventory retrieval is the four-profile
[simulation dataset](../scripts/datasets/wardrobe-simulation/README.md). The
schema attributes it exposes are analysed in
[`docs/research/data-model-assessment.md`](../docs/research/data-model-assessment.md).

## Milestone 1 status

Implemented:

- FastAPI application with `GET /health`, `GET /health/ollama`, and `POST /api/v1/chat`.
- Typed configuration via Pydantic Settings (`.env` + environment variables).
- Shared async Ollama provider built on `ChatOllama`, with separate chat and vision
  model configuration, model availability checks, and graceful connection errors.
- LangGraph `StateGraph` with input validation, intent classification, deterministic
  agent routing, four agents, and response formatting.
- Intent classifier: keyword rules for common requests, LLM structured classification
  for ambiguous messages, safe `general_advice` fallback.
- Conversation `thread_id` accepted end-to-end and passed to the graph.
- 68 tests that run without an Ollama server, plus Ruff lint/format checks.

Implemented in this milestone: a read-only, profile-scoped inventory bridge. The
FastAPI layer fetches the active profile's items from the Bun API using a
development-only Firebase token and passes the snapshot to the analyst and
stylist agents. The token is never logged, stored in graph state, or checkpointed.

Not implemented yet (see [Limitations](#current-limitations)): the Bun→Python
authentication proxy, saving the analyzed garment, queued multi-photo analysis,
inventory write/action tools, conversation persistence, and RAG. The intended
integration order is in [Next milestones](#next-milestones).

## Architecture

```text
FastAPI (app/api, app/main.py)
    │  validated request (Pydantic)
    ▼
Policies (app/policies/access_control.py)
    │  trusted user/household/profile context
    ▼
LangGraph workflow (app/graph/workflow.py)
    START
      │
      ▼
    validate_input ──(error)──► format_response ──► END
      │
      ▼
    classify_intent        keyword rules, then LLM structured output
      │
      ▼
    select_agent           deterministic intent → agent map
      │
      ├── wardrobe_analyst
      ├── outfit_stylist
      ├── vision_analyst
      └── wardrobe_advisor
      │
      ▼
    format_response ──► END
      │
      ▼
OllamaProvider (app/services/ollama_provider.py) ──► local Ollama
```

Key boundaries:

- **API layer** (`app/api`) owns HTTP contracts and error mapping.
- **Graph layer** (`app/graph`) owns state, nodes, routing, and workflow assembly.
- **Agent layer** (`app/agents`) owns role prompts and agent behaviour.
- **Service layer** (`app/services`) owns LLM construction and error translation.
- **Policy layer** (`app/policies`) owns trusted-context resolution.
- **Schemas** (`app/schemas`) define request/response models.

Dependencies are injected: the provider and compiled graph live on `app.state`, and
nodes receive their dependencies from the workflow factory. Nothing is initialised in
module-level mutable globals, and agents never construct LLM clients themselves.

### Intent → agent mapping

| Intent | Agent |
|---|---|
| `wardrobe_analysis` | `wardrobe_analyst` |
| `outfit_recommendation` | `outfit_stylist` |
| `image_analysis` | `vision_analyst` |
| `general_advice` | `wardrobe_advisor` |

## Prerequisites

- Python **3.12**
- [uv](https://docs.astral.sh/uv/) (package and dependency management)
- [Ollama](https://ollama.com/) running locally

## Quick start

### 1. Install uv

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# or with Homebrew
brew install uv
```

### 2. Install dependencies

```bash
cd wardro-agent
uv sync
```

`uv sync` creates `.venv` from the pinned `uv.lock` and installs the project itself.

### 3. Install and start Ollama

```bash
# macOS
brew install ollama
# or: https://ollama.com/download

ollama serve
```

In a second terminal, pull the configured models:

```bash
ollama pull qwen3
ollama pull qwen3-vl

# Verify
ollama list
curl -s http://localhost:11434/api/tags
```

The models are **not** assumed to be pre-installed. If you use different tags, update
`OLLAMA_CHAT_MODEL` / `OLLAMA_VISION_MODEL` in `.env`. Use the exact tag you pulled: an
untagged name such as `qwen3` means `qwen3:latest` to Ollama, not `qwen3:4b`.
`GET /health/ollama` reports which configured models are missing.

Qwen3.5 models default to thinking mode, which can spend the whole `OLLAMA_NUM_PREDICT`
budget before producing an answer and can make structured JSON classification return
empty output. `OLLAMA_DISABLE_THINKING=true` sends `think: false` to Ollama. If you use a
model that ignores that flag (some Qwen3 tags do), set it to `false`.

### 4. Configure the environment

```bash
cp .env.example .env
```

Edit `.env` if your Ollama URL, models, or backend URLs differ. `.env` is gitignored;
`.env.example` documents every supported variable.

| Variable | Default | Purpose |
|---|---|---|
| `APP_NAME` | `Wardro AI` | Application title |
| `APP_ENV` | `development` | `development`, `test`, `staging`, or `production` |
| `DEBUG` | `false` | Exposes internal error detail in API responses |
| `LOG_LEVEL` | `INFO` | Root log level (JSON logs) |
| `API_V1_PREFIX` | `/api/v1` | API route prefix |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_CHAT_MODEL` | `qwen3` | Chat/instruct model |
| `OLLAMA_VISION_MODEL` | `qwen3-vl` | Vision model (reserved; not used yet) |
| `OLLAMA_TEMPERATURE` | `0.2` | Sampling temperature |
| `OLLAMA_NUM_PREDICT` | `1024` | Maximum generated tokens |
| `OLLAMA_DISABLE_THINKING` | `true` | Send `think: false`; prevents reasoning from consuming the output budget |
| `OLLAMA_REQUEST_TIMEOUT` | `120` | LLM request timeout (seconds) |
| `OLLAMA_HEALTH_TIMEOUT` | `5` | Health check timeout (seconds) |
| `MAX_MESSAGE_LENGTH` | `8000` | Maximum user message length |
| `MAX_HISTORY_MESSAGES` | `10` | Prior messages forwarded to an agent |
| `CORS_ORIGINS` | `localhost:8081`, `127.0.0.1:8081`, `localhost:19006`, … | Comma-separated browser origins allowed to call the API |
| `CORS_ORIGIN_REGEX` | `^https?://(localhost\|127\.0\.0\.1)(:\d+)?$` | Development-only regex that also permits any localhost port |
| `DATABASE_URL` | — | Reserved for the persistence milestone |
| `BACKEND_API_URL` | `http://localhost:3000` | Wardrobe backend (not called yet) |

### 5. Start the API

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

OpenAPI docs: <http://localhost:8000/docs>

## API examples

### Health

```bash
curl -s http://localhost:8000/health | jq
```

```json
{
  "status": "healthy",
  "service": "wardro-ai",
  "version": "0.1.0",
  "environment": "development"
}
```

### Ollama health

```bash
curl -s http://localhost:8000/health/ollama | jq
```

Returns `200` when Ollama is reachable (status `ok` or `degraded` if a configured
model is missing) and `503` when Ollama cannot be reached.

### Chat

```bash
curl -s -X POST http://localhost:8000/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "What should I wear for a wedding?",
    "thread_id": "thread-123",
    "user_id": "user-123",
    "household_id": "family-123",
    "profile_id": "profile-123"
  }' | jq
```

```json
{
  "success": true,
  "thread_id": "thread-123",
  "intent": "outfit_recommendation",
  "agent": "outfit_stylist",
  "message": "Here are some illustrative suggestions...",
  "metadata": {
    "model": "qwen3",
    "persistence": "disabled",
    "wardrobe_context": "unavailable",
    "identity_source": "development_request_body"
  }
}
```

If `thread_id` is omitted, the API generates one (`thread-<uuid>`). If Ollama is down,
the API returns `503` with a structured `ErrorResponse`; the workflow never crashes the
process.

## Development inventory bridge

The analyst and stylist agents receive a real, profile-scoped inventory snapshot:

1. The app sends its Firebase ID token as `firebase_token` in the chat request.
2. FastAPI calls `GET {BACKEND_API_URL}/api/wardrobeItems` with
   `Authorization: Bearer <token>` and `X-Profile-Id`.
3. The token is used only for that call. It is **not** placed in `WardroState`,
   a LangGraph checkpoint, a log line, or an error message.
4. The item snapshot is put in state and rendered into the agent prompt.

This is a **development bridge**, not the production trust boundary. When Bun
exposes `/api/ai/*`, Bun will verify Firebase and profile ownership, sign a
short-lived internal JWT, and Python will verify that JWT. The `firebase_token`
field should then be removed from the request contract.

If the backend is unreachable or rejects the token, the agent falls back to the
explicitly-unavailable wardrobe context and says so rather than inventing items.

## Security: development-only identity injection

The example `user_id`, `household_id`, and `profile_id` values above are **illustrative
and unauthenticated**. This milestone has no authentication middleware.

`app/policies/access_control.py` resolves identity as follows:

- `APP_ENV=development`: identity is read from the request body so the API can be
  exercised locally. Every response metadata block marks the source as
  `development_request_body`.
- Any other `APP_ENV`: client-supplied identity is **rejected** with `401`. The service
  fails closed rather than treating body values as authenticated.

Before deployment, replace this with verified authentication middleware. Agents must
never infer user identity from LLM output or from the message text.

## Persistence status

`thread_id` is accepted, validated, returned, and passed to LangGraph as
`config.configurable.thread_id`. **No checkpointer is configured in this milestone, so
conversations do not persist between requests and the graph has no cross-request
memory.** The response metadata states `"persistence": "disabled"`.

`app/graph/checkpointer.py` is the single seam for persistence. `build_workflow(...)`
already accepts a `checkpointer` argument, so enabling persistence will not require
rewriting workflow nodes. The next milestone will construct an
`AsyncPostgresSaver` from `DATABASE_URL`, run its schema setup at startup, and return it
from `build_checkpointer`. Until then, `build_checkpointer` returns `None`.

## Testing

Tests mock the Ollama provider and do not require a running server.

```bash
uv run pytest -q
uv run pytest --cov=app
```

Coverage includes application startup, both health endpoints, provider configuration and
error translation, every intent classification path, all four routing paths, each agent
in isolation, full graph execution, unknown-intent fallback, Ollama-unavailable handling,
validation failures, and API response validation.

## Linting and formatting

```bash
uv run ruff check .
uv run ruff format --check .
uv run ruff format .
```

## Docker

```bash
docker build -t wardro-ai .
docker run --rm -p 8000:8000 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  wardro-ai
```

The Dockerfile was not built as part of this milestone; verify it in your environment.
Ollama must be reachable from the container (`host.docker.internal` on macOS/Windows,
or a host network/gateway on Linux).

## Project structure

```text
wardro/                          # repository root
└── wardro-agent/                # this service
    ├── app/
    │   ├── main.py              # create_app(), lifespan, health endpoints
    │   ├── config.py            # Pydantic Settings
    │   ├── logging_config.py    # JSON structured logging
    │   ├── dependencies.py      # FastAPI dependency providers
    │   ├── api/
    │   │   └── chat.py          # POST /api/v1/chat
    │   ├── agents/
    │   │   ├── base.py          # shared agent invocation
    │   │   ├── prompts.py       # centralised prompts
    │   │   ├── wardrobe_analyst.py
    │   │   ├── outfit_stylist.py
    │   │   ├── vision_analyst.py
    │   │   └── wardrobe_advisor.py
    │   ├── graph/
    │   │   ├── state.py         # typed WardroState
    │   │   ├── routing.py       # intents, classifier, intent→agent map
    │   │   ├── nodes.py         # graph nodes and conditional edges
    │   │   ├── checkpointer.py  # persistence seam (returns None)
    │   │   └── workflow.py      # build_workflow() factory
    │   ├── services/
    │   │   ├── ollama_provider.py   # ChatOllama construction, errors, health
    │   │   └── wardrobe_backend.py  # read-only profile inventory client
    │   ├── tools/
    │   │   └── wardrobe_tools.py    # inventory snapshot → prompt context
    │   ├── vision/
    │   │   ├── image_analyzer.py    # not-yet-available analyser
    │   │   └── schemas.py
    │   ├── policies/
    │   │   └── access_control.py    # trusted context / dev injection
    │   └── schemas/
    │       ├── requests.py
    │       └── responses.py
    ├── src/
    │   └── wardro_ai/
    │       └── __init__.py      # `wardro-ai` console entry point
    ├── tests/
    ├── pyproject.toml
    ├── uv.lock
    ├── Dockerfile
    ├── .env.example
    └── README.md
```

## Current limitations

- **No authentication.** Identity is trusted from the request body only in development;
  production rejects it. Auth middleware is the next security milestone.
- **No conversation persistence.** `thread_id` is plumbing only until a checkpointer is
  configured. Conversations do not survive between requests.
- **Inventory is read-only and development-authenticated.** The agent can list and
  reason over the active profile's items, but it cannot create, edit, mark worn, or
  save outfits. The Bun proxy and internal JWT are still pending, and prompts forbid
  inventing garments when a snapshot is unavailable.
- **Vision is single-image and synchronous.** A photo attached in chat is classified
  into structured attributes, but the analysis is not yet saved to the wardrobe, queued
  for multi-photo processing, deduplicated, or linked to an existing item.
- **No LLM-directed tool loop, RAG, embeddings, or multi-agent supervision.** Inventory
  retrieval is deterministic pre-graph work, not a model-selected tool call. The
  classifier only returns an intent.
- **Wardrobe/images routers, the backend client, and outfit/history tools are deferred.**
  They are added together with the features they serve rather than shipped as empty
  endpoints or disguised placeholders.
- **Single-turn agents.** Without a checkpointer, each request carries only its own
  message (plus any history explicitly supplied in state).
- **The Expo client is a development test harness.** It has no authentication or
  secure token storage, uses request-body identity, and does not stream tokens. It is
  intended for local browser testing only.
- **Thinking models can emit reasoning text** and run slowly on CPU-only machines.
  `OLLAMA_DISABLE_THINKING=true` sends `think: false`; if a model ignores that flag,
  set it to `false` and reasoning stays in the model's separate thinking channel.
  Adjust `OLLAMA_TEMPERATURE`, `OLLAMA_NUM_PREDICT`, or choose a smaller model as needed.

## Next milestones

1. **Bun proxy and internal JWT** — Bun verifies the Firebase token and profile
   ownership, signs a short-lived internal JWT, and calls this service. Python verifies
   the JWT and the development-only body identity path is removed. See
   [`docs/research/notion-synthesis.md`](../docs/research/notion-synthesis.md).
2. **Wardrobe tools** — build on the read-only inventory bridge with filtered search,
   item detail, outfit composition, wear logging, saved outfits, and confirmation-gated
   write actions.
3. **Vision pipeline** — save/confirm the structured analysis, support queued
   multi-photo ingestion, URL images, duplicate detection and background retries.
4. **Persistence** — PostgreSQL checkpointer, conversation history per thread,
   retention policy.
5. **Retrieval and richer styling** — wardrobe embeddings/RAG, deterministic outfit
   composition, and only then multi-agent collaboration.
