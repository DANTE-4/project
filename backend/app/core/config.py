"""
core/config.py — Application configuration via environment variables
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    POSTGRES_URL: str

    # CORS / Hosts
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]

    # ML Model
    MODEL_PATH: str = "app/models/best_model.pkl"
    SCALER_PATH: str = "app/models/scaler.pkl"
    ENCODER_PATH: str = "app/models/encoder.pkl"
    MODEL_VERSION: str = "1.0.0"


settings = Settings()
