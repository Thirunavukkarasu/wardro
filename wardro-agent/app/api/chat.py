"""Chat endpoint backed by the LangGraph agent workflow."""

import logging
from typing import Any, cast

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from langchain_core.messages import HumanMessage

from app.dependencies import SettingsDep, WardrobeBackendDep, WorkflowDep
from app.graph.routing import Intent, normalize_intent, resolve_agent
from app.graph.state import WardroState
from app.policies.access_control import ContextResolutionError, resolve_trusted_context
from app.schemas.requests import ChatRequest
from app.schemas.responses import ChatResponse, ErrorResponse
from app.services.wardrobe_backend import WardrobeBackendError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post(
    "",
    response_model=ChatResponse,
    responses={
        401: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def chat(
    request: ChatRequest,
    graph: WorkflowDep,
    settings: SettingsDep,
    wardrobe_backend: WardrobeBackendDep,
) -> ChatResponse | JSONResponse:
    """Send a user message through the agent workflow.

    Identity is resolved at the application boundary. In this milestone identity
    comes from the request body only in development; production requires auth
    middleware.
    """
    try:
        context = resolve_trusted_context(
            settings=settings,
            user_id=request.user_id,
            household_id=request.household_id,
            profile_id=request.profile_id,
            thread_id=request.thread_id,
        )
    except ContextResolutionError as exc:
        raise HTTPException(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_CONTENT
                if settings.is_development
                else status.HTTP_401_UNAUTHORIZED
            ),
            detail=str(exc),
        ) from exc

    # Inventory is fetched before the graph run and stored as data in state.
    # The Firebase token itself never enters graph state or a checkpoint.
    wardrobe_context: dict[str, Any] = {
        "available": False,
        "source": "unavailable",
        "note": "No profile inventory was supplied for this request.",
        "items": [],
    }

    if request.firebase_token and context.profile_id:
        try:
            items = await wardrobe_backend.list_items(
                token=request.firebase_token,
                profile_id=context.profile_id,
            )
            wardrobe_context = {
                "available": True,
                "source": "backend",
                "note": "",
                "items": [item.as_dict() for item in items],
            }
        except WardrobeBackendError as exc:
            logger.warning(
                "Inventory retrieval failed thread_id=%s: %s",
                context.thread_id,
                exc,
            )
            wardrobe_context = {
                "available": False,
                "source": "backend_error",
                "note": str(exc),
                "items": [],
            }
    elif not request.firebase_token:
        logger.info(
            "No development backend token supplied thread_id=%s; inventory context unavailable.",
            context.thread_id,
        )

    initial_state: WardroState = {
        "messages": [HumanMessage(content=request.message)],
        "user_id": context.user_id,
        "household_id": context.household_id,
        "profile_id": context.profile_id,
        "thread_id": context.thread_id,
        "intent": None,
        "selected_agent": None,
        "agent_response": None,
        "wardrobe_context": wardrobe_context,
        "errors": [],
    }
    config: dict[str, Any] = {"configurable": {"thread_id": context.thread_id}}

    try:
        result = cast(WardroState, await graph.ainvoke(initial_state, config=config))
    except Exception as exc:  # noqa: BLE001 - API must return a structured error
        logger.exception("Agent workflow failed for thread_id=%s", context.thread_id)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error="Internal agent error",
                detail=str(exc) if settings.debug else None,
                thread_id=context.thread_id,
            ).model_dump(mode="json"),
        )

    metadata: dict[str, Any] = {
        "model": settings.ollama_chat_model,
        "persistence": "disabled",
        "wardrobe_context": (
            "available"
            if wardrobe_context.get("available")
            else wardrobe_context.get("source", "unavailable")
        ),
        "wardrobe_item_count": len(wardrobe_context.get("items", [])),
        "identity_source": context.identity_source,
    }

    errors = list(result.get("errors") or [])
    if errors:
        raw_intent = result.get("intent")
        logger.warning(
            "Agent workflow completed with errors thread_id=%s intent=%s errors=%s",
            context.thread_id,
            raw_intent,
            errors,
        )
        return JSONResponse(
            status_code=(
                status.HTTP_422_UNPROCESSABLE_CONTENT
                if raw_intent is None
                else status.HTTP_503_SERVICE_UNAVAILABLE
            ),
            content=ErrorResponse(
                error="Agent request failed",
                detail="; ".join(errors) if settings.debug else None,
                thread_id=context.thread_id,
                metadata={
                    **metadata,
                    "user_message": result.get("agent_response") or "",
                },
            ).model_dump(mode="json"),
        )

    intent: Intent = normalize_intent(result.get("intent"))
    agent = resolve_agent(intent)
    message = result.get("agent_response") or ""

    logger.info(
        "Chat completed thread_id=%s intent=%s agent=%s",
        context.thread_id,
        intent.value,
        agent.value,
    )

    return ChatResponse(
        success=True,
        thread_id=context.thread_id,
        intent=intent,
        agent=agent,
        message=message,
        metadata=metadata,
    )
