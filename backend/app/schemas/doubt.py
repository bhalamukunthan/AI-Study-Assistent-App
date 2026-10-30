from datetime import datetime
from pydantic import BaseModel, Field

class DoubtSolveRequest(BaseModel):
    subject: str = Field(..., min_length=2)
    category: str = Field(default="academic")  # programming, mathematics, theory, academic
    question_text: str = Field(..., min_length=5)
    code_snippet: str | None = None

class DoubtResponse(BaseModel):
    id: int
    title: str
    subject: str
    category: str
    question_text: str
    code_snippet: str | None = None
    step_by_step_solution: str
    core_concepts: str | None = None
    related_topics: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

