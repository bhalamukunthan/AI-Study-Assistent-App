from typing import Any
from pydantic import BaseModel

class WeeklyActivityPoint(BaseModel):
    day: str
    date: str
    hours: float
    sessions: int
    quizzes: int

class SubjectBreakdown(BaseModel):
    subject: str
    hours: float
    percentage: float
    count: int

class RecentActivity(BaseModel):
    id: str
    type: str  # chat, quiz, plan, note, doubt, session
    title: str
    description: str
    timestamp: str

class UpcomingTask(BaseModel):
    id: int
    plan_id: int
    plan_title: str
    task_title: str
    topic: str
    duration_minutes: int
    task_type: str
    date_str: str | None = None
    is_completed: bool

class DashboardAnalytics(BaseModel):
    student_name: str
    today_study_hours: float
    total_study_hours: float
    total_questions_asked: int
    quizzes_completed: int
    current_streak_days: int
    average_quiz_score: float
    completed_tasks_count: int
    total_tasks_count: int
    weekly_activity: list[WeeklyActivityPoint]
    subject_distribution: list[SubjectBreakdown]
    recent_activities: list[RecentActivity]
    upcoming_tasks: list[UpcomingTask]

