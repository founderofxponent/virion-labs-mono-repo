import httpx
from typing import Dict, List, Optional, Any
from .config import settings
import logging
import json

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
                if response.status_code == 204:
                    return None
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.exception(f"Strapi API HTTP error: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.exception("Strapi API request error")
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
        
        # Transform each campaign to match the expected schema
        transformed_campaigns = []
        for campaign_data in campaigns_data:
            client_data = campaign_data.get("client", {})
            
            transformed_campaign = {
                "id": str(campaign_data.get("id", "")),
                "documentId": campaign_data.get("documentId"),
                "name": campaign_data.get("name", ""),  # BotCampaign expects 'name', not 'campaign_name'
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
                "metadata": campaign_data.get("metadata"),
                "landing_page_data": campaign_data.get("landing_page_data"),
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
            "metadata": campaign_data.get("metadata"),
            "landing_page_data": campaign_data.get("landing_page_data"),
        }

    async def create_campaign(self, campaign_data: Dict, document_id: str) -> Dict:
        """Creates a new campaign in Strapi."""
        logger.info("StrapiClient: Creating a new campaign in Strapi.")
        data = {"data": {**campaign_data, "documentId": document_id}}
        response = await self._request("POST", "campaigns", data=data)
        campaign = response.get("data")
        
        # Transform the response to match BotCampaign model structure
        if campaign:
            client_data = campaign.get("client", {})
            
            # Handle both case where client is an ID or a full object
            client_id = ""
            client_name = "Unknown Client"
            client_industry = "Unknown"
            
            if client_data:
                if isinstance(client_data, dict):
                    client_id = str(client_data.get("id", ""))
                    client_name = client_data.get("name", "Unknown Client")
                    client_industry = client_data.get("industry", "Unknown")
                else:
                    # client_data might just be an ID
                    client_id = str(client_data)
            
            transformed_campaign = {
                "id": str(campaign.get("id", "")),
                "documentId": document_id, # Ensure the documentId is in the response
                "name": campaign.get("name", ""),
                "type": campaign.get("campaign_type") or "standard",
                "guild_id": campaign.get("guild_id", ""),
                "channel_id": campaign.get("channel_id"),
                "client_id": client_id,
                "client_name": client_name,
                "client_industry": client_industry,
                "display_name": campaign.get("name", ""),
                "template": campaign.get("template", "default"),
                "description": campaign.get("description"),
                "is_active": campaign.get("is_active", True),
                "paused_at": campaign.get("paused_at"),
                "campaign_end_date": campaign.get("end_date"),
                "is_deleted": campaign.get("is_deleted", False),
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
                "metadata": campaign.get("metadata"),
                "landing_page_data": campaign.get("landing_page_data"),
            }
            return transformed_campaign
        
        return campaign

    async def update_campaign(self, document_id: str, update_data: Dict) -> Dict:
        """Updates a campaign in Strapi using documentId."""
        logger.info(f"StrapiClient: Updating campaign {document_id} in Strapi.")
        
        # Defensive timestamp validation to prevent validation errors
        logger.info(f"StrapiClient: Received raw update data: {update_data}")
        cleaned_update_data = update_data.copy()
        timestamp_fields = ['start_date', 'end_date', 'paused_at', 'deleted_at', 'last_activity_at']
        
        for field in timestamp_fields:
            if field in cleaned_update_data:
                value = cleaned_update_data[field]
                if value is not None and value != "":
                    # Ensure timestamp is in proper ISO format
                    if isinstance(value, str):
                        try:
                            # Try to parse and reformat to ensure valid ISO format
                            from datetime import datetime
                            if len(value) == 10:  # YYYY-MM-DD format
                                parsed_date = datetime.strptime(value, "%Y-%m-%d")
                                cleaned_update_data[field] = parsed_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                            elif 'T' in value and not value.endswith('Z') and '+' not in value and '-' not in value[10:]:
                                # Add Z if missing from a naive ISO format
                                cleaned_update_data[field] = value + 'Z'
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Invalid timestamp format for {field}: {value}. Removing from update.")
                            cleaned_update_data.pop(field, None)
                elif value == "":
                    # Remove empty string timestamps
                    cleaned_update_data.pop(field, None)
        
        logger.info(f"StrapiClient: Sending cleaned update data: {cleaned_update_data}")
        data = {"data": cleaned_update_data}
        params = {"populate": "*"}  # Ensure relations are populated in the response
        response = await self._request("PUT", f"campaigns/{document_id}", data=data, params=params)
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
            "metadata": campaign_data.get("metadata"),
            "landing_page_data": campaign_data.get("landing_page_data"),
        }

    async def delete_campaign(self, document_id: str) -> Dict:
        """Deletes a campaign in Strapi using its documentId."""
        logger.info(f"StrapiClient: Deleting campaign {document_id} in Strapi.")
        response = await self._request("DELETE", f"campaigns/{document_id}")
        return response.get("data") if response else {"status": "deleted"}

    async def get_onboarding_fields(self, campaign_id: str) -> List[Dict]:
        """Fetches onboarding fields for a campaign from Strapi."""
        logger.info(f"StrapiClient: Fetching onboarding fields for campaign {campaign_id} from Strapi.")
        params = {"filters[campaign][documentId][$eq]": campaign_id, "populate": "*"}
        response = await self._request("GET", "campaign-onboarding-fields", params=params)
        return response.get("data", [])

    async def get_onboarding_field(self, document_id: str) -> Dict:
        """Fetches a single onboarding field by its document ID."""
        logger.info(f"StrapiClient: Fetching onboarding field {document_id} from Strapi.")
        response = await self._request("GET", f"campaign-onboarding-fields/{document_id}", params={"populate": "*"})
        return response.get("data")

    async def create_onboarding_field(self, campaign_id: str, field_data: Dict) -> Dict:
        """Creates an onboarding field for a campaign in Strapi."""
        logger.info(f"StrapiClient: Creating onboarding field for campaign {campaign_id} in Strapi.")
        
        payload = {key: value for key, value in field_data.items() if key not in ['campaign_id', 'id']}
        
        data = {"data": {"campaign": {"connect": [{"documentId": campaign_id}]}, **payload}}
        response = await self._request("POST", "campaign-onboarding-fields", data=data)
        
        return response.get("data")

    async def update_onboarding_field(self, document_id: str, field_data: Dict) -> Dict:
        """
        Updates an onboarding field using detach-update-reattach logic to avoid constraint violations.
        This works around Strapi v5's relationship constraint issues.
        """
        logger.info(f"StrapiClient: Updating onboarding field {document_id} using detach-update-reattach logic.")
        
        # Step 1: Get the existing field to determine its campaign relationship
        try:
            existing_entity = await self._request("GET", f"campaign-onboarding-fields/{document_id}", params={"populate": "campaign"})
            existing_data = existing_entity.get("data", {})
            campaign_info = existing_data.get("campaign", {})
            campaign_document_id = campaign_info.get("documentId") if campaign_info else None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.error(f"Onboarding field with document ID {document_id} not found.")
                raise ValueError(f"Onboarding field with document ID {document_id} does not exist.")
            raise

        logger.info(f"Found existing field attached to campaign: {campaign_document_id}")

        # Step 2: Detach from campaign by setting campaign to null
        if campaign_document_id:
            logger.info("Step 2: Detaching field from campaign...")
            detach_data = {"data": {"campaign": None}}
            await self._request("PUT", f"campaign-onboarding-fields/{document_id}", data=detach_data)
            logger.info("Successfully detached field from campaign")

        # Step 3: Update the field with new data (without campaign relationship)
        logger.info("Step 3: Updating field with new data...")
        update_data = {}
        for key, value in field_data.items():
            if key not in ['campaign', 'campaign_id', 'id', 'documentId', 'createdAt', 'updatedAt', 'publishedAt']:
                update_data[key] = value

        if update_data:
            request_data = {"data": update_data}
            updated_response = await self._request("PUT", f"campaign-onboarding-fields/{document_id}", data=request_data)
            logger.info("Successfully updated field data")
        else:
            # If no data to update, just get the current state
            updated_response = await self._request("GET", f"campaign-onboarding-fields/{document_id}")

        # Step 4: Reattach to campaign if it was originally attached
        if campaign_document_id:
            logger.info("Step 4: Reattaching field to campaign...")
            # Update the campaign to include this field in its onboarding fields
            reattach_data = {"data": {"campaign_onboarding_fields": {"connect": [document_id]}}}
            await self._request("PUT", f"campaigns/{campaign_document_id}", data=reattach_data)
            logger.info("Successfully reattached field to campaign")

        # Return the updated field with populated campaign relationship
        final_response = await self._request("GET", f"campaign-onboarding-fields/{document_id}", params={"populate": "campaign"})
        return final_response.get("data")

    async def delete_onboarding_field(self, document_id: str) -> Dict:
        """Deletes an onboarding field in Strapi."""
        logger.info(f"StrapiClient: Deleting onboarding field {document_id} in Strapi.")
        response = await self._request("DELETE", f"campaign-onboarding-fields/{document_id}")
        return response.get("data") if response else {"status": "deleted"}

    async def create_onboarding_response(self, response_data: Dict) -> Dict:
        """Creates a new campaign onboarding response in Strapi."""
        logger.info("StrapiClient: Creating new campaign onboarding response in Strapi.")
        data = {"data": response_data}
        response = await self._request("POST", "campaign-onboarding-responses", data=data)
        return response.get("data")

    async def get_campaign_template(self, document_id: str) -> Dict:
        """Fetches a single campaign template by document ID from Strapi."""
        logger.info(f"StrapiClient: Fetching campaign template with document ID '{document_id}' from Strapi.")
        
        # Fetch by document ID only
        response = await self._request("GET", f"campaign-templates/{document_id}", params={"populate": "*"})
        return response.get("data")

    async def get_onboarding_responses(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of campaign onboarding responses from Strapi."""
        logger.info("StrapiClient: Fetching campaign onboarding responses from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaign-onboarding-responses", params=params)
        return response.get("data", [])

    async def get_onboarding_starts(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of campaign onboarding starts from Strapi."""
        logger.info("StrapiClient: Fetching campaign onboarding starts from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaign-onboarding-starts", params=params)
        return response.get("data", [])

    async def get_onboarding_completions(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of campaign onboarding completions from Strapi."""
        logger.info("StrapiClient: Fetching campaign onboarding completions from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaign-onboarding-completions", params=params)
        return response.get("data", [])

    async def create_onboarding_completion(self, completion_data: Dict) -> Dict:
        """Creates a new campaign onboarding completion in Strapi."""
        logger.info("StrapiClient: Creating new campaign onboarding completion in Strapi.")
        data = {"data": completion_data}
        response = await self._request("POST", "campaign-onboarding-completions", data=data)
        return response.get("data")

    async def create_onboarding_start(self, start_data: Dict) -> Dict:
        """Creates a new campaign onboarding start event in Strapi."""
        logger.info("StrapiClient: Creating new campaign onboarding start event in Strapi.")
        data = {"data": start_data}
        response = await self._request("POST", "campaign-onboarding-starts", data=data)
        return response.get("data")

    async def get_campaign_templates(self) -> List[Dict]:
        """Fetches a list of campaign templates from Strapi."""
        logger.info("StrapiClient: Fetching campaign templates from Strapi.")
        params = {"populate": "*"}
        response = await self._request("GET", "campaign-templates", params=params)
        return response.get("data", [])

    async def get_users(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of users from Strapi."""
        logger.info("StrapiClient: Fetching users from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "users", params=params)
        return response

    async def create_user(self, user_data: Dict) -> Dict:
        """Creates a new user in Strapi."""
        logger.info("StrapiClient: Creating new user in Strapi.")
        response = await self._request("POST", "users", data=user_data)
        return response

    async def update_user(self, user_id: int, user_data: Dict) -> Dict:
        """Updates a user in Strapi using its ID."""
        logger.info(f"StrapiClient: Updating user {user_id} in Strapi.")
        try:
            response = await self._request("PUT", f"users/{user_id}", data=user_data)
            return response
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"User {user_id} not found (404), it may have been deleted")
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
        return response.get("data") if response else {"status": "deleted"}
    # endregion

    async def get_referral_links(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of referral links from Strapi."""
        logger.info("StrapiClient: Fetching referral links from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "referral-links", params=params)
        return response.get("data", [])

    async def get_referral_links_by_user(self, user_id: str) -> List[Dict]:
        """
        Retrieves all referral links for a specific user.
        """
        filters = {
            "filters[influencer][id][$eq]": user_id,
            "populate": "campaign"
        }
        response = await self._request("GET", "referral-links", params=filters)
        return response.get("data", [])

    async def create_referral_link(self, link_data: Dict) -> Dict:
        """Creates a new referral link in Strapi."""
        logger.info("StrapiClient: Creating a new referral link in Strapi.")
        data = {"data": link_data}
        response = await self._request("POST", "referral-links", data=data)
        return response.get("data")

    async def update_referral_link(self, link_id: str, link_data: Dict) -> Dict:
        """Updates a referral link in Strapi."""
        logger.info(f"StrapiClient: Updating referral link {link_id} in Strapi.")
        data = {"data": link_data}
        response = await self._request("PUT", f"referral-links/{link_id}", data=data)
        return response.get("data")

    async def delete_referral_link(self, link_id: str) -> Dict:
        """Deletes a referral link in Strapi."""
        logger.info(f"StrapiClient: Deleting referral link {link_id} in Strapi.")
        response = await self._request("DELETE", f"referral-links/{link_id}")
        return response if response else {"status": "deleted"}

    async def get_referrals_by_user(self, user_id: str) -> List[Dict]:
        """
        Retrieves all referrals for a specific user.
        """
        filters = {
            "filters[influencer][id][$eq]": user_id,
            "populate": "referral_link"
        }
        response = await self._request("GET", "referrals", params=filters)
        return response.get("data", [])

    async def update_referral(self, referral_id: str, referral_data: Dict) -> Dict:
        """Updates a referral in Strapi."""
        logger.info(f"StrapiClient: Updating referral {referral_id} in Strapi.")
        data = {"data": referral_data}
        response = await self._request("PUT", f"referrals/{referral_id}", data=data)
        return response.get("data")

    async def delete_referral(self, referral_id: str) -> Dict:
        """Deletes a referral in Strapi."""
        logger.info(f"StrapiClient: Deleting referral {referral_id} in Strapi.")
        response = await self._request("DELETE", f"referrals/{referral_id}")
        return response if response else {"status": "deleted"}

    async def get_access_requests(self, filters: Optional[Dict] = None) -> List[Dict]:
        """Fetches a list of campaign influencer access requests from Strapi."""
        logger.info("StrapiClient: Fetching campaign influencer access requests from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaign-influencer-accesses", params=params)
        return response.get("data", [])

    async def update_access_request(self, request_id: str, data: Dict) -> Dict:
        """Updates a campaign influencer access request in Strapi."""
        logger.info(f"StrapiClient: Updating campaign influencer access request {request_id} in Strapi.")
        request_data = {"data": data}
        response = await self._request("PUT", f"campaign-influencer-accesses/{request_id}", data=request_data)
        return response.get("data")

    async def get_campaign_landing_pages(self, campaign_id: str) -> List[Dict]:
        """Fetches a list of landing pages for a campaign from Strapi."""
        logger.info(f"StrapiClient: Fetching landing pages for campaign {campaign_id} from Strapi.")
        params = {"filters[campaign][id][$eq]": campaign_id, "populate": "*"}
        response = await self._request("GET", "campaign-landing-pages", params=params)
        return response.get("data", [])

    async def create_campaign_landing_page(self, page_data: Dict) -> Dict:
        """Creates a new campaign landing page in Strapi."""
        logger.info("StrapiClient: Creating a new campaign landing page in Strapi.")
        data = {"data": page_data}
        response = await self._request("POST", "campaign-landing-pages", data=data)
        return response.get("data")

    async def update_campaign_landing_page(self, page_id: str, page_data: Dict) -> Dict:
        """Updates a campaign landing page in Strapi."""
        logger.info(f"StrapiClient: Updating campaign landing page {page_id} in Strapi.")
        data = {"data": page_data}
        response = await self._request("PUT", f"campaign-landing-pages/{page_id}", data=data)
        return response.get("data")

    async def delete_campaign_landing_page(self, page_id: str) -> Dict:
        """Deletes a campaign landing page in Strapi."""
        logger.info(f"StrapiClient: Deleting campaign landing page {page_id} in Strapi.")
        response = await self._request("DELETE", f"campaign-landing-pages/{page_id}")
        return response if response else {"status": "deleted"}

# Global client instance
strapi_client = StrapiClient()
