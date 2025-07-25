import httpx
import asyncio
from typing import Dict, List, Optional, Any
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class StrapiClient:
    def __init__(self):
        self.base_url = settings.STRAPI_URL
        self.api_token = settings.STRAPI_API_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    async def _request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> Dict:
        """Make authenticated request to Strapi API"""
        url = f"{self.base_url}/api/{endpoint}"
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    json=data,
                    params=params
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                logger.error(f"Strapi API error: {e}")
                raise

    # Campaign operations
    async def get_campaigns(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get campaigns with optional filters"""
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaigns", params=params)
        return response.get("data", [])

    async def get_campaign(self, campaign_id: int) -> Optional[Dict]:
        """Get single campaign by ID"""
        response = await self._request("GET", f"campaigns/{campaign_id}", params={"populate": "*"})
        return response.get("data")

    async def create_campaign(self, campaign_data: Dict) -> Dict:
        """Create new campaign"""
        data = {"data": campaign_data}
        response = await self._request("POST", "campaigns", data=data)
        return response.get("data")

    async def update_campaign(self, campaign_id: int, campaign_data: Dict) -> Dict:
        """Update existing campaign"""
        data = {"data": campaign_data}
        response = await self._request("PUT", f"campaigns/{campaign_id}", data=data)
        return response.get("data")

    # User Profile operations
    async def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Get user profile by Discord ID"""
        filters = {"filters[discord_user_id][$eq]": user_id}
        response = await self._request("GET", "user-profiles", params=filters)
        data = response.get("data", [])
        return data[0] if data else None

    async def create_user_profile(self, profile_data: Dict) -> Dict:
        """Create new user profile"""
        data = {"data": profile_data}
        response = await self._request("POST", "user-profiles", data=data)
        return response.get("data")

    async def update_user_profile(self, profile_id: int, profile_data: Dict) -> Dict:
        """Update user profile"""
        data = {"data": profile_data}
        response = await self._request("PUT", f"user-profiles/{profile_id}", data=data)
        return response.get("data")

    # Onboarding Response operations
    async def create_onboarding_response(self, response_data: Dict) -> Dict:
        """Create onboarding response"""
        data = {"data": response_data}
        response = await self._request("POST", "onboarding-responses", data=data)
        return response.get("data")

    async def get_onboarding_responses(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get onboarding responses with filters"""
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "onboarding-responses", params=params)
        return response.get("data", [])

    # Referral Link operations
    async def create_referral_link(self, link_data: Dict) -> Dict:
        """Create referral link"""
        data = {"data": link_data}
        response = await self._request("POST", "referral-links", data=data)
        return response.get("data")

    async def get_referral_links(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get referral links with filters"""
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "referral-links", params=params)
        return response.get("data", [])

    async def get_referral_link_by_code(self, code: str) -> Optional[Dict]:
        """Get referral link by code"""
        filters = {"filters[code][$eq]": code}
        response = await self._request("GET", "referral-links", params=filters)
        data = response.get("data", [])
        return data[0] if data else None

    # Analytics operations
    async def create_analytics_event(self, event_data: Dict) -> Dict:
        """Create analytics event"""
        data = {"data": event_data}
        response = await self._request("POST", "analytics-events", data=data)
        return response.get("data")

    async def get_analytics_events(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Get analytics events with filters"""
        params = {}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "analytics-events", params=params)
        return response.get("data", [])

    # Client operations
    async def get_clients(self) -> List[Dict]:
        """Get all clients"""
        response = await self._request("GET", "clients", params={"populate": "*"})
        return response.get("data", [])

    async def get_client(self, client_id: int) -> Optional[Dict]:
        """Get client by ID"""
        response = await self._request("GET", f"clients/{client_id}", params={"populate": "*"})
        return response.get("data")

# Global instance
strapi_client = StrapiClient()