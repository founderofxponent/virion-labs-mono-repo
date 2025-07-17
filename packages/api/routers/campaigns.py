from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from typing import List, Optional
from uuid import UUID
from supabase import Client
import os

from core.database import get_db
from services import campaign_service, auth_service
from middleware.auth_middleware import require_any_auth
from schemas.campaign import (
    DiscordGuildCampaign,
    CampaignAccessRequest,
    ReferralLink,
    ReferralLinkCreate,
    DataExportRequest,
    DataExportResponse
)

router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"],
)

security = HTTPBearer()

@router.get("/available", response_model=List[DiscordGuildCampaign])
async def get_available_campaigns(
    db: Client = Depends(get_db)
):
    """
    List all available campaigns.
    This endpoint is temporarily public for testing.
    """
    try:
        # For now, let's bypass user auth to test the service layer
        # In the future, we will re-introduce authentication
        # user_id = auth_service.get_user_id_from_token(credentials.credentials)
        # return campaign_service.get_available_campaigns(db, user_id)
        return campaign_service.get_available_campaigns(db, user_id=None)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in get_available_campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve campaigns")

@router.post("/{campaign_id}/request-access")
async def request_campaign_access(
    campaign_id: UUID,
    request_data: CampaignAccessRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Request access to a campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return campaign_service.request_campaign_access(db, campaign_id, user_id, request_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to request access")

@router.post("/{campaign_id}/referral-links", response_model=ReferralLink)
async def create_referral_link(
    campaign_id: UUID,
    link_data: ReferralLinkCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Create a referral link for a campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return campaign_service.create_referral_link(db, campaign_id, user_id, link_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create referral link")

@router.get("/{campaign_id}/referral-links", response_model=List[ReferralLink])
async def get_campaign_referral_links(
    campaign_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    List referral links for a campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return campaign_service.get_campaign_referral_links(db, campaign_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve referral links")

@router.post("/export-data", response_model=DataExportResponse)
async def initiate_data_export(
    export_request: DataExportRequest,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Initiate a data export for campaigns.
    Critical endpoint for Discord bot data export functionality.
    """
    try:
        # Require authentication
        auth_context = require_any_auth(request)
        
        result = campaign_service.initiate_data_export(db, export_request)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate data export: {e}")

@router.get("/export-data/download")
async def download_export_data(
    export_id: UUID = Query(..., description="The export ID to download"),
    request: Request = None,
    db: Client = Depends(get_db)
):
    """
    Download exported campaign data.
    Critical endpoint for Discord bot data export download functionality.
    """
    try:
        # Require authentication
        auth_context = require_any_auth(request)
        
        # Get export status
        export_record = campaign_service.get_export_status(db, export_id)
        
        if not export_record:
            raise HTTPException(status_code=404, detail="Export not found")
        
        if export_record.status.value != "completed":
            raise HTTPException(
                status_code=400, 
                detail=f"Export is not ready. Status: {export_record.status.value}"
            )
        
        if not export_record.file_path or not os.path.exists(export_record.file_path):
            raise HTTPException(status_code=404, detail="Export file not found")
        
        # Determine media type based on format
        media_type = "application/octet-stream"
        if export_record.format.value == "json":
            media_type = "application/json"
        elif export_record.format.value == "csv":
            media_type = "text/csv"
        elif export_record.format.value == "excel":
            media_type = "application/vnd.ms-excel"
        
        # Generate filename
        filename = f"export_{export_record.export_type.value}_{export_id}.{export_record.format.value}"
        
        return FileResponse(
            export_record.file_path,
            media_type=media_type,
            filename=filename
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download export: {e}")