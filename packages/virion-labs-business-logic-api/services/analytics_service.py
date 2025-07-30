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

    async def get_performance_over_time(self, timeframe_days: int) -> Dict[str, Any]:
        """
        Calculates the performance metrics over a given time frame, grouped by day.
        """
        from datetime import datetime, timedelta, timezone

        try:
            logger.info(f"Calculating performance over time for the last {timeframe_days} days")

            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=timeframe_days)

            # 1. Fetch all starts and completions within the timeframe
            start_filters = {"filters[started_at][$gte]": start_date.isoformat()}
            onboarding_starts = await strapi_client.get_onboarding_starts(start_filters)

            completion_filters = {"filters[completed_at][$gte]": start_date.isoformat()}
            onboarding_completions = await strapi_client.get_onboarding_completions(completion_filters)

            # 2. Group data by day
            daily_data = {}
            for i in range(timeframe_days + 1):
                date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                daily_data[date] = {"starts": 0, "completions": 0}

            for start in onboarding_starts:
                date = datetime.fromisoformat(start['started_at'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
                if date in daily_data:
                    daily_data[date]["starts"] += 1
            
            for completion in onboarding_completions:
                date = datetime.fromisoformat(completion['completed_at'].replace('Z', '+00:00')).strftime('%Y-%m-%d')
                if date in daily_data:
                    daily_data[date]["completions"] += 1
            
            # 3. Format for the response
            daily_metrics = [
                {
                    "date": date,
                    "users_started": data["starts"],
                    "users_completed": data["completions"]
                }
                for date, data in daily_data.items()
            ]

            return {
                "timeframe": f"{timeframe_days}d",
                "daily_metrics": daily_metrics
            }

        except Exception as e:
            logger.error(f"Failed to calculate performance over time: {e}")
            return {
                "timeframe": f"{timeframe_days}d",
                "daily_metrics": []
            }

analytics_service = AnalyticsService()