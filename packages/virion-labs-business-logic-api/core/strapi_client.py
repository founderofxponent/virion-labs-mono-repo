import httpx
from typing import Dict, List, Optional, Any
from .config import settings
import logging
import json
from schemas.strapi import (
    Client,
    StrapiClientCreate,
    StrapiClientUpdate,
    Campaign,
    StrapiCampaignCreate,
    StrapiCampaignUpdate,
    CampaignLandingPage,
    StrapiCampaignLandingPageCreate,
    StrapiCampaignLandingPageUpdate,
    CampaignOnboardingField,
    StrapiCampaignOnboardingFieldCreate,
    StrapiCampaignOnboardingFieldUpdate,
    LandingPageTemplate,
    StrapiLandingPageTemplateCreate,
    StrapiLandingPageTemplateUpdate,
    Referral,
    StrapiReferralCreate,
    ReferralLink,
    StrapiReferralLinkCreate,
    StrapiReferralLinkUpdate,
    CampaignOnboardingResponse,
    StrapiCampaignOnboardingResponseCreate,
    CampaignOnboardingStart,
    StrapiCampaignOnboardingStartCreate,
    CampaignOnboardingCompletion,
    StrapiCampaignOnboardingCompletionCreate,
    CampaignTemplate,
    UserSetting,
    StrapiUserSettingCreate,
    StrapiUserSettingUpdate
)

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

    def _sanitize_landing_page_data(self, page_data: Dict) -> Dict:
        """Sanitizes landing page data, ensuring JSON fields are correctly formatted."""
        sanitized_data = page_data.copy()
        json_fields = ['offer_highlights', 'product_images']
        
        for field in json_fields:
            if field in sanitized_data and sanitized_data[field] is not None:
                value = sanitized_data[field]
                if isinstance(value, str):
                    try:
                        # If it's a string that is valid JSON, parse it into a Python object.
                        sanitized_data[field] = json.loads(value)
                    except json.JSONDecodeError:
                        # If it's a plain string, it's invalid for a JSON column.
                        # Wrap it in a list to make it valid JSON.
                        logger.warning(f"Wrapping plain string value for JSON field '{field}' in a list.")
                        sanitized_data[field] = [value]
        
        if 'campaign' in sanitized_data and isinstance(sanitized_data['campaign'], dict):
            sanitized_data['campaign'] = sanitized_data['campaign'].get('id')

        return sanitized_data

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

    async def get_clients(self, filters: Optional[Dict] = None) -> List[Client]:
        """Fetches a list of clients from Strapi, returning them as validated Pydantic models."""
        logger.info("StrapiClient: Fetching real clients from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "clients", params=params)
        return [Client(**item) for item in response.get("data", [])]

    async def create_client(self, client_data: StrapiClientCreate) -> Client:
        """Creates a new client in Strapi using a validated Pydantic model."""
        logger.info("StrapiClient: Creating a new client in Strapi.")
        payload = client_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "clients", data=data)
        return Client(**response.get("data"))

    async def update_client(self, document_id: str, client_data: StrapiClientUpdate) -> Client:
        """Updates a client in Strapi using its documentId and a validated Pydantic model."""
        logger.info(f"StrapiClient: Updating client {document_id} in Strapi.")
        payload = client_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("PUT", f"clients/{document_id}", data=data)
        return Client(**response.get("data"))

    async def get_client(self, document_id: str, populate: Optional[List[str]] = None) -> Optional[Client]:
        """Fetches a single client by documentId from Strapi, returning a validated Pydantic model."""
        logger.info(f"StrapiClient: Fetching client {document_id} from Strapi.")
        params = {}
        if populate:
            params["populate"] = ",".join(populate)
        
        try:
            response = await self._request("GET", f"clients/{document_id}", params=params)
            if response and response.get("data"):
                return Client(**response.get("data"))
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Client with documentId {document_id} not found.")
                return None
            raise

    async def get_campaigns(self, filters: Optional[Dict] = None) -> List[Campaign]:
        """Fetches a list of campaigns from Strapi, returning them as validated Pydantic models."""
        logger.info("StrapiClient: Fetching campaigns from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaigns", params=params)
        return [Campaign(**item) for item in response.get("data", [])]

    async def get_campaign(self, document_id: str, populate: Optional[List[str]] = None) -> Optional[Campaign]:
        """Fetches a single campaign by documentId from Strapi, returning a validated Pydantic model."""
        logger.info(f"StrapiClient: Fetching campaign {document_id} from Strapi.")
        params = {}
        if populate:
            params["populate"] = ",".join(populate)
        else:
            params["populate"] = "*" # Default to populating all relations
        
        try:
            response = await self._request("GET", f"campaigns/{document_id}", params=params)
            if response and response.get("data"):
                return Campaign(**response.get("data"))
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Campaign with documentId {document_id} not found.")
                return None
            raise

    async def get_campaign_id_by_document_id(self, document_id: str) -> Optional[int]:
        """Fetches a campaign's numeric ID by its documentId."""
        logger.info(f"Fetching campaign numeric ID for documentId: {document_id}")
        filters = {
            "filters[documentId][$eq]": document_id,
            "fields[0]": "id"
        }
        response = await self._request("GET", "campaigns", params=filters)
        campaigns = response.get("data", [])
        if campaigns:
            campaign_id = campaigns[0].get("id")
            logger.info(f"Found numeric ID: {campaign_id} for documentId: {document_id}")
            return campaign_id
        logger.warning(f"No campaign found with documentId: {document_id}")
        return None

    async def create_campaign(self, campaign_data: StrapiCampaignCreate) -> Campaign:
        """Creates a new campaign in Strapi using a validated Pydantic model."""
        logger.info("StrapiClient: Creating a new campaign in Strapi.")
        payload = campaign_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "campaigns", data=data)
        return Campaign(**response.get("data"))

    async def update_campaign(self, document_id: str, update_data: StrapiCampaignUpdate) -> Campaign:
        """Updates a campaign in Strapi using its documentId and a validated Pydantic model."""
        logger.info(f"StrapiClient: Updating campaign {document_id} in Strapi.")
        payload = update_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        params = {"populate": "*"}  # Ensure relations are populated in the response
        response = await self._request("PUT", f"campaigns/{document_id}", data=data, params=params)
        return Campaign(**response.get("data"))

    async def delete_campaign(self, document_id: str) -> Dict:
        """Deletes a campaign in Strapi using its documentId."""
        logger.info(f"StrapiClient: Deleting campaign {document_id} in Strapi.")
        response = await self._request("DELETE", f"campaigns/{document_id}")
        return response.get("data") if response else {"status": "deleted"}

    async def get_onboarding_fields_by_campaign(self, campaign_id: str) -> List[CampaignOnboardingField]:
        """Fetches onboarding fields for a campaign from Strapi."""
        logger.info(f"StrapiClient: Fetching onboarding fields for campaign {campaign_id} from Strapi.")
        params = {"filters[campaign][documentId][$eq]": campaign_id, "populate": "*"}
        response = await self._request("GET", "campaign-onboarding-fields", params=params)
        return [CampaignOnboardingField(**item) for item in response.get("data", [])]

    async def get_onboarding_field(self, field_id: int) -> Optional[CampaignOnboardingField]:
        """Fetches a single onboarding field by its ID."""
        logger.info(f"StrapiClient: Fetching onboarding field {field_id} from Strapi.")
        try:
            response = await self._request("GET", f"campaign-onboarding-fields/{field_id}", params={"populate": "*"})
            if response and response.get("data"):
                return CampaignOnboardingField(**response.get("data"))
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Onboarding field with ID {field_id} not found.")
                return None
            raise

    async def get_onboarding_field_by_document_id(self, document_id: str) -> Optional[CampaignOnboardingField]:
        """Fetches a single onboarding field by its documentId."""
        logger.info(f"StrapiClient: Fetching onboarding field with documentId {document_id} from Strapi.")
        params = {
            "filters[documentId][$eq]": document_id,
            "populate": "*"
        }
        response = await self._request("GET", "campaign-onboarding-fields", params=params)
        fields = response.get("data", [])
        if fields:
            return CampaignOnboardingField(**fields[0])
        return None

    async def create_onboarding_field(self, field_data: StrapiCampaignOnboardingFieldCreate) -> CampaignOnboardingField:
        """Creates an onboarding field for a campaign in Strapi."""
        logger.info(f"StrapiClient: Creating onboarding field for campaign {field_data.campaign} in Strapi.")
        payload = field_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "campaign-onboarding-fields", data=data)
        return CampaignOnboardingField(**response.get("data"))

    async def update_onboarding_field(self, field_id: int, field_data: StrapiCampaignOnboardingFieldUpdate) -> CampaignOnboardingField:
        """Updates an onboarding field in Strapi."""
        logger.info(f"StrapiClient: Updating onboarding field {field_id} in Strapi.")
        payload = field_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("PUT", f"campaign-onboarding-fields/{field_id}", data=data)
        return CampaignOnboardingField(**response.get("data"))

    async def delete_onboarding_field(self, field_id: int) -> Dict:
        """Deletes an onboarding field in Strapi."""
        logger.info(f"StrapiClient: Deleting onboarding field {field_id} in Strapi.")
        response = await self._request("DELETE", f"campaign-onboarding-fields/{field_id}")
        return response.get("data") if response else {"status": "deleted"}

    async def create_onboarding_response(self, response_data: StrapiCampaignOnboardingResponseCreate) -> CampaignOnboardingResponse:
        """Creates a new campaign onboarding response in Strapi."""
        logger.info("StrapiClient: Creating new campaign onboarding response in Strapi.")
        payload = response_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "campaign-onboarding-responses", data=data)
        return CampaignOnboardingResponse(**response.get("data"))

    async def get_campaign_template(self, document_id: str) -> Optional[CampaignTemplate]:
        """Fetches a single campaign template by document ID from Strapi."""
        logger.info(f"StrapiClient: Fetching campaign template with document ID '{document_id}' from Strapi.")
        try:
            response = await self._request("GET", f"campaign-templates/{document_id}", params={"populate": "*"})
            if response and response.get("data"):
                return CampaignTemplate(**response.get("data"))
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Campaign template with documentId {document_id} not found.")
                return None
            raise

    async def get_onboarding_responses(self, filters: Optional[Dict] = None) -> List[CampaignOnboardingResponse]:
        """Fetches a list of campaign onboarding responses from Strapi."""
        logger.info("StrapiClient: Fetching campaign onboarding responses from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaign-onboarding-responses", params=params)
        return [CampaignOnboardingResponse(**item) for item in response.get("data", [])]

    async def get_onboarding_starts(self, filters: Optional[Dict] = None) -> List[CampaignOnboardingStart]:
        """Fetches a list of campaign onboarding starts from Strapi."""
        logger.info("StrapiClient: Fetching campaign onboarding starts from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaign-onboarding-starts", params=params)
        return [CampaignOnboardingStart(**item) for item in response.get("data", [])]

    async def get_onboarding_completions(self, filters: Optional[Dict] = None) -> List[CampaignOnboardingCompletion]:
        """Fetches a list of campaign onboarding completions from Strapi."""
        logger.info("StrapiClient: Fetching campaign onboarding completions from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "campaign-onboarding-completions", params=params)
        return [CampaignOnboardingCompletion(**item) for item in response.get("data", [])]

    async def create_onboarding_completion(self, completion_data: StrapiCampaignOnboardingCompletionCreate) -> CampaignOnboardingCompletion:
        """Creates a new campaign onboarding completion in Strapi."""
        logger.info("StrapiClient: Creating new campaign onboarding completion in Strapi.")
        payload = completion_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "campaign-onboarding-completions", data=data)
        return CampaignOnboardingCompletion(**response.get("data"))

    async def create_onboarding_start(self, start_data: StrapiCampaignOnboardingStartCreate) -> CampaignOnboardingStart:
        """Creates a new campaign onboarding start event in Strapi."""
        logger.info("StrapiClient: Creating new campaign onboarding start event in Strapi.")
        payload = start_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "campaign-onboarding-starts", data=data)
        return CampaignOnboardingStart(**response.get("data"))

    async def get_campaign_templates(self, filters: Optional[Dict] = None) -> List[CampaignTemplate]:
        """Fetches a list of campaign templates from Strapi."""
        logger.info("StrapiClient: Fetching campaign templates from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        response = await self._request("GET", "campaign-templates", params=params)
        return [CampaignTemplate(**item) for item in response.get("data", [])]

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
            # Users-permissions plugin expects data directly, not wrapped in {"data": ...}
            print(f"Updating user {user_id} with data: {user_data}")
            response = await self._request("PUT", f"users/{user_id}", data=user_data)
            return response
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"User {user_id} not found (404), it may have been deleted")
                return None
            raise

    async def update_user_setting(self, setting_id: int, setting_data: StrapiUserSettingUpdate) -> UserSetting:
        """Updates a user setting in Strapi using its ID."""
        logger.info(f"StrapiClient: Updating user setting {setting_id} in Strapi.")
        payload = setting_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("PUT", f"user-settings/{setting_id}", data=data)
        return UserSetting(**response.get("data"))

    async def create_user_setting(self, setting_data: StrapiUserSettingCreate) -> UserSetting:
        """Creates a new user setting in Strapi."""
        logger.info("StrapiClient: Creating new user setting in Strapi.")
        # Strapi expects the user relation to be set from the user side, not on setting creation.
        payload = setting_data.model_dump(exclude={'user'})
        data = {"data": payload}
        response = await self._request("POST", "user-settings", data=data)
        return UserSetting(**response.get("data"))

    async def update_user_setting_relation(self, user_id: int, setting_id: int) -> Dict:
        """Updates the user to link it to a new user_setting."""
        logger.info(f"StrapiClient: Linking user {user_id} to setting {setting_id}.")
        data = {"user_setting": setting_id}
        return await self.update_user(user_id, data)

    async def get_user(self, user_id: int) -> Dict:
        """Fetches a single user by their ID from Strapi."""
        logger.info(f"StrapiClient: Fetching user {user_id} from Strapi.")
        # The 'populate' parameter is crucial to get the user's role information
        params = {"populate": "role"}
        # Note: This endpoint is part of the Users & Permissions plugin
        response = await self._request("GET", f"users/{user_id}", params=params)
        return response

    async def get_roles(self) -> List[Dict]:
        """Fetches all roles from Strapi."""
        logger.info("StrapiClient: Fetching roles from Strapi.")
        response = await self._request("GET", "users-permissions/roles")
        return response.get("roles", [])

    async def get_role_by_name(self, role_name: str) -> Optional[Dict]:
        """Fetches a role by name from Strapi."""
        logger.info(f"StrapiClient: Fetching role {role_name} from Strapi.")
        roles = await self.get_roles()
        
        for role in roles:
            if role.get("name") == role_name:
                return role
        return None

    async def update_user_role(self, user_id: int, role_id: int) -> Dict:
        """Updates a user's role in Strapi."""
        logger.info(f"StrapiClient: Updating user {user_id} role to {role_id}.")
        user_data = {"role": role_id}
        return await self.update_user(user_id, user_data)

    # region Landing Page Template Operations
    async def get_landing_page_templates(self, filters: Optional[Dict] = None) -> List[LandingPageTemplate]:
        """Fetches a list of landing page templates from Strapi."""
        logger.info("StrapiClient: Fetching landing page templates from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "landing-page-templates", params=params)
        return [LandingPageTemplate(**item) for item in response.get("data", [])]

    async def get_landing_page_template(self, document_id: str) -> Optional[LandingPageTemplate]:
        """Fetches a single landing page template from Strapi using documentId."""
        logger.info(f"StrapiClient: Fetching landing page template {document_id} from Strapi.")
        params = {"populate": "*"}
        try:
            response = await self._request("GET", f"landing-page-templates/{document_id}", params=params)
            if response and response.get("data"):
                return LandingPageTemplate(**response.get("data"))
            return None
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Landing page template with documentId {document_id} not found.")
                return None
            raise

    async def create_landing_page_template(self, template_data: StrapiLandingPageTemplateCreate) -> LandingPageTemplate:
        """Creates a new landing page template in Strapi."""
        logger.info("StrapiClient: Creating new landing page template in Strapi.")
        payload = template_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "landing-page-templates", data=data)
        return LandingPageTemplate(**response.get("data"))

    async def update_landing_page_template(self, document_id: str, template_data: StrapiLandingPageTemplateUpdate) -> LandingPageTemplate:
        """Updates a landing page template in Strapi using documentId."""
        logger.info(f"StrapiClient: Updating landing page template {document_id} in Strapi.")
        payload = template_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("PUT", f"landing-page-templates/{document_id}", data=data)
        return LandingPageTemplate(**response.get("data"))

    async def delete_landing_page_template(self, document_id: str) -> Dict:
        """Deletes a landing page template in Strapi using documentId."""
        logger.info(f"StrapiClient: Deleting landing page template {document_id} from Strapi.")
        await self._request("DELETE", f"landing-page-templates/{document_id}")
        return {"status": "deleted", "documentId": document_id}
    # endregion

    async def get_referral_links(self, filters: Optional[Dict] = None) -> List[ReferralLink]:
        """Fetches a list of referral links from Strapi, returning them as validated Pydantic models."""
        logger.info("StrapiClient: Fetching referral links from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "referral-links", params=params)
        return [ReferralLink(**item) for item in response.get("data", [])]

    async def get_referral_links_by_user(self, user_id: str) -> List[ReferralLink]:
        """Retrieves all referral links for a specific user as validated Pydantic models."""
        filters = {
            "filters[influencer][id][$eq]": user_id,
            "populate": "campaign"
        }
        return await self.get_referral_links(filters=filters)

    async def create_referral_link(self, link_data: StrapiReferralLinkCreate) -> ReferralLink:
        """Creates a new referral link in Strapi using a validated Pydantic model."""
        logger.info("StrapiClient: Creating a new referral link in Strapi.")
        payload = link_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "referral-links", data=data)
        return ReferralLink(**response.get("data"))

    async def update_referral_link(self, link_id: int, link_data: StrapiReferralLinkUpdate) -> ReferralLink:
        """Updates a referral link in Strapi using its ID and a validated Pydantic model."""
        logger.info(f"StrapiClient: Updating referral link {link_id} in Strapi.")
        payload = link_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("PUT", f"referral-links/{link_id}", data=data)
        return ReferralLink(**response.get("data"))

    async def delete_referral_link(self, link_id: str) -> Dict:
        """Deletes a referral link in Strapi."""
        logger.info(f"StrapiClient: Deleting referral link {link_id} in Strapi.")
        response = await self._request("DELETE", f"referral-links/{link_id}")
        return response if response else {"status": "deleted"}

    async def get_referrals(self, filters: Optional[Dict] = None) -> List[Referral]:
        """Fetches a list of referrals from Strapi."""
        logger.info("StrapiClient: Fetching referrals from Strapi.")
        params = {"populate": "*"}
        if filters:
            params.update(filters)
        
        response = await self._request("GET", "referrals", params=params)
        return [Referral(**item) for item in response.get("data", [])]

    async def create_referral(self, referral_data: StrapiReferralCreate) -> Referral:
        """Creates a new referral in Strapi."""
        logger.info("StrapiClient: Creating a new referral in Strapi.")
        payload = referral_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "referrals", data=data)
        return Referral(**response.get("data"))

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

    async def get_campaign_landing_page(self, campaign_id: str) -> Optional[CampaignLandingPage]:
        """Fetches the landing page for a campaign from Strapi."""
        logger.info(f"StrapiClient: Fetching landing page for campaign {campaign_id} from Strapi.")
        params = {"filters[campaign][documentId][$eq]": campaign_id, "populate": "*"}
        response = await self._request("GET", "campaign-landing-pages", params=params)
        pages = response.get("data", [])
        if not pages:
            return None
        return CampaignLandingPage(**pages[0])

    async def create_campaign_landing_page(self, page_data: StrapiCampaignLandingPageCreate) -> CampaignLandingPage:
        """Creates a new campaign landing page in Strapi."""
        logger.info("StrapiClient: Creating a new campaign landing page in Strapi.")
        payload = page_data.model_dump(exclude_unset=True)
        data = {"data": payload}
        response = await self._request("POST", "campaign-landing-pages", data=data)
        return CampaignLandingPage(**response.get("data"))

    async def update_campaign_landing_page(self, page_id: str, page_data: StrapiCampaignLandingPageUpdate) -> Dict:
        """Updates a campaign landing page in Strapi using a Pydantic model."""
        logger.info(f"CLIENT: Updating campaign landing page {page_id} in Strapi.")
        
        # Convert the Pydantic model to a dictionary, excluding unset fields.
        update_payload = page_data.model_dump(exclude_unset=True)

        # If campaign is present as a document ID string, convert it to a numeric ID
        if 'campaign' in update_payload and isinstance(update_payload['campaign'], str):
            campaign_doc_id = update_payload.pop('campaign')
            campaign_id = await self.get_campaign_id_by_document_id(campaign_doc_id)
            if campaign_id:
                update_payload['campaign'] = campaign_id
            else:
                logger.warning(f"Could not find campaign with documentId: {campaign_doc_id}. Relation will not be updated.")

        data = {"data": update_payload}
        
        logger.info(f"CLIENT: Sending final payload to Strapi: {data}")
        response = await self._request("PUT", f"campaign-landing-pages/{page_id}", data=data)
        logger.info(f"Successfully updated landing page. Response: {response}")
        
        return response.get("data")

    async def delete_campaign_landing_page(self, page_id: str) -> Dict:
        """Deletes a campaign landing page in Strapi."""
        logger.info(f"StrapiClient: Deleting campaign landing page {page_id} in Strapi.")
        response = await self._request("DELETE", f"campaign-landing-pages/{page_id}")
        return response if response else {"status": "deleted"}

# Global client instance
strapi_client = StrapiClient()
