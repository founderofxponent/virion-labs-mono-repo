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

    async def get_influencer_metrics(self, user_id: int) -> Dict[str, Any]:
        """
        Calculates the performance metrics for a specific influencer.
        """
        try:
            logger.info(f"Calculating influencer metrics for user {user_id}")

            # 1. Fetch all referral links for the user
            link_filters = {"filters[influencer][id][$eq]": user_id}
            referral_links = await strapi_client.get_referral_links(link_filters)

            # 2. Aggregate the metrics
            total_links = len(referral_links)
            active_links = len([link for link in referral_links if link.get('is_active')])
            total_clicks = sum(link.get('clicks', 0) for link in referral_links)
            total_conversions = sum(link.get('conversions', 0) for link in referral_links)
            total_earnings = sum(link.get('earnings', 0) for link in referral_links)

            if total_clicks > 0:
                overall_conversion_rate = (total_conversions / total_clicks) * 100
            else:
                overall_conversion_rate = 0

            # 3. Format for the response
            metrics = {
                "total_links": total_links,
                "active_links": active_links,
                "total_clicks": total_clicks,
                "total_conversions": total_conversions,
                "total_earnings": total_earnings,
                "overall_conversion_rate": round(overall_conversion_rate, 2),
                "links": [
                    {
                        "id": link.get('id'),
                        "title": link.get('title'),
                        "platform": link.get('platform'),
                        "clicks": link.get('clicks', 0),
                        "conversions": link.get('conversions', 0),
                        "earnings": link.get('earnings', 0),
                        "conversion_rate": link.get('conversion_rate', 0),
                        "referral_url": link.get('referral_url'),
                        "original_url": link.get('original_url'),
                        "thumbnail_url": link.get('thumbnail_url'),
                        "is_active": link.get('is_active'),
                        "created_at": link.get('createdAt'),
                        "expires_at": link.get('expires_at'),
                        "description": link.get('description'),
                        "referral_code": link.get('referral_code'),
                        "campaign_context": {
                            "campaign_name": link.get('campaign', {}).get('name') if link.get('campaign') else None,
                            "client_name": link.get('campaign', {}).get('client', {}).get('name') if link.get('campaign') and link.get('campaign').get('client') else None
                        }
                    }
                    for link in referral_links
                ]
            }

            return metrics

        except Exception as e:
            logger.error(f"Failed to calculate influencer metrics for user {user_id}: {e}")
            return {
                "total_links": 0,
                "active_links": 0,
                "total_clicks": 0,
                "total_conversions": 0,
                "total_earnings": 0,
                "overall_conversion_rate": 0,
                "links": []
            }

analytics_service = AnalyticsService()