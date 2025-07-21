from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List
from uuid import UUID

class AnalyticsTrackRequest(BaseModel):
    event_type: str
    guild_id: Optional[str] = None
    user_id: Optional[str] = None
    campaign_id: Optional[UUID] = None
    referral_link_id: Optional[UUID] = None
    interaction_type: Optional[str] = None
    command_name: Optional[str] = None
    onboarding_step: Optional[str] = None
    response_time_ms: Optional[int] = None
    sentiment_score: Optional[float] = None
    conversion_value: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = {}
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    referrer: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None

class AnalyticsTrackResponse(BaseModel):
    success: bool
    message: str
    event_id: Optional[UUID] = None

class GuildAnalytics(BaseModel):
    guild_id: str
    total_interactions: int
    successful_onboardings: int
    referral_conversions: int
    commands_used: int
    users_served: int
    active_campaigns: int
    last_activity_at: Optional[datetime] = None
    top_commands: List[Dict[str, Any]]
    conversion_rate: float
    engagement_metrics: Dict[str, Any]
    time_series_data: Optional[List[Dict[str, Any]]] = None

class GuildAnalyticsResponse(BaseModel):
    guild_id: str
    analytics: GuildAnalytics
    success: bool
    message: str

class CampaignAnalytics(BaseModel):
    campaign_id: UUID
    total_interactions: int
    successful_onboardings: int
    referral_conversions: int
    commands_used: int
    users_served: int
    conversion_rate: float
    avg_response_time_ms: Optional[float] = None
    avg_sentiment_score: Optional[float] = None
    engagement_metrics: Dict[str, Any]
    last_activity_at: Optional[datetime] = None

class UserJourneyStep(BaseModel):
    step_name: str
    timestamp: datetime
    duration_ms: Optional[int] = None
    completed: bool
    metadata: Optional[Dict[str, Any]] = {}

class UserJourney(BaseModel):
    user_id: str
    guild_id: str
    campaign_id: Optional[UUID] = None
    journey_start: datetime
    journey_end: Optional[datetime] = None
    total_duration_ms: Optional[int] = None
    steps: List[UserJourneyStep]
    completed: bool
    conversion_achieved: bool