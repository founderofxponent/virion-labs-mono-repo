from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional, List
from services.client_service import client_service
from services.campaign_service import campaign_service
from schemas.operation_schemas import (
    ClientCreateRequest, ClientCreateResponse,
    ClientListResponse, ClientUpdateRequest,
    CampaignListResponse, CampaignUpdateRequest
)
from core.auth import get_current_user
from core.auth import StrapiUser as User
from core.strapi_client import strapi_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Client Operations
@router.post("/client/create", response_model=ClientCreateResponse)
async def create_client_operation(request: ClientCreateRequest):
    """Business operation for client creation with setup options."""
    try:
        result = await client_service.create_client_operation(
            client_data=request.client_data.model_dump(),
            setup_options=request.setup_options.model_dump()
        )
        return ClientCreateResponse(**result)
        
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
    """Business operation for listing clients with business context."""
    try:
        logger.info(f"list_clients_operation called. Current user: {current_user}")
        if not current_user:
            logger.warning("list_clients_operation: current_user is None.")
            raise HTTPException(status_code=401, detail="Could not validate credentials for this operation.")
        
        logger.info(f"Current user role: {current_user.role}")
        if not current_user.role or current_user.role.get('name') not in ["Platform Administrator", "admin"]:
            logger.warning(f"list_clients_operation: User {current_user.email} with role {current_user.role.get('name') if current_user.role else 'None'} attempted to access admin endpoint.")
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for administrators only."
            )

        filters = {}
        if industry:
            filters["filters[industry][$eq]"] = industry
        if tier:
            filters["filters[budget_tier][$eq]"] = tier
        if status:
            filters["filters[status][$eq]"] = status
        result = await client_service.list_clients_operation(filters=filters, current_user=current_user)
        return ClientListResponse(**result)
        
        
    except Exception as e:
        logger.error(f"Client list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/get/{client_id}")
