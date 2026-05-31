from pydantic import BaseModel, Field


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language: str = Field(default="en")
