from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ClickTrackingRequest(BaseModel):
    """Request model for tracking clicks on referral links."""
    user_agent: Optional[str] = Field(None, description="User agent string from the browser")
    ip_address: Optional[str] = Field(None, description="IP address of the user")
    referrer: Optional[str] = Field(None, description="Referrer URL")
    country: Optional[str] = Field(None, description="User's country")
    city: Optional[str] = Field(None, description="User's city")
    device_type: Optional[str] = Field(None, description="Device type (mobile, desktop, tablet)")
    browser: Optional[str] = Field(None, description="Browser name")


class ConversionTrackingRequest(BaseModel):
    """Request model for tracking conversions on referral links."""
    conversion_value: Optional[float] = Field(0.0, description="Monetary value of the conversion")
    conversion_type: Optional[str] = Field("signup", description="Type of conversion (signup, purchase, etc.)")
    user_agent: Optional[str] = Field(None, description="User agent string from the browser")
    ip_address: Optional[str] = Field(None, description="IP address of the user")
    metadata: Optional[dict] = Field(None, description="Additional metadata about the conversion")


class TrackingResponse(BaseModel):
    """Response model for tracking operations."""
    success: bool = Field(description="Whether the tracking operation was successful")
    message: str = Field(description="Human-readable message about the operation")
    clicks: int = Field(description="Current total clicks for the referral link")
    conversions: int = Field(description="Current total conversions for the referral link")
    earnings: float = Field(description="Current total earnings for the referral link")


class ReferralStatsResponse(BaseModel):
    """Response model for referral link statistics."""
    referral_code: str = Field(description="The referral code")
    clicks: int = Field(description="Total clicks")
    conversions: int = Field(description="Total conversions")
    earnings: float = Field(description="Total earnings")
    conversion_rate: float = Field(description="Conversion rate as a percentage")
    last_click_at: Optional[datetime] = Field(None, description="Timestamp of last click")
    last_conversion_at: Optional[datetime] = Field(None, description="Timestamp of last conversion")
    created_at: Optional[datetime] = Field(None, description="When the referral link was created")
    is_active: bool = Field(description="Whether the referral link is active")