from typing import Dict, Any, List
from core.strapi_client import strapi_client
import logging

logger = logging.getLogger(__name__)

class InfluencerDomain:
    """
    Domain logic for influencer-specific operations.
    """

    async def get_enriched_referral_links(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetches referral links for an influencer and enriches them with business context.
        """
        # In a real-world scenario, you might add business rules here,
        # such as calculating performance tiers, identifying high-performing links,
        # or adding recommendations.

        logger.info(f"Fetching referral links for user: {user_id}")
        
        # For now, we will just fetch the raw data from Strapi.
        # The business logic can be expanded here later.
        links = await strapi_client.get_referral_links_by_user(user_id)
        
        enriched_links = []
        for link in links:
            enriched_links.append({
                **link,
                "business_context": {
                    "performance_status": "normal",
                    "recommendations": []
                }
            })
            
        return enriched_links