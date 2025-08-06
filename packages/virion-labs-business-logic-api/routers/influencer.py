from fastapi import APIRouter, Depends, HTTPException, status, Body
from services.influencer_service import influencer_service
from core.auth import get_current_user
from core.auth import StrapiUser as User
from schemas.influencer_schemas import (
    ReferralLinkCreateRequest,
    ReferralLinkUpdateRequest,
    ReferralLinkResponse,
    ReferralLinkListResponse,
    ReferralResponse,
    ReferralListResponse
)
from domain.influencers.schemas import ReferralLinkCreate, ReferralLinkUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def _verify_influencer_role(current_user: User):
    """Raises HTTPException if the user is not an influencer."""
    if not current_user.role or current_user.role.get('name') != 'Influencer':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: This endpoint is for influencers only."
        )

@router.get("/referral-links", response_model=ReferralLinkListResponse, summary="List Referral Links")
async def list_referral_links_operation(current_user: User = Depends(get_current_user)):
    """Business operation for an influencer to list their own referral links."""
    _verify_influencer_role(current_user)
    try:
        links = await influencer_service.list_referral_links_operation(user_id=current_user.id)
        return {"links": links, "total_count": len(links)}
    except Exception as e:
        logger.error(f"List referral links operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/referral-links", response_model=ReferralLinkResponse, status_code=status.HTTP_201_CREATED, summary="Create a new Referral Link")
async def create_referral_link_operation(request: ReferralLinkCreateRequest, current_user: User = Depends(get_current_user)):
    """Business operation for an influencer to create a new referral link."""
    _verify_influencer_role(current_user)
    try:
        link_data = ReferralLinkCreate(**request.model_dump(), influencer=current_user.id)
        created_link = await influencer_service.create_referral_link_operation(link_data, user_id=current_user.id)
        return created_link
    except Exception as e:
        logger.error(f"Create referral link operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/referral-links/{link_id}", response_model=ReferralLinkResponse, summary="Update a Referral Link")
async def update_referral_link_operation(link_id: int, request: ReferralLinkUpdateRequest, current_user: User = Depends(get_current_user)):
    """Business operation for an influencer to update their own referral link."""
    _verify_influencer_role(current_user)
    try:
        update_data = ReferralLinkUpdate(**request.model_dump(exclude_unset=True))
        updated_link = await influencer_service.update_referral_link_operation(link_id, update_data, user_id=current_user.id)
        return updated_link
    except Exception as e:
        logger.error(f"Update referral link operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/referral-links/{link_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a Referral Link")
async def delete_referral_link_operation(link_id: int, current_user: User = Depends(get_current_user)):
    """Business operation for an influencer to delete their own referral link."""
    _verify_influencer_role(current_user)
    try:
        await influencer_service.delete_referral_link_operation(link_id, user_id=current_user.id)
        return
    except Exception as e:
        logger.error(f"Delete referral link operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/referrals", response_model=ReferralListResponse, summary="List Referrals")
async def list_referrals_operation(current_user: User = Depends(get_current_user)):
    """Business operation for an influencer to list their own referrals."""
    _verify_influencer_role(current_user)
    try:
        referrals = await influencer_service.list_referrals_operation(user_id=current_user.id)
        return {"referrals": referrals, "total_count": len(referrals)}
    except Exception as e:
        logger.error(f"List referrals operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/referrals/{referral_id}", response_model=ReferralResponse, summary="Update a Referral's Status")
async def update_referral_status_operation(referral_id: int, status_data: dict = Body(...), current_user: User = Depends(get_current_user)):
    """Business operation for an influencer to update the status of their own referral."""
    _verify_influencer_role(current_user)
    try:
        status_val = status_data.get("status")
        if not status_val:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status field is required.")
        
        updated_referral = await influencer_service.update_referral_status_operation(referral_id, status_val, user_id=current_user.id)
        return updated_referral
    except Exception as e:
        logger.error(f"Update referral status operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/referrals/{referral_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a Referral")
async def delete_referral_operation(referral_id: int, current_user: User = Depends(get_current_user)):
    """Business operation for an influencer to delete their own referral."""
    _verify_influencer_role(current_user)
    try:
        await influencer_service.delete_referral_operation(referral_id, user_id=current_user.id)
        return
    except Exception as e:
        logger.error(f"Delete referral operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))