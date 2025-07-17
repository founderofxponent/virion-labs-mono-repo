from supabase import Client
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import json

from schemas.analytics import (
    AnalyticsTrackRequest, 
    AnalyticsTrackResponse, 
    GuildAnalytics, 
    GuildAnalyticsResponse,
    CampaignAnalytics,
    UserJourney,
    UserJourneyStep
)

def track_analytics_event(db: Client, event_data: AnalyticsTrackRequest) -> AnalyticsTrackResponse:
    """
    Track an analytics event and store it in the appropriate tables.
    """
    try:
        event_id = uuid4()
        
        # Store in referral_analytics table for comprehensive tracking
        analytics_data = {
            "id": str(event_id),
            "event_type": event_data.event_type,
            "user_agent": event_data.user_agent,
            "ip_address": event_data.ip_address,
            "referrer": event_data.referrer,
            "country": event_data.country,
            "city": event_data.city,
            "device_type": event_data.device_type,
            "browser": event_data.browser,
            "conversion_value": event_data.conversion_value,
            "metadata": {
                "guild_id": event_data.guild_id,
                "user_id": event_data.user_id,
                "campaign_id": str(event_data.campaign_id) if event_data.campaign_id else None,
                "referral_link_id": str(event_data.referral_link_id) if event_data.referral_link_id else None,
                "interaction_type": event_data.interaction_type,
                "command_name": event_data.command_name,
                "onboarding_step": event_data.onboarding_step,
                "response_time_ms": event_data.response_time_ms,
                "sentiment_score": event_data.sentiment_score,
                **event_data.metadata
            },
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store main analytics event
        response = db.table("referral_analytics").insert(analytics_data).execute()
        
        # Store Discord-specific interaction if it's a bot interaction
        if event_data.guild_id and event_data.interaction_type:
            discord_interaction = {
                "guild_id": event_data.guild_id,
                "user_id": event_data.user_id,
                "campaign_id": str(event_data.campaign_id) if event_data.campaign_id else None,
                "interaction_type": event_data.interaction_type,
                "command_name": event_data.command_name,
                "onboarding_step": event_data.onboarding_step,
                "response_time_ms": event_data.response_time_ms,
                "sentiment_score": event_data.sentiment_score,
                "metadata": event_data.metadata,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Insert into discord_referral_interactions table
            db.table("discord_referral_interactions").insert(discord_interaction).execute()
        
        # Update campaign stats if campaign_id is provided
        if event_data.campaign_id:
            _update_campaign_analytics(db, event_data.campaign_id, event_data.event_type)
        
        return AnalyticsTrackResponse(
            success=True,
            message="Analytics event tracked successfully",
            event_id=event_id
        )
        
    except Exception as e:
        return AnalyticsTrackResponse(
            success=False,
            message=f"Failed to track analytics event: {str(e)}"
        )

def get_guild_analytics(db: Client, guild_id: str) -> GuildAnalyticsResponse:
    """
    Get comprehensive analytics for a specific guild.
    """
    try:
        # Get campaign analytics for this guild
        campaigns_response = db.table("discord_guild_campaigns").select("*").eq("guild_id", guild_id).execute()
        
        if not campaigns_response.data:
            return GuildAnalyticsResponse(
                guild_id=guild_id,
                analytics=GuildAnalytics(
                    guild_id=guild_id,
                    total_interactions=0,
                    successful_onboardings=0,
                    referral_conversions=0,
                    commands_used=0,
                    users_served=0,
                    active_campaigns=0,
                    top_commands=[],
                    conversion_rate=0.0,
                    engagement_metrics={}
                ),
                success=True,
                message="No campaigns found for this guild"
            )
        
        # Aggregate stats from all campaigns in this guild
        total_interactions = sum(campaign.get("total_interactions", 0) for campaign in campaigns_response.data)
        successful_onboardings = sum(campaign.get("successful_onboardings", 0) for campaign in campaigns_response.data)
        referral_conversions = sum(campaign.get("referral_conversions", 0) for campaign in campaigns_response.data)
        commands_used = sum(campaign.get("commands_used", 0) for campaign in campaigns_response.data)
        users_served = sum(campaign.get("users_served", 0) for campaign in campaigns_response.data)
        active_campaigns = len([c for c in campaigns_response.data if c.get("is_active", False)])
        
        # Get last activity timestamp
        last_activity = max((c.get("last_activity_at") for c in campaigns_response.data if c.get("last_activity_at")), default=None)
        
        # Calculate conversion rate
        conversion_rate = (successful_onboardings / total_interactions * 100) if total_interactions > 0 else 0.0
        
        # Get top commands from interactions
        top_commands = _get_top_commands(db, guild_id)
        
        # Get engagement metrics
        engagement_metrics = _get_engagement_metrics(db, guild_id)
        
        # Get time series data for the last 30 days
        time_series_data = _get_time_series_data(db, guild_id, days=30)
        
        analytics = GuildAnalytics(
            guild_id=guild_id,
            total_interactions=total_interactions,
            successful_onboardings=successful_onboardings,
            referral_conversions=referral_conversions,
            commands_used=commands_used,
            users_served=users_served,
            active_campaigns=active_campaigns,
            last_activity_at=datetime.fromisoformat(last_activity.replace('Z', '+00:00')) if last_activity else None,
            top_commands=top_commands,
            conversion_rate=conversion_rate,
            engagement_metrics=engagement_metrics,
            time_series_data=time_series_data
        )
        
        return GuildAnalyticsResponse(
            guild_id=guild_id,
            analytics=analytics,
            success=True,
            message="Guild analytics retrieved successfully"
        )
        
    except Exception as e:
        return GuildAnalyticsResponse(
            guild_id=guild_id,
            analytics=GuildAnalytics(
                guild_id=guild_id,
                total_interactions=0,
                successful_onboardings=0,
                referral_conversions=0,
                commands_used=0,
                users_served=0,
                active_campaigns=0,
                top_commands=[],
                conversion_rate=0.0,
                engagement_metrics={}
            ),
            success=False,
            message=f"Failed to get guild analytics: {str(e)}"
        )

def _update_campaign_analytics(db: Client, campaign_id: UUID, event_type: str):
    """
    Update campaign statistics based on the event type.
    """
    try:
        # Get current campaign stats
        campaign_response = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id).execute()
        
        if not campaign_response.data:
            return
            
        campaign = campaign_response.data[0]
        updates = {"updated_at": datetime.utcnow().isoformat()}
        
        # Update stats based on event type
        if event_type == "interaction":
            updates["total_interactions"] = campaign.get("total_interactions", 0) + 1
        elif event_type == "onboarding_complete":
            updates["successful_onboardings"] = campaign.get("successful_onboardings", 0) + 1
        elif event_type == "referral_conversion":
            updates["referral_conversions"] = campaign.get("referral_conversions", 0) + 1
        elif event_type == "command_used":
            updates["commands_used"] = campaign.get("commands_used", 0) + 1
        elif event_type == "user_served":
            updates["users_served"] = campaign.get("users_served", 0) + 1
        
        # Update last activity
        updates["last_activity_at"] = datetime.utcnow().isoformat()
        
        # Apply updates
        db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
        
    except Exception as e:
        print(f"Error updating campaign analytics: {e}")

def _get_top_commands(db: Client, guild_id: str) -> List[Dict[str, Any]]:
    """
    Get top commands used in a guild.
    """
    try:
        # Query discord_referral_interactions for command usage
        response = db.table("discord_referral_interactions").select("command_name").eq("guild_id", guild_id).execute()
        
        if not response.data:
            return []
        
        # Count command usage
        command_counts = {}
        for interaction in response.data:
            command = interaction.get("command_name")
            if command:
                command_counts[command] = command_counts.get(command, 0) + 1
        
        # Sort by usage and return top 10
        top_commands = sorted(command_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return [{"command": cmd, "usage_count": count} for cmd, count in top_commands]
        
    except Exception as e:
        print(f"Error getting top commands: {e}")
        return []

def _get_engagement_metrics(db: Client, guild_id: str) -> Dict[str, Any]:
    """
    Get engagement metrics for a guild.
    """
    try:
        # Query recent interactions
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        
        response = db.table("discord_referral_interactions").select("*").eq("guild_id", guild_id).gte("created_at", thirty_days_ago).execute()
        
        if not response.data:
            return {}
        
        # Calculate metrics
        total_interactions = len(response.data)
        avg_response_time = sum(i.get("response_time_ms", 0) for i in response.data) / total_interactions if total_interactions > 0 else 0
        avg_sentiment = sum(i.get("sentiment_score", 0) for i in response.data if i.get("sentiment_score")) / total_interactions if total_interactions > 0 else 0
        
        unique_users = len(set(i.get("user_id") for i in response.data if i.get("user_id")))
        
        return {
            "total_interactions_30d": total_interactions,
            "avg_response_time_ms": avg_response_time,
            "avg_sentiment_score": avg_sentiment,
            "unique_users_30d": unique_users,
            "engagement_rate": (total_interactions / unique_users) if unique_users > 0 else 0
        }
        
    except Exception as e:
        print(f"Error getting engagement metrics: {e}")
        return {}

def _get_time_series_data(db: Client, guild_id: str, days: int = 30) -> List[Dict[str, Any]]:
    """
    Get time series data for analytics dashboard.
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Query analytics data for the time period
        response = db.table("referral_analytics").select("*").gte("created_at", start_date.isoformat()).execute()
        
        if not response.data:
            return []
        
        # Filter for this guild
        guild_data = [d for d in response.data if d.get("metadata", {}).get("guild_id") == guild_id]
        
        # Group by date
        daily_data = {}
        for record in guild_data:
            date_str = record["created_at"][:10]  # Extract date part
            if date_str not in daily_data:
                daily_data[date_str] = {
                    "date": date_str,
                    "interactions": 0,
                    "onboardings": 0,
                    "conversions": 0
                }
            
            daily_data[date_str]["interactions"] += 1
            
            if record.get("event_type") == "onboarding_complete":
                daily_data[date_str]["onboardings"] += 1
            elif record.get("event_type") == "referral_conversion":
                daily_data[date_str]["conversions"] += 1
        
        # Sort by date and return
        return sorted(daily_data.values(), key=lambda x: x["date"])
        
    except Exception as e:
        print(f"Error getting time series data: {e}")
        return []