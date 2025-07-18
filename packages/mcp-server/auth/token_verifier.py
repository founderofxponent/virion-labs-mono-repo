"""Token verification for MCP OAuth authentication."""

import aiohttp
import asyncio
from typing import Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class AccessToken:
    """Represents a verified access token."""
    user_id: str
    client_id: str
    scope: str
    expires_at: float
    audience: Optional[str] = None


class TokenVerifier:
    """Verifies OAuth access tokens via introspection."""
    
    def __init__(self, introspection_url: str, resource_url: Optional[str] = None):
        self.introspection_url = introspection_url
        self.resource_url = resource_url
        self.audience = resource_url  # Add audience property
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create HTTP session."""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=10)
            connector = aiohttp.TCPConnector(limit=10, limit_per_host=5)
            self._session = aiohttp.ClientSession(
                timeout=timeout,
                connector=connector
            )
        return self._session
    
    async def verify_token(self, token: str) -> Optional[AccessToken]:
        """Verify an access token via introspection."""
        try:
            session = await self._get_session()
            
            data = {"token": token}
            
            async with session.post(
                self.introspection_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as response:
                if response.status != 200:
                    logger.warning(f"Introspection failed with status {response.status}")
                    return None
                
                result = await response.json()
                
                if not result.get("active", False):
                    logger.debug("Token is not active")
                    return None
                
                # Optional resource validation
                if self.resource_url:
                    token_aud = result.get("aud")
                    if token_aud and not self._validate_audience(token_aud):
                        logger.warning(f"Token audience {token_aud} doesn't match resource {self.resource_url}")
                        return None
                
                return AccessToken(
                    user_id=result.get("username", "unknown"),
                    client_id=result.get("client_id", "unknown"),
                    scope=result.get("scope", ""),
                    expires_at=result.get("exp", 0),
                    audience=result.get("aud")
                )
                
        except asyncio.TimeoutError:
            logger.warning("Token introspection timed out")
            return None
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            return None
    
    def _validate_audience(self, token_audience: str) -> bool:
        """Validate token audience against resource URL."""
        if not self.resource_url:
            return True
        
        # Simple prefix matching for audience validation
        return token_audience.startswith(self.resource_url.rstrip('/'))
    
    async def close(self):
        """Close HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()