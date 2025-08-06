from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, Literal

class UserSettingUpdate(BaseModel):
    """API model for updating user settings."""
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
    profile_visibility: Optional[Literal['public', 'private']] = None
    show_earnings: Optional[bool] = None
    show_referral_count: Optional[bool] = None
    webhook_url: Optional[str] = None
    webhook_events: Optional[Dict[str, Any]] = None
    theme: Optional[Literal['light', 'dark', 'system']] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    currency: Optional[str] = None
    two_factor_enabled: Optional[bool] = None
    login_notifications: Optional[bool] = None

class UserSetting(UserSettingUpdate):
    """API model for a user setting response."""
    id: int

class Role(BaseModel):
    id: int
    name: str
    description: str
    type: str

class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    provider: Optional[str] = None
    confirmed: Optional[bool] = False
    blocked: Optional[bool] = False
    role: Optional[Role] = None
    full_name: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str