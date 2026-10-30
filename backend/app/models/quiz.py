from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database.session import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False)
    topic = Column(String(200), nullable=False)
    difficulty = Column(String(50), default="Medium", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    question = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False)  # JSON array of strings
    correct_answer = Column(String(500), nullable=False)
    explanation = Column(Text, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=False)
    total_questions = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    answers_json = Column(Text, nullable=False)  # JSON array of user answers
    completed_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="results")
    user = relationship("User", back_populates="quiz_results")

