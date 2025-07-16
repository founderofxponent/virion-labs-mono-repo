from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from uuid import UUID
from supabase import Client

from core.database import get_db
from services import referral_service
from schemas.referral import (
    ReferralValidation, 
    ReferralCampaignInfo, 
    ReferralSignup, 
    ReferralComplete
)

router = APIRouter(
    prefix="/api/referral",
    tags=["Referral"],
)

@router.get("/{code}/validate", response_model=ReferralValidation)
async def validate_referral_code(
    code: str,
    db: Client = Depends(get_db)
):
    """
    Validate a referral code.
    """
    try:
        return referral_service.validate_referral_code(db, code)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to validate referral code")

@router.get("/{code}/campaign", response_model=ReferralCampaignInfo)
async def get_referral_campaign_info(
    code: str,
    db: Client = Depends(get_db)
):
    """
    Get campaign info for a referral code.
    """
    try:
        return referral_service.get_referral_campaign_info(db, code)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get campaign info")

@router.post("/signup")
async def process_referral_signup(
    signup_data: ReferralSignup,
    db: Client = Depends(get_db)
):
    """
    Process a signup from a referral.
    """
    try:
        return referral_service.process_referral_signup(db, signup_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process referral signup")

@router.post("/complete")
async def complete_referral(
    completion_data: ReferralComplete,
    db: Client = Depends(get_db)
):
    """
    Mark a referral as converted.
    """
    try:
        return referral_service.complete_referral(db, completion_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to complete referral")