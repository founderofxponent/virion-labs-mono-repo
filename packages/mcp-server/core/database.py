"""Database client and connection management."""

import logging
from typing import Optional
from supabase import create_client, Client
from .config import DatabaseConfig

logger = logging.getLogger(__name__)


class DatabaseClient:
    """Database client wrapper for Supabase."""
    
    def __init__(self, config: DatabaseConfig):
        self.config = config
        self._client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """Get the Supabase client, creating it if necessary."""
        if self._client is None:
            self._client = create_client(self.config.url, self.config.service_role_key)
            logger.info("Database client initialized")
        return self._client
    
    def table(self, name: str):
        """Get a table reference."""
        return self.client.table(name)
    
    def health_check(self) -> bool:
        """Check database connectivity."""
        try:
            # Simple query to test connection
            result = self.client.table("discord_guild_campaigns").select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False