from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from services.influencer_service import influencer_service
from core.auth import get_current_user
from core.auth import StrapiUser as User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/referral-links", summary="List Referral Links")
async def list_referral_links_operation(current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to list their own referral links.
    """
    try:
        # Ensure the user has the 'Influencer' role
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        result = await influencer_service.list_referral_links_operation(user_id=str(current_user.id))
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer referral links operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching referral links.")

@router.post("/referral-links", summary="Create a new Referral Link")
async def create_referral_link_operation(link_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to create a new referral link.
    """
    try:
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        # The service will handle adding the influencer_id
        result = await influencer_service.create_referral_link_operation(
            link_data=link_data,
            user_id=str(current_user.id)
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer create referral link operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while creating the referral link.")

@router.put("/referral-links/{link_id}", summary="Update a Referral Link")
async def update_referral_link_operation(link_id: str, link_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to update their own referral link.
    """
    try:
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        result = await influencer_service.update_referral_link_operation(
            link_id=link_id,
            link_data=link_data,
            user_id=str(current_user.id)
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer update referral link operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while updating the referral link.")

@router.delete("/referral-links/{link_id}", summary="Delete a Referral Link")
async def delete_referral_link_operation(link_id: str, current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to delete their own referral link.
    """
    try:
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        result = await influencer_service.delete_referral_link_operation(
            link_id=link_id,
            user_id=str(current_user.id)
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer delete referral link operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while deleting the referral link.")

@router.get("/referrals", summary="List Referrals")
async def list_referrals_operation(current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to list their own referrals.
    """
    try:
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        result = await influencer_service.list_referrals_operation(user_id=str(current_user.id))
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer referrals operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching referrals.")

@router.put("/referrals/{referral_id}", summary="Update a Referral's Status")
async def update_referral_status_operation(referral_id: str, status_data: Dict[str, str], current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to update the status of their own referral.
    """
    try:
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        result = await influencer_service.update_referral_status_operation(
            referral_id=referral_id,
            status=status_data.get("status"),
            user_id=str(current_user.id)
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer update referral status operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while updating the referral status.")

@router.delete("/referrals/{referral_id}", summary="Delete a Referral")
async def delete_referral_operation(referral_id: str, current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to delete their own referral.
    """
    try:
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        result = await influencer_service.delete_referral_operation(
            referral_id=referral_id,
            user_id=str(current_user.id)
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer delete referral operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while deleting the referral.")

@router.post("/campaigns/{campaign_id}/referral-links", summary="Create a Campaign-Specific Referral Link")
async def create_campaign_referral_link_operation(campaign_id: str, link_data: Dict[str, Any], current_user: User = Depends(get_current_user)):
    """
    Business operation for an influencer to create a new referral link for a specific campaign.
    """
    try:
        if current_user.role['name'] != "Influencer":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for influencers only."
            )

        result = await influencer_service.create_campaign_referral_link_operation(
            campaign_id=campaign_id,
            link_data=link_data,
            user_id=str(current_user.id)
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Influencer create campaign referral link operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while creating the campaign referral link.")