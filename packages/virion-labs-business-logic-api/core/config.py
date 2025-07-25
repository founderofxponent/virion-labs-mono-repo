from pydantic_settings import BaseSettings
import logging

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    # Strapi Configuration
    STRAPI_URL: str = "http://localhost:1337"
    STRAPI_API_TOKEN: str

    # API Configuration
    API_TITLE: str = "Virion Labs Unified Business Logic API"
    API_VERSION: str = "1.0.0"
    API_PORT: int = 8000

    # Authentication
    JWT_SECRET: str # This might be used for signing the API's own tokens later
    API_KEY: str

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Log a confirmation that the settings were loaded
logger.info("Configuration settings loaded.")

