"""Clothing-image analysis placeholder.

Actual vision inference is scheduled for the next milestone. This module exposes
the interface the vision agent will use so the agent does not need to change when
real analysis is added.
"""

from app.vision.schemas import ImageAnalysisRequest, ImageAnalysisResult

_VISION_NOT_AVAILABLE_DETAIL = (
    "Clothing image analysis is not implemented in this milestone. "
    "Vision support is planned for the next milestone."
)


class ImageAnalyzer:
    """Image analysis interface with an honest not-available implementation."""

    async def analyze(
        self,
        request: ImageAnalysisRequest | None = None,
    ) -> ImageAnalysisResult:
        """Return an explicit not-available result until vision is implemented."""
        del request
        return ImageAnalysisResult(
            status="not_available",
            items=[],
            detail=_VISION_NOT_AVAILABLE_DETAIL,
        )
