from core.strapi_client import strapi_client
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service layer for analytics operations."""

    async def get_comprehensive_dashboard(self, current_user) -> Dict[str, Any]:
        """
        Provides a comprehensive overview of platform analytics, tailored to the user's role.
        """
        # Fetch all campaigns and clients
        all_campaigns = await strapi_client.get_campaigns()
        all_clients = await strapi_client.get_clients()

        # Calculate overview metrics
        total_campaigns = len(all_campaigns)
        active_campaigns = len([c for c in all_campaigns if c.is_active])
        total_clients = len(all_clients)
        active_clients = len([c for c in all_clients if c.client_status == 'active'])

        # Calculate onboarding metrics
        total_starts = 0
        total_completions = 0
        for campaign in all_campaigns:
            funnel_analytics = await self.get_onboarding_funnel_analytics(campaign.id)
            total_starts += funnel_analytics['total_starts']
            total_completions += funnel_analytics['total_completions']

        if total_starts > 0:
            overall_completion_rate = (total_completions / total_starts) * 100
        else:
            overall_completion_rate = 0

        overview = {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_onboarding_starts": total_starts,
            "total_onboarding_completions": total_completions,
            "overall_completion_rate": round(overall_completion_rate, 2),
            "total_clients": total_clients,
            "active_clients": active_clients,
        }

        # Format campaign analytics
        campaigns_analytics = []
        for campaign in all_campaigns:
            funnel_analytics = await self.get_onboarding_funnel_analytics(campaign.id)
            campaigns_analytics.append({
                "id": campaign.id,
                "name": campaign.name,
                "total_starts": funnel_analytics['total_starts'],
                "total_completions": funnel_analytics['total_completions'],
                "completion_rate": funnel_analytics['completion_rate'],
                "client_name": campaign.client.name if campaign.client else "N/A",
            })

        return {
            "overview": overview,
            "campaigns": campaigns_analytics
        }

    async def get_onboarding_funnel_analytics(self, campaign_id: str) -> Dict[str, Any]:
        """
        Calculates the onboarding funnel analytics for a specific campaign.
        """
        try:
            logger.info(f"Calculating onboarding funnel analytics for campaign {campaign_id}")

            # 1. Get total starts
            start_filters = {"filters[campaign][id][$eq]": campaign_id}
            onboarding_starts = await strapi_client.get_onboarding_starts(start_filters)
            total_starts = len(onboarding_starts)

            # 2. Get total completions
            completion_filters = {"filters[campaign][id][$eq]": campaign_id}
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
                if start.started_at:
                    date = start.started_at.strftime('%Y-%m-%d')
                    if date in daily_data:
                        daily_data[date]["starts"] += 1
            
            for completion in onboarding_completions:
                if completion.completed_at:
                    date = completion.completed_at.strftime('%Y-%m-%d')
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

    async def get_performance_report(self, current_user, timeframe: str) -> Dict[str, Any]:
        """
        Provides a daily breakdown of key performance metrics.
        """
        timeframe_days = int(timeframe.replace('d', ''))
        return await self.get_performance_over_time(timeframe_days)

    async def get_influencer_specific_metrics(self, current_user) -> Dict[str, Any]:
        """
        Provides key metrics for a specific influencer.
        """
        return await self.get_influencer_metrics(current_user.id)

    async def get_roi_analytics(self) -> Dict[str, Any]:
        """
        Calculates the ROI for all campaigns.
        """
        try:
            logger.info("Calculating ROI analytics for all campaigns")

            # 1. Fetch all campaigns
            all_campaigns = await strapi_client.get_campaigns()

            # 2. Aggregate the metrics
            total_investment = sum(getattr(campaign, 'total_investment', 0) for campaign in all_campaigns)
            total_return = sum(
                getattr(campaign, 'successful_onboardings', 0) * getattr(campaign, 'value_per_conversion', 0)
                for campaign in all_campaigns
            )

            if total_investment > 0:
                roi_percentage = ((total_return - total_investment) / total_investment) * 100
            else:
                roi_percentage = 0

            # 3. Format for the response
            analytics_data = {
                "total_investment": total_investment,
                "total_return": total_return,
                "roi_percentage": round(roi_percentage, 2),
                "campaigns_roi": [
                    {
                        "campaign_id": campaign.id,
                        "name": getattr(campaign, 'name', ''),
                        "investment": getattr(campaign, 'total_investment', 0),
                        "return": getattr(campaign, 'successful_onboardings', 0) * getattr(campaign, 'value_per_conversion', 0),
                        "roi":
                            ((getattr(campaign, 'successful_onboardings', 0) * getattr(campaign, 'value_per_conversion', 0) - getattr(campaign, 'total_investment', 0)) / getattr(campaign, 'total_investment', 0)) * 100
                            if getattr(campaign, 'total_investment', 0) > 0 else 0
                    }
                    for campaign in all_campaigns
                ]
            }

            return analytics_data

        except Exception as e:
            logger.error(f"Failed to calculate ROI analytics: {e}")
            return {
                "total_investment": 0,
                "total_return": 0,
                "roi_percentage": 0,
                "campaigns_roi": []
            }

analytics_service = AnalyticsService()