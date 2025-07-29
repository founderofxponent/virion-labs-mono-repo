from fastapi import APIRouter, HTTPException, Depends
from schemas.integration_schemas import (
    GetCampaignsResponse,
    RequestAccessRequest,
    RequestAccessResponse,
    HasVerifiedRoleResponse,
)
from services.integration_service import integration_service
from core.auth import get_current_user, StrapiUser
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/discord/campaigns/{guild_id}", response_model=GetCampaignsResponse)
async def get_discord_campaigns(guild_id: str, channel_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Get campaigns for a Discord guild, filtered by channel.
    """
    try:
        campaigns = await integration_service.get_discord_campaigns(guild_id, channel_id)
        return GetCampaignsResponse(campaigns=campaigns)
    except Exception as e:
        logger.error(f"Failed to get Discord campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve campaigns.")

@router.post("/discord/request-access", response_model=RequestAccessResponse)
async def request_discord_access(request: RequestAccessRequest, user: StrapiUser = Depends(get_current_user)):
    """
    Handle a user's request for access in Discord.
    """
    try:
        result = await integration_service.request_discord_access(request.model_dump())
        return RequestAccessResponse(**result)
    except Exception as e:
        logger.error(f"Failed to process Discord access request: {e}")
        raise HTTPException(status_code=500, detail="Failed to process access request.")

@router.get("/discord/user/{user_id}/has-verified-role/{guild_id}", response_model=HasVerifiedRoleResponse)
async def has_verified_role(user_id: str, guild_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Check if a Discord user has the verified role in a guild.
    """
    try:
        has_role = await integration_service.has_verified_role(user_id, guild_id)
        return HasVerifiedRoleResponse(has_role=has_role)
    except Exception as e:
        logger.error(f"Failed to check for verified role: {e}")
        raise HTTPException(status_code=500, detail="Failed to check user role.")