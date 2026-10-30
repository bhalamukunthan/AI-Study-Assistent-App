from datetime import datetime
from pydantic import BaseModel, Field

class StudySessionCreate(BaseModel):
    subject: str = Field(default="General Study")
    duration_minutes: int = Field(..., ge=1, le=1440)
    notes: str | None = None

class StudySessionResponse(BaseModel):
    id: int
    user_id: int
    subject: str
    duration_minutes: int
    notes: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

