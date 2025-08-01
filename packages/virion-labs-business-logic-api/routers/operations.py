from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional, List
from services.client_service import client_service
from services.campaign_service import campaign_service
from services.campaign_template_service import campaign_template_service
from services.landing_page_template_service import landing_page_template_service
from services.referral_service import referral_service
from schemas.operation_schemas import (
    ClientCreateRequest, ClientResponse,
    ClientListResponse, ClientUpdateRequest,
    CampaignListResponse, CampaignUpdateRequest, CampaignCreateRequest, CampaignResponse,
    CampaignLandingPageCreateRequest, CampaignLandingPageUpdateRequest, CampaignLandingPageResponse,
    LandingPageTemplateListResponse, LandingPageTemplateResponse,
    LandingPageTemplateCreateRequest, LandingPageTemplateUpdateRequest,
    OnboardingFieldsBatchUpdateRequest,
    OnboardingFieldCreateRequest,
    OnboardingFieldUpdateRequest,
    OnboardingFieldResponse,
    OnboardingFieldListResponse,
    ReferralCreateRequest,
    ReferralResponse,
    ReferralListResponse,
)
from domain.campaigns.schemas import (
    CampaignLandingPageCreate, CampaignLandingPageUpdate,
    CampaignOnboardingFieldCreate,
    CampaignOnboardingFieldUpdate,
    CampaignCreate, CampaignUpdate
)
from domain.clients.schemas import ClientCreate, ClientUpdate
from domain.landing_page_templates.schemas import LandingPageTemplateCreate, LandingPageTemplateUpdate
from domain.referrals.schemas import ReferralCreate
from core.auth import get_current_user
from core.auth import StrapiUser as User
from core.strapi_client import strapi_client
import logging
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

router = APIRouter()