async def get_client_operation(client_id: str):
    """Business operation for getting client details with business context."""
    try:
        client = await strapi_client.get_client(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        
        business_context = client_service.client_domain.get_client_business_context(client)
        
        return {
            "client": client,
            "business_context": business_context
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get client operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/client/update/{client_id}")
async def update_client_operation(client_id: str, request: ClientUpdateRequest, current_user: User = Depends(get_current_user)):
    """Business operation for updating client with business logic."""
    try:
        result = await client_service.update_client_operation(
            document_id=client_id,
            updates=request.model_dump(exclude_unset=True),
            current_user=current_user
        )
        return result
        
    except Exception as e:
        logger.error(f"Client update operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/client/delete/{client_id}")
async def delete_client_operation(client_id: str, current_user: User = Depends(get_current_user)):
    """Business operation for deleting client with cleanup."""
    try:
        result = await client_service.delete_client_operation(
            document_id=client_id,
            current_user=current_user
        )
        return result
        
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
    influencer_id: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """
    Business operation for listing campaigns.
    If influencer_id is provided, it lists campaigns available to that influencer.
    Otherwise, it lists campaigns based on administrative filters.
    """
    try:
        filters = {
            "pagination[page]": page,
            "pagination[pageSize]": limit
        }

        if client_id:
            filters["filters[client.id][$eq]"] = client_id
        if status:
            filters["filters[status][$eq]"] = status

        if influencer_id:
            # Logic for influencer-specific campaigns
            # Ensure the current user is the influencer they are requesting for, or an admin
            if str(current_user.id) != influencer_id and current_user.role.get('name') not in ["Platform Administrator", "admin"]:
                raise HTTPException(status_code=403, detail="You can only view your own available campaigns.")
            
            campaigns = await campaign_service.list_available_campaigns_for_influencer(influencer_id, filters)
            total_count = len(campaigns)
        else:
            # Administrative listing
            if current_user.role.get('name') not in ["Platform Administrator", "admin"]:
                raise HTTPException(status_code=403, detail="Access forbidden: This endpoint is for administrators only.")
            
            result = await campaign_service.list_campaigns_operation(filters)
            campaigns = result.get("campaigns", [])
            total_count = result.get("total_count", 0)

        return CampaignListResponse(
            campaigns=campaigns,
            total_count=total_count,
            page=page,
            limit=limit
        )

    except Exception as e:
        logger.error(f"Campaign list operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/get/{campaign_id}")
async def get_campaign_operation(campaign_id: int):
    """Business operation for getting campaign details."""
    try:
        campaign = await strapi_client.get_campaign(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Add business context
        business_context = {
            "performance_metrics": await _get_campaign_metrics(campaign_id),
            "status_insights": _get_status_insights(campaign["attributes"]),
            "recommendations": _get_campaign_recommendations(campaign["attributes"])
        }
        
        return {
            "campaign": campaign,
            "business_context": business_context
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get campaign operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/update/{campaign_id}")
async def update_campaign_operation(campaign_id: int, request: CampaignUpdateRequest):
    """Business operation for updating campaign."""
    try:
        # Add update metadata
        updates = request.model_dump(exclude_unset=True)
        updates["updated_at"] = datetime.utcnow().isoformat()
        
        updated_campaign = await strapi_client.update_campaign(campaign_id, updates)
        
        return {
            "campaign": updated_campaign,
            "updated": True
        }
        
    except Exception as e:
        logger.error(f"Campaign update operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/update-stats/{campaign_id}")
async def update_campaign_stats_operation(campaign_id: int, stats: Dict[str, Any]):
    """Business operation for updating campaign statistics."""
    try:
        # Add timestamp to stats
        stats["stats_updated_at"] = datetime.utcnow().isoformat()
        
        updated_campaign = await strapi_client.update_campaign(campaign_id, {"stats": stats})
        
        return {
            "campaign": updated_campaign,
            "stats_updated": True
        }
        
    except Exception as e:
        logger.error(f"Campaign stats update failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/available", summary="List Available Campaigns")
async def list_available_campaigns_operation():
    """
    Business operation for listing all available campaigns.
    """
    try:
        # In a real-world scenario, you would have a service that filters campaigns
        # based on the user's role and permissions.
        # For now, we will fetch all active campaigns.
        result = await campaign_service.list_campaigns_operation(filters={"filters[is_active][$eq]": True})
        return result
        
    except Exception as e:
        logger.error(f"Available campaigns operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/{campaign_id}/landing-pages", summary="List Campaign Landing Pages")
async def list_campaign_landing_pages_operation(campaign_id: str):
    """
    Business operation for listing all landing pages for a specific campaign.
    """
    try:
        result = await campaign_service.list_landing_pages_operation(campaign_id=campaign_id)
        return result
        
    except Exception as e:
        logger.error(f"Campaign landing pages operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaign/{campaign_id}/landing-pages", summary="Create a Campaign Landing Page")
async def create_campaign_landing_page_operation(campaign_id: str, page_data: Dict[str, Any]):
    """
    Business operation for creating a new landing page for a specific campaign.
    """
    try:
        result = await campaign_service.create_landing_page_operation(campaign_id=campaign_id, page_data=page_data)
        return result
        
    except Exception as e:
        logger.error(f"Create campaign landing page operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/landing-pages/{page_id}", summary="Update a Campaign Landing Page")
async def update_campaign_landing_page_operation(page_id: str, page_data: Dict[str, Any]):
    """
    Business operation for updating a landing page.
    """
    try:
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

# Helper functions
async def _get_campaign_metrics(campaign_id: int) -> Dict[str, Any]:
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
    
    status = campaign_data.get("status", "")
    if status == "active":
        insights.append("Campaign is currently active and receiving traffic")
    elif status == "paused":
        insights.append("Campaign is paused - consider resuming for continued performance")
    
    return insights

def _get_campaign_recommendations(campaign_data: Dict[str, Any]) -> List[str]:
    """Get recommendations for campaign optimization."""
    recommendations = []
    
    budget = campaign_data.get("budget", 0)
    if budget < 1000:
        recommendations.append("Consider increasing budget for better reach")
    
    duration = campaign_data.get("duration_days", 0)
    if duration > 60:
        recommendations.append("Long campaigns may benefit from mid-point optimization")
    
    return recommendations
