from datetime import datetime
from pydantic import BaseModel, Field

class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    conversation_id: int | None = None
    subject: str = "General"

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    id: int
    title: str
    subject: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageResponse] = []

    class Config:
        from_attributes = True

class ConversationSummary(BaseModel):
    id: int
    title: str
    subject: str
    created_at: datetime
    updated_at: datetime
    message_count: int

    class Config:
        from_attributes = True

