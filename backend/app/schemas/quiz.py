from datetime import datetime
from pydantic import BaseModel, Field

class QuizGenerateRequest(BaseModel):
    subject: str = Field(..., min_length=2)
    topic: str = Field(..., min_length=2)
    difficulty: str = Field(default="Medium")
    question_count: int = Field(default=5, ge=1, le=20)
    question_type: str = Field(default="Multiple Choice")

class QuizQuestionResponse(BaseModel):
    id: int
    question: str
    options: list[str]
    correct_answer: str
    explanation: str

    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: int
    title: str
    subject: str
    topic: str
    difficulty: str
    created_at: datetime
    questions: list[QuizQuestionResponse]

    class Config:
        from_attributes = True

class QuizSubmitRequest(BaseModel):
    answers: dict[int, str]  # question_id -> chosen option string

class QuizAnswerDetail(BaseModel):
    question_id: int
    question: str
    options: list[str]
    selected_answer: str
    correct_answer: str
    is_correct: bool
    explanation: str

class QuizResultResponse(BaseModel):
    id: int
    quiz_id: int
    quiz_title: str
    subject: str
    difficulty: str
    score: int
    total_questions: int
    percentage: float
    answers_detail: list[QuizAnswerDetail]
    completed_at: datetime

