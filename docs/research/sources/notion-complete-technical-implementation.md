# Wardro AI — Complete Technical Implementation

We're going to build Wardro AI as a new, independently deployable Python service that integrates with the existing Wardro application.

## Product and architecture decisions

- **Scope:** Entire family, with individual wardrobe profiles.
- **Clothing input:** Manual photo uploads and mobile camera capture, both with AI auto-categorization.
- **Deployment:** Local-first using Ollama, with a path to cloud deployment.
- **Orchestration:** LangGraph.
- **Vision:** Ollama multimodal model.
- **Existing application:** Flutter + Firebase Auth + Bun/Hono + PostgreSQL/Drizzle + Firebase Storage + Next.js.

**Key architectural decision:** Python is the AI intelligence layer. The existing Bun backend remains the system of record; Python will not own a second copy of wardrobe data.

## 1. Target architecture

```mermaid
flowchart TD
    A[Wardro Mobile Application<br/>Flutter · Family profiles · Camera · Chat] --> B[Bun + Hono Backend<br/>Firebase Auth · Authorization · Drizzle]
    B --> C[Python Agent Platform<br/>FastAPI]
    C --> D[Wardro Agent Harness<br/>Agent registry · Tools · Policies · Context]
    D --> E[LangGraph Workflow]
    E --> F[Intent Router]
    F --> G[Inventory Agent]
    F --> H[Stylist Agent]
    F --> I[Vision Agent]
    F --> J[Insights Agent]
    G --> K[Ollama Text LLM]
    H --> K
    I --> L[Ollama Vision LLM]
    C --> M[Existing PostgreSQL]
    C --> N[Firebase Storage]
    C --> O[LangGraph Checkpoints]
```

### Ownership boundaries

| Component | Owns |
| --- | --- |
| Flutter | User interaction and presentation |
| Bun/Hono | Authentication, authorization, database mutations |
| PostgreSQL | Wardrobe and family data |
| Firebase Storage | Original clothing images |
| Python/FastAPI | AI execution and orchestration |
| LangGraph | Workflow state and transitions |
| Ollama | Local LLM and image inference |

This separation allows Ollama, LangGraph workflows and AI models to evolve without changing Flutter or existing business APIs.

## 2. Existing repository: integration points

The implementation is designed around the existing repository structure and documented integration points:

| Area | Existing implementation |
| --- | --- |
| Flutter app | `mobile/` — Flutter |
| Backend | `backend/` — Bun + Hono |
| DB schema | `backend/src/schema.ts` |
| Authentication | `backend/src/auth.ts` — Firebase ID token verification |
| Existing tables | `user`, `wardrobe`, `wardrobe_item` |
| Item photo field | `photo_uri` |
| Storage path | `users/{uid}/items/...` |
| Existing API | `/api/wardrobes`, `/api/wardrobeItems` |
| Flutter API client | Existing authenticated API client under `mobile/lib/` |

The current Drizzle schema has three core tables. Add family profiles and AI metadata without replacing those tables. Preserve the existing authentication model: derive the owner UID from the verified Firebase token, never trust a client-supplied owner ID.

### Family data model

```mermaid
erDiagram
    user ||--o{ wardrobe_profile : owns
    wardrobe_profile ||--o{ wardrobe : contains
    wardrobe ||--o{ wardrobe_item : contains
    wardrobe_item ||--o| wardrobe_item_analysis : analyzed_as
    wardrobe_profile ||--o| wardrobe_style_preferences : has
    wardrobe_profile ||--o{ wardrobe_outfit : saves
    wardrobe_outfit ||--o{ wardrobe_outfit_item : includes
    wardrobe_item ||--o{ wardrobe_outfit_item : appears_in
    wardrobe_item ||--o{ wardrobe_wear_history : tracked_by
```

A profile can have multiple wardrobes (office, casual, festive, seasonal). A wardrobe can contain many items. Suggested relationships include `self`, `spouse`, `child`, `parent`, and `other`. Keep family profiles under one authenticated account initially; child profiles do not need separate login accounts.

## 3. Database migrations — Drizzle + PostgreSQL

Make the database changes additive and backfill existing users and wardrobes.

### Migration 001: Family profiles

File: `backend/drizzle/0002_family_profiles.sql`

```sql
CREATE TABLE wardrobe_profile (
    id SERIAL PRIMARY KEY,
    owner_uid TEXT NOT NULL
        REFERENCES "user"(uid) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    relationship TEXT NOT NULL DEFAULT 'self',
    profile_type TEXT NOT NULL DEFAULT 'adult',
    date_of_birth DATE,
    avatar_uri TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX wardrobe_profile_owner_idx
ON wardrobe_profile(owner_uid);

ALTER TABLE wardrobe
ADD COLUMN profile_id INTEGER
REFERENCES wardrobe_profile(id)
ON DELETE RESTRICT;
```

### Backfill existing wardrobes

```sql
INSERT INTO wardrobe_profile (
    owner_uid, display_name, relationship, profile_type
)
SELECT uid, COALESCE(display_name, 'My Wardrobe'), 'self', 'adult'
FROM "user";

UPDATE wardrobe w
SET profile_id = p.id
FROM wardrobe_profile p
WHERE p.owner_uid = w.owner_uid
  AND p.relationship = 'self'
  AND w.profile_id IS NULL;

ALTER TABLE wardrobe
ALTER COLUMN profile_id SET NOT NULL;

CREATE INDEX wardrobe_profile_idx
ON wardrobe(profile_id);

CREATE UNIQUE INDEX wardrobe_profile_self_unique
ON wardrobe_profile(owner_uid)
WHERE relationship = 'self';
```

### Migration 002: AI clothing attributes

File: `backend/drizzle/0003_wardrobe_ai.sql`

