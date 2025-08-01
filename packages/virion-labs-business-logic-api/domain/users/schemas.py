from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any, List, Literal
from datetime import datetime

class UserSettingBase(BaseModel):
    """Base model for user settings."""
    bio: Optional[str] = None
    phone_number: Optional[str] = None
    twitter_handle: Optional[str] = None
    instagram_handle: Optional[str] = None
    youtube_channel: Optional[str] = None
    discord_username: Optional[str] = None
    website_url: Optional[str] = None
    email_notifications_new_referral: Optional[bool] = True
    email_notifications_link_clicks: Optional[bool] = False
    email_notifications_weekly_reports: Optional[bool] = True
    email_notifications_product_updates: Optional[bool] = True
    push_notifications_new_referral: Optional[bool] = False
    push_notifications_link_clicks: Optional[bool] = False
    push_notifications_weekly_reports: Optional[bool] = False
    push_notifications_product_updates: Optional[bool] = False
    profile_visibility: Optional[Literal['public', 'private']] = 'public'
    show_earnings: Optional[bool] = False
    show_referral_count: Optional[bool] = True
    webhook_url: Optional[str] = None
    webhook_events: Optional[Dict[str, Any]] = None
    theme: Optional[Literal['light', 'dark', 'system']] = 'system'
    language: Optional[str] = 'en'
    timezone: Optional[str] = 'UTC'
    currency: Optional[str] = 'USD'
    two_factor_enabled: Optional[bool] = False
    login_notifications: Optional[bool] = True

class UserSettingCreate(UserSettingBase):
    """Model for creating new user settings."""
    user: int # Expects the numeric ID of the user

class UserSettingUpdate(UserSettingBase):
    """Model for updating user settings. All fields are optional."""
    pass

class UserSettingResponse(UserSettingBase):
    """Model for a user setting response."""
    id: int

class UserBase(BaseModel):
    """Base model for a user."""
    username: str
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    """Model for creating a new user."""
    password: str # Required for creation
    confirmed: bool = True
    blocked: bool = False
    role: int # Expects the numeric ID of the role

class UserUpdate(BaseModel):
    """Model for updating a user. All fields are optional."""
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    blocked: Optional[bool] = None

class UserResponse(UserBase):
    """Model for a user response."""
    id: int
    provider: Optional[str] = None
    confirmed: Optional[bool] = False
    blocked: Optional[bool] = False
    settings: Optional[UserSettingResponse] = None