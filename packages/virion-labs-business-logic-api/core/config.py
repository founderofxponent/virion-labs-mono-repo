from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Strapi Configuration
    STRAPI_URL: str = "http://localhost:1337"
    STRAPI_API_TOKEN: str = "your_strapi_api_token_here"

    # API Configuration
    API_TITLE: str = "Virion Labs Unified Business Logic API"
    API_VERSION: str = "1.0.0"
    API_PORT: int = 8001

    # Authentication
    JWT_SECRET: str = "your_jwt_secret_here"
    API_KEY: str = "your_api_key_here"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
