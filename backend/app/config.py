from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    APP_NAME: str = "AEGIS - Digital Asset Protection"
    DATABASE_URL: str = "sqlite:///./aegis.db"
    UPLOAD_DIR: str = "./uploads"
    GOOGLE_API_KEY: str = ""
    GOOGLE_CLOUD_PROJECT: str = ""
    GOOGLE_CSE_ID: str = ""
    YOUTUBE_API_KEY: str = ""
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    SIMILARITY_THRESHOLD: float = 0.85

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
