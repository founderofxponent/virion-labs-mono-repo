from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List
from core.auth import get_current_user
from core.auth import StrapiUser as User
from services.template_service import template_service
from services.email_service import email_service
from schemas.template_schemas import (
    EmailTemplateCreate,
    EmailTemplateUpdate, 
    EmailTemplateResponse,
    EmailTemplatesListResponse,
    TemplateRenderRequest,
    TemplateRenderResponse,
    SendTestEmailRequest,
    SendTestEmailResponse
)
from schemas.strapi import StrapiEmailTemplateCreate, StrapiEmailTemplateUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def _check_admin_role(current_user: User):
    """Check if user has admin role."""
    if current_user.role['name'] != "Platform Administrator":
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: This endpoint is for administrators only."
        )

@router.get("/", response_model=EmailTemplatesListResponse, summary="List Email Templates")
async def list_templates(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    template_id: Optional[str] = Query(None, description="Filter by template ID"),
    current_user: User = Depends(get_current_user)
):
    """
    List all email templates. Admin access required.
    """
    try:
        _check_admin_role(current_user)
        
        # Build filters
        filters = {}
        if is_active is not None:
            filters["filters[is_active][$eq]"] = is_active
        if template_id:
            filters["filters[template_id][$eq]"] = template_id
            
        templates = await template_service.get_templates(filters=filters if filters else None)
        
        # Convert to response format
        template_responses = [
            EmailTemplateResponse(
                id=template.id,
                documentId=template.documentId,
                template_id=template.template_id,
                subject=template.subject,
                body=template.body,
                description=template.description,
                is_active=template.is_active,
                variables=template.variables,
                createdAt=template.createdAt,
                updatedAt=template.updatedAt,
                publishedAt=template.publishedAt
            )
            for template in templates
        ]
        
        return EmailTemplatesListResponse(templates=template_responses, total=len(template_responses))
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list templates: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching templates.")

@router.post("/", response_model=EmailTemplateResponse, summary="Create Email Template")
async def create_template(
    template_data: EmailTemplateCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Create a new email template. Admin access required.
    """
    try:
        _check_admin_role(current_user)
        
        # Check if template_id already exists
        existing_templates = await template_service.get_templates(
            filters={"filters[template_id][$eq]": template_data.template_id}
        )
        if existing_templates:
            raise HTTPException(
                status_code=400,
                detail=f"Template with template_id '{template_data.template_id}' already exists"
            )
        
        # Create template
        strapi_data = StrapiEmailTemplateCreate(**template_data.model_dump())
        created_template = await template_service.create_template(strapi_data)
        
        return EmailTemplateResponse(
            id=created_template.id,
            documentId=created_template.documentId,
            template_id=created_template.template_id,
            subject=created_template.subject,
            body=created_template.body,
            description=created_template.description,
            is_active=created_template.is_active,
            variables=created_template.variables,
            createdAt=created_template.createdAt,
            updatedAt=created_template.updatedAt,
            publishedAt=created_template.publishedAt
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while creating the template.")

@router.get("/{template_id}", response_model=EmailTemplateResponse, summary="Get Email Template")
async def get_template_by_id(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific email template by template_id. Admin access required.
    """
    try:
        _check_admin_role(current_user)
        
        template = await template_service.get_template_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail=f"Template with template_id '{template_id}' not found")
            
        return EmailTemplateResponse(
            id=template.id,
            documentId=template.documentId,
            template_id=template.template_id,
            subject=template.subject,
            body=template.body,
            description=template.description,
            is_active=template.is_active,
            variables=template.variables,
            createdAt=template.createdAt,
            updatedAt=template.updatedAt,
            publishedAt=template.publishedAt
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching the template.")

@router.put("/{document_id}", response_model=EmailTemplateResponse, summary="Update Email Template")
async def update_template(
    document_id: str,
    template_data: EmailTemplateUpdate,
    current_user: User = Depends(get_current_user)
):
    """
    Update an email template by document ID. Admin access required.
    """
    try:
        _check_admin_role(current_user)
        
        # Check if template_id is being changed and if it conflicts
        if template_data.template_id:
            existing_templates = await template_service.get_templates(
                filters={"filters[template_id][$eq]": template_data.template_id}
            )
            # Check if any existing template has the same template_id but different document_id
            for existing in existing_templates:
                if existing.documentId != document_id:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Template with template_id '{template_data.template_id}' already exists"
                    )
        
        strapi_data = StrapiEmailTemplateUpdate(**template_data.model_dump(exclude_unset=True))
        updated_template = await template_service.update_template(document_id, strapi_data)
        
        return EmailTemplateResponse(
            id=updated_template.id,
            documentId=updated_template.documentId,
            template_id=updated_template.template_id,
            subject=updated_template.subject,
            body=updated_template.body,
            description=updated_template.description,
            is_active=updated_template.is_active,
            variables=updated_template.variables,
            createdAt=updated_template.createdAt,
            updatedAt=updated_template.updatedAt,
            publishedAt=updated_template.publishedAt
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while updating the template.")

@router.delete("/{document_id}", summary="Delete Email Template")
async def delete_template(
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Delete an email template by document ID. Admin access required.
    """
    try:
        _check_admin_role(current_user)
        
        await template_service.delete_template(document_id)
        return {"message": "Template deleted successfully", "documentId": document_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while deleting the template.")

@router.post("/render", response_model=TemplateRenderResponse, summary="Render Email Template")
async def render_template(
    render_request: TemplateRenderRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Render an email template with variables. Admin access required.
    """
    try:
        _check_admin_role(current_user)
        
        rendered = await template_service.render_template(
            render_request.template_id, 
            render_request.variables
        )
        
        return TemplateRenderResponse(
            subject=rendered["subject"],
            body=rendered["body"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to render template: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while rendering the template.")

@router.post("/send-test", response_model=SendTestEmailResponse, summary="Send Test Email")
async def send_test_email(
    test_request: SendTestEmailRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Send a test email using a template. Admin access required.
    """
    try:
        _check_admin_role(current_user)
        
        # Verify template exists
        template = await template_service.get_template_by_id(test_request.template_id)
        if not template:
            raise HTTPException(
                status_code=404, 
                detail=f"Template with template_id '{test_request.template_id}' not found"
            )
        
        # Render the template
        rendered = await template_service.render_template(
            test_request.template_id, 
            test_request.variables
        )
        
        # Send the test email using the email service
        from services.email_service import TemplateEmail
        template_email = TemplateEmail(
            to=test_request.to_email,
            template_id=test_request.template_id,
            variables=test_request.variables
        )
        
        await email_service.send_template_email(template_email)
        
        return SendTestEmailResponse(
            message="Test email sent successfully",
            template_id=test_request.template_id,
            recipient=test_request.to_email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to send test email: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while sending the test email.")