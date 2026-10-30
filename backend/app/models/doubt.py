from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Doubt(Base):
    __tablename__ = "doubts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    subject = Column(String(100), nullable=False)
    category = Column(String(50), default="academic")  # programming, mathematics, theory, academic
    question_text = Column(Text, nullable=False)
    code_snippet = Column(Text, nullable=True)
    step_by_step_solution = Column(Text, nullable=False)
    core_concepts = Column(Text, nullable=True)
    related_topics = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="doubts")

