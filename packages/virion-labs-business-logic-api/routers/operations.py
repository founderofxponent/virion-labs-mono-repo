from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional, List
from services.client_service import client_service
from services.campaign_service import campaign_service
from services.campaign_template_service import campaign_template_service
from services.landing_page_template_service import landing_page_template_service
from services.referral_service import referral_service
from services.onboarding_service import onboarding_service
from services.campaign_access_service import campaign_access_service
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
    OnboardingStartCreateRequest,
    OnboardingCompletionCreateRequest,
    OnboardingResponseCreateRequest,
    OnboardingStartResponse,
    OnboardingCompletionResponse,
    OnboardingResponseResponse,
    OnboardingStartListResponse,
    OnboardingCompletionListResponse,
    OnboardingResponseListResponse,
    CampaignTemplateResponse,
    CampaignTemplateListResponse,
    CampaignAccessRequestRequest,
    CampaignAccessRequestResponse,
    CampaignAccessRequestUpdateRequest,
    CampaignAccessRequestListResponse,
)
from schemas.strapi import Campaign
from domain.campaigns.schemas import (
    CampaignLandingPageCreate, CampaignLandingPageUpdate,
    CampaignOnboardingFieldCreate,
    CampaignOnboardingFieldUpdate,
    CampaignCreate, CampaignUpdate
)
from domain.clients.schemas import ClientCreate, ClientUpdate
from domain.landing_page_templates.schemas import LandingPageTemplateCreate, LandingPageTemplateUpdate
from domain.referrals.schemas import ReferralCreate
from domain.onboarding.schemas import (
    CampaignOnboardingStartCreate,
    CampaignOnboardingCompletionCreate,
    CampaignOnboardingResponseCreate
)
from domain.campaign_access.schemas import (
    CampaignInfluencerAccessCreate,
    CampaignInfluencerAccessUpdate
)
from core.auth import get_current_user
from core.auth import StrapiUser as User
from core.strapi_client import strapi_client
import logging
from datetime import datetime
import httpx

logger = logging.getLogger(__name__)

router = APIRouter()

