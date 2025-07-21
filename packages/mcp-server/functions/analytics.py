"""Analytics and reporting functions."""

import asyncio
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware
from server import token_context


async def get_campaign_analytics(params: dict) -> dict:
    """Retrieves the performance metrics for a specific campaign."""
    try:
        token = token_context.get()
        campaign_id = params["campaign_id"]
        result = await api_client._make_request("GET", f"/api/analytics/campaign/{campaign_id}", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting campaign analytics: {e}")
        return {"error": str(e)}


async def get_my_analytics(_params: dict) -> dict:
    """Retrieves the performance metrics for the current influencer."""
    try:
        token = token_context.get()
        result = await api_client._make_request("GET", "/api/analytics/my-analytics", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        return {"error": str(e)}


async def track_analytics_event(params: dict) -> dict:
    """Tracks an analytics event."""
    try:
        token = token_context.get()
        data = {
            "event_type": params["event_type"],
            "user_id": params.get("user_id"),
            "campaign_id": params.get("campaign_id"),
            "guild_id": params.get("guild_id"),
            "referral_code": params.get("referral_code"),
            "metadata": params.get("metadata", {})
        }
        
        result = await api_client._make_request("POST", "/api/analytics/track", data=data, token=token)
        return result
    except Exception as e:
        logger.error(f"Error tracking analytics event: {e}")
        return {"error": str(e)}


async def get_guild_analytics(params: dict) -> dict:
    """Gets analytics for a specific Discord guild."""
    try:
        token = token_context.get()
        guild_id = params["guild_id"]
        result = await api_client._make_request("GET", f"/api/analytics/guild/{guild_id}", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting guild analytics: {e}")
        return {"error": str(e)}


async def get_campaign_overview(_params: dict) -> dict:
    """Gets campaign overview analytics."""
    try:
        token = token_context.get()
        result = await api_client._make_request("GET", "/api/analytics/campaign-overview", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting campaign overview: {e}")
        return {"error": str(e)}


async def get_real_time_analytics(params: dict) -> dict:
    """Gets real-time analytics data."""
    try:
        token = token_context.get()
        time_range = params.get("time_range", "1h")
        campaign_id = params.get("campaign_id")
        
        query_params = [f"time_range={time_range}"]
        if campaign_id:
            query_params.append(f"campaign_id={campaign_id}")
        
        query_string = "&".join(query_params)
        result = await api_client._make_request("GET", f"/api/analytics/real-time?{query_string}", token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting real-time analytics: {e}")
        return {"error": str(e)}


async def get_user_journey_analytics(params: dict) -> dict:
    """Gets user journey analytics data."""
    try:
        token = token_context.get()
        user_id = params.get("user_id")
        campaign_id = params.get("campaign_id")
        
        query_params = []
        if user_id:
            query_params.append(f"user_id={user_id}")
        if campaign_id:
            query_params.append(f"campaign_id={campaign_id}")
        
        query_string = "&".join(query_params)
        endpoint = "/api/analytics/user-journey"
        if query_string:
            endpoint += f"?{query_string}"
        
        result = await api_client._make_request("GET", endpoint, token=token)
        return result
    except Exception as e:
        logger.error(f"Error getting user journey analytics: {e}")
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
            ),
            FunctionSpec(
                name="track_analytics_event",
                func=apply_middleware(track_analytics_event, [
                    validation_middleware(["event_type"])
                ]),
                category=self.category,
                description="Tracks an analytics event",
                schema={
                    "type": "object",
                    "properties": {
                        "event_type": {"type": "string", "description": "Type of analytics event"},
                        "user_id": {"type": "string", "description": "Optional user ID"},
                        "campaign_id": {"type": "string", "description": "Optional campaign UUID"},
                        "guild_id": {"type": "string", "description": "Optional Discord guild ID"},
                        "referral_code": {"type": "string", "description": "Optional referral code"},
                        "metadata": {"type": "object", "description": "Optional event metadata"}
                    },
                    "required": ["event_type"]
                }
            ),
            FunctionSpec(
                name="get_guild_analytics",
                func=apply_middleware(get_guild_analytics, [
                    validation_middleware(["guild_id"])
                ]),
                category=self.category,
                description="Gets analytics for a specific Discord guild",
                schema={
                    "type": "object",
                    "properties": {
                        "guild_id": {"type": "string", "description": "Discord guild ID"}
                    },
                    "required": ["guild_id"]
                }
            ),
            FunctionSpec(
                name="get_campaign_overview",
                func=apply_middleware(get_campaign_overview),
                category=self.category,
                description="Gets campaign overview analytics",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="get_real_time_analytics",
                func=apply_middleware(get_real_time_analytics),
                category=self.category,
                description="Gets real-time analytics data",
                schema={
                    "type": "object",
                    "properties": {
                        "time_range": {
                            "type": "string",
                            "description": "Time range for analytics",
                            "enum": ["5m", "15m", "1h", "6h", "24h"],
                            "default": "1h"
                        },
                        "campaign_id": {"type": "string", "description": "Optional campaign UUID"}
                    },
                    "description": "All parameters are optional"
                }
            ),
            FunctionSpec(
                name="get_user_journey_analytics",
                func=apply_middleware(get_user_journey_analytics),
                category=self.category,
                description="Gets user journey analytics data",
                schema={
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string", "description": "Optional user ID"},
                        "campaign_id": {"type": "string", "description": "Optional campaign UUID"}
                    },
                    "description": "All parameters are optional"
                }
            )
        ]


def get_plugin() -> AnalyticsPlugin:
    """Get the analytics plugin instance."""
    return AnalyticsPlugin()