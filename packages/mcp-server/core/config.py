"""Configuration management for the MCP server."""

import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class ServerConfig:
    """Server configuration settings."""
    transport: str = os.getenv("TRANSPORT", "stdio")  # Default to stdio for MCP compatibility
    port: int = int(os.getenv("PORT", 8080))
    host: str = os.getenv("HOST", "127.0.0.1")
    path: str = os.getenv("MCP_PATH", "/mcp")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    json_response: bool = os.getenv("JSON_RESPONSE", "false").lower() == "true"


@dataclass
class DatabaseConfig:
    """Database configuration settings (legacy, kept for backward compatibility)."""
    url: str = os.getenv("SUPABASE_URL", "")
    service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    def __post_init__(self):
        # Make database config optional since we're moving to API-based communication
        pass


@dataclass
class APIConfig:
    """API configuration settings."""
    base_url: str = os.getenv("API_BASE_URL", "http://localhost:8000")
    mcp_api_token: str = os.getenv("MCP_API_TOKEN", "")
    
    def __post_init__(self):
        if not self.base_url:
            raise ValueError("API_BASE_URL is required")
        if not self.mcp_api_token:
            raise ValueError("MCP_API_TOKEN is required for service-to-service authentication")


@dataclass
class AppConfig:
    """Application configuration."""
    server: ServerConfig
    database: DatabaseConfig
    api: APIConfig
    
    @classmethod
    def from_env(cls) -> "AppConfig":
        """Create configuration from environment variables."""
        return cls(
            server=ServerConfig(),
            database=DatabaseConfig(),
            api=APIConfig()
        )