```sql
CREATE TABLE wardrobe_item_analysis (
    id SERIAL PRIMARY KEY,
    wardrobe_item_id INTEGER NOT NULL UNIQUE
        REFERENCES wardrobe_item(id) ON DELETE CASCADE,
    garment_type TEXT,
    subcategory TEXT,
    primary_color TEXT,
    secondary_colors JSONB DEFAULT '[]',
    pattern TEXT,
    material TEXT,
    fit TEXT,
    sleeve_length TEXT,
    occasions JSONB DEFAULT '[]',
    seasons JSONB DEFAULT '[]',
    style_tags JSONB DEFAULT '[]',
    confidence JSONB DEFAULT '{}',
    model_name TEXT,
    prompt_version TEXT,
    verified_by_user BOOLEAN NOT NULL DEFAULT FALSE,
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX wardrobe_analysis_type_idx
ON wardrobe_item_analysis(garment_type);

CREATE INDEX wardrobe_analysis_color_idx
ON wardrobe_item_analysis(primary_color);
```

The existing `category`, `color`, `size`, `brand` and `item_name` fields remain useful. AI analysis adds detailed attributes instead of replacing existing data.

### Migration 003: Wear history and preferences

```sql
CREATE TABLE wardrobe_wear_history (
    id BIGSERIAL PRIMARY KEY,
    owner_uid TEXT NOT NULL REFERENCES "user"(uid) ON DELETE CASCADE,
    wardrobe_item_id INTEGER NOT NULL
        REFERENCES wardrobe_item(id) ON DELETE CASCADE,
    worn_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    occasion TEXT,
    notes TEXT
);

CREATE INDEX wear_history_item_date_idx
ON wardrobe_wear_history(wardrobe_item_id, worn_at DESC);

CREATE TABLE wardrobe_style_preferences (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER NOT NULL UNIQUE
        REFERENCES wardrobe_profile(id) ON DELETE CASCADE,
    preferred_colors JSONB DEFAULT '[]',
    preferred_styles JSONB DEFAULT '[]',
    preferred_occasions JSONB DEFAULT '[]',
    disliked_colors JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration 004: Saved outfits

```sql
CREATE TABLE wardrobe_outfit (
    id SERIAL PRIMARY KEY,
    owner_uid TEXT NOT NULL REFERENCES "user"(uid) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL
        REFERENCES wardrobe_profile(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    occasion TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wardrobe_outfit_item (
    outfit_id INTEGER NOT NULL
        REFERENCES wardrobe_outfit(id) ON DELETE CASCADE,
    wardrobe_item_id INTEGER NOT NULL
        REFERENCES wardrobe_item(id) ON DELETE CASCADE,
    PRIMARY KEY (outfit_id, wardrobe_item_id)
);
```

Add database-level constraints or transaction checks to ensure every outfit item belongs to the same profile and owner as the outfit. Application authorization alone should not be the only protection.

### Drizzle schema additions

Add the following definitions to `backend/src/schema.ts`, adapting imported names to the existing schema:

```tsx
import {
  pgTable, serial, text, integer, timestamp, date,
  boolean, jsonb
} from "drizzle-orm/pg-core";

export const wardrobeProfiles = pgTable("wardrobe_profile", {
  id: serial("id").primaryKey(),
  ownerUid: text("owner_uid").notNull()
    .references(() => users.uid, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  relationship: text("relationship").notNull(),
  profileType: text("profile_type").notNull(),
  dateOfBirth: date("date_of_birth"),
  avatarUri: text("avatar_uri"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow().notNull(),
});

export const wardrobeItemAnalysis = pgTable("wardrobe_item_analysis", {
  id: serial("id").primaryKey(),
  wardrobeItemId: integer("wardrobe_item_id").notNull().unique()
    .references(() => wardrobeItems.id, { onDelete: "cascade" }),
  garmentType: text("garment_type"),
  subcategory: text("subcategory"),
  primaryColor: text("primary_color"),
  secondaryColors: jsonb("secondary_colors").default([]),
  pattern: text("pattern"),
  material: text("material"),
  fit: text("fit"),
  sleeveLength: text("sleeve_length"),
  occasions: jsonb("occasions").default([]),
  seasons: jsonb("seasons").default([]),
  styleTags: jsonb("style_tags").default([]),
  confidence: jsonb("confidence").default({}),
  modelName: text("model_name"),
  promptVersion: text("prompt_version"),
  verifiedByUser: boolean("verified_by_user").notNull().default(false),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).defaultNow(),
});
```

Also add `profileId` to the existing `wardrobes` definition and define wear-history, preferences and outfit tables using the SQL above.

**Migration note:** Do not use `drizzle-kit push` as the production migration mechanism. Generate and review SQL migrations, back up the database and run migrations against a development copy before production.

## 4. Python AI service — project structure

Create a new root-level `ai/` directory:

```
ai/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── chat.py
│   │   ├── vision.py
│   │   └── health.py
│   ├── graph/
│   │   ├── state.py
│   │   ├── context.py
│   │   ├── workflow.py
│   │   ├── nodes.py
│   │   └── routing.py
│   ├── agents/
│   │   ├── inventory.py
│   │   ├── stylist.py
│   │   ├── advisor.py
│   │   └── vision.py
│   ├── services/
│   │   ├── ollama.py
│   │   ├── backend.py
│   │   └── image_service.py
│   ├── schemas/
│   │   ├── chat.py
│   │   ├── clothing.py
│   │   └── outfit.py
│   └── security/
│       └── internal_auth.py
├── tests/
├── pyproject.toml
├── Dockerfile
└── .env.example
```

### Dependencies

File: `ai/pyproject.toml`

```toml
[project]
name = "wardro-ai"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.120",
    "uvicorn[standard]",
    "langgraph",
    "langchain-core",
    "langchain-ollama",
    "ollama",
    "pydantic>=2",
    "pydantic-settings",
    "httpx",
    "python-multipart",
    "psycopg[binary,pool]",
    "langgraph-checkpoint-postgres",
    "pyjwt[crypto]",
    "pillow"
]

[dependency-groups]
dev = ["pytest", "pytest-asyncio", "ruff", "httpx"]
```

Install and pull starter models:

```bash
cd ai
uv sync
ollama pull qwen3:8b
ollama pull qwen3-vl:4b
```

Starting model choices:

| Workload | Model |
| --- | --- |
| Chat and intent understanding | `qwen3:8b` |
| Clothing image recognition | `qwen3-vl:4b` |
| Better vision accuracy experiments | `qwen3-vl:8b` |

These are starting configurations, not guaranteed hardware requirements. Quantization and available memory matter. Confirm model availability and Ollama version in the target environment.

## 5. Build the LangGraph workflow

Use a deterministic retrieval step followed by LLM reasoning. Avoid allowing an unrestricted agent to execute arbitrary database tools.

### State and request context

File: `ai/app/graph/state.py`

```python
from typing import TypedDict, Annotated, Any
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class WardroState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    intent: str
    filters: dict[str, Any]
    wardrobe_items: list[dict]
    response: dict
```

File: `ai/app/graph/context.py`

```python
from typing import TypedDict

class WardroContext(TypedDict):
    owner_uid: str
    profile_id: int
    firebase_id_token: str
```

State contains workflow data. Context contains authenticated request information. The LLM never chooses another user's UID.

### Configuration

File: `ai/app/config.py`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    OLLAMA_URL: str = "http://localhost:11434"
    TEXT_MODEL: str = "qwen3:8b"
    VISION_MODEL: str = "qwen3-vl:4b"
    BACKEND_URL: str = "http://localhost:3000/api"
    INTERNAL_SERVICE_SECRET: str
    DATABASE_URL: str
    MAX_UPLOAD_MB: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
```

### Intent classification

File: `ai/app/schemas/chat.py`

```python
from typing import Literal, Any
from pydantic import BaseModel, Field

class IntentPlan(BaseModel):
    intent: Literal[
        "inventory_search",
        "outfit_recommendation",
        "wardrobe_insights",
        "general_chat"
    ]
    filters: dict[str, Any] = Field(default_factory=dict)
    occasion: str | None = None
    explanation: str = ""
```

File: `ai/app/graph/nodes.py`

```python
from langchain_core.messages import SystemMessage
from langchain_ollama import ChatOllama
from app.config import settings
from app.schemas.chat import IntentPlan

text_model = ChatOllama(
    model=settings.TEXT_MODEL,
    base_url=settings.OLLAMA_URL,
    temperature=0
)

intent_model = text_model.with_structured_output(IntentPlan)

async def classify_intent(state):
    result = await intent_model.ainvoke([
        SystemMessage(content="""
        You are Wardro's wardrobe intent classifier.
        Classify the user's request:
        inventory_search: asks what clothes they own.
        outfit_recommendation: asks for outfit combinations.
        wardrobe_insights: asks about usage, unused items or wardrobe gaps.
        general_chat: other wardrobe-related conversation.
        Extract useful filters such as category, color, garment_type,
        brand and occasion. Never invent wardrobe items.
        """),
        state["messages"][-1]
    ])
    return {"intent": result.intent, "filters": result.filters}
```

### Routing

File: `ai/app/graph/routing.py`

```python
def route_intent(state):
    return {
        "inventory_search": "inventory",
        "outfit_recommendation": "stylist",
        "wardrobe_insights": "advisor",
        "general_chat": "general"
    }.get(state["intent"], "general")
```

### Retrieve actual wardrobe data

File: `ai/app/services/backend.py`

```python
import httpx
from app.config import settings

class WardroBackend:
    async def get_items(self, token: str, profile_id: int, filters: dict):
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.BACKEND_URL}/wardrobeItems",
                headers={"Authorization": f"Bearer {token}"},
                params={"profileId": profile_id, **filters},
                timeout=20
            )
            response.raise_for_status()
            return response.json()
```

The `profileId` filter must be added to the Bun endpoint. It must always scope results by authenticated `owner_uid` and selected profile.

### Inventory agent

File: `ai/app/agents/inventory.py`

```python
from app.services.backend import WardroBackend

backend = WardroBackend()

async def inventory_node(state, runtime):
    context = runtime.context
    items = await backend.get_items(
        token=context["firebase_id_token"],
        profile_id=context["profile_id"],
        filters=state["filters"]
    )
    return {
        "wardrobe_items": items,
        "response": {"type": "inventory", "items": items}
    }
```

### Outfit stylist

File: `ai/app/agents/stylist.py`

```python
from pydantic import BaseModel
from app.graph.nodes import text_model

class OutfitSuggestion(BaseModel):
    name: str
    item_ids: list[int]
    explanation: str
    occasion: str

class OutfitResponse(BaseModel):
    suggestions: list[OutfitSuggestion]

stylist_model = text_model.with_structured_output(OutfitResponse)

async def stylist_node(state):
    available_items = state["wardrobe_items"]
    result = await stylist_model.ainvoke([
        ("system", """
        You are Wardro's personal fashion stylist.
        Recommend outfits using ONLY the supplied wardrobe items.
        Every item_ids entry must be an ID from the inventory.
        Never invent items or image URLs.
        If there are insufficient matching clothes, explain what is missing.
        """),
        ("human", f"""
        User request: {state['messages'][-1].content}
        Available wardrobe items: {available_items}
        """)
    ])

    available_ids = {item["id"] for item in available_items}
    suggestions = []
    for outfit in result.suggestions:
        valid_ids = [
            item_id for item_id in outfit.item_ids
            if item_id in available_ids
        ]
        if valid_ids:
            suggestions.append({
                **outfit.model_dump(),
                "item_ids": valid_ids
            })

    return {
        "response": {
            "type": "outfits",
            "suggestions": suggestions
        }
    }
```

In production, validate that each outfit contains compatible garment roles (for example, top and bottom) and that returned items belong to the selected profile.

### Build the graph

File: `ai/app/graph/workflow.py`

```python
from langgraph.graph import StateGraph, START, END
from app.graph.state import WardroState
from app.graph.nodes import classify_intent
from app.graph.routing import route_intent
from app.agents.inventory import inventory_node
from app.agents.stylist import stylist_node

async def advisor_node(state, runtime):
    # Query wear history through the authenticated backend.
    # Calculate usage statistics deterministically.
    return {"response": {"type": "insights", "items": []}}

async def general_node(state):
    from app.graph.nodes import text_model
    response = await text_model.ainvoke(state["messages"])
    return {
        "response": {
            "type": "text",
            "message": response.content
        }
    }

async def prepare_stylist(state, runtime):
    return await inventory_node(state, runtime)

def build_wardro_graph(checkpointer=None):
    graph = StateGraph(WardroState)
    graph.add_node("classify", classify_intent)
    graph.add_node("inventory", inventory_node)
    graph.add_node("stylist_inventory", prepare_stylist)
    graph.add_node("stylist", stylist_node)
    graph.add_node("advisor", advisor_node)
    graph.add_node("general", general_node)
    graph.add_edge(START, "classify")
    graph.add_conditional_edges(
        "classify",
        route_intent,
        {
            "inventory": "inventory",
            "outfit_recommendation": "stylist_inventory",
            "wardrobe_insights": "advisor",
            "general_chat": "general"
        }
    )
    graph.add_edge("stylist_inventory", "stylist")
    for node in ["inventory", "stylist", "advisor", "general"]:
        graph.add_edge(node, END)
    return graph.compile(checkpointer=checkpointer)
```

This is a starter workflow. The advisor node is a placeholder, not a completed insights engine. Declare `context_schema=WardroContext` on the graph builder and use `Runtime[WardroContext]` in nodes that access request context.

## 6. Ollama vision — analyze uploaded clothing

The image analyzer returns a structured draft, not a direct database mutation.

File: `ai/app/schemas/clothing.py`

```python
from pydantic import BaseModel, Field

class ClothingAnalysis(BaseModel):
    garment_type: str
    subcategory: str | None = None
    primary_color: str
    secondary_colors: list[str] = Field(default_factory=list)
    pattern: str | None = None
    material: str | None = None
    fit: str | None = None
    sleeve_length: str | None = None
    occasions: list[str] = Field(default_factory=list)
    seasons: list[str] = Field(default_factory=list)
    style_tags: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1)
    uncertain_fields: list[str] = Field(default_factory=list)
```

File: `ai/app/agents/vision.py`

```python
import ollama
from app.config import settings
from app.schemas.clothing import ClothingAnalysis

class ClothingVisionAgent:
    def __init__(self):
        self.client = ollama.AsyncClient(host=settings.OLLAMA_URL)

    async def analyze(self, image_bytes: bytes):
        response = await self.client.chat(
            model=settings.VISION_MODEL,
            messages=[{
                "role": "user",
                "content": """
                Analyze the clothing item in this image.
                Identify garment type, subcategory, primary and secondary
                colors, pattern, fabric only if visually identifiable,
                fit, sleeve length, appropriate occasions and style.
                Do not infer the wearer, identity or age.
                Do not guess material when uncertain.
                Return only the requested structured result.
                """,
                "images": [image_bytes]
            }],
            format=ClothingAnalysis.model_json_schema(),
            options={"temperature": 0}
        )
        return ClothingAnalysis.model_validate_json(
            response.message.content
        )
```

### Clothing taxonomy

For Indian wardrobes, include Saree, blouse, lehenga, salwar suit, kurti, dupatta; Western dresses, jeans, trousers, tops and shirts; men's kurta, sherwani, formal and casual shirts; children's ethnic wear, school wear, rompers and baby clothing; footwear, bags and accessories.

Do not force all clothing into generic `top`, `bottom`, `dress` categories. Keep a normalized category and a specific garment type.

## 7. API contracts — integrate with the existing Hono backend

Keep existing routes working:

```
GET    /api/wardrobes
POST   /api/wardrobes
GET    /api/wardrobeItems
GET    /api/wardrobeItems/:wardrobeId
POST   /api/wardrobeItems
DELETE /api/wardrobeItems/:id
```

Add these routes:

| Method | Endpoint | Responsibility |
| --- | --- | --- |
| GET | `/api/profiles` | List family profiles |
| POST | `/api/profiles` | Create profile |
| PATCH | `/api/profiles/:id` | Update profile |
| DELETE | `/api/profiles/:id` | Delete profile, subject to ownership and data rules |
| POST | `/api/ai/chat` | Wardrobe conversation |
| POST | `/api/ai/analyze-image` | Analyze clothing photo |
| POST | `/api/ai/outfits` | Generate outfit combinations |
| POST | `/api/wardrobeItems/:id/wear` | Record item usage |
| GET | `/api/profiles/:id/insights` | Profile-specific insights |

### Create family profile

`POST /api/profiles`

Request:

```json
{
  "displayName": "Aarush",
  "relationship": "child",
  "profileType": "child"
}
```

Response:

```json
{
  "id": 12,
  "displayName": "Aarush",
  "relationship": "child",
  "profileType": "child"
}
```

The server derives `owner_uid` from the Firebase token.

### AI chat

`POST /api/ai/chat`

Request:

```json
{
  "profileId": 12,
  "threadId": null,
  "message": "Show me all my blue t-shirts"
}
```

Response:

```json
{
  "threadId": "9a0f...",
  "intent": "inventory_search",
  "response": {
    "type": "inventory",
    "message": "I found 3 blue t-shirts.",
    "items": [
      {
        "id": 201,
        "itemName": "Blue cotton t-shirt",
        "photoUri": "https://...",
        "category": "T-shirt",
        "color": "Blue"
      }
    ]
  }
}
```

### AI image analysis

`POST /api/ai/analyze-image`, content type `multipart/form-data`:

| Field | Value |
| --- | --- |
| `profileId` | `12` |
| `wardrobeId` | `5` |
| `image` | Uploaded JPEG or PNG |

Response:

```json
{
  "analysisId": "draft_abc123",
  "status": "awaiting_confirmation",
  "analysis": {
    "garmentType": "kurti",
    "primaryColor": "mustard yellow",
    "pattern": "floral",
    "material": "cotton",
    "occasions": ["casual", "office"],
    "confidence": 0.92
  }
}
```

The AI response is a draft. It is not yet saved.

### Confirm and save

Use the existing `POST /api/wardrobeItems` API with an optional analysis object:

```json
{
  "wardrobeId": 5,
  "itemName": "Mustard floral kurti",
  "photoUri": "firebase-download-url",
  "category": "Ethnic wear",
  "color": "Mustard",
  "size": "M",
  "analysis": {
    "garmentType": "kurti",
    "primaryColor": "mustard yellow",
    "pattern": "floral",
    "material": "cotton",
    "occasions": ["casual", "office"]
  }
}
```

The Bun backend validates the item, profile and analysis, then inserts `wardrobe_item` and `wardrobe_item_analysis` in one database transaction.

### Chat thread ownership

Add a `wardro_ai_thread` table with `thread_id` UUID primary key, `owner_uid`, `profile_id`, `created_at` and `updated_at`. Every chat request must verify that the thread belongs to the authenticated user and selected profile. A LangGraph `thread_id` is a checkpoint key, not an authorization mechanism.

## 8. Bun + Hono integration

Reuse the existing Firebase authentication middleware. Add modules:

```
backend/src/
├── modules/
│   ├── users/
│   ├── wardrobes/
│   ├── wardrobeItems/
│   ├── profiles/
│   │   └── index.ts
│   └── ai/
│       └── index.ts
├── routes.ts
├── auth.ts
└── schema.ts
```

Update `backend/src/routes.ts`:

```tsx
import profileRoutes from '@/modules/profiles'
import aiRoutes from '@/modules/ai'

apiRoutes.route('/profiles', profileRoutes)
apiRoutes.route('/ai', aiRoutes)
```

### Profile API example

File: `backend/src/modules/profiles/index.ts`

```tsx
import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { wardrobeProfiles } from '@/schema'
import { requireUser, AuthEnv } from '@/auth'

const app = new Hono<AuthEnv>()
app.use('*', requireUser)

app.get('/', async (c) => {
    const uid = c.get('uid')
    const profiles = await db
        .select()
        .from(wardrobeProfiles)
        .where(eq(wardrobeProfiles.ownerUid, uid))
    return c.json({ profiles })
})

app.post('/', async (c) => {
    const uid = c.get('uid')
    const body = await c.req.json()
    const [profile] = await db
        .insert(wardrobeProfiles)
        .values({
            ownerUid: uid,
            displayName: body.displayName,
            relationship: body.relationship,
            profileType: body.profileType,
        })
        .returning()
    return c.json({ profile }, 201)
})

export default app
```

Add Zod validation and profile ownership checks to update and delete operations. Protect the default `self` profile from accidental deletion.

### Secure communication between Bun and Python

Use a short-lived internal JWT rather than trusting a plain `X-User-Id` header.

1. Flutter sends Firebase token to Bun.
2. Bun verifies it using existing middleware.
3. Bun verifies that the selected profile belongs to the user.
4. Bun signs a short-lived internal JWT.
5. Bun calls Python.
6. Python verifies the internal JWT before running LangGraph.

Bun helper:

```tsx
import { SignJWT } from 'jose'

export async function createAiContextToken(
    uid: string,
    profileId: number
) {
    const secret = new TextEncoder().encode(
        process.env.AI_INTERNAL_SECRET!
    )
    return new SignJWT({ profile_id: profileId })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(uid)
        .setIssuer('wardro-api')
        .setAudience('wardro-ai')
        .setIssuedAt()
        .setExpirationTime('2m')
        .sign(secret)
}
```

Python verification:

```python
import jwt
from app.config import settings

def verify_internal_context(token: str):
    return jwt.decode(
        token,
        settings.INTERNAL_SERVICE_SECRET,
        algorithms=["HS256"],
        issuer="wardro-api",
        audience="wardro-ai"
    )
```

The Python service should use the Firebase ID token forwarded by Bun when calling existing authenticated wardrobe endpoints. Do not store it in LangGraph checkpoints, logs or long-term memory.

### AI proxy route

```tsx
app.post('/chat', requireUser, async (c) => {
    const uid = c.get('uid')
    const body = await c.req.json()

    const profile = await getOwnedProfile(
        uid,
        Number(body.profileId)
    )
    if (!profile) {
        return c.json({ error: 'Profile not found' }, 404)
    }

    const contextToken = await createAiContextToken(
        uid, profile.id
    )
    const firebaseToken =
        c.req.header('Authorization')!.slice(7)

    const response = await fetch(
        `${process.env.AI_SERVICE_URL}/v1/chat`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Wardro-Context': contextToken,
                'X-Firebase-Id-Token': firebaseToken
            },
            body: JSON.stringify({
                message: body.message,
                threadId: body.threadId
            })
        }
    )

    if (!response.ok) {
        return c.json({ error: 'AI service unavailable' }, 502)
    }
    return c.json(await response.json())
})
```

Also add request validation, timeouts, rate limits and safe error mapping. The AI service should only be reachable through the trusted backend, not exposed directly to the public internet.

## 9. FastAPI endpoints

File: `ai/app/api/chat.py`

```python
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from app.security.internal_auth import verify_internal_context
from app.graph.workflow import build_wardro_graph
from app.graph.context import WardroContext

router = APIRouter()
graph = build_wardro_graph()

class ChatRequest(BaseModel):
    message: str
    threadId: str | None = None

@router.post("/chat")
async def chat(
    request: ChatRequest,
    context_token: str = Header(alias="X-Wardro-Context"),
    firebase_token: str = Header(alias="X-Firebase-Id-Token")
):
    try:
        claims = verify_internal_context(context_token)
    except Exception:
        raise HTTPException(401, "Invalid internal context")

    owner_uid = claims["sub"]
    profile_id = claims["profile_id"]

    context: WardroContext = {
        "owner_uid": owner_uid,
        "profile_id": profile_id,
        "firebase_id_token": firebase_token
    }

    import uuid
    thread_id = request.threadId or str(uuid.uuid4())

    result = await graph.ainvoke(
        {
            "messages": [HumanMessage(content=request.message)],
            "intent": "",
            "filters": {},
            "wardrobe_items": [],
            "response": {}
        },
        config={"configurable": {"thread_id": thread_id}},
        context=context
    )

    return {
        "threadId": thread_id,
        "intent": result["intent"],
        "response": result["response"]
    }
```

Before invocation, verify thread ownership. This example assumes the graph is compiled with a context schema compatible with `WardroContext`, and nodes use the injected LangGraph runtime context.

File: `ai/app/main.py`

```python
from fastapi import FastAPI
from app.api.chat import router as chat_router
from app.api.vision import router as vision_router

app = FastAPI(title="Wardro AI", version="1.0.0")
app.include_router(chat_router, prefix="/v1")
app.include_router(vision_router, prefix="/v1")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "wardro-ai"}
```

Initialize the LangGraph model and checkpointer through FastAPI's application lifespan rather than constructing a global graph for each request. Manage database connections and model clients under a controlled lifecycle.

## 10. Vision API and photo ingestion

Use one image-ingestion flow for both camera capture and gallery uploads.

```mermaid
flowchart TD
    A[Camera or Gallery] --> B[Flutter Photo Capture]
    B --> C[Upload Original to Firebase]
    C --> D[Authenticated Hono AI Endpoint]
    D --> E[Verify Profile and File]
    E --> F[Python Vision Service]
    F --> G[Ollama Qwen3-VL]
    G --> H[Structured Clothing Analysis]
    H --> I[Flutter Confirmation Screen]
    I --> J{User Confirms?}
    J -->|Edit and Save| K[Existing Wardrobe API]
    J -->|Reject| L[Discard Draft]
    K --> M[Save Item + AI Metadata]
```

File: `ai/app/api/vision.py`

```python
from fastapi import APIRouter, UploadFile, File, Header, HTTPException
from app.agents.vision import ClothingVisionAgent
from app.security.internal_auth import verify_internal_context

router = APIRouter()
vision_agent = ClothingVisionAgent()

@router.post("/analyze-image")
async def analyze_image(
    image: UploadFile = File(...),
    context_token: str = Header(alias="X-Wardro-Context")
):
    try:
        verify_internal_context(context_token)
    except Exception:
        raise HTTPException(401, "Unauthorized")

    if image.content_type not in {
        "image/jpeg", "image/png", "image/webp"
    }:
        raise HTTPException(415, "Unsupported image format")

    image_bytes = await image.read(10 * 1024 * 1024 + 1)
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(413, "Image too large")

    analysis = await vision_agent.analyze(image_bytes)
    return {
        "status": "awaiting_confirmation",
        "analysis": analysis.model_dump()
    }
```

The Bun proxy validates the Firebase token and profile ownership before forwarding the multipart file. Flutter must never call the Python endpoint directly.

### Firebase Storage rules

The existing Storage read condition should verify that the requester UID matches the UID in the path. Example rules:

```jsx
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/items/{fileName} {
      allow read, delete: if request.auth != null
        && request.auth.uid == uid;

      allow create, update: if request.auth != null
        && request.auth.uid == uid
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Family profiles under one Firebase account can share account storage without allowing unrelated users to read their photos. Validate file content and size server-side as well as in Storage rules.

## 11. Flutter integration

Extend the existing Flutter app rather than redesigning it. Reuse the existing authentication, Home, All Items, Wardrobe detail, Add Item, photo capture, Firebase upload and authenticated API client.

### Proposed mobile experience

- Family profile selector at the top of Home.
- Prominent "Ask Wardro AI" card on Home.
- Chat screen accessible from that card.
- "Analyze with AI" option in Add Item.
- Outfit suggestions inside the existing wardrobe experience.

Keep the current Home / Items / Profile navigation initially. Do not add another bottom navigation tab until the AI experience justifies it.

### New Flutter feature structure

```
mobile/lib/features/
├── family/
│   ├── models/wardrobe_profile.dart
│   ├── repositories/profile_repository.dart
│   └── widgets/profile_selector.dart
└── ai/
    ├── models/
    │   ├── chat_message.dart
    │   ├── ai_response.dart
    │   └── clothing_analysis.dart
    ├── repositories/ai_repository.dart
    ├── screens/wardrobe_chat_screen.dart
    └── widgets/
        ├── chat_bubble.dart
        ├── wardrobe_item_card.dart
        ├── outfit_recommendation_card.dart
        └── analysis_confirmation_card.dart
```

### Profile model

```dart
class WardrobeProfile {
  final int id;
  final String displayName;
  final String relationship;
  final String profileType;

  WardrobeProfile({
    required this.id,
    required this.displayName,
    required this.relationship,
    required this.profileType,
  });

  factory WardrobeProfile.fromJson(Map<String, dynamic> json) {
    return WardrobeProfile(
      id: json['id'],
      displayName: json['displayName'],
      relationship: json['relationship'],
      profileType: json['profileType'],
    );
  }
}
```

### AI repository

Use the existing `ApiClient` and Firebase authentication implementation:

```dart
class AiRepository {
  final ApiClient apiClient;
  AiRepository(this.apiClient);

  Future<Map<String, dynamic>> sendMessage({
    required int profileId,
    required String message,
    String? threadId,
  }) async {
    return apiClient.post(
      '/ai/chat',
      body: {
        'profileId': profileId,
        'message': message,
        'threadId': threadId,
      },
    );
  }
}
```

Adapt the method signature to the actual `ApiClient` implementation rather than introducing a second HTTP client.

### Camera and gallery integration

Reuse the existing `PhotoCaptureField` and Firebase Storage upload flow:

1. Take a photo or choose from gallery.
2. Upload the original photo using the existing upload helper.
3. Send local image bytes to `/api/ai/analyze-image`.
4. Receive structured metadata.
5. Display an editable confirmation card.
6. Save through the existing `/api/wardrobeItems` endpoint with confirmed analysis.

For cross-platform Flutter, `XFile.readAsBytes()` works better than relying on `dart:io File` paths in the image-analysis upload flow.

## 12. LangGraph persistence and conversation memory

Distinguish three kinds of information:

| Data | Where it lives |
| --- | --- |
| Current conversation and graph execution | LangGraph checkpoint |
| Long-term clothing inventory | Existing PostgreSQL |
| Personal styling preferences | `wardrobe_style_preferences` |

Do not put wardrobe inventory into vector memory. It is structured relational data and should be retrieved through SQL-backed APIs.

### PostgreSQL checkpointer

Create a thread ownership table:

```sql
CREATE TABLE wardro_ai_thread (
    thread_id UUID PRIMARY KEY,
    owner_uid TEXT NOT NULL REFERENCES "user"(uid) ON DELETE CASCADE,
    profile_id INTEGER NOT NULL
        REFERENCES wardrobe_profile(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX wardro_ai_thread_owner_idx
ON wardro_ai_thread(owner_uid, profile_id);
```

Use `AsyncPostgresSaver` and an async connection pool. Initialize the checkpointer once during FastAPI startup, call its setup method, and close the pool during shutdown.

When resuming a conversation:

- Verify thread ownership.
- Verify profile ownership.
- Load the correct LangGraph checkpoint.
- Keep conversations separated by family profile.

A conversation about one profile's clothes must not inherit another family member's context.

### Example preference memory

```json
{
  "profile_id": 12,
  "preferences": {
    "favorite_colors": ["blue", "green"],
    "preferred_style": ["casual", "ethnic"],
    "disliked_colors": ["neon"],
    "preferred_fit": ["regular"]
  }
}
```

Store explicit preferences in PostgreSQL. Conversation summaries can be stored with the AI thread. Promote a preference into long-term memory only when it is explicitly provided or sufficiently confirmed by the user.

## 13. Local-first development setup

### Environment configuration

File: `ai/.env.example`

```
OLLAMA_URL=http://localhost:11434
TEXT_MODEL=qwen3:8b
VISION_MODEL=qwen3-vl:4b
BACKEND_URL=http://localhost:3000/api
DATABASE_URL=postgresql://postgres:password@localhost:5432/wardro
INTERNAL_SERVICE_SECRET=replace-with-a-long-random-secret
MAX_UPLOAD_MB=10
```

In `backend/.env`:

```
AI_SERVICE_URL=http://localhost:8001
AI_INTERNAL_SECRET=the-same-long-random-secret
```

Do not commit either environment file.

### Start all services

**1. PostgreSQL**

Start the existing local PostgreSQL instance on port 5432.

**2. Ollama**

```bash
ollama serve
ollama pull qwen3:8b
ollama pull qwen3-vl:4b
```

Default port: 11434.

**3. Bun backend**

```bash
cd backend
bun install
bun run dev
```

Default port: 3000.

**4. Python AI service**

```bash
cd ai
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

Default port: 8001.

**5. Flutter**

```bash
cd mobile
flutter pub get
flutter run -d chrome \
  --dart-define=API_BASE_URL=http://localhost:3000/api
```

For Android emulator:

```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api
```

For Docker, use service names or appropriate host networking rather than `localhost` between containers.

### Production deployment

Do not deploy Ollama inside the existing Firebase App Hosting backend. Use a separate private AI service and dedicated GPU inference machine or appropriately provisioned cloud GPU service.

```mermaid
flowchart TD
    A[Flutter] --> B[Firebase App Hosting]
    B --> C[Bun + Hono]
    C --> D[Private Python AI Service]
    D --> E[LangGraph]
    E --> F[GPU inference server running Ollama]
    D --> G[Existing PostgreSQL]
    D --> H[Firebase Storage]
```

Keep the inference endpoint private and restrict it to the AI service.

## 14. Testing and quality gates

Establish these tests before enabling AI for all users:

| Test case | Expected result |
| --- | --- |
| User creates family profile | Profile associated with authenticated UID |
| User selects another family's profile ID | 404/403, no data leak |
| Existing wardrobe migration | Existing items remain accessible |
| Search blue shirts | Only actual blue shirts returned |
| Outfit recommendation | Every item ID exists in selected profile |
| Upload kurti image | Structured clothing draft |
| Reject AI analysis | No item created |
| Edit AI analysis | User changes preserved |
| Resume chat | Correct thread and profile restored |
| Access another user's photo | Denied by Storage rules |
| Ollama unavailable | Controlled service-unavailable response |
| Model returns invalid data | Validation error, no database mutation |

Add an evaluation dataset with at least 50–100 real clothing photos covering Indian ethnic clothing, Western clothing, men's wear, children's wear, different lighting conditions and multiple colors.

Measure:

- Garment-type accuracy.
- Color accuracy.
- Duplicate detection precision.
- User correction rate.
- Vision latency.
- Outfit recommendation acceptance rate.

Optimize for accuracy against the actual wardrobe, not just chatbot fluency.

## 15. Final implementation sequence

### Sprint 1 — Family foundation

- [ ]  Add family profile migration.
- [ ]  Backfill existing wardrobes to default profile.
- [ ]  Update Drizzle schema.
- [ ]  Add profile CRUD APIs.
- [ ]  Add profile selector in Flutter.
- [ ]  Fix Firebase Storage read authorization.

### Sprint 2 — AI infrastructure

- [ ]  Create Python `ai/` package.
- [ ]  Configure Ollama.
- [ ]  Implement FastAPI.
- [ ]  Implement internal authentication.
- [ ]  Implement LangGraph runtime.
- [ ]  Add PostgreSQL checkpointer.

### Sprint 3 — Wardrobe intelligence

- [ ]  Implement intent classification.
- [ ]  Implement inventory retrieval.
- [ ]  Add color and category filters.
- [ ]  Add natural language wardrobe chat.
- [ ]  Add profile-aware conversations.

### Sprint 4 — Image intelligence

- [ ]  Integrate Qwen3-VL.
- [ ]  Implement image analysis.
- [ ]  Add structured clothing metadata.
- [ ]  Add confirmation screen.
- [ ]  Persist verified AI analysis.

### Sprint 5 — Personal stylist

- [ ]  Implement outfit matching.
- [ ]  Add occasion-based recommendations.
- [ ]  Add wear history.
- [ ]  Add preference learning.
- [ ]  Add saved outfits.

### Sprint 6 — Production

- [ ]  Add evaluations.
- [ ]  Add tracing and metrics.
- [ ]  Add rate limits and timeouts.
- [ ]  Add Docker deployment.
- [ ]  Run family data isolation tests.

## 16. Important implementation corrections before coding

### A. LangGraph context schema

Declare the context schema on the graph builder:

```python
from langgraph.graph import StateGraph
from app.graph.context import WardroContext

builder = StateGraph(
    WardroState,
    context_schema=WardroContext
)

return builder.compile(checkpointer=checkpointer)
```

Nodes that access authenticated context should use the runtime:

```python
from langgraph.runtime import Runtime

async def inventory_node(
    state: WardroState,
    runtime: Runtime[WardroContext]
):
    context = runtime.context
    # Fetch authenticated profile inventory
```

### B. Existing wardrobe query

The backend must join `wardrobe_item` to `wardrobe` when filtering by profile:

```tsx
db.select()
  .from(wardrobeItems)
  .innerJoin(
    wardrobes,
    eq(wardrobeItems.wardrobeId, wardrobes.id)
  )
  .where(
    and(
      eq(wardrobeItems.ownerUid, uid),
      eq(wardrobes.profileId, profileId)
    )
  )
```

Filtering only by `owner_uid` would mix wardrobes of different family members.

### C. Default profile

Create one `self` profile per user and add a partial unique index. For existing users, create the default profile before associating existing wardrobes. For the first release, exact dates of birth for children are not required; profile type and clothing sizes are sufficient.

### D. Checkpointer lifecycle

Do not use an in-memory checkpointer in production or construct a new PostgreSQL checkpointer on every request. Initialize one shared async connection pool and checkpointer during FastAPI startup.

### E. Database write ownership

The AI must never directly insert or delete wardrobe items. Bun remains the only writer. User confirmation must precede any AI-generated item creation.

## 17. What Wardro can eventually become

**Wardro — Your family's personal stylist.** A single wardrobe intelligence platform for every member of the household.

| Profile | Wardrobe capabilities |
| --- | --- |
| Women | Sarees, kurtis, office wear, festive looks |
| Men | Formal, casual, traditional and travel outfits |
| Kids | School wear, casual wear, growth and size tracking |
| Babies | Rompers, essentials, sizes and clothing usage |

Prioritize these three experiences:

1. **Know what I own:** accurate inventory search and image recognition.
2. **What should I wear?:** outfit suggestions using actual owned items.
3. **Manage my family wardrobe:** independent profiles with shared household convenience.

These three establish the foundation for everything else.

## Implementation status and repository notes

The design maps to the existing repository's README, Drizzle schema, authentication middleware, route registration, Flutter architecture documentation and Firebase Storage rules. The repository has not been modified or deployed as part of this design document. Some Flutter method signatures and backend route internals must be matched to their actual implementations before merging.

## Recommended next engineering step

Implement Sprint 1 and Sprint 2 together as a first working vertical slice: create family profiles, migrate existing wardrobe ownership, start the Python service and successfully retrieve inventory for one selected family profile. This establishes a secure foundation before introducing image recognition and outfit recommendations.

---

## Visual reference notes

The original response included illustrative, dynamically rendered visual examples for:

- The Wardro mobile AI chat experience, with a family profile selector and outfit recommendation card.
- A family wardrobe concept showing women's, men's, children's and baby clothing.

Those were live visual/search components rather than static image files. Their exact original media could not be embedded from the conversation export; these descriptions preserve their intended placement and meaning.