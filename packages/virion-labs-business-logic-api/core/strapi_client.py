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
        
        if params is None:
            params = {}

        # For update and delete, we need to see draft content
        if method in ["PUT", "DELETE"]:
            params["publicationState"] = "preview"

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                logger.info(f"Making Strapi request: {method} {url} with params {params}")
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

    async def create_client(self, client_data: Dict) -> Dict:
        """Creates a new client in Strapi."""
        logger.info("StrapiClient: Creating a new client in Strapi.")
        data = {"data": client_data}
        response = await self._request("POST", "clients", data=data)
        return response.get("data")

    async def update_client(self, document_id: str, client_data: Dict) -> Dict:
        """Updates a client in Strapi using its documentId."""
        logger.info(f"StrapiClient: Updating client {document_id} in Strapi.")
        data = {"data": client_data}
        response = await self._request("PUT", f"clients/{document_id}", data=data)
        return response.get("data")

    async def get_client(self, document_id: str) -> Dict:
        """Fetches a single client by documentId from Strapi."""
        logger.info(f"StrapiClient: Fetching client {document_id} from Strapi.")
        response = await self._request("GET", f"clients/{document_id}")
        return response.get("data")

    async def get_user_profiles(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of user profiles from Strapi."""
        logger.info("StrapiClient: Fetching user profiles from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "user-profiles", params=params)
        return response.get("data", [])

    async def update_user_profile(self, strapi_id: int, profile_data: Dict) -> Dict:
        """Updates a user profile in Strapi using its Strapi ID."""
        logger.info(f"StrapiClient: Updating user profile {strapi_id} in Strapi.")
        data = {"data": profile_data}
        response = await self._request("PUT", f"user-profiles/{strapi_id}", data=data)
        return response.get("data")

    async def update_user_setting(self, setting_id: int, setting_data: Dict) -> Dict:
        """Updates a user setting in Strapi using its ID."""
        logger.info(f"StrapiClient: Updating user setting {setting_id} in Strapi.")
        data = {"data": setting_data}
        response = await self._request("PUT", f"user-settings/{setting_id}", data=data)
        return response.get("data")

    async def get_user(self, user_id: int) -> Dict:
        """Fetches a single user by their ID from Strapi."""
        logger.info(f"StrapiClient: Fetching user {user_id} from Strapi.")
        # The 'populate' parameter is crucial to get the user's role information
        params = {"populate": "role"}
        # Note: This endpoint is part of the Users & Permissions plugin
        response = await self._request("GET", f"users/{user_id}", params=params)
        return response

# Global client instance
strapi_client = StrapiClient()
