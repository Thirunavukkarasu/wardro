"""Console entry point for the Wardro AI agent service.

The service itself lives in the top-level :mod:`app` package. This module exists
because ``pyproject.toml`` declares a ``wardro-ai`` console script, and the
``uv_build`` backend expects a ``src/wardro_ai`` package.
"""

import uvicorn


def main() -> None:
    """Run the FastAPI application with Uvicorn."""
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)


if __name__ == "__main__":
    main()
