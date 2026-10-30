from datetime import datetime
from pydantic import BaseModel, Field

class StudyPlanGenerateRequest(BaseModel):
    student_name: str = Field(default="Alex")
    subject: str = Field(..., min_length=2)
    topics: str = Field(..., min_length=2)
    hours_per_day: float = Field(default=2.0, ge=0.5, le=16.0)
    target_date: str = Field(...)
    knowledge_level: str = Field(default="Beginner")

class StudyTaskResponse(BaseModel):
    id: int
    plan_id: int
    day_number: int
    date_str: str | None = None
    topic: str
    task_title: str
    description: str | None = None
    duration_minutes: int
    task_type: str
    is_completed: bool
    completed_at: datetime | None = None

    class Config:
        from_attributes = True

class StudyPlanResponse(BaseModel):
    id: int
    title: str
    student_name: str
    subject: str
    topics: str
    hours_per_day: float
    target_date: str
    knowledge_level: str
    overview: str | None = None
    created_at: datetime
    tasks: list[StudyTaskResponse] = []
    total_tasks: int = 0
    completed_tasks: int = 0
    progress_percentage: float = 0.0

    class Config:
        from_attributes = True

