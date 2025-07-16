from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import bot_campaign_service, auth_service
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

security = HTTPBearer()

@router.get("/", response_model=List[BotCampaign])
async def get_bot_campaigns(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Get campaigns for the bot.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return bot_campaign_service.get_bot_campaigns(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve bot campaigns")

@router.post("/", response_model=BotCampaign)
async def create_bot_campaign(
    campaign_data: BotCampaignCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Create a new bot campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return bot_campaign_service.create_bot_campaign(db, user_id, campaign_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create bot campaign")

@router.get("/{campaign_id}", response_model=BotCampaign)
async def get_bot_campaign(
    campaign_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Get a specific bot campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return bot_campaign_service.get_bot_campaign_by_id(db, campaign_id, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to retrieve bot campaign")

@router.patch("/{campaign_id}", response_model=BotCampaign)
async def update_bot_campaign(
    campaign_id: UUID,
    campaign_data: BotCampaignUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Update a bot campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return bot_campaign_service.update_bot_campaign(db, campaign_id, user_id, campaign_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update bot campaign")

@router.delete("/{campaign_id}")
async def delete_bot_campaign(
    campaign_id: UUID,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Delete a bot campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
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
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Client = Depends(get_db)
):
    """
    Update statistics for a campaign.
    """
    try:
        user_id = auth_service.get_user_id_from_token(credentials.credentials)
        return bot_campaign_service.update_campaign_stats(db, campaign_id, user_id, stats_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update campaign stats")