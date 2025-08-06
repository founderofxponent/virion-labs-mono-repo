from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from services.analytics_service import analytics_service
from schemas.analytics_schemas import OnboardingExportRequest, OnboardingExportResponse, InfluencerMetricsResponse
from core.auth import get_current_user
from core.auth import StrapiUser as User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/dashboard", summary="Get Main Analytics Dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    """Provides a comprehensive overview of platform analytics."""
    try:
        # This endpoint can be accessed by admin, client, or influencer
        # The service layer will tailor the response based on the user's role
        data = await analytics_service.get_comprehensive_dashboard(current_user)
        return data
    except Exception as e:
        logger.error(f"Analytics dashboard endpoint failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while fetching dashboard analytics.")



@router.get("/performance-report", summary="Get Performance Report")
async def get_performance_report(timeframe: str = "30d", current_user: User = Depends(get_current_user)):
    """Provides a daily breakdown of key performance metrics."""
    try:
        # The service will handle role-based access and data scoping
        data = await analytics_service.get_performance_report(current_user, timeframe)
        return data
    except Exception as e:
        logger.error(f"Performance report endpoint failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while fetching the performance report.")

@router.get("/roi", summary="Get ROI Analytics")
async def get_roi_analytics(current_user: User = Depends(get_current_user)):
    """Provides a report on return on investment for campaigns."""
    try:
        # This is typically for admins or clients
        if current_user.role['name'] not in ["Platform Administrator", "client"]:
             raise HTTPException(status_code=403, detail="Access forbidden.")
        data = await analytics_service.get_roi_analytics(current_user)
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"ROI analytics endpoint failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while fetching ROI analytics.")

@router.get("/influencer-metrics", response_model=InfluencerMetricsResponse, summary="Get Influencer-Specific Metrics")
async def get_influencer_metrics(current_user: User = Depends(get_current_user)):
    """Provides key metrics for a specific influencer."""
    try:
        # This is for influencers only
        if current_user.role['name'] != "Influencer":
            raise HTTPException(status_code=403, detail="Access forbidden.")
        data = await analytics_service.get_influencer_specific_metrics(current_user)
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer metrics endpoint failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while fetching influencer metrics.")

@router.post(
    "/export/onboarding-data",
    response_model=OnboardingExportResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Export Campaign Onboarding Data"
)
async def export_onboarding_data(
    request: OnboardingExportRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Accepts a request to export campaign onboarding data, initiates the
    export process, and returns a response with a secure download link.
    """
    try:
        response = await analytics_service.export_onboarding_data(
            request=request,
            current_user=current_user
        )
        return response
    except HTTPException:
        # Re-raise known HTTP exceptions (e.g., for authorization)
        raise
    except Exception as e:
        logger.error(f"Onboarding data export failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during the export process."
        )