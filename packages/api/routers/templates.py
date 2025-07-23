from fastapi import APIRouter, Depends, HTTPException, Request, Query
from typing import List, Optional
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import template_service
from middleware.auth_middleware import AuthContext
from schemas.db.campaign_templates import (
    CampaignTemplate,
    CampaignTemplateCreate,
    CampaignTemplateUpdate
)
from schemas.api.template import (
    CampaignTemplateResponse,
    CampaignTemplateListResponse,
    CampaignTemplateWithLandingPage,
    CampaignTemplateWithLandingPageResponse,
    CampaignTemplateWithLandingPageListResponse,
    LandingPageTemplate,
    LandingPageTemplateListResponse,
    ApplyTemplateRequest,
    ApplyTemplateResponse,
    DefaultTemplatesResponse
)
from schemas.api.common import MessageResponse

router = APIRouter(
    prefix="/api",
    tags=["Templates"],
)

@router.get(
    "/campaign-templates", 
    response_model=CampaignTemplateListResponse, 
    operation_id="templates.list",
    summary="[Templates] Get a list of all campaign templates, optionally including their landing page data."
)
async def get_campaign_templates(
    request: Request,
    db: Client = Depends(get_db),
    include_landing_page: bool = Query(False, description="Include landing page template data")
):
    """
    List all campaign templates. 
    Critical endpoint for Discord bot template management.
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        if include_landing_page:
            result = template_service.get_campaign_templates(db, include_landing_page=True)
            if result.success:
                return CampaignTemplateWithLandingPageListResponse(
                    success=result.success,
                    message=result.message,
                    templates=result.templates,
                    total_count=result.total_count
                )
            else:
                raise HTTPException(status_code=500, detail=result.message)
        else:
            return template_service.get_campaign_templates(db, include_landing_page=False)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign templates: {e}")

@router.get(
    "/campaign-templates/{template_id}", 
    response_model=CampaignTemplateResponse, 
    operation_id="templates.get",
    summary="[Templates] Get a specific campaign template by its ID, optionally including its landing page data."
)
async def get_campaign_template(
    template_id: UUID,
    request: Request,
    db: Client = Depends(get_db),
    include_landing_page: bool = Query(False, description="Include landing page template data")
):
    """
    Get a specific campaign template by ID.
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        if include_landing_page:
            result = template_service.get_campaign_template_by_id(db, template_id, include_landing_page=True)
            if result.success:
                return CampaignTemplateWithLandingPageResponse(
                    success=result.success,
                    message=result.message,
                    template=result.template
                )
            else:
                raise HTTPException(status_code=404 if "not found" in result.message else 500, detail=result.message)
        else:
            result = template_service.get_campaign_template_by_id(db, template_id, include_landing_page=False)
            if not result.success:
                raise HTTPException(status_code=404 if "not found" in result.message else 500, detail=result.message)
            return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign template: {e}")

