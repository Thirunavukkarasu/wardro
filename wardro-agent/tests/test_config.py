"""Configuration loading tests."""

from app.config import Settings, get_settings


def test_defaults_are_used_without_env_file(monkeypatch) -> None:
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    monkeypatch.delenv("OLLAMA_CHAT_MODEL", raising=False)
    monkeypatch.delenv("OLLAMA_VISION_MODEL", raising=False)
    monkeypatch.delenv("OLLAMA_TEMPERATURE", raising=False)

    settings = Settings(_env_file=None)

    assert settings.app_name == "Wardro AI"
    assert settings.ollama_base_url == "http://localhost:11434"
    assert settings.ollama_chat_model == "qwen3"
    assert settings.ollama_vision_model == "qwen3-vl"
    assert settings.ollama_temperature == 0.2


def test_environment_variables_override_defaults(monkeypatch) -> None:
    monkeypatch.setenv("OLLAMA_CHAT_MODEL", "custom-chat")
    monkeypatch.setenv("OLLAMA_TEMPERATURE", "0.7")

    settings = Settings(_env_file=None)

    assert settings.ollama_chat_model == "custom-chat"
    assert settings.ollama_temperature == 0.7


def test_is_development_only_for_development_environment() -> None:
    assert Settings(_env_file=None, app_env="development").is_development is True
    assert Settings(_env_file=None, app_env="production").is_development is False
    assert Settings(_env_file=None, app_env="test").is_development is False


def test_cors_origins_are_split_and_trimmed() -> None:
    settings = Settings(
        _env_file=None,
        cors_origins=" http://localhost:8081 , ,http://127.0.0.1:8081 ",
    )

    assert settings.cors_origin_list == [
        "http://localhost:8081",
        "http://127.0.0.1:8081",
    ]


def test_get_settings_is_cached() -> None:
    assert get_settings() is get_settings()
