from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List, Optional

class Settings(BaseSettings):
    APP_NAME: str = "EmotsioonideJalgijaAPI"
    APP_VERSION: str = "1.0.0"
    SECRET_KEY: str = "CHANGE_ME"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./emotions.db"
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    class Config:
        env_file = ".env"

settings = Settings()
