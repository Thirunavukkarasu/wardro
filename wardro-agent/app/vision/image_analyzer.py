"""Clothing-image analysis through a vision-capable Ollama model.

The app sends a base64 image in the chat request. This module asks the
configured vision model for strict JSON and validates the result before it is
returned to the app. It is intentionally synchronous with the request for the
minimal version; a queued ingestion pipeline can replace it later without
changing the response schema.
"""

from __future__ import annotations

import json
import re

from langchain_core.messages import HumanMessage, SystemMessage

from app.services.ollama_provider import ChatProvider
from app.vision.schemas import (
    DetectedGarment,
    ImageAnalysisRequest,
    ImageAnalysisResult,
    VisionResponse,
)

VISION_SYSTEM_PROMPT = """You are a clothing vision analyst for Wardro.
Analyze the attached photo and return only valid JSON. Do not use markdown fences.

Return this shape:
{
  "items": [
    {
      "garment_type": "t-shirt",
      "category": "Tops",
      "subcategory": "T-shirt",
      "primary_color": "black",
      "secondary_colors": [],
      "pattern": "solid",
      "material": "cotton",
      "fit": "regular",
      "sleeve_length": "short",
      "occasions": ["casual"],
      "seasons": ["all-season"],
      "style_tags": ["minimal"],
      "description": "A plain black cotton crew-neck t-shirt.",
      "confidence": 0.95
    }
  ],
  "summary": "One black cotton t-shirt."
}

Rules:
- Describe only garments that are clearly visible. If no garment is visible, return
  {"items": [], "summary": "No garment is clearly visible."}.
- Use lower-case values. Do not guess brand names, sizes or price.
- Keep each description to one sentence.
- Confidence is a number between 0 and 1.
"""

_VISION_NOT_AVAILABLE_DETAIL = (
    "Clothing image analysis is not configured. Set OLLAMA_VISION_MODEL to a "
    "vision-capable model and retry."
)


class ImageAnalyzer:
    """Analyze one image with the configured vision model."""

    def __init__(
        self,
        provider: ChatProvider | None = None,
        *,
        model: str | None = None,
    ) -> None:
        self._provider = provider
        self._model = model

    async def analyze(
        self,
        request: ImageAnalysisRequest | None = None,
    ) -> ImageAnalysisResult:
        """Return a validated analysis, or an explicit not-available result."""
        if self._provider is None or not self._model:
            return ImageAnalysisResult(
                status="not_available",
                items=[],
                detail=_VISION_NOT_AVAILABLE_DETAIL,
            )

        if request is None:
            return ImageAnalysisResult(
                status="not_available",
                items=[],
                detail="No image was supplied.",
                model=self._model,
            )

        image = request.image_base64
        if not image:
            # URL download belongs to the queued ingestion pipeline. Keep the
            # minimal chat path explicit about what it supports.
            return ImageAnalysisResult(
                status="not_available",
                items=[],
                detail="Send the image as base64 data for this version.",
                model=self._model,
            )

        if image.startswith("data:") and "," in image:
            image = image.split(",", 1)[1]

        media_type = request.media_type if request.media_type.startswith("image/") else "image/jpeg"
        hint = f"\nUser hint: {request.hint}" if request.hint else ""
        messages = [
            SystemMessage(content=VISION_SYSTEM_PROMPT),
            HumanMessage(
                content=[
                    {
                        "type": "text",
                        "text": "Identify the garment in this photo." + hint,
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{media_type};base64,{image}"},
                    },
                ]
            ),
        ]

        raw = await self._provider.achat(messages, model=self._model)
        parsed = _parse_json(raw)
        if parsed is None:
            return ImageAnalysisResult(
                status="not_available",
                items=[],
                detail="The vision model did not return valid JSON. Try another photo.",
                model=self._model,
            )

        try:
            response = VisionResponse.model_validate(parsed)
        except Exception:
            return ImageAnalysisResult(
                status="not_available",
                items=[],
                detail="The vision model returned an unexpected analysis shape.",
                model=self._model,
            )

        return ImageAnalysisResult(
            status="completed",
            items=response.items,
            detail=response.summary or _summary(response.items),
            model=self._model,
        )


def _parse_json(raw: str) -> dict[str, object] | None:
    text = raw.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        parsed = json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _summary(items: list[DetectedGarment]) -> str:
    if not items:
        return "No garment is clearly visible."
    first = items[0]
    colour = f"{first.primary_color} " if first.primary_color else ""
    return f"Detected a {colour}{first.garment_type}.".strip()
