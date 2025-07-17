from supabase import Client
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import secrets

from schemas.campaign import (
    DiscordGuildCampaign, 
    DiscordGuildCampaignCreate, 
    DiscordGuildCampaignUpdate,
    Campaign, 
    CampaignAccessRequest, 
    ReferralLink, 
    ReferralLinkCreate
)

def get_available_campaigns(db: Client, user_id: Optional[UUID]) -> List[DiscordGuildCampaign]:
    """
    Get campaigns available to a user.
    If user_id is None, returns all active campaigns.
    """
    query = db.table("discord_guild_campaigns").select("*").eq("is_active", True).eq("is_deleted", False)
    
    # In the future, we can add user-specific logic here
    # if user_id:
    #     query = query.eq("some_user_column", user_id)

    response = query.execute()

    if response.data:
        return [DiscordGuildCampaign.model_validate(campaign) for campaign in response.data]
    return []

def get_campaign_by_id(db: Client, campaign_id: UUID) -> DiscordGuildCampaign:
    """
    Get campaign by ID.
    """
    response = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def create_campaign(db: Client, campaign_data: DiscordGuildCampaignCreate) -> DiscordGuildCampaign:
    """
    Create a new campaign.
    """
    campaign_record = {
        **campaign_data.model_dump(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("discord_guild_campaigns").insert(campaign_record).execute()
    if not response.data:
        raise Exception("Failed to create campaign")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def update_campaign(db: Client, campaign_id: UUID, campaign_data: DiscordGuildCampaignUpdate) -> DiscordGuildCampaign:
    """
    Update campaign details.
    """
    # Remove None values
    updates = {k: v for k, v in campaign_data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def delete_campaign(db: Client, campaign_id: UUID) -> None:
    """
    Soft delete a campaign.
    """
    updates = {
        "is_deleted": True,
        "deleted_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")

def set_campaign_status(db: Client, campaign_id: UUID, is_active: bool) -> DiscordGuildCampaign:
    """
    Set campaign active status.
    """
    updates = {
        "is_active": is_active,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    if not is_active:
        updates["paused_at"] = datetime.utcnow().isoformat()
    else:
        updates["paused_at"] = None
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

def update_campaign_stats(db: Client, campaign_id: UUID, stats: dict) -> DiscordGuildCampaign:
    """
    Update campaign statistics.
    """
    updates = {
        **stats,
        "updated_at": datetime.utcnow().isoformat(),
        "last_activity_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign not found")
    
    return DiscordGuildCampaign.model_validate(response.data[0])

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
    campaign_response = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    # Check if user already has access request
    existing_request = db.table("campaign_influencer_access").select("*").eq("campaign_id", campaign_id).eq("influencer_id", user_id).execute()
    if existing_request.data:
        raise ValueError("Access request already exists")
    
    # Create access request
    request_record = {
        "campaign_id": campaign_id,
        "influencer_id": user_id,
        "request_message": request_data.reason,
        "admin_response": request_data.additional_info,
        "request_status": "pending",
        "requested_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("campaign_influencer_access").insert(request_record).execute()
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
    # Check if campaign exists
    campaign_response = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    # Generate unique referral code if not provided
    if not link_data.referral_code:
        code = secrets.token_urlsafe(8)
        
        # Ensure code is unique
        while True:
            existing_link = db.table("referral_links").select("*").eq("referral_code", code).execute()
            if not existing_link.data:
                break
            code = secrets.token_urlsafe(8)
        
        link_data.referral_code = code
    
    link_record = {
        **link_data.model_dump(),
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

def get_referral_links_by_influencer(
    db: Client, 
    influencer_id: UUID
) -> List[ReferralLink]:
    """
    Get referral links for an influencer.
    """
    response = db.table("referral_links").select("*").eq("influencer_id", influencer_id).execute()
    if response.data:
        return [ReferralLink.model_validate(link) for link in response.data]
    return []
