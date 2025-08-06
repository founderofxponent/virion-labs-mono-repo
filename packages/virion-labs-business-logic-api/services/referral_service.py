from typing import List, Dict, Optional
from fastapi import HTTPException
from core.strapi_client import strapi_client
from domain.referrals.schemas import ReferralCreate, ReferralResponse
from schemas.strapi import StrapiReferralCreate, Referral
from schemas.user_schemas import User
import logging

logger = logging.getLogger(__name__)

class ReferralService:
    """Service layer for handling referral-related business logic."""

    async def create_referral_operation(self, referral_data: ReferralCreate, current_user: User) -> ReferralResponse:
        """
        Handles the business logic for creating a new referral.
        """
        try:
            # In a real-world scenario, you might have business rules here, such as:
            # - Checking if the campaign_id is valid and active.
            # - Preventing duplicate referrals within a certain time frame.
            # - Sending a notification email to the referee.

            logger.info(f"User '{current_user.username}' is creating a referral for campaign '{referral_data.campaign_id}'.")

            # Convert domain model to Strapi model for persistence
            strapi_data = StrapiReferralCreate(**referral_data.model_dump())
            
            created_referral = await strapi_client.create_referral(strapi_data)
            
            # Convert Strapi response model back to domain response model
            return ReferralResponse(**created_referral.model_dump())

        except Exception as e:
            logger.error(f"Error creating referral: {e}")
            # Re-raise as HTTPException to be handled by the router
            raise HTTPException(status_code=500, detail="Failed to create referral.")

    async def list_referrals_operation(self, filters: Optional[Dict], current_user: User) -> List[ReferralResponse]:
        """
        Handles the business logic for listing referrals.
        """
        try:
            # Here you could add authorization logic, e.g., only admins can see all referrals,
            # while other users can only see referrals they made.
            logger.info(f"User '{current_user.username}' is listing referrals with filters: {filters}")

            strapi_referrals = await strapi_client.get_referrals(filters)
            
            # Convert list of Strapi models to a list of domain response models
            return [ReferralResponse(**referral.model_dump()) for referral in strapi_referrals]

        except Exception as e:
            logger.error(f"Error listing referrals: {e}")
            raise HTTPException(status_code=500, detail="Failed to list referrals.")

# Global instance of the service
referral_service = ReferralService()