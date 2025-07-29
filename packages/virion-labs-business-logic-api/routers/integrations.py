from fastapi import APIRouter, HTTPException, Depends
from schemas.integration_schemas import (
    GetCampaignsResponse,
    RequestAccessRequest,
    RequestAccessResponse,
    HasVerifiedRoleResponse,
    OnboardingStartRequest,
    OnboardingStartResponse,
    OnboardingSubmitRequest,
    OnboardingSubmitResponse,
)
from services.integration_service import integration_service
from core.auth import get_api_key
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/discord/campaigns/{guild_id}", response_model=GetCampaignsResponse)
async def get_discord_campaigns(guild_id: str, channel_id: str, join_campaigns_channel_id: str = None, api_key: str = Depends(get_api_key)):
    """
    Get campaigns for a Discord guild, filtered by channel.
    """
    try:
        campaigns = await integration_service.get_discord_campaigns(guild_id, channel_id, join_campaigns_channel_id)
        return GetCampaignsResponse(campaigns=campaigns)
    except Exception as e:
        logger.error(f"Failed to get Discord campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve campaigns.")

@router.post("/discord/request-access", response_model=RequestAccessResponse)
async def request_discord_access(request: RequestAccessRequest, api_key: str = Depends(get_api_key)):
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
async def has_verified_role(user_id: str, guild_id: str, api_key: str = Depends(get_api_key)):
    """
    Check if a Discord user has the verified role in a guild.
    """
    try:
        has_role = await integration_service.has_verified_role(user_id, guild_id)
        return HasVerifiedRoleResponse(has_role=has_role)
    except Exception as e:
        logger.error(f"Failed to check for verified role: {e}")
        raise HTTPException(status_code=500, detail="Failed to check user role.")

@router.post("/discord/onboarding/start", response_model=OnboardingStartResponse)
async def start_discord_onboarding(request: OnboardingStartRequest, api_key: str = Depends(get_api_key)):
    """
    Start Discord onboarding process and get campaign onboarding fields.
    """
    try:
        result = await integration_service.start_discord_onboarding(
            request.campaign_id,
            request.discord_user_id,
            request.discord_username
        )
        return OnboardingStartResponse(**result)
    except Exception as e:
        logger.error(f"Failed to start Discord onboarding: {e}")
        raise HTTPException(status_code=500, detail="Failed to start onboarding process.")

@router.post("/discord/onboarding/submit", response_model=OnboardingSubmitResponse)
async def submit_discord_onboarding(request: OnboardingSubmitRequest, api_key: str = Depends(get_api_key)):
    """
    Submit Discord onboarding responses and complete the onboarding process.
    """
    try:
        result = await integration_service.submit_discord_onboarding(
            request.campaign_id,
            request.discord_user_id,
            request.discord_username,
            request.responses
        )
        return OnboardingSubmitResponse(**result)
    except Exception as e:
        logger.error(f"Failed to submit Discord onboarding: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding.")