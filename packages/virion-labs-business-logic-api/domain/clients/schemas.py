from pydantic import BaseModel, EmailStr
from typing import Optional

class ClientBase(BaseModel):
    """Base model for a client, containing all common fields."""
    name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    industry: Optional[str] = None
    client_status: Optional[str] = None
    website: Optional[str] = None
    primary_contact: Optional[str] = None

class Client(ClientBase):
    """Model representing a client within the service layer."""
    id: int
    documentId: str

class ClientCreate(ClientBase):
    """Model for creating a new client. Name is required."""
    name: str
    contact_email: EmailStr

class ClientUpdate(ClientBase):
    """
    Model for updating a client. All fields are optional.
    Inherits all fields from ClientBase, and none are required.
    """
    pass