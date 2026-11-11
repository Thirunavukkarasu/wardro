FROM python:3.12-slim

COPY --from=ghcr.io/astral-sh/uv:0.13.7 /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install dependencies first so this layer is cached independently of app code.
# The project itself is not installed: the service runs from ./app.
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --no-install-project

COPY app ./app

EXPOSE 8080

CMD ["sh", "-c", "exec /app/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
