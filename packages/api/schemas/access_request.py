from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class AccessRequestCreate(BaseModel):
    discord_user_id: str
    discord_username: str
    discord_guild_id: str
    full_name: str
    email: EmailStr
    verified_role_id: str
    additional_data: Optional[Dict[str, Any]] = None