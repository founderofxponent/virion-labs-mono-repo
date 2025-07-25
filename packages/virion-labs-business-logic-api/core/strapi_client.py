import httpx
from typing import Dict, List, Optional, Any
from .config import settings
import logging

logger = logging.getLogger(__name__)

class StrapiClient:
    """
    Strapi client to interact with the real Strapi API.
    """
    def __init__(self):
        self.base_url = settings.STRAPI_URL
        self.api_token = settings.STRAPI_API_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    async def _request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict:
        """Make an authenticated request to the Strapi API."""
        url = f"{self.base_url}/api/{endpoint}"
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                logger.info(f"Making Strapi request: {method} {url}")
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    json=data,
                    params=params
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"Strapi API HTTP error: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"Strapi API request error: {e}")
                raise

    async def get_clients(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of clients from Strapi."""
        logger.info("StrapiClient: Fetching real clients from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "clients", params=params)
        return response.get("data", [])

# Global client instance
strapi_client = StrapiClient()
