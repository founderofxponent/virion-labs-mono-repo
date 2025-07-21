from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import analytics_service
from middleware.auth_middleware import AuthContext
from schemas.analytics import (
    AnalyticsTrackRequest,
    AnalyticsTrackResponse,
    GuildAnalyticsResponse,
    CampaignAnalytics,
    UserJourney
)

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"],
)

@router.post("/track", response_model=AnalyticsTrackResponse)
async def track_analytics(
    event_data: AnalyticsTrackRequest,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Track an analytics event. Supports both JWT and API key authentication.
    Critical endpoint for Discord bot interaction tracking.
    """
    try:
        auth_context: AuthContext = request.state.auth
        return analytics_service.track_analytics_event(db, event_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track analytics event: {e}")

@router.get("/guild/{guild_id}", response_model=GuildAnalyticsResponse)
async def get_guild_analytics(
    guild_id: str,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get comprehensive analytics for a specific guild.
    Critical endpoint for Discord bot analytics retrieval.
    """
    try:
        auth_context: AuthContext = request.state.auth
        return analytics_service.get_guild_analytics(db, guild_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve guild analytics: {e}")

@router.get("/campaign-overview")
async def get_campaign_overview(
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get campaign performance overview across all campaigns.
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        # Get all campaigns
        campaigns_response = db.table("discord_guild_campaigns").select("*").execute()
        
        if not campaigns_response.data:
            return {
                "total_campaigns": 0,
                "active_campaigns": 0,
                "total_interactions": 0,
                "total_onboardings": 0,
                "total_conversions": 0,
                "overall_conversion_rate": 0.0,
                "campaigns": []
            }
        
        campaigns = campaigns_response.data
        
        # Calculate overview metrics
        total_campaigns = len(campaigns)
        active_campaigns = len([c for c in campaigns if c.get("is_active", False)])
        total_interactions = sum(c.get("total_interactions", 0) for c in campaigns)
        total_onboardings = sum(c.get("successful_onboardings", 0) for c in campaigns)
        total_conversions = sum(c.get("referral_conversions", 0) for c in campaigns)
        overall_conversion_rate = (total_onboardings / total_interactions * 100) if total_interactions > 0 else 0.0
        
        # Build campaign summaries
        campaign_summaries = []
        for campaign in campaigns:
            campaign_interactions = campaign.get("total_interactions", 0)
            campaign_onboardings = campaign.get("successful_onboardings", 0)
            campaign_conversion_rate = (campaign_onboardings / campaign_interactions * 100) if campaign_interactions > 0 else 0.0
            
            campaign_summaries.append({
                "id": campaign["id"],
                "name": campaign.get("campaign_name", "Unknown"),
                "guild_id": campaign.get("guild_id"),
                "is_active": campaign.get("is_active", False),
                "total_interactions": campaign_interactions,
                "successful_onboardings": campaign_onboardings,
                "referral_conversions": campaign.get("referral_conversions", 0),
                "conversion_rate": campaign_conversion_rate,
                "last_activity_at": campaign.get("last_activity_at")
            })
        
        # Sort by interactions desc
        campaign_summaries.sort(key=lambda x: x["total_interactions"], reverse=True)
        
        return {
            "total_campaigns": total_campaigns,
            "active_campaigns": active_campaigns,
            "total_interactions": total_interactions,
            "total_onboardings": total_onboardings,
            "total_conversions": total_conversions,
            "overall_conversion_rate": overall_conversion_rate,
            "campaigns": campaign_summaries
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get campaign overview: {e}")

@router.get("/real-time")
async def get_real_time_analytics(
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get real-time activity data for the last hour.
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        from datetime import datetime, timedelta
        
        # Get recent activity (last hour)
        one_hour_ago = (datetime.utcnow() - timedelta(hours=1)).isoformat()
        
        # Query recent analytics events
        response = db.table("referral_analytics").select("*").gte("created_at", one_hour_ago).execute()
        
        if not response.data:
            return {
                "active_users": 0,
                "events_last_hour": 0,
                "top_guilds": [],
                "recent_events": []
            }
        
        events = response.data
        
        # Calculate real-time metrics
        active_users = len(set(event.get("metadata", {}).get("user_id") for event in events if event.get("metadata", {}).get("user_id")))
        events_last_hour = len(events)
        
        # Get top guilds by activity
        guild_activity = {}
        for event in events:
            guild_id = event.get("metadata", {}).get("guild_id")
            if guild_id:
                guild_activity[guild_id] = guild_activity.get(guild_id, 0) + 1
        
        top_guilds = sorted(guild_activity.items(), key=lambda x: x[1], reverse=True)[:10]
        top_guilds_list = [{"guild_id": guild_id, "activity_count": count} for guild_id, count in top_guilds]
        
        # Get recent events (last 10)
        recent_events = sorted(events, key=lambda x: x["created_at"], reverse=True)[:10]
        recent_events_list = [
            {
                "event_type": event["event_type"],
                "guild_id": event.get("metadata", {}).get("guild_id"),
                "user_id": event.get("metadata", {}).get("user_id"),
                "timestamp": event["created_at"],
                "interaction_type": event.get("metadata", {}).get("interaction_type")
            }
            for event in recent_events
        ]
        
        return {
            "active_users": active_users,
            "events_last_hour": events_last_hour,
            "top_guilds": top_guilds_list,
            "recent_events": recent_events_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get real-time analytics: {e}")

@router.get("/user-journey")
async def get_user_journey_analytics(
    request: Request,
    db: Client = Depends(get_db),
    guild_id: str = None,
    user_id: str = None
):
    """
    Get user journey analytics with optional filtering.
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        # Build query for user journey data
        query = db.table("discord_referral_interactions").select("*")
        
        if guild_id:
            query = query.eq("guild_id", guild_id)
        if user_id:
            query = query.eq("user_id", user_id)
        
        # Order by timestamp
        response = query.order("created_at", desc=True).limit(100).execute()
        
        if not response.data:
            return {
                "total_journeys": 0,
                "completed_journeys": 0,
                "avg_completion_time": 0,
                "common_paths": [],
                "drop_off_points": []
            }
        
        interactions = response.data
        
        # Group by user to create journeys
        user_journeys = {}
        for interaction in interactions:
            user_id = interaction.get("user_id")
            if not user_id:
                continue
                
            if user_id not in user_journeys:
                user_journeys[user_id] = []
            
            user_journeys[user_id].append({
                "step": interaction.get("onboarding_step", interaction.get("interaction_type", "unknown")),
                "timestamp": interaction["created_at"],
                "guild_id": interaction.get("guild_id"),
                "campaign_id": interaction.get("campaign_id")
            })
        
        # Analyze journeys
        total_journeys = len(user_journeys)
        completed_journeys = sum(1 for journey in user_journeys.values() if any("complete" in step.get("step", "") for step in journey))
        
        # Calculate common paths and drop-off points
        all_steps = []
        for journey in user_journeys.values():
            journey_steps = [step["step"] for step in sorted(journey, key=lambda x: x["timestamp"])]
            all_steps.extend(journey_steps)
        
        # Count step occurrences
        step_counts = {}
        for step in all_steps:
            step_counts[step] = step_counts.get(step, 0) + 1
        
        common_paths = sorted(step_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "total_journeys": total_journeys,
            "completed_journeys": completed_journeys,
            "completion_rate": (completed_journeys / total_journeys * 100) if total_journeys > 0 else 0,
            "avg_completion_time": 0,  # Would need more sophisticated calculation
            "common_paths": [{"step": step, "count": count} for step, count in common_paths],
            "drop_off_points": []  # Would need journey analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user journey analytics: {e}")