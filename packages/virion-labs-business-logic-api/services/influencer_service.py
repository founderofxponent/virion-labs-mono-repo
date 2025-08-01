from typing import List, Dict, Any
from domain.influencers.domain import InfluencerDomain
from domain.influencers.schemas import (
    ReferralLinkCreate,
    ReferralLinkUpdate,
    ReferralLinkResponse,
    Referral
)
from schemas.strapi import (
    StrapiReferralLinkCreate,
    StrapiReferralLinkUpdate
)
from core.strapi_client import strapi_client
import logging

logger = logging.getLogger(__name__)

class InfluencerService:
    """
    Service layer for influencer-specific operations.
    """

    def __init__(self):
        self.influencer_domain = InfluencerDomain()

    async def list_referral_links_operation(self, user_id: int) -> List[ReferralLinkResponse]:
        """Business operation for listing an influencer's referral links."""
        logger.info(f"Executing list referral links operation for user: {user_id}")
        return await self.influencer_domain.get_enriched_referral_links(str(user_id))

    async def create_referral_link_operation(self, link_data: ReferralLinkCreate, user_id: int) -> ReferralLinkResponse:
        """Business operation for creating a new referral link for an influencer."""
        logger.info(f"Executing create referral link operation for user: {user_id}")
        
        # The domain model expects the user_id to be set.
        link_data.influencer = user_id
        
        strapi_data = StrapiReferralLinkCreate(**link_data.model_dump())
        created_link = await strapi_client.create_referral_link(strapi_data)
        
        return ReferralLinkResponse(**created_link.model_dump())

    async def update_referral_link_operation(self, link_id: int, link_data: ReferralLinkUpdate, user_id: int) -> ReferralLinkResponse:
        """Business operation for updating a referral link for an influencer."""
        logger.info(f"Executing update referral link operation for user: {user_id}, link: {link_id}")
        
        # TODO: Add domain logic to verify link ownership by user_id
        
        strapi_data = StrapiReferralLinkUpdate(**link_data.model_dump(exclude_unset=True))
        updated_link = await strapi_client.update_referral_link(link_id, strapi_data)
        
        return ReferralLinkResponse(**updated_link.model_dump())

    async def delete_referral_link_operation(self, link_id: int, user_id: int) -> None:
        """Business operation for deleting a referral link for an influencer."""
        logger.info(f"Executing delete referral link operation for user: {user_id}, link: {link_id}")
        
        # TODO: Add domain logic to verify link ownership by user_id
        
        await strapi_client.delete_referral_link(str(link_id))
        return

    async def list_referrals_operation(self, user_id: int) -> List[Referral]:
        """Business operation for listing an influencer's referrals."""
        logger.info(f"Executing list referrals operation for user: {user_id}")
        
        # The strapi_client now returns validated Pydantic models
        referrals = await strapi_client.get_referrals_by_user(str(user_id))
        
        # Convert the raw Strapi dicts to our domain model
        return [Referral(**ref) for ref in referrals]

    async def update_referral_status_operation(self, referral_id: str, status: str, user_id: str) -> Dict[str, Any]:
        """
        Business operation for updating the status of a referral.
        """
        logger.info(f"Executing update referral status operation for user: {user_id}, referral: {referral_id}")

        # In a real-world scenario, you would first verify that the referral belongs to the user.
        # For now, we will trust the frontend to only allow updates to the user's own referrals.

        updated_referral = await strapi_client.update_referral(referral_id, {"status": status})

        return {
            "referral": updated_referral,
            "message": "Referral status updated successfully."
        }

    async def delete_referral_operation(self, referral_id: str, user_id: str) -> Dict[str, Any]:
        """
        Business operation for deleting a referral.
        """
        logger.info(f"Executing delete referral operation for user: {user_id}, referral: {referral_id}")

        # In a real-world scenario, you would first verify that the referral belongs to the user.
        # For now, we will trust the frontend to only allow deletions of the user's own referrals.

        await strapi_client.delete_referral(referral_id)

        return {
            "message": "Referral deleted successfully."
        }

    async def create_campaign_referral_link_operation(self, campaign_id: str, link_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Business operation for creating a new campaign-specific referral link for an influencer.
        """
        logger.info(f"Executing create campaign referral link operation for user: {user_id}, campaign: {campaign_id}")

        # Add the influencer and campaign to the link data
        link_data['influencer'] = user_id
        link_data['campaign'] = campaign_id

        # In a real-world scenario, you would call the domain to apply business rules
        # created_link = await self.influencer_domain.create_referral_link(link_data)

        # For now, we will call the strapi client directly
        created_link = await strapi_client.create_referral_link(link_data)

        return {
            "link": created_link,
            "message": "Campaign referral link created successfully."
        }

# Global service instance
influencer_service = InfluencerService()