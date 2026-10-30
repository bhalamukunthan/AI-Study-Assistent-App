from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    original_filename = Column(String(255), nullable=True)
    file_type = Column(String(50), default="text")
    summary_type = Column(String(50), default="short")  # short, detailed, key_points, flashcards, questions
    content = Column(Text, nullable=False)
    summary_result = Column(Text, nullable=False)
    structured_data = Column(Text, nullable=True)  # JSON formatted for flashcards/practice questions
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notes")

