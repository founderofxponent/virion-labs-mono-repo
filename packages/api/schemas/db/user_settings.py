from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class UserSettingBase(BaseModel):
    user_id: UUID
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    discord_username: Optional[str] = None
    website_url: Optional[str] = None
    email_notifications_new_referral: int
    email_notifications_link_clicks: int
    email_notifications_weekly_reports: int
    email_notifications_product_updates: int
    push_notifications_new_referral: int
    push_notifications_link_clicks: int
    push_notifications_weekly_reports: int
    push_notifications_product_updates: int
    profile_visibility: str
    show_earnings: int
    show_referral_count: int
    webhook_url: Optional[str] = None
    webhook_events: list
    api_key_regenerated_at: Optional[str] = None
    theme: str
    language: str
    timezone: str
    currency: str
    two_factor_enabled: int
    login_notifications: int
    api_key: Optional[str] = None
    api_key_test: Optional[str] = None

class UserSettingCreate(UserSettingBase):
    pass

class UserSettingUpdate(BaseModel):
    user_id: Optional[UUID] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    discord_username: Optional[str] = None
    website_url: Optional[str] = None
    email_notifications_new_referral: Optional[int] = None
    email_notifications_link_clicks: Optional[int] = None
    email_notifications_weekly_reports: Optional[int] = None
    email_notifications_product_updates: Optional[int] = None
    push_notifications_new_referral: Optional[int] = None
    push_notifications_link_clicks: Optional[int] = None
    push_notifications_weekly_reports: Optional[int] = None
    push_notifications_product_updates: Optional[int] = None
    profile_visibility: Optional[str] = None
    show_earnings: Optional[int] = None
    show_referral_count: Optional[int] = None
    webhook_url: Optional[str] = None
    webhook_events: Optional[list] = None
    api_key_regenerated_at: Optional[str] = None
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    two_factor_enabled: Optional[int] = None
    login_notifications: Optional[int] = None
    api_key: Optional[str] = None
    api_key_test: Optional[str] = None

class UserSetting(UserSettingBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
