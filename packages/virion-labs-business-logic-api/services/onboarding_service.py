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
            
            # Track conversion if there's a referral link in the completion data
            await self._track_conversion_if_applicable(completion_data, current_user)
            
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

    async def _track_conversion_if_applicable(self, completion_data: CampaignOnboardingCompletionCreate, current_user: User):
        """Helper method to track referral conversions when onboarding is completed."""
        try:
            # Check if the completion data includes a referral_link_id
            referral_link_id = getattr(completion_data, 'referral_link_id', None)
            if not referral_link_id:
                logger.info("No referral link associated with onboarding completion, skipping conversion tracking")
                return

            # Get the referral link to find the referral code
            filters = {
                "filters[id][$eq]": referral_link_id,
                "populate[0]": "campaign",
                "populate[1]": "influencer"
            }
            referral_links = await strapi_client.get_referral_links(filters=filters)
            
            if not referral_links:
                logger.warning(f"Referral link with ID {referral_link_id} not found, cannot track conversion")
                return

            referral_link = referral_links[0]
            referral_code = referral_link.referral_code

            # Track the conversion
            current_conversions = referral_link.conversions or 0
            current_earnings = referral_link.earnings or 0.0
            
            # Calculate conversion value (this could be configurable per campaign)
            conversion_value = 10.0  # Default conversion value, should be made configurable
            
            new_conversions = current_conversions + 1
            new_earnings = current_earnings + conversion_value

            # Update the referral link
            from schemas.strapi import StrapiReferralLinkUpdate
            from datetime import datetime
            
            update_data = StrapiReferralLinkUpdate(
                conversions=new_conversions,
                earnings=new_earnings,
                last_conversion_at=datetime.now()
            )

            await strapi_client.update_referral_link(referral_link.id, update_data)
            
            logger.info(f"Conversion tracked for referral code {referral_code}: conversions {current_conversions} -> {new_conversions}, earnings {current_earnings} -> {new_earnings}")

        except Exception as e:
            logger.error(f"Error tracking conversion for onboarding completion: {e}")
            # Don't raise the exception as this shouldn't fail the onboarding completion

# Global instance of the service
onboarding_service = OnboardingService()