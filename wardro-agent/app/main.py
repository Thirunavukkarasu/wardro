"""FastAPI application entry point."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import chat
from app.config import Settings, get_settings
from app.dependencies import OllamaProviderDep, SettingsDep
from app.graph.checkpointer import build_checkpointer
from app.graph.workflow import build_workflow
from app.logging_config import configure_logging
from app.schemas.responses import HealthResponse, OllamaHealthResponse
from app.services.ollama_provider import OllamaProvider
from app.services.wardrobe_backend import WardrobeBackendClient
from app.vision.image_analyzer import ImageAnalyzer

logger = logging.getLogger(__name__)

VERSION = "0.1.0"


def create_app(
    *,
    settings: Settings | None = None,
    provider: OllamaProvider | None = None,
) -> FastAPI:
    """Create and configure the FastAPI application.

    Args:
        settings: Optional settings override (used by tests).
        provider: Optional Ollama provider override (used by tests).

    Returns:
        A configured FastAPI application.
    """
    app_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        configure_logging(app_settings)
        ollama_provider = provider or OllamaProvider(app_settings)
        workflow = build_workflow(
            provider=ollama_provider,
            settings=app_settings,
            checkpointer=build_checkpointer(app_settings),
        )

        application.state.settings = app_settings
        application.state.ollama_provider = ollama_provider
        application.state.wardrobe_graph = workflow
        application.state.wardrobe_backend = WardrobeBackendClient(app_settings)
        application.state.image_analyzer = ImageAnalyzer(
            ollama_provider,
            model=app_settings.ollama_vision_model,
        )

        if app_settings.is_development:
            logger.warning(
                "DEVELOPMENT MODE: request-body identity is trusted. Authentication "
                "middleware is required before this service is deployed."
            )
        logger.info(
            "Wardro AI started environment=%s ollama=%s chat_model=%s",
            app_settings.app_env,
            app_settings.ollama_base_url,
            app_settings.ollama_chat_model,
        )
        yield
        logger.info("Wardro AI stopped")

    application = FastAPI(
        title=app_settings.app_name,
        description="AI-powered family wardrobe assistant",
        version=VERSION,
        lifespan=lifespan,
    )

    # The Expo web client is a browser application served from a different origin.
    # Origins are explicit outside development; development also accepts any
    # localhost port so a reassigned Expo dev-server port still works.
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origin_list,
        allow_origin_regex=(
            app_settings.cors_origin_regex if app_settings.is_development else None
        ),
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Accept", "Content-Type", "Authorization"],
        max_age=600,
    )
    application.include_router(chat.router, prefix=app_settings.api_v1_prefix)

    @application.get("/health", response_model=HealthResponse, tags=["health"])
    async def health(settings: SettingsDep) -> HealthResponse:
        """Return application liveness information."""
        return HealthResponse(
            service="wardro-ai",
            version=VERSION,
            environment=settings.app_env,
        )

    @application.get(
        "/health/ollama",
        response_model=OllamaHealthResponse,
        responses={503: {"model": OllamaHealthResponse}},
        tags=["health"],
    )
    async def ollama_health(
        provider_dep: OllamaProviderDep,
    ) -> OllamaHealthResponse | JSONResponse:
        """Check Ollama connectivity and configured model availability."""
        result = await provider_dep.check_health()
        payload = OllamaHealthResponse(
            status=result.status,
            reachable=result.reachable,
            base_url=result.base_url,
            chat_model=result.chat_model,
            vision_model=result.vision_model,
            chat_model_available=result.chat_model_available,
            vision_model_available=result.vision_model_available,
            installed_models=list(result.installed_models),
            detail=result.detail,
        )
        if not result.reachable:
            return JSONResponse(
                status_code=503,
                content=payload.model_dump(mode="json"),
            )
        return payload

    return application


app: FastAPI = create_app()
