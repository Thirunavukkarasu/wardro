"""Schemas for the clothing-image analysis pipeline."""

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ImageAnalysisRequest(BaseModel):
    """Input for an image analysis request."""

    image_url: str | None = Field(default=None, description="Remote image URL.")
    image_base64: str | None = Field(
        default=None, description="Base64-encoded image data without a data-URI prefix."
    )
    media_type: str = Field(default="image/jpeg", description="Image MIME type.")
    hint: str | None = Field(default=None, description="Optional user hint about the image.")

    @model_validator(mode="after")
    def require_image_reference(self) -> "ImageAnalysisRequest":
        if not self.image_url and not self.image_base64:
            raise ValueError("Provide either image_url or image_base64.")
        return self


class DetectedGarment(BaseModel):
    """A garment detected in an image."""

    garment_type: str = Field(description="Specific garment, e.g. t-shirt, kurti, jeans.")
    category: str | None = Field(default=None, description="Normalised category.")
    subcategory: str | None = Field(default=None, description="Optional finer category.")
    primary_color: str | None = None
    secondary_colors: list[str] = Field(default_factory=list)
    pattern: str | None = None
    material: str | None = None
    fit: str | None = None
    sleeve_length: str | None = None
    occasions: list[str] = Field(default_factory=list)
    seasons: list[str] = Field(default_factory=list)
    style_tags: list[str] = Field(default_factory=list)
    description: str | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class VisionResponse(BaseModel):
    """The JSON shape requested from the vision model."""

    items: list[DetectedGarment] = Field(default_factory=list)
    summary: str | None = None


class ImageAnalysisResult(BaseModel):
    """Structured result of an image analysis attempt."""

    status: Literal["completed", "not_available"]
    items: list[DetectedGarment] = Field(default_factory=list)
    detail: str
    model: str | None = None
