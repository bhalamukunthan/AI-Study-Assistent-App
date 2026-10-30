from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    student_name = Column(String(100), default="Alex")
    subject = Column(String(100), nullable=False)
    topics = Column(Text, nullable=False)
    hours_per_day = Column(Float, default=2.0)
    target_date = Column(String(50), nullable=False)
    knowledge_level = Column(String(50), default="Beginner")
    overview = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="study_plans")
    tasks = relationship("StudyTask", back_populates="plan", cascade="all, delete-orphan", order_by="StudyTask.day_number")

class StudyTask(Base):
    __tablename__ = "study_tasks"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    day_number = Column(Integer, nullable=False)
    date_str = Column(String(50), nullable=True)
    topic = Column(String(200), nullable=False)
    task_title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=45)
    task_type = Column(String(50), default="study")  # study, practice, revision, break
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    plan = relationship("StudyPlan", back_populates="tasks")

