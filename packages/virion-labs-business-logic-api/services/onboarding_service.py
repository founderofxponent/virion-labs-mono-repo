from typing import List, Dict, Optional
from fastapi import HTTPException
from core.strapi_client import strapi_client
from domain.onboarding.schemas import (
    CampaignOnboardingStartCreate, CampaignOnboardingStartResponse,
    CampaignOnboardingCompletionCreate, CampaignOnboardingCompletionResponse,
    CampaignOnboardingResponseCreate, CampaignOnboardingResponse
)
from schemas.strapi import (
    StrapiCampaignOnboardingStartCreate,
    StrapiCampaignOnboardingCompletionCreate,
    StrapiCampaignOnboardingResponseCreate
)
from schemas.user_schemas import User
import logging

logger = logging.getLogger(__name__)

class OnboardingService:
    """Service layer for handling campaign onboarding lifecycle events."""

    # --- Onboarding Start ---
    async def create_onboarding_start(self, start_data: CampaignOnboardingStartCreate, current_user: User) -> CampaignOnboardingStartResponse:
        """Handles the business logic for creating an onboarding start event."""
        try:
            strapi_data = StrapiCampaignOnboardingStartCreate(**start_data.model_dump())
            created_event = await strapi_client.create_onboarding_start(strapi_data)
            return CampaignOnboardingStartResponse(**created_event.model_dump())
        except Exception as e:
            logger.error(f"Error creating onboarding start event: {e}")
            raise HTTPException(status_code=500, detail="Failed to create onboarding start event.")

    async def list_onboarding_starts(self, filters: Optional[Dict], current_user: User) -> List[CampaignOnboardingStartResponse]:
        """Handles the business logic for listing onboarding start events."""
        try:
            events = await strapi_client.get_onboarding_starts(filters)
            return [CampaignOnboardingStartResponse(**event.model_dump()) for event in events]
        except Exception as e:
            logger.error(f"Error listing onboarding start events: {e}")
            raise HTTPException(status_code=500, detail="Failed to list onboarding start events.")

    # --- Onboarding Completion ---
    async def create_onboarding_completion(self, completion_data: CampaignOnboardingCompletionCreate, current_user: User) -> CampaignOnboardingCompletionResponse:
        """Handles the business logic for creating an onboarding completion event."""
        try:
            strapi_data = StrapiCampaignOnboardingCompletionCreate(**completion_data.model_dump())
            created_event = await strapi_client.create_onboarding_completion(strapi_data)
            return CampaignOnboardingCompletionResponse(**created_event.model_dump())
        except Exception as e:
            logger.error(f"Error creating onboarding completion event: {e}")
            raise HTTPException(status_code=500, detail="Failed to create onboarding completion event.")

    async def list_onboarding_completions(self, filters: Optional[Dict], current_user: User) -> List[CampaignOnboardingCompletionResponse]:
        """Handles the business logic for listing onboarding completion events."""
        try:
            events = await strapi_client.get_onboarding_completions(filters)
            return [CampaignOnboardingCompletionResponse(**event.model_dump()) for event in events]
        except Exception as e:
            logger.error(f"Error listing onboarding completion events: {e}")
            raise HTTPException(status_code=500, detail="Failed to list onboarding completion events.")

    # --- Onboarding Response ---
    async def create_onboarding_response(self, response_data: CampaignOnboardingResponseCreate, current_user: User) -> CampaignOnboardingResponse:
        """Handles the business logic for creating an onboarding response."""
        try:
            strapi_data = StrapiCampaignOnboardingResponseCreate(**response_data.model_dump())
            created_response = await strapi_client.create_onboarding_response(strapi_data)
            return CampaignOnboardingResponse(**created_response.model_dump())
        except Exception as e:
            logger.error(f"Error creating onboarding response: {e}")
            raise HTTPException(status_code=500, detail="Failed to create onboarding response.")

    async def list_onboarding_responses(self, filters: Optional[Dict], current_user: User) -> List[CampaignOnboardingResponse]:
        """Handles the business logic for listing onboarding responses."""
        try:
            responses = await strapi_client.get_onboarding_responses(filters)
            return [CampaignOnboardingResponse(**response.model_dump()) for response in responses]
        except Exception as e:
            logger.error(f"Error listing onboarding responses: {e}")
            raise HTTPException(status_code=500, detail="Failed to list onboarding responses.")

# Global instance of the service
onboarding_service = OnboardingService()