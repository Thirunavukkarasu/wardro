"""Chat endpoint backed by the LangGraph agent workflow."""

import logging
from typing import Any, cast

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from langchain_core.messages import HumanMessage

from app.dependencies import (
    ImageAnalyzerDep,
    SettingsDep,
    WardrobeBackendDep,
    WorkflowDep,
)
from app.graph.routing import Intent, normalize_intent, resolve_agent
from app.graph.state import WardroState
from app.policies.access_control import ContextResolutionError, resolve_trusted_context
from app.policies.firebase_auth import VerifiedUserDep
from app.schemas.requests import ChatRequest
from app.schemas.responses import ChatResponse, ErrorResponse
from app.services.ollama_provider import OllamaError
from app.services.wardrobe_backend import WardrobeBackendError
from app.vision.schemas import ImageAnalysisRequest, ImageAnalysisResult

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
    verified_user: VerifiedUserDep,
    wardrobe_backend: WardrobeBackendDep,
    image_analyzer: ImageAnalyzerDep,
) -> ChatResponse | JSONResponse:
    """Send a user message through the agent workflow.

    Identity comes from a verified Firebase ID token in deployed environments,
    or the request body in development.
    """
    try:
        context = resolve_trusted_context(
            settings=settings,
            user_id=request.user_id,
            household_id=request.household_id,
            profile_id=request.profile_id,
            thread_id=request.thread_id,
            verified_user_id=verified_user.uid if verified_user else None,
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

    if request.image_base64:
        # The minimal image path returns a classification directly. The image
        # is not written to graph state, a checkpoint or a log line.
        try:
            analysis = await image_analyzer.analyze(
                ImageAnalysisRequest(
                    image_base64=request.image_base64,
                    media_type=request.image_media_type,
                    hint=request.message,
                )
            )
        except OllamaError as exc:
            logger.warning(
                "Image analysis failed thread_id=%s: %s",
                context.thread_id,
                exc,
            )
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=ErrorResponse(
                    error="Image analysis failed",
                    detail=str(exc) if settings.debug else None,
                    thread_id=context.thread_id,
                ).model_dump(mode="json"),
            )
        except Exception as exc:  # noqa: BLE001 - API must return a structured error
            logger.exception(
                "Unexpected image analysis error thread_id=%s",
                context.thread_id,
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=ErrorResponse(
                    error="Image analysis failed",
                    detail=str(exc) if settings.debug else None,
                    thread_id=context.thread_id,
                ).model_dump(mode="json"),
            )

        if analysis.status != "completed":
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=ErrorResponse(
                    error="Image analysis unavailable",
                    detail=analysis.detail,
                    thread_id=context.thread_id,
                    metadata={
                        "model": analysis.model,
                        "analysis": analysis.model_dump(mode="json"),
                    },
                ).model_dump(mode="json"),
            )

        return ChatResponse(
            success=True,
            thread_id=context.thread_id,
            intent=Intent.IMAGE_ANALYSIS,
            agent=resolve_agent(Intent.IMAGE_ANALYSIS),
            message=_analysis_message(analysis),
            metadata={
                "model": analysis.model,
                "persistence": "disabled",
                "image_analysis": "completed",
                "analysis": analysis.model_dump(mode="json"),
                "identity_source": context.identity_source,
            },
        )

    # Inventory is fetched before the graph run and stored as data in state.
    # The Firebase token itself never enters graph state or a checkpoint.
    wardrobe_context: dict[str, Any] = {
        "available": False,
        "source": "unavailable",
        "note": "No profile inventory was supplied for this request.",
        "items": [],
    }

    backend_token = verified_user.token if verified_user else request.firebase_token
    if backend_token and context.profile_id:
        try:
            items = await wardrobe_backend.list_items(
                token=backend_token,
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
    elif not backend_token:
        logger.info(
            "No backend token supplied thread_id=%s; inventory context unavailable.",
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


def _analysis_message(result: ImageAnalysisResult) -> str:
    """Render a completed analysis as chat-friendly Markdown."""
    if result.detail:
        lead = result.detail
    else:
        lead = "Here is what I can see."

    if not result.items:
        return lead

    blocks: list[str] = [lead]
    for item in result.items[:3]:
        name = " ".join(part for part in (item.primary_color, item.garment_type) if part).strip()
        lines = [f"I found **{name or item.garment_type}**."]
        if item.category:
            lines.append(f"- Category: {item.category}")
        if item.subcategory:
            lines.append(f"- Type: {item.subcategory}")
        if item.pattern:
            lines.append(f"- Pattern: {item.pattern}")
        if item.material:
            lines.append(f"- Material: {item.material}")
        if item.fit:
            lines.append(f"- Fit: {item.fit}")
        if item.sleeve_length:
            lines.append(f"- Sleeve: {item.sleeve_length}")
        if item.occasions:
            lines.append(f"- Occasions: {', '.join(item.occasions)}")
        if item.seasons:
            lines.append(f"- Seasons: {', '.join(item.seasons)}")
        if item.confidence:
            lines.append(f"- Confidence: {round(item.confidence * 100)}%")
        blocks.append("\n".join(lines))

    return "\n\n".join(blocks)
