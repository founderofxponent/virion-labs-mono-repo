from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from services.client_service import client_service
from schemas.operation_schemas import ClientListResponse, ClientCreateRequest, ClientCreateResponse, ClientUpdateRequest
from core.auth import get_current_user, StrapiUser
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

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

# Analytics Operations
@router.get("/analytics/dashboard")
async def get_analytics_dashboard(user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for analytics dashboard data.
    (Protected)
    """
    try:
        # Mock analytics data for now - replace with actual analytics service
        analytics_data = {
            "overview": {
                "total_campaigns": 0,
                "active_campaigns": 0,
                "campaigns_last_30_days": 0,
                "total_clients": 0,
                "active_clients": 0,
                "new_clients_30_days": 0,
                "total_users_responded": 0,
                "users_completed": 0,
                "total_field_responses": 0,
                "responses_last_7_days": 0,
                "responses_last_30_days": 0,
                "total_interactions": 0,
                "unique_interaction_users": 0,
                "onboarding_completions": 0,
                "interactions_24h": 0,
                "total_referral_links": 0,
                "active_referral_links": 0,
                "total_clicks": 0,
                "total_conversions": 0,
                "completion_rate": 0.0,
                "click_through_rate": 0.0
            },
            "campaigns": [],
            "dailyMetrics": []
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
        # Mock ROI data for now
        roi_data = {
            "total_investment": 0.0,
            "total_return": 0.0,
            "roi_percentage": 0.0,
            "campaigns_roi": []
        }
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
        # Mock performance report data
        performance_data = {
            "timeframe": timeframe,
            "metrics": {
                "total_views": 0,
                "total_clicks": 0,
                "conversion_rate": 0.0,
                "engagement_rate": 0.0
            },
            "trends": []
        }
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
        # Mock influencer metrics data
        influencer_data = {
            "personal_stats": {
                "total_referrals": 0,
                "successful_conversions": 0,
                "earnings": 0.0,
                "performance_score": 0.0
            },
            "campaign_performance": []
        }
        return influencer_data
        
    except Exception as e:
        logger.error(f"Influencer metrics operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
