"""Analytics and reporting functions."""

from typing import List
from functions.base import supabase, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


def get_campaign_analytics(params: dict) -> dict:
    """Retrieves the performance metrics for a specific campaign."""
    try:
        campaign_id = params["campaign_id"]
        
        # Get clicks
        clicks_response = supabase.table("referral_analytics").select("id", count='exact').eq("event_type", "click").in_("link_id", supabase.table("referral_links").select("id").eq("campaign_id", campaign_id).execute().data).execute()
        clicks = clicks_response.count or 0

        # Get conversions
        conversions_response = supabase.table("campaign_onboarding_completions").select("id", count='exact').eq("campaign_id", campaign_id).execute()
        conversions = conversions_response.count or 0

        return {
            "campaign_id": campaign_id,
            "clicks": clicks,
            "conversions": conversions,
            "conversion_rate": f"{(conversions / clicks * 100):.2f}%" if clicks > 0 else "0.00%"
        }
    except Exception as e:
        logger.error(f"Error getting campaign analytics: {e}")
        return {"error": str(e)}


def get_my_analytics(_params: dict) -> dict:
    """Retrieves the performance metrics for the current influencer."""
    try:
        clicks_response = supabase.table("referral_analytics").select("id", count='exact').eq("event_type", "click").execute()
        clicks = clicks_response.count or 0

        conversions_response = supabase.table("campaign_onboarding_completions").select("id", count='exact').execute()
        conversions = conversions_response.count or 0

        return {
            "total_clicks": clicks,
            "total_conversions": conversions,
            "conversion_rate": f"{(conversions / clicks * 100):.2f}%" if clicks > 0 else "0.00%"
        }
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return {"error": str(e)}


class AnalyticsPlugin(PluginBase):
    """Plugin for analytics and reporting functions."""
    
    @property
    def category(self) -> str:
        return "analytics"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="get_campaign_analytics",
                func=apply_middleware(get_campaign_analytics, [
                    validation_middleware(["campaign_id"])
                ]),
                category=self.category,
                description="Gets campaign performance metrics",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"}
                    },
                    "required": ["campaign_id"]
                }
            ),
            FunctionSpec(
                name="get_my_analytics",
                func=apply_middleware(get_my_analytics),
                category=self.category,
                description="Gets influencer analytics",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            )
        ]


def get_plugin() -> AnalyticsPlugin:
    """Get the analytics plugin instance."""
    return AnalyticsPlugin()