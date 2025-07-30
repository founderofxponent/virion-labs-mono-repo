from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any
from services.client_service import client_service
from services.campaign_service import campaign_service
from services.analytics_service import analytics_service
from services.landing_page_template_service import landing_page_template_service
from schemas.operation_schemas import ClientListResponse, ClientCreateRequest, ClientCreateResponse, ClientUpdateRequest
from core.auth import get_current_user, StrapiUser
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# region Client Operations
@router.post("/client/create", response_model=ClientCreateResponse)
async def create_client_operation(request: ClientCreateRequest, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for client creation with setup options.
    (Protected)
    """
    try:
        result = await client_service.create_client_operation(
            client_data=request.client_data.model_dump(),
            setup_options=request.setup_options.model_dump(),
            current_user=user
        )
        return ClientCreateResponse(**result)
    except Exception as e:
        logger.error(f"Client creation operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/client/update/{document_id}")
async def update_client_operation(document_id: str, request: ClientUpdateRequest, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for updating a client.
    (Protected)
    """
    try:
        # Exclude unset fields so we only update what's provided
        updates = request.model_dump(exclude_unset=True)
        if not updates:
            raise HTTPException(status_code=400, detail="No update data provided.")
            
        result = await client_service.update_client_operation(document_id, updates, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Client update operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/get/{document_id}")
async def get_client_operation(document_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for fetching a single client.
    (Protected)
    """
    try:
        result = await client_service.get_client_operation(document_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Client get operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/client/delete/{document_id}")
async def delete_client_operation(document_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for deleting a client (soft delete).
    (Protected)
    """
    try:
        result = await client_service.delete_client_operation(document_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Client delete operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/client/list", response_model=ClientListResponse)
async def list_clients_operation(status: Optional[str] = None, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for listing clients with optional filtering.
    (Protected)
    """
    try:
        filters = {}
        if status:
            filters["filters[status][$eq]"] = status

        result = await client_service.list_clients_operation(filters, current_user=user)
        return ClientListResponse(**result)

    except Exception as e:
        logger.error(f"Client list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# endregion

# region Campaign Operations
@router.get("/campaign/list")
async def list_campaigns_operation(user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for listing campaigns.
    """
    try:
        result = await campaign_service.list_campaigns_operation(current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaign/create")
async def create_campaign_operation(request: Dict[str, Any], user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for campaign creation.
    """
    try:
        # Assuming request contains campaign_data and setup_options
        campaign_data = request.get("campaign_data", {})
        setup_options = request.get("setup_options", {})
        result = await campaign_service.create_campaign_operation(campaign_data, setup_options, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign creation operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/get/{campaign_id}")
async def get_campaign_operation(campaign_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for fetching a single campaign.
    """
    try:
        result = await campaign_service.get_campaign_operation(campaign_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign get operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/update/{campaign_id}")
async def update_campaign_operation(campaign_id: str, updates: Dict[str, Any], user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for updating a campaign.
    """
    try:
        result = await campaign_service.update_campaign_operation(campaign_id, updates, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign update operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/campaign/delete/{campaign_id}")
async def delete_campaign_operation(campaign_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for deleting a campaign.
    """
    try:
        result = await campaign_service.delete_campaign_operation(campaign_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign delete operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/campaign/unarchive/{campaign_id}")
async def unarchive_campaign_operation(campaign_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for unarchiving a campaign.
    """
    try:
        result = await campaign_service.unarchive_campaign_operation(campaign_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign unarchive operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/campaign/archive/{campaign_id}")
async def archive_campaign_operation(campaign_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for archiving a campaign.
    """
    try:
        result = await campaign_service.archive_campaign_operation(campaign_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign archive operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign/onboarding-fields/{campaign_id}")
async def get_onboarding_fields_operation(campaign_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for fetching onboarding fields for a campaign.
    """
    try:
        result = await campaign_service.get_onboarding_fields_operation(campaign_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Onboarding fields fetch operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaign/{campaign_id}/onboarding-fields")
async def create_onboarding_field_operation(campaign_id: str, field_data: Dict[str, Any], user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for creating an onboarding field for a campaign.
    """
    try:
        result = await campaign_service.create_onboarding_field_operation(campaign_id, field_data, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Onboarding field creation operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/onboarding-fields/{document_id}")
async def update_onboarding_field_operation(document_id: str, field_data: Dict[str, Any], user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for updating an onboarding field for a campaign.
    """
    try:
        logger.info(f"Received request to update onboarding field {document_id} with data: {field_data}")
        result = await campaign_service.update_onboarding_field_operation(document_id, field_data, current_user=user)
        logger.info(f"Successfully updated onboarding field {document_id}. Result: {result}")
        return result
    except Exception as e:
        logger.error(f"Onboarding field update operation failed for document {document_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/campaign/onboarding-fields/{document_id}")
async def delete_onboarding_field_operation(document_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for deleting an onboarding field for a campaign.
    """
    try:
        result = await campaign_service.delete_onboarding_field_operation(document_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Onboarding field delete operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/campaign/{campaign_id}/onboarding-fields/batch")
async def batch_update_onboarding_fields_operation(
    campaign_id: str, 
    batch_data: Dict[str, Any], 
    user: StrapiUser = Depends(get_current_user)
):
    """
    Business operation for batch updating onboarding fields for a campaign.
    Handles create, update, and delete operations sequentially to prevent deadlocks.
    
    Expected payload:
    {
        "fields": [
            {"id": "existing_id", "field_label": "Updated Label", ...},  # Update
            {"field_label": "New Field", ...},  # Create (no id)
        ],
        "delete_ids": ["id1", "id2"]  # Optional: document IDs to delete
    }
    """
    try:
        logger.info(f"Received batch update request for campaign {campaign_id} with {len(batch_data.get('fields', []))} fields")
        result = await campaign_service.batch_update_onboarding_fields_operation(
            campaign_id, batch_data, current_user=user
        )
        logger.info(f"Successfully processed batch update for campaign {campaign_id}")
        return result
    except Exception as e:
        logger.error(f"Batch onboarding fields update operation failed for campaign {campaign_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign-template/get/{document_id}")
async def get_campaign_template_operation(document_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for fetching a single campaign template by document ID.
    """
    try:
        result = await campaign_service.get_campaign_template_operation(document_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign template fetch operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/campaign-template/list")
async def list_campaign_templates_operation(user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for listing all campaign templates.
    """
    try:
        result = await campaign_service.list_campaign_templates_operation(current_user=user)
        return result
    except Exception as e:
        logger.error(f"Campaign template list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# endregion

# region Landing Page Template Operations
@router.get("/landing-page-template/list")
async def list_landing_page_templates_operation(
    campaign_type: Optional[str] = None,
    category: Optional[str] = None,
    user: StrapiUser = Depends(get_current_user)
):
    """
    Business operation for listing landing page templates with optional filtering.
    """
    try:
        if campaign_type:
            result = await landing_page_template_service.list_landing_page_templates_by_campaign_type_operation(campaign_type, current_user=user)
        elif category:
            result = await landing_page_template_service.list_landing_page_templates_by_category_operation(category, current_user=user)
        else:
            result = await landing_page_template_service.list_landing_page_templates_operation(current_user=user)
        return result
    except Exception as e:
        logger.error(f"Landing page template list operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/landing-page-template/get/{template_id}")
async def get_landing_page_template_operation(template_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for fetching a single landing page template.
    """
    try:
        result = await landing_page_template_service.get_landing_page_template_operation(template_id, current_user=user)
        return result
    except Exception as e:
        logger.error(f"Landing page template get operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# endregion

# region Analytics Operations
@router.get("/analytics/dashboard")
async def get_analytics_dashboard(user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for analytics dashboard data.
    (Protected)
    """
    try:
        # Get all campaigns to aggregate analytics
        all_campaigns_result = await campaign_service.list_campaigns_operation(current_user=user)
        all_campaigns = all_campaigns_result.get("campaigns", [])

        total_starts = 0
        total_completions = 0
        
        campaign_analytics_list = []

        for campaign in all_campaigns:
            campaign_id = campaign.documentId
            if campaign_id:
                funnel_data = await analytics_service.get_onboarding_funnel_analytics(campaign_id)
                total_starts += funnel_data.get("total_starts", 0)
                total_completions += funnel_data.get("total_completions", 0)
                campaign_analytics_list.append({
                    "campaign_id": campaign_id,
                    "name": campaign.name,
                    **funnel_data
                })

        # Calculate overall completion rate
        overall_completion_rate = (total_completions / total_starts) * 100 if total_starts > 0 else 0

        analytics_data = {
            "overview": {
                "total_campaigns": len(all_campaigns),
                "active_campaigns": len([c for c in all_campaigns if c.is_active]),
                "total_onboarding_starts": total_starts,
                "total_onboarding_completions": total_completions,
                "overall_completion_rate": round(overall_completion_rate, 2),
            },
            "campaigns": campaign_analytics_list,
            "dailyMetrics": [] # Placeholder for future implementation
        }

        # Get actual client count from the client service
        client_result = await client_service.list_clients_operation({}, current_user=user)
        analytics_data["overview"]["total_clients"] = client_result.get("total_count", 0)
        analytics_data["overview"]["active_clients"] = len([
            c for c in client_result.get("clients", [])
            if c.attributes.get("client_status") == "active"
        ])

        return analytics_data
        
    except Exception as e:
        logger.error(f"Analytics dashboard operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/roi")
async def get_analytics_roi(user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for ROI analytics.
    (Protected)
    """
    try:
        roi_data = await analytics_service.get_roi_analytics()
        return roi_data
        
    except Exception as e:
        logger.error(f"ROI analytics operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/performance-report")
async def get_analytics_performance_report(
    timeframe: Optional[str] = "30d",
    user: StrapiUser = Depends(get_current_user)
):
    """
    Business operation for performance report.
    (Protected)
    """
    try:
        # Convert timeframe string (e.g., "30d") to integer days
        timeframe_days = int(timeframe.replace('d', ''))
        
        performance_data = await analytics_service.get_performance_over_time(timeframe_days)
        
        return performance_data
        
    except Exception as e:
        logger.error(f"Performance report operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/influencer-metrics")
async def get_analytics_influencer_metrics(user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for influencer-specific metrics.
    (Protected)
    """
    try:
        # The user object from the dependency contains the user's ID
        influencer_data = await analytics_service.get_influencer_metrics(user.id)
        return influencer_data
        
    except Exception as e:
        logger.error(f"Influencer metrics operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
# endregion

