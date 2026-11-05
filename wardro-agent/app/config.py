"""Application configuration loaded from environment variables and ``.env``."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings.

    Every field can be overridden with an environment variable of the same name
    in upper case (for example ``ollama_chat_model`` -> ``OLLAMA_CHAT_MODEL``).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Wardro AI"
    app_env: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    log_level: str = "INFO"

    ollama_base_url: str = "http://localhost:11434"
    ollama_chat_model: str = "qwen3"
    ollama_vision_model: str = "qwen3-vl"
    ollama_temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    ollama_num_predict: int = Field(default=1024, gt=0)
    # Qwen3.5 defaults to thinking mode, which consumes the token budget and can
    # leave no output for structured JSON. Disable it unless the model ignores the flag.
    ollama_disable_thinking: bool = True
    ollama_request_timeout: float = Field(default=120.0, gt=0.0)
    ollama_health_timeout: float = Field(default=5.0, gt=0.0)

    backend_api_url: str = "http://localhost:3000"
    wardrobe_backend_timeout: float = Field(default=10.0, gt=0.0)
    database_url: str | None = None

    # Comma-separated browser origins allowed to call the API. The Expo web client
    # normally runs on port 8081, but Expo increments the port when it is occupied.
    cors_origins: str = (
        "http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:19006,http://127.0.0.1:19006,"
        "http://localhost:3000,http://127.0.0.1:3000"
    )
    # In development this also permits any localhost/127.0.0.1 port, so an Expo
    # dev server that fell back to 8082 still works. Production uses the explicit
    # CORS_ORIGINS list only.
    cors_origin_regex: str = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

    max_message_length: int = Field(default=8000, gt=0)
    max_history_messages: int = Field(default=10, ge=0)

    @property
    def is_development(self) -> bool:
        """Return ``True`` only when development-only features may be enabled."""
        return self.app_env == "development"

    @property
    def cors_origin_list(self) -> list[str]:
        """Return configured CORS origins, trimmed and without blanks."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return the process-wide settings instance."""
    return Settings()
