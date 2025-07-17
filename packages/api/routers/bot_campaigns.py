from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import bot_campaign_service
from middleware.auth_middleware import require_any_auth, AuthContext
from schemas.bot_campaign import (
    BotCampaign, 
    BotCampaignCreate, 
    BotCampaignUpdate,
    CampaignStats
)

router = APIRouter(
    prefix="/api/bot-campaigns",
    tags=["Bot Campaigns"],
)

@router.get("/", response_model=List[BotCampaign])
async def get_bot_campaigns(
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get campaigns for the bot. Supports both JWT and API key authentication.
    """
    try:
        auth_context = require_any_auth(request)
        # For service auth, return all campaigns; for user auth, return user-specific campaigns
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return bot_campaign_service.get_bot_campaigns(db, user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve bot campaigns")

@router.post("/", response_model=BotCampaign)
async def create_bot_campaign(
    campaign_data: BotCampaignCreate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Create a new bot campaign. Supports both JWT and API key authentication.
    """
    try:
        auth_context = require_any_auth(request)
        # For service auth, user_id can be None; for user auth, use actual user_id
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return bot_campaign_service.create_bot_campaign(db, user_id, campaign_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create bot campaign")

@router.get("/{campaign_id}", response_model=BotCampaign)
async def get_bot_campaign(
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
        return bot_campaign_service.get_bot_campaign_by_id(db, campaign_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve bot campaign")

@router.patch("/{campaign_id}", response_model=BotCampaign)
async def update_bot_campaign(
    campaign_id: UUID,
    campaign_data: BotCampaignUpdate,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Update a bot campaign. Supports both JWT and API key authentication.
    """
    try:
        auth_context = require_any_auth(request)
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return bot_campaign_service.update_bot_campaign(db, campaign_id, user_id, campaign_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update bot campaign")

@router.delete("/{campaign_id}")
async def delete_bot_campaign(
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
        bot_campaign_service.delete_bot_campaign(db, campaign_id, user_id)
        return {"message": "Bot campaign deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete bot campaign")

@router.patch("/{campaign_id}/stats")
async def update_campaign_stats(
    campaign_id: UUID,
    stats_data: CampaignStats,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Update statistics for a campaign. Supports both JWT and API key authentication.
    """
    try:
        auth_context = require_any_auth(request)
        user_id = auth_context.user_id if auth_context.is_user_auth else None
        return bot_campaign_service.update_campaign_stats(db, campaign_id, user_id, stats_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update campaign stats")