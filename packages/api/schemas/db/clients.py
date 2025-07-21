from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from uuid import UUID

class ClientBase(BaseModel):
    name: str
    industry: str
    logo: Optional[str] = None
    influencers: int
    status: str
    join_date: datetime
    website: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    logo: Optional[str] = None
    influencers: Optional[int] = None
    status: Optional[str] = None
    join_date: Optional[datetime] = None
    website: Optional[str] = None
    primary_contact: Optional[str] = None
    contact_email: Optional[EmailStr] = None

class Client(ClientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