def _to_campaign_response(campaign: Campaign) -> CampaignResponse:
    """Converts a Strapi Campaign model to a CampaignResponse model."""
    client_response = None
    if campaign.client:
        client_response = ClientResponse(
            id=campaign.client.id,
            documentId=campaign.client.documentId,
            name=campaign.client.name,
            contact_email=campaign.client.contact_email,
            industry=campaign.client.industry,
            client_status=campaign.client.client_status,
            website=campaign.client.website,
            primary_contact=campaign.client.primary_contact,
        )
    
    return CampaignResponse(
        id=campaign.id,
        documentId=campaign.documentId or '',
        name=campaign.name,
        description=campaign.description,
        campaign_type=campaign.campaign_type,
        is_active=campaign.is_active,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        guild_id=campaign.guild_id,
        client=client_response
    )

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
    influencer_id: Optional[int] = None,
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

        campaigns_data = await campaign_service.list_campaigns_operation(filters)
        
        # Convert Strapi models to Pydantic response models
        campaign_responses = [_to_campaign_response(c) for c in campaigns_data]
        
        # If influencer_id is provided, enhance campaigns with access request status
        if influencer_id:
            # Get access requests for this influencer
            access_filters = {"filters[user][id][$eq]": influencer_id}
            access_requests = await campaign_access_service.list_access_requests_operation(
                access_filters, current_user
            )
            
            # Create a lookup map for access requests by campaign_id
            access_lookup = {}
            for access_req in access_requests:
                access_lookup[access_req.campaign_id] = access_req
            
            # Enhance campaign responses with access status
            enhanced_campaigns = []
            for campaign in campaign_responses:
                access_req = access_lookup.get(campaign.id)
                
                # Create a new campaign dict with enhanced data
                campaign_dict = campaign.model_dump()
                if access_req:
                    campaign_dict["has_access"] = access_req.request_status == "approved"
                    campaign_dict["request_status"] = access_req.request_status
                else:
                    campaign_dict["has_access"] = False
                    campaign_dict["request_status"] = None
                
                # Add discord_server_name - this should come from campaign data
                campaign_dict["discord_server_name"] = campaign.guild_id
                
                # Create new CampaignResponse with enhanced data
                enhanced_campaign = CampaignResponse(**campaign_dict)
                enhanced_campaigns.append(enhanced_campaign)
            
            campaign_responses = enhanced_campaigns
        
        total_count = len(campaign_responses)

        return CampaignListResponse(
            campaigns=campaign_responses,
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
        return _to_campaign_response(created_campaign)
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
        return _to_campaign_response(campaign)
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
        return _to_campaign_response(updated_campaign)
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
        
        campaign_dict = None
        if result.campaign:
            campaign_dict = result.campaign.model_dump()

        return CampaignLandingPageResponse(
            id=result.id,
            offer_title=result.offer_title,
            offer_description=result.offer_description,
            offer_highlights=result.offer_highlights,
            offer_value=result.offer_value,
            offer_expiry_date=result.offer_expiry_date,
            hero_image_url=result.hero_image_url,
            product_images=result.product_images,
            video_url=result.video_url,
            what_you_get=result.what_you_get,
            how_it_works=result.how_it_works,
            requirements=result.requirements,
            support_info=result.support_info,
            inherited_from_template=result.inherited_from_template,
            landing_page_template=result.landing_page_template,
            campaign=campaign_dict
        )
        
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
@router.get("/campaign-template/list", response_model=CampaignTemplateListResponse)
async def list_campaign_templates_operation(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Business operation for listing campaign templates."""
    try:
        filters = {}
        if category:
            filters["category"] = category
        
        templates = await campaign_template_service.list_campaign_templates_operation(filters)
        return {"templates": templates, "total_count": len(templates)}
        
    except Exception as e:
        logger.error(f"Campaign template list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign-template/get/{template_id}", response_model=CampaignTemplateResponse)
async def get_campaign_template_operation(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    """Business operation for getting a specific campaign template."""
    try:
        template = await campaign_template_service.get_campaign_template_operation(template_id)
        
        if not template:
            raise HTTPException(status_code=404, detail="Campaign template not found")
        
        return template
        
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

# Onboarding Operations
@router.post("/onboarding/start", response_model=OnboardingStartResponse, status_code=201)
async def create_onboarding_start_operation(request: OnboardingStartCreateRequest, current_user: User = Depends(get_current_user)):
    """Logs the start of an onboarding process."""
    try:
        start_data = CampaignOnboardingStartCreate(**request.model_dump())
        created_event = await onboarding_service.create_onboarding_start(start_data, current_user)
        return created_event
    except Exception as e:
        logger.error(f"Onboarding start creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/onboarding/starts", response_model=OnboardingStartListResponse)
async def list_onboarding_starts_operation(campaign_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Lists onboarding start events."""
    try:
        filters = {}
        if campaign_id:
            filters["filters[campaign][documentId][$eq]"] = campaign_id
        
        starts = await onboarding_service.list_onboarding_starts(filters, current_user)
        return {"starts": starts, "total_count": len(starts)}
    except Exception as e:
        logger.error(f"Onboarding start listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/onboarding/complete", response_model=OnboardingCompletionResponse, status_code=201)
async def create_onboarding_completion_operation(request: OnboardingCompletionCreateRequest, current_user: User = Depends(get_current_user)):
    """Logs the completion of an onboarding process."""
    try:
        completion_data = CampaignOnboardingCompletionCreate(**request.model_dump())
        created_event = await onboarding_service.create_onboarding_completion(completion_data, current_user)
        return created_event
    except Exception as e:
        logger.error(f"Onboarding completion creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/onboarding/completions", response_model=OnboardingCompletionListResponse)
async def list_onboarding_completions_operation(campaign_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Lists onboarding completion events."""
    try:
        filters = {}
        if campaign_id:
            filters["filters[campaign][documentId][$eq]"] = campaign_id
        
        completions = await onboarding_service.list_onboarding_completions(filters, current_user)
        return {"completions": completions, "total_count": len(completions)}
    except Exception as e:
        logger.error(f"Onboarding completion listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/onboarding/responses", response_model=OnboardingResponseResponse, status_code=201)
async def create_onboarding_response_operation(request: OnboardingResponseCreateRequest, current_user: User = Depends(get_current_user)):
    """Creates a new campaign onboarding response."""
    try:
        response_data = CampaignOnboardingResponseCreate(**request.model_dump())
        created_response = await onboarding_service.create_onboarding_response(response_data, current_user)
        return created_response
    except Exception as e:
        logger.error(f"Onboarding response creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/onboarding/responses", response_model=OnboardingResponseListResponse)
async def list_onboarding_responses_operation(campaign_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Lists campaign onboarding responses."""
    try:
        filters = {}
        if campaign_id:
            filters["filters[campaign][documentId][$eq]"] = campaign_id
        
        responses = await onboarding_service.list_onboarding_responses(filters, current_user)
        return {"responses": responses, "total_count": len(responses)}
    except Exception as e:
        logger.error(f"Onboarding response listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Campaign Access Request Operations
@router.post("/campaign/request-access", response_model=CampaignAccessRequestResponse, status_code=201)
async def request_campaign_access_operation(
    request: CampaignAccessRequestRequest,
    current_user: User = Depends(get_current_user)
):
    """Creates a new campaign access request from an influencer."""
    try:
        access_data = CampaignInfluencerAccessCreate(
            campaign_id=request.campaign_id,
            user_id=request.user_id,
            request_message=request.request_message,
            request_status="pending",
            requested_at=datetime.now().isoformat()
        )
        
        created_request = await campaign_access_service.create_access_request_operation(
            access_data, current_user
        )
        
        return CampaignAccessRequestResponse(
            id=created_request.id,
            documentId=created_request.documentId,
            campaign_id=created_request.campaign_id,
            user_id=created_request.user_id,
            request_message=created_request.request_message,
            request_status=created_request.request_status,
            requested_at=created_request.requested_at.isoformat() if created_request.requested_at else None,
            access_granted_at=created_request.access_granted_at.isoformat() if created_request.access_granted_at else None,
            is_active=created_request.is_active,
            admin_response=created_request.admin_response
        )
        
    except Exception as e:
        logger.error(f"Campaign access request creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/access-requests", response_model=CampaignAccessRequestListResponse)
async def list_campaign_access_requests_operation(
    campaign_id: Optional[int] = None,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Lists campaign access requests with optional filters."""
    try:
        filters = {}
        if campaign_id:
            filters["filters[campaign][id][$eq]"] = campaign_id
        if user_id:
            filters["filters[user][id][$eq]"] = user_id
        if status:
            filters["filters[request_status][$eq]"] = status
            
        access_requests = await campaign_access_service.list_access_requests_operation(
            filters, current_user
        )
        
        return CampaignAccessRequestListResponse(
            access_requests=[
                CampaignAccessRequestResponse(
                    id=req.id,
                    documentId=req.documentId,
                    campaign_id=req.campaign_id,
                    user_id=req.user_id,
                    request_message=req.request_message,
                    request_status=req.request_status,
                    requested_at=req.requested_at.isoformat() if req.requested_at else None,
                    access_granted_at=req.access_granted_at.isoformat() if req.access_granted_at else None,
                    is_active=req.is_active,
                    admin_response=req.admin_response,
                    campaign=getattr(req, 'campaign', None),
                    user=getattr(req, 'user', None)
                )
                for req in access_requests
            ],
            total_count=len(access_requests)
        )
        
    except Exception as e:
        logger.error(f"Campaign access request listing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/access-requests/{access_id}", response_model=CampaignAccessRequestResponse)
async def update_campaign_access_request_operation(
    access_id: str,
    request: CampaignAccessRequestUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Updates a campaign access request (for approval/denial by admins)."""
    try:
        update_data = CampaignInfluencerAccessUpdate(
            request_status=request.request_status,
            admin_response=request.admin_response,
            is_active=request.is_active,
            access_granted_at=datetime.now().isoformat() if request.request_status == "approved" else None
        )
        
        updated_request = await campaign_access_service.update_access_request_operation(
            access_id, update_data, current_user
        )
        
        return CampaignAccessRequestResponse(
            id=updated_request.id,
            documentId=updated_request.documentId,
            campaign_id=updated_request.campaign_id,
            user_id=updated_request.user_id,
            request_message=updated_request.request_message,
            request_status=updated_request.request_status,
            requested_at=updated_request.requested_at.isoformat() if updated_request.requested_at else None,
            access_granted_at=updated_request.access_granted_at.isoformat() if updated_request.access_granted_at else None,
            is_active=updated_request.is_active,
            admin_response=updated_request.admin_response
        )
        
    except Exception as e:
        logger.error(f"Campaign access request update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
