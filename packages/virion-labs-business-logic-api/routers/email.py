from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Dict, Optional
import logging
from core.auth import get_api_key
from services.email_service import email_service
from services.template_service import template_service

logger = logging.getLogger(__name__)

router = APIRouter()

class SendTemplateEmailRequest(BaseModel):
    template_id: str
    to: EmailStr
    variables: Dict[str, str]
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None

class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    html: str
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None

@router.post("/api/v1/email/send-template")
async def send_template_email(
    request: SendTemplateEmailRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Send an email using a Strapi template with variable substitution.
    """
    try:
        logger.info(f"Sending template email: {request.template_id} to {request.to}")
        
        # Use the template email service
        from services.email_service import TemplateEmail
        
        template_email_data = TemplateEmail(
            to=request.to,
            template_id=request.template_id,
            variables=request.variables,
            from_email=request.from_email,
            from_name=request.from_name
        )
        
        await email_service.send_template_email(template_email_data)
        
        return {
            "success": True,
            "message": f"Template email sent successfully to {request.to}"
        }
        
    except Exception as e:
        logger.error(f"Failed to send template email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/api/v1/email/send")
async def send_email(
    request: SendEmailRequest,
    api_key: str = Depends(get_api_key)
):
    """
    Send a direct email with HTML content.
    """
    try:
        logger.info(f"Sending direct email to {request.to}")
        
        from services.email_service import Email
        
        email_data = Email(
            to=request.to,
            subject=request.subject,
            html=request.html,
            from_email=request.from_email,
            from_name=request.from_name
        )
        
        await email_service.send_email(email_data)
        
        return {
            "success": True,
            "message": f"Email sent successfully to {request.to}"
        }
        
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.get("/api/v1/email/templates")
async def list_email_templates(
    api_key: str = Depends(get_api_key)
):
    """
    List available email templates from Strapi.
    """
    try:
        templates = await template_service.list_templates()
        return {
            "success": True,
            "templates": templates
        }
    except Exception as e:
        logger.error(f"Failed to list email templates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list templates: {str(e)}")

@router.get("/api/v1/email/templates/{template_id}")
async def get_email_template(
    template_id: str,
    api_key: str = Depends(get_api_key)
):
    """
    Get a specific email template by ID.
    """
    try:
        template = await template_service.get_template(template_id)
        if not template:
            raise HTTPException(status_code=404, detail=f"Template {template_id} not found")
            
        return {
            "success": True,
            "template": template
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get email template: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get template: {str(e)}")