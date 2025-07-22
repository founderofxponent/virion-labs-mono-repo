from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from typing import List, Optional
from uuid import UUID
from supabase import Client
import os

from core.database import get_db
from services import campaign_service
from middleware.auth_middleware import AuthContext, require_any_auth
from schemas.db.discord_guild_campaigns import DiscordGuildCampaign
from schemas.db.referral_links import ReferralLink, ReferralLinkCreate
from schemas.api.campaign import (
    CampaignAccessRequest,
    DataExportRequest,
    DataExportResponse,
    CampaignCreate, 
    CampaignUpdate,
    CampaignStats
)

router = APIRouter(
    prefix="/api/campaigns",
    tags=["Campaigns"],
)


@router.get("/", response_model=List[DiscordGuildCampaign], operation_id="campaigns.list")
async def get_campaigns(
    request: Request,
    db: Client = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=1000, description="Number of items per page")
):
    """
    Get campaigns for the bot. Supports both JWT and API key authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        # For service auth, return all campaigns; for user auth, return user-specific campaigns
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return campaign_service.get_campaigns(db, user_id, page=page, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaigns: {e}")

@router.post("/", operation_id="campaigns.create")
async def create_campaign(
    campaign_data: CampaignCreate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Create a new bot campaign. Supports both JWT and API key authentication.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        print("🔥 DEBUG: Starting campaign creation", flush=True)
        print(f"🔥 DEBUG: Campaign data input: {campaign_data}", flush=True)
        
        auth_context = require_any_auth(request)
        # For service auth, user_id can be None; for user auth, use actual user_id
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        print(f"🔥 DEBUG: Auth context user_id: {user_id}", flush=True)
        
        result = campaign_service.create_campaign(db, user_id, campaign_data)
        print(f"🔥 DEBUG: Service result type: {type(result)}", flush=True)
        print(f"🔥 DEBUG: Service result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}", flush=True)
        
        # Check for any remaining UUID objects
        from uuid import UUID
        from datetime import datetime
        def check_for_problematic_types(obj, path=""):
            if isinstance(obj, UUID):
                print(f"🔥 DEBUG: Found UUID at {path}: {obj}", flush=True)
                return True
            elif isinstance(obj, datetime):
                print(f"🔥 DEBUG: Found datetime at {path}: {obj}", flush=True)
                return True
            elif isinstance(obj, dict):
                found = False
                for k, v in obj.items():
                    if check_for_problematic_types(v, f"{path}.{k}"):
                        found = True
                return found
            elif isinstance(obj, list):
                found = False
                for i, v in enumerate(obj):
                    if check_for_problematic_types(v, f"{path}[{i}]"):
                        found = True
                return found
            return False
        
        has_problematic_types = check_for_problematic_types(result)
        print(f"🔥 DEBUG: Has problematic types: {has_problematic_types}", flush=True)
        
        print(f"🔥 DEBUG: Returning result...", flush=True)
        return result
    except ValueError as e:
        logger.error(f"DEBUG: ValueError in campaign creation: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"DEBUG: Exception in campaign creation: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create campaign: {e}")

@router.get("/available", response_model=List[DiscordGuildCampaign], operation_id="campaigns.available")
async def get_available_campaigns(
    request: Request,
    db: Client = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    limit: int = Query(50, ge=1, le=1000, description="Number of items per page")
):
    """
    List all available campaigns.
    Requires authentication (either user or service).
    """
    try:
        auth_context: AuthContext = request.state.auth
        # If it's a user, we might want to filter by what's available to them.
        # For a service, we might show all. This logic can be in the service layer.
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return campaign_service.get_available_campaigns(db, user_id=user_id, page=page, limit=limit)
    except Exception as e:
        # Log the exception for debugging
        print(f"Error in get_available_campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve campaigns")

@router.get("/{campaign_id}", response_model=DiscordGuildCampaign, operation_id="campaigns.get_by_id")
async def get_campaign(
    campaign_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get a specific bot campaign. Supports both JWT and API key authentication.
    """
    try:
        auth_context = require_any_auth(request)
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return campaign_service.get_campaign_by_id(db, campaign_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve campaign: {e}")

@router.patch("/{campaign_id}", response_model=DiscordGuildCampaign, operation_id="campaigns.update")
async def update_campaign(
    campaign_id: UUID,
    campaign_data: CampaignUpdate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Update a bot campaign. Supports both JWT and API key authentication.
    """
    try:
        auth_context = require_any_auth(request)
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return campaign_service.update_campaign(db, campaign_id, user_id, campaign_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update campaign: {e}")

@router.delete("/{campaign_id}", operation_id="campaigns.delete")
async def delete_campaign(
    campaign_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Delete a bot campaign. Supports both JWT and API key authentication.
    """
    try:
        auth_context = require_any_auth(request)
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        campaign_service.delete_campaign(db, campaign_id, user_id)
        return {"message": "Bot campaign deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete campaign: {e}")

@router.patch("/{campaign_id}/stats", response_model=DiscordGuildCampaign, operation_id="campaigns.update_stats")
async def update_campaign_stats(
    campaign_id: UUID,
    stats: CampaignStats,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Update campaign statistics. Can be called by bot or other services.
    """
    try:
        # This endpoint can be called by any authenticated service or user
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_user_auth and not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Not authorized to update stats")
            
        return campaign_service.update_campaign_stats(db, campaign_id, stats)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update campaign stats: {e}")

@router.post("/{campaign_id}/request-access", operation_id="campaigns.request_access")
async def request_campaign_access(
    campaign_id: UUID,
    request_data: CampaignAccessRequest,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Request access to a campaign. Requires user authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_user_auth:
            raise HTTPException(status_code=403, detail="User authentication required")
        
        user_id = auth_context.user_id
        return campaign_service.request_campaign_access(db, campaign_id, user_id, request_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to request access")

@router.post("/{campaign_id}/referral-links", response_model=ReferralLink, operation_id="campaigns.create_referral_link")
async def create_referral_link(
    campaign_id: UUID,
    link_data: ReferralLinkCreate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Create a referral link for a campaign. Requires user authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_user_auth:
            raise HTTPException(status_code=403, detail="User authentication required")
            
        user_id = auth_context.user_id
        return campaign_service.create_referral_link(db, campaign_id, UUID(user_id), link_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create referral link")

@router.get("/{campaign_id}/referral-links", response_model=List[ReferralLink], operation_id="campaigns.get_referral_links")
async def get_campaign_referral_links(
    campaign_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    List referral links for a campaign. Requires user authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_user_auth:
            raise HTTPException(status_code=403, detail="User authentication required")
        
        user_id = auth_context.user_id
        return campaign_service.get_campaign_referral_links(db, campaign_id, UUID(user_id))
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve referral links")

@router.post("/export-data", response_model=DataExportResponse, operation_id="campaigns.export_data")
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
        auth_context: AuthContext = request.state.auth
        
        result = campaign_service.initiate_data_export(db, export_request)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=result.message)
        
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initiate data export: {e}")

@router.get("/export-data/download", operation_id="campaigns.download_export")
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
        auth_context: AuthContext = request.state.auth
        
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