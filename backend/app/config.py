import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./apliquei.db"
    SECRET_KEY: str = "apliquei-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    FRONTEND_URL: str = "*"
    
    # Path to backend root (where main.py is)
    BACKEND_DIR: Path = Path(__file__).resolve().parent.parent
    UPLOAD_DIR: Path = BACKEND_DIR / "uploads"

    class Config:
        env_file = ".env"


settings = Settings()
