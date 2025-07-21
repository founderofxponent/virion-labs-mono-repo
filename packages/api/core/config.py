from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    FASTAPI_ENV: str = "development"
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    MCP_API_TOKEN: str
    JWT_SECRET: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
