"""FastAPI dependency providers.

Dependencies read from ``app.state`` so the application container is explicit and
replaceable in tests; nothing here mutates global state.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from langgraph.graph.state import CompiledStateGraph

from app.config import Settings, get_settings
from app.services.ollama_provider import OllamaProvider
from app.services.wardrobe_backend import WardrobeBackendClient


def get_app_settings(request: Request) -> Settings:
    """Return settings from the application container or process cache."""
    settings = getattr(request.app.state, "settings", None)
    return settings if settings is not None else get_settings()


def get_ollama_provider(request: Request) -> OllamaProvider:
    """Return the application's Ollama provider."""
    provider = getattr(request.app.state, "ollama_provider", None)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Ollama provider is not initialised.",
        )
    return provider


def get_wardrobe_graph(request: Request) -> CompiledStateGraph:
    """Return the compiled agent workflow."""
    graph = getattr(request.app.state, "wardrobe_graph", None)
    if graph is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Agent workflow is not initialised.",
        )
    return graph


def get_wardrobe_backend(request: Request) -> WardrobeBackendClient:
    """Return the read-only wardrobe backend client."""
    backend = getattr(request.app.state, "wardrobe_backend", None)
    if backend is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Wardrobe backend client is not initialised.",
        )
    return backend


SettingsDep = Annotated[Settings, Depends(get_app_settings)]
OllamaProviderDep = Annotated[OllamaProvider, Depends(get_ollama_provider)]
WorkflowDep = Annotated[CompiledStateGraph, Depends(get_wardrobe_graph)]
WardrobeBackendDep = Annotated[WardrobeBackendClient, Depends(get_wardrobe_backend)]
