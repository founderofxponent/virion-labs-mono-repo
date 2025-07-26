from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserSettings(BaseModel):
    id: int
    documentId: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    discord_username: Optional[str] = None
    website_url: Optional[str] = None
    email_notifications_new_referral: bool = True
    email_notifications_link_clicks: bool = False
    email_notifications_weekly_reports: bool = True
    email_notifications_product_updates: bool = True
    push_notifications_new_referral: bool = False
    push_notifications_link_clicks: bool = False
    push_notifications_weekly_reports: bool = False
    push_notifications_product_updates: bool = False
    profile_visibility: Optional[str] = None
    show_earnings: bool = False
    show_referral_count: bool = True
    webhook_url: Optional[str] = None
    webhook_events: Optional[List[str]] = None
    theme: str = "system"
    language: str = "en"
    timezone: str = "UTC"
    currency: str = "USD"
    two_factor_enabled: bool = False
    login_notifications: bool = True
    api_key: Optional[str] = None
    api_key_test: Optional[str] = None
    api_key_regenerated_at: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime
    publishedAt: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserSettingsUpdate(BaseModel):
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    discord_username: Optional[str] = None
    website_url: Optional[str] = None
    email_notifications_new_referral: Optional[bool] = None
    email_notifications_link_clicks: Optional[bool] = None
    email_notifications_weekly_reports: Optional[bool] = None
    email_notifications_product_updates: Optional[bool] = None
    push_notifications_new_referral: Optional[bool] = None
    push_notifications_link_clicks: Optional[bool] = None
    push_notifications_weekly_reports: Optional[bool] = None
    push_notifications_product_updates: Optional[bool] = None
    profile_visibility: Optional[str] = None
    show_earnings: Optional[bool] = None
    show_referral_count: Optional[bool] = None
    webhook_url: Optional[str] = None
    webhook_events: Optional[List[str]] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    two_factor_enabled: Optional[bool] = None
    login_notifications: Optional[bool] = None