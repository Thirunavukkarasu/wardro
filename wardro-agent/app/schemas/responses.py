"""API response models."""

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.graph.routing import AgentName, Intent


class ChatResponse(BaseModel):
    """Successful chat response."""

    success: bool = True
    thread_id: str
    intent: Intent
    agent: AgentName
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    """Structured error response."""

    success: bool = False
    error: str
    detail: str | None = None
    thread_id: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    """Application liveness response."""

    status: Literal["healthy"] = "healthy"
    service: str
    version: str
    environment: str


class OllamaHealthResponse(BaseModel):
    """Ollama connectivity and model-availability response."""

    status: Literal["ok", "degraded", "unavailable"]
    reachable: bool
    base_url: str
    chat_model: str
    vision_model: str
    chat_model_available: bool | None = None
    vision_model_available: bool | None = None
    installed_models: list[str] = Field(default_factory=list)
    detail: str | None = None
