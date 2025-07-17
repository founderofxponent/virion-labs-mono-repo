from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class ClientBase(BaseModel):
    name: str
    industry: str
    logo: Optional[str] = None
    website: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class Client(ClientBase):
    id: UUID
    influencers: Optional[int] = 0
    status: str = "Active"
    join_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True