# Client Operations
@router.post("/client/create", response_model=ClientResponse, status_code=201)
async def create_client_operation(request: ClientCreateRequest, current_user: User = Depends(get_current_user)):
    """Creates a new client."""
    try:
        client_data = ClientCreate(**request.model_dump())
        created_client = await client_service.create_client_operation(client_data, current_user)
        return created_client
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Client creation operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/list", response_model=ClientListResponse)
async def list_clients_operation(
    industry: Optional[str] = None,
    tier: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Lists all clients with optional filters."""
    try:
        filters = {}
        if industry:
            filters["filters[industry][$eq]"] = industry
        if tier:
            filters["filters[budget_tier][$eq]"] = tier
        if status:
            filters["filters[status][$eq]"] = status
            
        result = await client_service.list_clients_operation(filters=filters, current_user=current_user)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Client list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/get/{client_id}", response_model=ClientResponse)
async def get_client_operation(client_id: str, current_user: User = Depends(get_current_user)):
    """Gets a single client by its documentId."""
    try:
        client = await client_service.get_client_operation(client_id, current_user)
        return client
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get client operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/client/update/{client_id}", response_model=ClientResponse)
async def update_client_operation(client_id: str, request: ClientUpdateRequest, current_user: User = Depends(get_current_user)):
    """Updates a client."""
    try:
        update_data = ClientUpdate(**request.model_dump(exclude_unset=True))
        updated_client = await client_service.update_client_operation(
            document_id=client_id,
            updates=update_data,
            current_user=current_user
        )
        return updated_client
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Client update operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/client/delete/{client_id}", status_code=200)
async def delete_client_operation(client_id: str, current_user: User = Depends(get_current_user)):
    """Deletes a client (soft delete)."""
    try:
        result = await client_service.delete_client_operation(
            document_id=client_id,
            current_user=current_user
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Client delete operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/client/archive/{client_id}")
async def archive_client_operation(client_id: int):
    """Business operation for archiving client with cleanup."""
    try:
        result = await client_service.archive_client_operation(client_id)
        return result
        
    except Exception as e:
        logger.error(f"Client archive operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Campaign Operations
@router.get("/campaign/list", response_model=CampaignListResponse)
async def list_campaigns_operation(
    client_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Lists all campaigns with optional filters."""
    try:
        filters = {
            "pagination[page]": page,
            "pagination[pageSize]": limit
        }
        if client_id:
            filters["filters[client.documentId][$eq]"] = client_id
        if status:
            filters["filters[status][$eq]"] = status

        campaigns = await campaign_service.list_campaigns_operation(filters)
        total_count = len(campaigns) # This might need a more sophisticated count in the future

        return CampaignListResponse(
            campaigns=campaigns,
            total_count=total_count,
            page=page,
            limit=limit
        )
    except Exception as e:
        logger.error(f"Campaign list operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaign/create", response_model=CampaignResponse, status_code=201)
async def create_campaign_operation(request: CampaignCreateRequest, current_user: User = Depends(get_current_user)):
    """Creates a new campaign."""
    try:
        campaign_data = CampaignCreate(**request.model_dump())
        created_campaign = await campaign_service.create_campaign_operation(campaign_data)
        return created_campaign
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Campaign creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/get/{campaign_id}", response_model=CampaignResponse)
async def get_campaign_operation(campaign_id: str, current_user: User = Depends(get_current_user)):
    """Gets a single campaign by its documentId."""
    try:
        campaign = await campaign_service.get_campaign_operation(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return campaign
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get campaign operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/update/{campaign_id}", response_model=CampaignResponse)
async def update_campaign_operation(campaign_id: str, request: CampaignUpdateRequest, current_user: User = Depends(get_current_user)):
    """Updates a campaign."""
    try:
        update_data = CampaignUpdate(**request.model_dump(exclude_unset=True))
        updated_campaign = await campaign_service.update_campaign_operation(
            document_id=campaign_id,
            campaign_data=update_data
        )
        return updated_campaign
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Campaign update operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/campaign/delete/{campaign_id}", status_code=200)
async def delete_campaign_operation(campaign_id: str, current_user: User = Depends(get_current_user)):
    """Deletes a campaign."""
    try:
        result = await campaign_service.delete_campaign_operation(document_id=campaign_id)
        return result
    except Exception as e:
        logger.error(f"Campaign delete operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/{campaign_id}/landing-page", summary="Get Campaign Landing Page", response_model=CampaignLandingPageResponse)
async def get_campaign_landing_page_operation(campaign_id: str):
    """
    Business operation for getting the landing page for a specific campaign.
    """
    try:
        result = await campaign_service.get_landing_page_operation(campaign_id=campaign_id)
        if not result:
            raise HTTPException(status_code=404, detail="Landing page not found")
        return result
        
    except Exception as e:
        logger.error(f"Campaign landing page operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaign/landing-pages", summary="Create a Campaign Landing Page", response_model=CampaignLandingPageResponse)
async def create_campaign_landing_page_operation(request: CampaignLandingPageCreateRequest):
    """
    Business operation for creating a new landing page for a specific campaign.
    """
    try:
        page_data = CampaignLandingPageCreate(**request.model_dump())
        result = await campaign_service.create_landing_page_operation(page_data)
        return result
        
    except Exception as e:
        logger.error(f"Create campaign landing page operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/landing-pages/{page_id}", summary="Update a Campaign Landing Page")
async def update_campaign_landing_page_operation(page_id: str, request: CampaignLandingPageUpdateRequest):
    """
    Business operation for updating a landing page.
    """
    try:
        logger.info(f"ROUTER: Received request to update landing page {page_id}")
        
        # Map the API model to the service-layer model
        page_data = CampaignLandingPageUpdate(**request.model_dump(exclude_unset=True))
        
        result = await campaign_service.update_landing_page_operation(page_id=page_id, page_data=page_data)
        return result
        
    except Exception as e:
        logger.error(f"Update campaign landing page operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/campaign/landing-pages/{page_id}", summary="Delete a Campaign Landing Page")
async def delete_campaign_landing_page_operation(page_id: str):
    """
    Business operation for deleting a landing page.
    """
    try:
        result = await campaign_service.delete_landing_page_operation(page_id=page_id)
        return result
        
    except Exception as e:
        logger.error(f"Delete campaign landing page operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Campaign Onboarding Fields CRUD ---

@router.post("/campaign/onboarding-fields", summary="Create Campaign Onboarding Field", response_model=OnboardingFieldResponse)
async def create_campaign_onboarding_field_operation(request: OnboardingFieldCreateRequest):
    """Creates a new onboarding field for a campaign."""
    try:
        service_data = CampaignOnboardingFieldCreate(**request.model_dump())
        result = await campaign_service.create_onboarding_field_operation(field_data=service_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Create campaign onboarding field operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/{campaign_id}/onboarding-fields", summary="List Campaign Onboarding Fields", response_model=OnboardingFieldListResponse)
async def list_campaign_onboarding_fields_operation(campaign_id: str):
    """Lists all onboarding fields for a specific campaign."""
    try:
        fields = await campaign_service.get_onboarding_fields_operation(campaign_id=campaign_id)
        return {"onboarding_fields": fields, "total_count": len(fields)}
    except Exception as e:
        logger.error(f"List campaign onboarding fields operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/onboarding-fields/{field_id}", summary="Get Campaign Onboarding Field", response_model=OnboardingFieldResponse)
async def get_campaign_onboarding_field_operation(field_id: str):
    """Gets a single onboarding field by its ID or documentId."""
    try:
        result = await campaign_service.get_onboarding_field_operation(field_id=field_id)
        if not result:
            raise HTTPException(status_code=404, detail="Onboarding field not found")
        
        # Manually construct the response to ensure validators are applied
        response_data = result.model_dump()
        return OnboardingFieldResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get campaign onboarding field operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/onboarding-fields/{field_id}", summary="Update Campaign Onboarding Field", response_model=OnboardingFieldResponse)
async def update_campaign_onboarding_field_operation(field_id: int, request: OnboardingFieldUpdateRequest):
    """Updates an existing onboarding field."""
    try:
        service_data = CampaignOnboardingFieldUpdate(**request.model_dump(exclude_unset=True))
        result = await campaign_service.update_onboarding_field_operation(field_id=field_id, field_data=service_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Update campaign onboarding field operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/campaign/onboarding-fields/{field_id}", summary="Delete Campaign Onboarding Field")
async def delete_campaign_onboarding_field_operation(field_id: int):
    """Deletes an onboarding field."""
    try:
        result = await campaign_service.delete_onboarding_field_operation(field_id=field_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Delete campaign onboarding field operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
async def _get_campaign_metrics(campaign_id: str) -> Dict[str, Any]:
    """Get performance metrics for campaign."""
    # Mock implementation - replace with actual metrics calculation
    return {
        "total_views": 1250,
        "total_clicks": 89,
        "conversion_rate": 7.1,
        "roi": 145.6
    }

def _get_status_insights(campaign_data: Dict[str, Any]) -> List[str]:
    """Get status insights for campaign."""
    insights = []
    
    is_active = campaign_data.get("is_active", True)
    paused_at = campaign_data.get("paused_at")
    
    if is_active and not paused_at:
        insights.append("Campaign is currently active and receiving traffic")
    elif paused_at:
        insights.append("Campaign is paused - consider resuming for continued performance")
    elif not is_active:
        insights.append("Campaign is inactive")
    
    return insights

def _get_campaign_recommendations(campaign_data: Dict[str, Any]) -> List[str]:
    """Get recommendations for campaign optimization."""
    recommendations = []
    
    total_interactions = campaign_data.get("total_interactions", 0)
    if total_interactions < 50:
        recommendations.append("Consider increasing promotional activities to boost engagement")
    
    referral_conversions = campaign_data.get("referral_conversions", 0)
    successful_onboardings = campaign_data.get("successful_onboardings", 0)
    
    if total_interactions > 0 and referral_conversions == 0:
        recommendations.append("Review referral tracking setup - no conversions detected")
    
    if successful_onboardings > 0 and referral_conversions < successful_onboardings * 0.5:
        recommendations.append("Consider optimizing referral funnel to improve conversion rate")
    
    return recommendations

# Campaign Template Operations
@router.get("/campaign-template/list")
async def list_campaign_templates_operation(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Business operation for listing campaign templates."""
    try:
        filters = {}
        if category:
            filters["category"] = category
        
        result = await campaign_template_service.list_campaign_templates_operation(filters)
        return result
        
    except Exception as e:
        logger.error(f"Campaign template list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign-template/get/{template_id}")
async def get_campaign_template_operation(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """Business operation for getting a specific campaign template."""
    try:
        result = await campaign_template_service.get_campaign_template_operation(template_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="Campaign template not found")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get campaign template operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Landing Page Template Operations
@router.get("/landing-page-template/list", response_model=LandingPageTemplateListResponse)
async def list_landing_page_templates_operation(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Lists landing page templates."""
    try:
        filters = {}
        if category:
            filters["filters[category][$eq]"] = category
        
        templates = await landing_page_template_service.list_templates_operation(filters, current_user)
        return {
            "landing_page_templates": templates,
            "total_count": len(templates)
        }
    except Exception as e:
        logger.error(f"Landing page template list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/landing-page-template/get/{template_id}", response_model=LandingPageTemplateResponse)
async def get_landing_page_template_operation(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """Gets a specific landing page template by its documentId."""
    try:
        template = await landing_page_template_service.get_template_operation(template_id, current_user)
        if not template:
            raise HTTPException(status_code=404, detail="Landing page template not found")
        return template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get landing page template operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/landing-page-template/create", response_model=LandingPageTemplateResponse, status_code=201)
async def create_landing_page_template_operation(
    request: LandingPageTemplateCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Creates a new landing page template."""
    try:
        template_data = LandingPageTemplateCreate(**request.model_dump())
        created_template = await landing_page_template_service.create_template_operation(template_data, current_user)
        return created_template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create landing page template operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/landing-page-template/update/{template_id}", response_model=LandingPageTemplateResponse)
async def update_landing_page_template_operation(
    template_id: str,
    request: LandingPageTemplateUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Updates a landing page template."""
    try:
        update_data = LandingPageTemplateUpdate(**request.model_dump(exclude_unset=True))
        updated_template = await landing_page_template_service.update_template_operation(template_id, update_data, current_user)
        return updated_template
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update landing page template operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/landing-page-template/delete/{template_id}", status_code=200)
async def delete_landing_page_template_operation(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """Deletes a landing page template."""
    try:
        result = await landing_page_template_service.delete_template_operation(template_id, current_user)
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete landing page template operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Referral Operations
@router.post("/referral/create", response_model=ReferralResponse, status_code=201)
async def create_referral_operation(
    request: ReferralCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Creates a new referral."""
    try:
        referral_data = ReferralCreate(**request.model_dump())
        created_referral = await referral_service.create_referral_operation(referral_data, current_user)
        return created_referral
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Referral creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/referral/list", response_model=ReferralListResponse)
async def list_referrals_operation(
    campaign_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Lists referrals, optionally filtered by campaign."""
    try:
        filters = {}
        if campaign_id:
            filters["filters[campaign][documentId][$eq]"] = campaign_id
        
        referrals = await referral_service.list_referrals_operation(filters, current_user)
        return {
            "referrals": referrals,
            "total_count": len(referrals)
        }
    except Exception as e:
        logger.error(f"Referral listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
