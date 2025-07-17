from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import campaign_service, auth_service
from schemas.campaign import (
    DiscordGuildCampaign,
    CampaignAccessRequest,
    ReferralLink,
    ReferralLinkCreate
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