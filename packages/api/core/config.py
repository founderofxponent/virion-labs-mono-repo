from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    FASTAPI_ENV: str = "development"
    
    # Legacy Supabase (keep for migration phase)
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    
    # Strapi Configuration
    STRAPI_URL: str = "http://localhost:1337"
    STRAPI_API_TOKEN: str
    
    # API Configuration
    MCP_API_TOKEN: str
    JWT_SECRET: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
