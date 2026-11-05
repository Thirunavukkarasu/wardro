"""Schemas for the (not yet implemented) clothing-image analysis pipeline."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ImageAnalysisRequest(BaseModel):
    """Input for an image analysis request."""

    image_url: str | None = Field(default=None, description="Remote image URL.")
    image_base64: str | None = Field(default=None, description="Base64-encoded image data.")
    hint: str | None = Field(default=None, description="Optional user hint about the image.")

    @model_validator(mode="after")
    def require_image_reference(self) -> "ImageAnalysisRequest":
        if not self.image_url and not self.image_base64:
            raise ValueError("Provide either image_url or image_base64.")
        return self


class DetectedGarment(BaseModel):
    """A garment detected in an image."""

    category: str
    colour: str | None = None
    description: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class ImageAnalysisResult(BaseModel):
    """Structured result of an image analysis attempt."""

    status: Literal["completed", "not_available"]
    items: list[DetectedGarment] = Field(default_factory=list)
    detail: str
