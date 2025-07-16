from supabase import Client
from typing import List
from uuid import UUID
from datetime import datetime
import secrets

from schemas.campaign import Campaign, CampaignAccessRequest, ReferralLink, ReferralLinkCreate

def get_available_campaigns(db: Client, user_id: UUID) -> List[Campaign]:
    """
    Get campaigns available to a user.
    """
    response = db.table("campaigns").select("*").eq("is_active", True).execute()
    if response.data:
        return [Campaign.model_validate(campaign) for campaign in response.data]
    return []

def request_campaign_access(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID, 
    request_data: CampaignAccessRequest
) -> dict:
    """
    Request access to a campaign.
    """
    # Check if campaign exists
    campaign_response = db.table("campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    # Check if user already has access request
    existing_request = db.table("campaign_access_requests").select("*").eq("campaign_id", campaign_id).eq("user_id", user_id).execute()
    if existing_request.data:
        raise ValueError("Access request already exists")
    
    # Create access request
    request_record = {
        "campaign_id": campaign_id,
        "user_id": user_id,
        "reason": request_data.reason,
        "additional_info": request_data.additional_info,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("campaign_access_requests").insert(request_record).execute()
    if not response.data:
        raise Exception("Failed to create access request")
    
    return {"message": "Access request submitted successfully"}

def create_referral_link(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID, 
    link_data: ReferralLinkCreate
) -> ReferralLink:
    """
    Create a referral link for a campaign.
    """
    # Check if campaign exists and user has access
    campaign_response = db.table("campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    # Generate unique referral code
    code = secrets.token_urlsafe(8)
    
    # Ensure code is unique
    while True:
        existing_link = db.table("referral_links").select("*").eq("code", code).execute()
        if not existing_link.data:
            break
        code = secrets.token_urlsafe(8)
    
    link_record = {
        **link_data.model_dump(),
        "campaign_id": campaign_id,
        "code": code,
        "created_by": user_id,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("referral_links").insert(link_record).execute()
    if not response.data:
        raise Exception("Failed to create referral link")
    
    return ReferralLink.model_validate(response.data[0])

def get_campaign_referral_links(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID
) -> List[ReferralLink]:
    """
    Get referral links for a campaign.
    """
    response = db.table("referral_links").select("*").eq("campaign_id", campaign_id).execute()
    if response.data:
        return [ReferralLink.model_validate(link) for link in response.data]
    return []