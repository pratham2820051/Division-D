"""First-aid recommendation response models."""

from pydantic import BaseModel, ConfigDict, Field


class FirstAidRecommendation(BaseModel):
    """First-aid steps for the top predicted disease."""

    model_config = ConfigDict(validate_assignment=True)

    disease_name: str = Field(..., min_length=1, max_length=256)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    first_aid: list[str] = Field(
        default_factory=list,
        description="Immediate care steps from the disease knowledge record.",
    )
