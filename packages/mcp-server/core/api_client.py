"""API client for communicating with the unified Virion Labs API."""

import logging
import httpx
from typing import Optional, Dict, Any, List
from .config import APIConfig

logger = logging.getLogger(__name__)


class APIClient:
    """HTTP client for the unified API."""
    
    def __init__(self, config: APIConfig):
        self.config = config
        self.base_url = config.base_url
        self.api_key = config.api_key
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=30.0
            )
        return self._client
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to API."""
        client = await self._get_client()
        
        try:
            response = await client.request(
                method=method,
                url=endpoint,
                json=data,
                params=params
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"API request failed: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"API request failed: {e.response.status_code}")
        except Exception as e:
            logger.error(f"API request error: {e}")
            raise ValueError(f"API request error: {str(e)}")
    
    # Client endpoints
    async def create_client(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new client."""
        return await self._make_request("POST", "/api/clients/", data=client_data)
    
    async def update_client(self, client_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing client."""
        return await self._make_request("PATCH", f"/api/clients/{client_id}", data=updates)
    
    async def list_clients(self) -> List[Dict[str, Any]]:
        """List all clients."""
        response = await self._make_request("GET", "/api/clients/")
        # API returns a direct list, not wrapped in an object
        if isinstance(response, list):
            return response
        return response.get("clients", [])
    
    async def get_client(self, client_id: str) -> Dict[str, Any]:
        """Get a specific client."""
        return await self._make_request("GET", f"/api/clients/{client_id}")
    
    async def delete_client(self, client_id: str) -> Dict[str, Any]:
        """Delete a client."""
        return await self._make_request("DELETE", f"/api/clients/{client_id}")
    
    # Campaign endpoints
    async def create_campaign(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new campaign."""
        return await self._make_request("POST", "/api/bot-campaigns/", data=campaign_data)
    
    async def update_campaign(self, campaign_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing campaign."""
        return await self._make_request("PATCH", f"/api/bot-campaigns/{campaign_id}", data=updates)
    
    async def list_campaigns(self) -> List[Dict[str, Any]]:
        """List all campaigns."""
        response = await self._make_request("GET", "/api/bot-campaigns/")
        # API returns a direct list, not wrapped in an object
        if isinstance(response, list):
            return response
        return response.get("campaigns", [])
    
    async def get_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Get a specific campaign."""
        return await self._make_request("GET", f"/api/bot-campaigns/{campaign_id}")
    
    async def delete_campaign(self, campaign_id: str) -> Dict[str, Any]:
        """Delete a campaign."""
        return await self._make_request("DELETE", f"/api/bot-campaigns/{campaign_id}")
    
    async def update_campaign_stats(self, campaign_id: str, stats: Dict[str, Any]) -> Dict[str, Any]:
        """Update campaign statistics."""
        return await self._make_request("PATCH", f"/api/bot-campaigns/{campaign_id}/stats", data=stats)
    
    # Referral endpoints
    async def validate_referral_code(self, code: str) -> Dict[str, Any]:
        """Validate a referral code."""
        return await self._make_request("GET", f"/api/referral/{code}/validate")
    
    async def get_referral_campaign_info(self, code: str) -> Dict[str, Any]:
        """Get campaign info for a referral code."""
        return await self._make_request("GET", f"/api/referral/{code}/campaign")
    
    async def process_referral_signup(self, signup_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a referral signup."""
        return await self._make_request("POST", "/api/referral/signup", data=signup_data)
    
    async def complete_referral(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Mark a referral as converted."""
        return await self._make_request("POST", "/api/referral/complete", data=completion_data)
    
    # Access request endpoints
    async def create_access_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new access request."""
        return await self._make_request("POST", "/api/access-requests/", data=request_data)
    
    async def list_access_requests(self) -> List[Dict[str, Any]]:
        """List all access requests."""
        response = await self._make_request("GET", "/api/admin/access-requests")
        # API returns a direct list, not wrapped in an object
        if isinstance(response, list):
            return response
        return response.get("access_requests", [])
    
    async def update_access_request(self, request_id: str, action: str) -> Dict[str, Any]:
        """Update access request status."""
        return await self._make_request("POST", "/api/admin/access-requests", data={
            "request_id": request_id,
            "action": action
        })
    
    # Discord bot endpoints
    async def start_onboarding(self, onboarding_data: Dict[str, Any]) -> Dict[str, Any]:
        """Start onboarding flow."""
        return await self._make_request("POST", "/api/discord-bot/onboarding/start", data=onboarding_data)
    
    async def submit_onboarding_modal(self, modal_data: Dict[str, Any]) -> Dict[str, Any]:
        """Submit onboarding modal."""
        return await self._make_request("POST", "/api/discord-bot/onboarding/modal", data=modal_data)
    
    async def get_onboarding_session(self, discord_user_id: str) -> Dict[str, Any]:
        """Get onboarding session."""
        return await self._make_request("GET", "/api/discord-bot/onboarding/session", params={"discord_user_id": discord_user_id})
    
    async def complete_onboarding(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Complete onboarding."""
        return await self._make_request("POST", "/api/discord-bot/onboarding/complete", data=completion_data)
    
    async def get_discord_config(self, guild_id: str) -> Dict[str, Any]:
        """Get Discord configuration."""
        return await self._make_request("GET", "/api/discord-bot/config", params={"guild_id": guild_id})
    
    async def assign_discord_role(self, guild_id: str, member_id: str, role_data: Dict[str, Any]) -> Dict[str, Any]:
        """Assign Discord role."""
        return await self._make_request("POST", f"/api/discord-bot/discord/guilds/{guild_id}/members/{member_id}/roles", data=role_data)
    
    async def get_member_roles(self, guild_id: str, member_id: str) -> List[Dict[str, Any]]:
        """Get member roles."""
        response = await self._make_request("GET", f"/api/discord-bot/discord/guilds/{guild_id}/members/{member_id}/roles")
        return response.get("roles", [])
    
    async def close(self):
        """Close the HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None