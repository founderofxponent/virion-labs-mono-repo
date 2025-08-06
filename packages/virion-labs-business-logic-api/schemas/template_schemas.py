from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class EmailTemplateBase(BaseModel):
    """Base schema for email template."""
    template_id: str = Field(..., description="Unique identifier for the template")
    subject: str = Field(..., description="Email subject template")
    body: Any = Field(..., description="Email body template (HTML)")
    description: Optional[str] = Field(None, description="Template description")
    is_active: Optional[bool] = Field(True, description="Whether the template is active")
    variables: Optional[List[str]] = Field(None, description="List of available template variables")

class EmailTemplateCreate(EmailTemplateBase):
    """Schema for creating email templates."""
    pass

class EmailTemplateUpdate(BaseModel):
    """Schema for updating email templates."""
    template_id: Optional[str] = Field(None, description="Unique identifier for the template")
    subject: Optional[str] = Field(None, description="Email subject template")
    body: Optional[str] = Field(None, description="Email body template (HTML)")
    description: Optional[str] = Field(None, description="Template description")
    is_active: Optional[bool] = Field(None, description="Whether the template is active")
    variables: Optional[List[str]] = Field(None, description="List of available template variables")

class EmailTemplateResponse(EmailTemplateBase):
    """Schema for email template responses."""
    id: int = Field(..., description="Template database ID")
    documentId: Optional[str] = Field(None, description="Strapi document ID")
    createdAt: Optional[str] = Field(None, description="Creation timestamp")
    updatedAt: Optional[str] = Field(None, description="Last update timestamp")
    publishedAt: Optional[str] = Field(None, description="Publication timestamp")

class TemplateRenderRequest(BaseModel):
    """Schema for template rendering requests."""
    template_id: str = Field(..., description="Template ID to render")
    variables: Dict[str, str] = Field(..., description="Variables to substitute in the template")

class TemplateRenderResponse(BaseModel):
    """Schema for template rendering responses."""
    subject: str = Field(..., description="Rendered email subject")
    body: str = Field(..., description="Rendered email body")

class EmailTemplatesListResponse(BaseModel):
    """Schema for templates list response."""
    templates: List[EmailTemplateResponse] = Field(..., description="List of email templates")
    total: Optional[int] = Field(None, description="Total number of templates")

class SendTestEmailRequest(BaseModel):
    """Schema for sending test emails."""
    template_id: str = Field(..., description="Template ID to use for the test email")
    to_email: str = Field(..., description="Recipient email address")
    variables: Dict[str, str] = Field(default_factory=dict, description="Variables to substitute in the template")

class SendTestEmailResponse(BaseModel):
    """Schema for test email send response."""
    message: str = Field(..., description="Success message")
    template_id: str = Field(..., description="Template ID used")
    recipient: str = Field(..., description="Recipient email address")