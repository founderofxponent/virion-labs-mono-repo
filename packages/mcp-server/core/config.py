"""Configuration management for the MCP server."""

import os
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class ServerConfig:
    """Server configuration settings."""
    transport: str = os.getenv("TRANSPORT", "http")
    port: int = int(os.getenv("PORT", 8080))
    host: str = os.getenv("HOST", "0.0.0.0")
    path: str = os.getenv("MCP_PATH", "/mcp")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")


@dataclass
class DatabaseConfig:
    """Database configuration settings."""
    url: str = os.getenv("SUPABASE_URL", "")
    service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    def __post_init__(self):
        if not self.url or not self.service_role_key:
            raise ValueError("Database configuration is incomplete. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")


@dataclass
class AppConfig:
    """Application configuration."""
    server: ServerConfig
    database: DatabaseConfig
    
    @classmethod
    def from_env(cls) -> "AppConfig":
        """Create configuration from environment variables."""
        return cls(
            server=ServerConfig(),
            database=DatabaseConfig()
        )