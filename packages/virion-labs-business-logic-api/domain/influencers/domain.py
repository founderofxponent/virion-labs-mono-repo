from typing import List
from core.strapi_client import strapi_client
from .schemas import ReferralLinkResponse
import logging

logger = logging.getLogger(__name__)

class InfluencerDomain:
    """
    Domain logic for influencer-specific operations.
    """

    async def get_enriched_referral_links(self, user_id: str) -> List[ReferralLinkResponse]:
        """
        Fetches referral links for an influencer and enriches them with business context.
        """
        logger.info(f"Fetching referral links for user: {user_id}")
        
        # The strapi_client now returns validated Pydantic models
        links = await strapi_client.get_referral_links_by_user(user_id)
        
        # The enrichment logic can be added here in the future.
        # For now, we will just return the validated list.
        # Note: If you were to add business_context, you would add it to the
        # ReferralLinkResponse model.
        
        return links