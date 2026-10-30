from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

class NoteSummarizeRequest(BaseModel):
    title: str = Field(default="My Study Notes")
    content: str = Field(..., min_length=10)
    summary_type: str = Field(default="short")  # short, detailed, key_points, flashcards, questions

class NoteResponse(BaseModel):
    id: int
    title: str
    original_filename: str | None = None
    file_type: str
    summary_type: str
    content: str
    summary_result: str
    structured_data: Any | None = None
    created_at: datetime

    class Config:
        from_attributes = True

