import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Absolute directory of backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_FILE = BASE_DIR / "studymate.db"

class Settings(BaseSettings):
    PROJECT_NAME: str = "StudyMate AI"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DB_FILE.as_posix()}")
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_UPLOAD_SIZE: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_EXTENSIONS: set[str] = {".txt", ".pdf", ".docx"}
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()
# If env set relative path, normalize it to absolute
if settings.DATABASE_URL.startswith("sqlite:///./"):
    rel = settings.DATABASE_URL.replace("sqlite:///./", "")
    settings.DATABASE_URL = f"sqlite:///{(BASE_DIR / rel).as_posix()}"
