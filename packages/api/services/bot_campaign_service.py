from supabase import Client
from typing import List
from uuid import UUID
from datetime import datetime

from schemas.bot_campaign import BotCampaign, BotCampaignCreate, BotCampaignUpdate, CampaignStats

def get_bot_campaigns(db: Client, user_id: UUID) -> List[BotCampaign]:
    """
    Get bot campaigns for a user.
    """
    response = db.table("bot_campaigns").select("*").eq("created_by", user_id).execute()
    if response.data:
        return [BotCampaign.model_validate(campaign) for campaign in response.data]
    return []

def create_bot_campaign(db: Client, user_id: UUID, campaign_data: BotCampaignCreate) -> BotCampaign:
    """
    Create a new bot campaign.
    """
    campaign_record = {
        **campaign_data.model_dump(),
        "created_by": user_id,
        "view_count": 0,
        "join_count": 0,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("bot_campaigns").insert(campaign_record).execute()
    if not response.data:
        raise Exception("Failed to create bot campaign")
    
    return BotCampaign.model_validate(response.data[0])

def get_bot_campaign_by_id(db: Client, campaign_id: UUID, user_id: UUID) -> BotCampaign:
    """
    Get a specific bot campaign by ID.
    """
    response = db.table("bot_campaigns").select("*").eq("id", campaign_id).eq("created_by", user_id).execute()
    if not response.data:
        raise ValueError("Bot campaign not found")
    
    return BotCampaign.model_validate(response.data[0])

def update_bot_campaign(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID, 
    campaign_data: BotCampaignUpdate
) -> BotCampaign:
    """
    Update a bot campaign.
    """
    # Remove None values
    updates = {k: v for k, v in campaign_data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    response = db.table("bot_campaigns").update(updates).eq("id", campaign_id).eq("created_by", user_id).execute()
    if not response.data:
        raise ValueError("Bot campaign not found")
    
    return BotCampaign.model_validate(response.data[0])

def delete_bot_campaign(db: Client, campaign_id: UUID, user_id: UUID) -> None:
    """
    Delete a bot campaign.
    """
    response = db.table("bot_campaigns").delete().eq("id", campaign_id).eq("created_by", user_id).execute()
    if not response.data:
        raise ValueError("Bot campaign not found")

def update_campaign_stats(
    db: Client, 
    campaign_id: UUID, 
    user_id: UUID, 
    stats_data: CampaignStats
) -> BotCampaign:
    """
    Update statistics for a campaign.
    """
    updates = {}
    if stats_data.view_count is not None:
        updates["view_count"] = stats_data.view_count
    if stats_data.join_count is not None:
        updates["join_count"] = stats_data.join_count
    if stats_data.additional_stats is not None:
        updates["additional_stats"] = stats_data.additional_stats
    
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    response = db.table("bot_campaigns").update(updates).eq("id", campaign_id).eq("created_by", user_id).execute()
    if not response.data:
        raise ValueError("Bot campaign not found")
    
    return BotCampaign.model_validate(response.data[0])