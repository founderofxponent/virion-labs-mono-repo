from pydantic_settings import BaseSettings
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Strapi Configuration
    STRAPI_URL: str = "http://localhost:1337"
    STRAPI_API_TOKEN: str

    # Discord Configuration
    DISCORD_BOT_TOKEN: Optional[str] = None

    # API Configuration
    API_TITLE: str = "Virion Labs Unified Business Logic API"
    API_VERSION: str = "1.0.0"
    API_PORT: int = 8000
    API_URL: str

    # Authentication
    JWT_SECRET: str # This might be used for signing the API's own tokens later
    JWT_ALGORITHM: str = "HS256"
    API_KEY: str
    FRONTEND_URL: str = "http://localhost:3000"
    PASSWORD_RESET_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Log a confirmation that the settings were loaded
logger.info("Configuration settings loaded.")