@router.post(
    "/campaign-templates", 
    response_model=CampaignTemplateResponse, 
    operation_id="templates.create",
    summary="[Templates] Create a new campaign template."
)
async def create_campaign_template(
    template_data: CampaignTemplateCreate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Create a new campaign template.
    """
    try:
        auth_context: AuthContext = request.state.auth
        result = template_service.create_campaign_template(db, template_data)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create campaign template: {e}")

@router.patch(
    "/campaign-templates/{template_id}", 
    response_model=CampaignTemplateResponse, 
    operation_id="templates.update",
    summary="[Templates] Update an existing campaign template."
)
async def update_campaign_template(
    template_id: UUID,
    template_data: CampaignTemplateUpdate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Update an existing campaign template.
    """
    try:
        auth_context: AuthContext = request.state.auth
        result = template_service.update_campaign_template(db, template_id, template_data)
        
        if not result.success:
            status_code = 404 if "not found" in result.message else 400
            raise HTTPException(status_code=status_code, detail=result.message)
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update campaign template: {e}")

@router.delete(
    "/campaign-templates/{template_id}", 
    response_model=MessageResponse, 
    operation_id="templates.delete",
    summary="[Templates] Delete a campaign template by its ID."
)
async def delete_campaign_template(
    template_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Delete a campaign template.
    """
    try:
        auth_context: AuthContext = request.state.auth
        result = template_service.delete_campaign_template(db, template_id)
        
        if not result.success:
            status_code = 404 if "not found" in result.message else 400
            raise HTTPException(status_code=status_code, detail=result.message)
        
        return MessageResponse(message="Campaign template deleted successfully")
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete campaign template: {e}")

@router.get(
    "/landing-page-templates", 
    response_model=LandingPageTemplateListResponse, 
    operation_id="templates.list_landing_pages",
    summary="[Templates] Get a list of all available landing page templates."
)
async def get_landing_page_templates(
    request: Request,
    db: Client = Depends(get_db)
):
    """
    List all landing page templates.
    """
    try:
        auth_context: AuthContext = request.state.auth
        return template_service.get_landing_page_templates(db)
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve landing page templates: {e}")

@router.post(
    "/campaign-onboarding-fields/apply-template", 
    response_model=ApplyTemplateResponse, 
    operation_id="templates.apply_to_campaign",
    summary="[Templates] Apply a campaign template's fields to a specific campaign."
)
async def apply_template_to_campaign(
    request_data: ApplyTemplateRequest,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Apply a campaign template to a specific campaign.
    Critical endpoint for Discord bot template application.
    """
    try:
        auth_context: AuthContext = request.state.auth
        result = template_service.apply_template_to_campaign(db, request_data)
        
        if not result.success:
            status_code = 404 if "not found" in result.message else 400
            raise HTTPException(status_code=status_code, detail=result.message)
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to apply template to campaign: {e}")

# Additional utility endpoints
@router.get(
    "/campaign-templates/by-category/{category}", 
    response_model=CampaignTemplateListResponse, 
    operation_id="templates.get_by_category",
    summary="[Templates] Get a list of campaign templates filtered by a specific category."
)
async def get_campaign_templates_by_category(
    category: str,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get campaign templates filtered by category.
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        response = db.table("campaign_templates").select("*").eq("category", category).order("created_at", desc=True).execute()
        
        if not response.data:
            return CampaignTemplateListResponse(
                success=True,
                message=f"No templates found for category: {category}",
                templates=[],
                total_count=0
            )
        
        templates = [CampaignTemplate.model_validate(template) for template in response.data]
        
        return CampaignTemplateListResponse(
            success=True,
            message=f"Templates for category {category} retrieved successfully",
            templates=templates,
            total_count=len(templates)
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve templates by category: {e}")

@router.get(
    "/campaign-templates/by-type/{campaign_type}", 
    response_model=CampaignTemplateResponse, 
    operation_id="templates.get_by_type",
    summary="[Templates] Get a specific campaign template by its campaign type identifier."
)
async def get_campaign_template_by_type(
    campaign_type: str,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get a campaign template by its campaign_type identifier.
    Useful for Discord bot when it knows the campaign type.
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        response = db.table("campaign_templates").select("*").eq("campaign_type", campaign_type).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Template not found for campaign type: {campaign_type}")
        
        template = CampaignTemplate.model_validate(response.data[0])
        
        return CampaignTemplateResponse(
            success=True,
            message="Template retrieved successfully",
            template=template
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve template by type: {e}")

@router.get(
    "/templates/default", 
    response_model=DefaultTemplatesResponse, 
    operation_id="templates.get_defaults",
    summary="[Templates] Get a list of all default campaign and landing page templates."
)
async def get_default_templates(
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get all default templates (both campaign and landing page).
    """
    try:
        auth_context: AuthContext = request.state.auth
        
        # Get default campaign templates
        campaign_response = db.table("campaign_templates").select("*").eq("is_default", True).execute()
        campaign_templates = [CampaignTemplate.model_validate(t) for t in campaign_response.data] if campaign_response.data else []
        
        # Get default landing page templates
        landing_response = db.table("landing_page_templates").select("*").eq("is_default", True).execute()
        landing_templates = [LandingPageTemplate.model_validate(t) for t in landing_response.data] if landing_response.data else []
        
        return DefaultTemplatesResponse(
            success=True,
            message="Default templates retrieved successfully",
            campaign_templates=campaign_templates,
            landing_page_templates=landing_templates
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve default templates: {e}")