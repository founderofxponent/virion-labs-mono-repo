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

    async def get_client(self, document_id: str, populate: Optional[List[str]] = None) -> Dict:
        """Fetches a single client by documentId from Strapi."""
        logger.info(f"StrapiClient: Fetching client {document_id} from Strapi.")
        params = {}
        if populate:
            params["populate"] = ",".join(populate)
        response = await self._request("GET", f"clients/{document_id}", params=params)
        return response.get("data")

    async def get_campaigns(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of campaigns from Strapi."""
        logger.info("StrapiClient: Fetching campaigns from Strapi.")
        params = {"populate": "*"} # Populate all fields to get complete campaign data
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaigns", params=params)
        campaigns_data = response.get("data", [])
        
        # Transform Strapi response to match expected BotCampaign model
        transformed_campaigns = []
        for campaign in campaigns_data:
            # The data is already flattened (no nested attributes structure)
            # Transform field names to match BotCampaign model
            client_data = campaign.get("client", {})
            
            transformed_campaign = {
                "id": str(campaign.get("id", "")),
                "documentId": campaign.get("documentId"),
                "name": campaign.get("name", ""),
                "type": campaign.get("campaign_type") or "standard",  # Map campaign_type to type, handle None
                "guild_id": campaign.get("guild_id", ""),
                "channel_id": campaign.get("channel_id"),
                "client_id": str(client_data.get("id", "")) if client_data else "",
                "client_name": client_data.get("name", "") if client_data else "",
                "client_industry": client_data.get("industry", "") if client_data else "",
                "display_name": campaign.get("name", ""),  # Use name as display_name if not specified
                "template": campaign.get("template", "default"),  # Default template
                "description": campaign.get("description"),
                "is_active": campaign.get("is_active", True),
                "paused_at": campaign.get("paused_at"),
                "campaign_end_date": campaign.get("end_date"),
                "is_deleted": campaign.get("is_deleted", False),  # Default to False
                "deleted_at": campaign.get("deleted_at"),
                "campaign_start_date": campaign.get("start_date") or campaign.get("createdAt"),
                "created_at": campaign.get("createdAt"),
                "updated_at": campaign.get("updatedAt"),
                "total_interactions": campaign.get("total_interactions", 0),
                "successful_onboardings": campaign.get("successful_onboardings", 0),
                "referral_conversions": campaign.get("referral_conversions", 0),
                "last_activity_at": campaign.get("last_activity_at"),
                "configuration_version": campaign.get("configuration_version"),
                "referral_link_id": campaign.get("referral_link_id"),
                "referral_link_title": campaign.get("referral_link_title"),
                "referral_code": campaign.get("referral_code"),
                "referral_platform": campaign.get("referral_platform"),
                "auto_role_assignment": campaign.get("auto_role_assignment"),
                "target_role_ids": campaign.get("target_role_ids"),
                "referral_tracking_enabled": campaign.get("referral_tracking_enabled"),
                "moderation_enabled": campaign.get("moderation_enabled"),
                "bot_name": campaign.get("bot_name"),
                "bot_personality": campaign.get("bot_personality"),
                "bot_response_style": campaign.get("bot_response_style"),
                "brand_color": campaign.get("brand_color"),
                "brand_logo_url": campaign.get("brand_logo_url"),
                "welcome_message": campaign.get("welcome_message"),
                "webhook_url": campaign.get("webhook_url"),
                "rate_limit_per_user": campaign.get("rate_limit_per_user"),
                "features": campaign.get("features"),
                "auto_responses": campaign.get("auto_responses"),
                "custom_commands": campaign.get("custom_commands"),
                "onboarding_flow": campaign.get("onboarding_flow"),
                "metadata": campaign.get("metadata"),
            }
            transformed_campaigns.append(transformed_campaign)
        
        return transformed_campaigns

    async def get_campaign(self, document_id: str) -> Dict:
        """Fetches a single campaign from Strapi using documentId."""
        logger.info(f"StrapiClient: Fetching campaign {document_id} from Strapi.")
        params = {"populate": "*"}
        response = await self._request("GET", f"campaigns/{document_id}", params=params)
        campaign_data = response.get("data")
        
        if not campaign_data:
            return None
            
        # Apply same transformation as get_campaigns
        client_data = campaign_data.get("client", {})
        
        return {
            "id": str(campaign_data.get("id", "")),
            "documentId": campaign_data.get("documentId"),
            "name": campaign_data.get("name", ""),
            "type": campaign_data.get("campaign_type") or "standard",
            "guild_id": campaign_data.get("guild_id", ""),
            "channel_id": campaign_data.get("channel_id"),
            "client_id": str(client_data.get("id", "")) if client_data else "",
            "client_name": client_data.get("name", "") if client_data else "",
            "client_industry": client_data.get("industry", "") if client_data else "",
            "display_name": campaign_data.get("name", ""),
            "template": campaign_data.get("template", "default"),
            "description": campaign_data.get("description"),
            "is_active": campaign_data.get("is_active", True),
            "paused_at": campaign_data.get("paused_at"),
            "campaign_end_date": campaign_data.get("end_date"),
            "is_deleted": campaign_data.get("is_deleted", False),
            "deleted_at": campaign_data.get("deleted_at"),
            "campaign_start_date": campaign_data.get("start_date") or campaign_data.get("createdAt"),
            "created_at": campaign_data.get("createdAt"),
            "updated_at": campaign_data.get("updatedAt"),
            "total_interactions": campaign_data.get("total_interactions", 0),
            "successful_onboardings": campaign_data.get("successful_onboardings", 0),
            "referral_conversions": campaign_data.get("referral_conversions", 0),
            "last_activity_at": campaign_data.get("last_activity_at"),
            "configuration_version": campaign_data.get("configuration_version"),
            "referral_link_id": campaign_data.get("referral_link_id"),
            "referral_link_title": campaign_data.get("referral_link_title"),
            "referral_code": campaign_data.get("referral_code"),
            "referral_platform": campaign_data.get("referral_platform"),
            "auto_role_assignment": campaign_data.get("auto_role_assignment"),
            "target_role_ids": campaign_data.get("target_role_ids"),
            "referral_tracking_enabled": campaign_data.get("referral_tracking_enabled"),
            "moderation_enabled": campaign_data.get("moderation_enabled"),
            "bot_name": campaign_data.get("bot_name"),
            "bot_personality": campaign_data.get("bot_personality"),
            "bot_response_style": campaign_data.get("bot_response_style"),
            "brand_color": campaign_data.get("brand_color"),
            "brand_logo_url": campaign_data.get("brand_logo_url"),
            "welcome_message": campaign_data.get("welcome_message"),
            "webhook_url": campaign_data.get("webhook_url"),
            "rate_limit_per_user": campaign_data.get("rate_limit_per_user"),
            "features": campaign_data.get("features"),
            "auto_responses": campaign_data.get("auto_responses"),
            "custom_commands": campaign_data.get("custom_commands"),
            "onboarding_flow": campaign_data.get("onboarding_flow"),
            "metadata": campaign_data.get("metadata"),
        }

    async def create_campaign(self, campaign_data: Dict) -> Dict:
        """Creates a new campaign in Strapi."""
        logger.info("StrapiClient: Creating a new campaign in Strapi.")
        data = {"data": campaign_data}
        response = await self._request("POST", "campaigns", data=data)
        return response.get("data")

    async def update_campaign(self, document_id: str, update_data: Dict) -> Dict:
        """Updates a campaign in Strapi using documentId."""
        logger.info(f"StrapiClient: Updating campaign {document_id} in Strapi.")
        data = {"data": update_data}
        response = await self._request("PUT", f"campaigns/{document_id}", data=data)
        campaign_data = response.get("data")
        
        # Apply same transformation as get_campaign
        if not campaign_data:
            return None
            
        client_data = campaign_data.get("client", {})
        
        return {
            "id": str(campaign_data.get("id", "")),
            "documentId": campaign_data.get("documentId"),
            "name": campaign_data.get("name", ""),
            "type": campaign_data.get("campaign_type") or "standard",
            "guild_id": campaign_data.get("guild_id", ""),
            "channel_id": campaign_data.get("channel_id"),
            "client_id": str(client_data.get("id", "")) if client_data else "",
            "client_name": client_data.get("name", "") if client_data else "",
            "client_industry": client_data.get("industry", "") if client_data else "",
            "display_name": campaign_data.get("name", ""),
            "template": campaign_data.get("template", "default"),
            "description": campaign_data.get("description"),
            "is_active": campaign_data.get("is_active", True),
            "paused_at": campaign_data.get("paused_at"),
            "campaign_end_date": campaign_data.get("end_date"),
            "is_deleted": campaign_data.get("is_deleted", False),
            "deleted_at": campaign_data.get("deleted_at"),
            "campaign_start_date": campaign_data.get("start_date") or campaign_data.get("createdAt"),
            "created_at": campaign_data.get("createdAt"),
            "updated_at": campaign_data.get("updatedAt"),
            "total_interactions": campaign_data.get("total_interactions", 0),
            "successful_onboardings": campaign_data.get("successful_onboardings", 0),
            "referral_conversions": campaign_data.get("referral_conversions", 0),
            "last_activity_at": campaign_data.get("last_activity_at"),
            "configuration_version": campaign_data.get("configuration_version"),
            "referral_link_id": campaign_data.get("referral_link_id"),
            "referral_link_title": campaign_data.get("referral_link_title"),
            "referral_code": campaign_data.get("referral_code"),
            "referral_platform": campaign_data.get("referral_platform"),
            "auto_role_assignment": campaign_data.get("auto_role_assignment"),
            "target_role_ids": campaign_data.get("target_role_ids"),
            "referral_tracking_enabled": campaign_data.get("referral_tracking_enabled"),
            "moderation_enabled": campaign_data.get("moderation_enabled"),
            "bot_name": campaign_data.get("bot_name"),
            "bot_personality": campaign_data.get("bot_personality"),
            "bot_response_style": campaign_data.get("bot_response_style"),
            "brand_color": campaign_data.get("brand_color"),
            "brand_logo_url": campaign_data.get("brand_logo_url"),
            "welcome_message": campaign_data.get("welcome_message"),
            "webhook_url": campaign_data.get("webhook_url"),
            "rate_limit_per_user": campaign_data.get("rate_limit_per_user"),
            "features": campaign_data.get("features"),
            "auto_responses": campaign_data.get("auto_responses"),
            "custom_commands": campaign_data.get("custom_commands"),
            "onboarding_flow": campaign_data.get("onboarding_flow"),
            "metadata": campaign_data.get("metadata"),
        }

    async def delete_campaign(self, document_id: str) -> Dict:
        """Deletes a campaign in Strapi using its documentId."""
        logger.info(f"StrapiClient: Deleting campaign {document_id} in Strapi.")
        response = await self._request("DELETE", f"campaigns/{document_id}")
        return response.get("data")

    async def get_onboarding_fields(self, campaign_id: str) -> List[Dict]:
        """Fetches onboarding fields for a campaign from Strapi."""
        logger.info(f"StrapiClient: Fetching onboarding fields for campaign {campaign_id} from Strapi.")
        params = {"filters[campaign][id][$eq]": campaign_id}
        response = await self._request("GET", "onboarding-fields", params=params)
        return response.get("data", [])

    async def create_onboarding_field(self, campaign_id: str, field_data: Dict) -> Dict:
        """Creates an onboarding field for a campaign in Strapi."""
        logger.info(f"StrapiClient: Creating onboarding field for campaign {campaign_id} in Strapi.")
        data = {"data": {"campaign": campaign_id, **field_data}}
        response = await self._request("POST", "onboarding-fields", data=data)
        return response.get("data")

    async def update_onboarding_field(self, field_id: str, field_data: Dict) -> Dict:
        """Updates an onboarding field in Strapi."""
        logger.info(f"StrapiClient: Updating onboarding field {field_id} in Strapi.")
        data = {"data": field_data}
        response = await self._request("PUT", f"onboarding-fields/{field_id}", data=data)
        return response.get("data")

    async def get_campaign_template(self, document_id: str) -> Dict:
        """Fetches a single campaign template by document ID from Strapi."""
        logger.info(f"StrapiClient: Fetching campaign template with document ID '{document_id}' from Strapi.")
        
        # Fetch by document ID only
        response = await self._request("GET", f"campaign-templates/{document_id}", params={"populate": "*"})
        return response.get("data")

    async def get_campaign_templates(self) -> List[Dict]:
        """Fetches a list of campaign templates from Strapi."""
        logger.info("StrapiClient: Fetching campaign templates from Strapi.")
        params = {"populate": "*"}
        response = await self._request("GET", "campaign-templates", params=params)
        return response.get("data", [])

    async def get_user_profiles(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of user profiles from Strapi."""
        logger.info("StrapiClient: Fetching user profiles from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "user-profiles", params=params)
        return response.get("data", [])

    async def create_user_profile(self, profile_data: Dict) -> Dict:
        """Creates a new user profile in Strapi."""
        logger.info("StrapiClient: Creating new user profile in Strapi.")
        data = {"data": profile_data}
        response = await self._request("POST", "user-profiles", data=data)
        return response.get("data")

    async def update_user_profile(self, profile_id: int, profile_data: Dict) -> Dict:
        """Updates a user profile in Strapi using its ID."""
        logger.info(f"StrapiClient: Updating user profile {profile_id} in Strapi.")
        data = {"data": profile_data}
        try:
            response = await self._request("PUT", f"user-profiles/{profile_id}", data=data)
            return response.get("data")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"User profile {profile_id} not found (404), it may have been deleted")
                return None
            raise

    async def update_user_setting(self, setting_id: int, setting_data: Dict) -> Dict:
        """Updates a user setting in Strapi using its ID."""
        logger.info(f"StrapiClient: Updating user setting {setting_id} in Strapi.")
        data = {"data": setting_data}
        response = await self._request("PUT", f"user-settings/{setting_id}", data=data)
        return response.get("data")

    async def create_user_setting(self, setting_data: Dict) -> Dict:
        """Creates a new user setting in Strapi."""
        logger.info("StrapiClient: Creating new user setting in Strapi.")
        data = {"data": setting_data}
        response = await self._request("POST", "user-settings", data=data)
        return response.get("data")

    async def get_user(self, user_id: int) -> Dict:
        """Fetches a single user by their ID from Strapi."""
        logger.info(f"StrapiClient: Fetching user {user_id} from Strapi.")
        # The 'populate' parameter is crucial to get the user's role information
        params = {"populate": "role"}
        # Note: This endpoint is part of the Users & Permissions plugin
        response = await self._request("GET", f"users/{user_id}", params=params)
        return response

    # region Landing Page Template Operations
    async def get_landing_page_templates(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of landing page templates from Strapi."""
        logger.info("StrapiClient: Fetching landing page templates from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "landing-page-templates", params=params)
        return response.get("data", [])

    async def get_landing_page_template(self, document_id: str, populate: Optional[List[str]] = None) -> Dict:
        """Fetches a single landing page template from Strapi using documentId."""
        logger.info(f"StrapiClient: Fetching landing page template {document_id} from Strapi.")
        params = {}
        if populate:
            params["populate"] = ",".join(populate)
        else:
            params["populate"] = "*"
        
        response = await self._request("GET", f"landing-page-templates/{document_id}", params=params)
        return response.get("data")

    async def create_landing_page_template(self, template_data: Dict) -> Dict:
        """Creates a new landing page template in Strapi."""
        logger.info("StrapiClient: Creating new landing page template in Strapi.")
        data = {"data": template_data}
        response = await self._request("POST", "landing-page-templates", data=data)
        return response.get("data")

    async def update_landing_page_template(self, document_id: str, template_data: Dict) -> Dict:
        """Updates a landing page template in Strapi using documentId."""
        logger.info(f"StrapiClient: Updating landing page template {document_id} in Strapi.")
        data = {"data": template_data}
        response = await self._request("PUT", f"landing-page-templates/{document_id}", data=data)
        return response.get("data")

    async def delete_landing_page_template(self, document_id: str) -> Dict:
        """Deletes a landing page template in Strapi using documentId."""
        logger.info(f"StrapiClient: Deleting landing page template {document_id} from Strapi.")
        response = await self._request("DELETE", f"landing-page-templates/{document_id}")
        return response.get("data")
    # endregion

# Global client instance
strapi_client = StrapiClient()
