from core.strapi_client import strapi_client
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service layer for analytics operations."""

    async def get_onboarding_funnel_analytics(self, campaign_id: str) -> Dict[str, Any]:
        """
        Calculates the onboarding funnel analytics for a specific campaign.
        """
        try:
            logger.info(f"Calculating onboarding funnel analytics for campaign {campaign_id}")

            # 1. Get total starts
            start_filters = {"filters[campaign][documentId][$eq]": campaign_id}
            onboarding_starts = await strapi_client.get_onboarding_starts(start_filters)
            total_starts = len(onboarding_starts)

            # 2. Get total completions
            completion_filters = {"filters[campaign][documentId][$eq]": campaign_id}
            onboarding_completions = await strapi_client.get_onboarding_completions(completion_filters)
            total_completions = len(onboarding_completions)

            # 3. Calculate completion rate
            if total_starts > 0:
                completion_rate = (total_completions / total_starts) * 100
            else:
                completion_rate = 0

            analytics_data = {
                "total_starts": total_starts,
                "total_completions": total_completions,
                "completion_rate": round(completion_rate, 2)
            }
            
            logger.info(f"Onboarding funnel analytics for campaign {campaign_id}: {analytics_data}")
            return analytics_data

        except Exception as e:
            logger.error(f"Failed to calculate onboarding funnel analytics for campaign {campaign_id}: {e}")
            # Return zeroed data on error to avoid breaking the caller
            return {
                "total_starts": 0,
                "total_completions": 0,
                "completion_rate": 0
            }

analytics_service = AnalyticsService()