from supabase import Client
from typing import List, Optional
from uuid import UUID
from datetime import datetime
import json

from schemas.bot_campaign import BotCampaign, BotCampaignCreate, BotCampaignUpdate, CampaignStats

def get_bot_campaigns(db: Client, user_id: Optional[UUID]) -> List[BotCampaign]:
    """
    Get bot campaigns. If user_id is provided, returns campaigns for that user.
    Otherwise, returns all campaigns.
    """
    query = db.table("discord_guild_campaigns").select("*")
    if user_id:
        query = query.eq("client_id", user_id) # Assuming user_id corresponds to client_id
    
    response = query.execute()
    if response.data:
        return [BotCampaign.model_validate(campaign) for campaign in response.data]
    return []

def create_bot_campaign(db: Client, user_id: Optional[UUID], campaign_data: BotCampaignCreate) -> BotCampaign:
    """
    Create a new bot campaign.
    """
    campaign_dict = campaign_data.model_dump()
    
    # Convert UUIDs to strings for JSON serialization
    for key, value in campaign_dict.items():
        if isinstance(value, UUID):
            campaign_dict[key] = str(value)

    response = db.table("discord_guild_campaigns").insert(campaign_dict).execute()
    
    if not response.data:
        raise Exception(f"Failed to create bot campaign: {response}")
    
    return BotCampaign.model_validate(response.data[0])

def get_bot_campaign_by_id(db: Client, campaign_id: UUID, user_id: Optional[UUID]) -> BotCampaign:
    """
    Get a specific bot campaign by ID.
    """
    query = db.table("discord_guild_campaigns").select("*").eq("id", campaign_id)
    if user_id:
        query = query.eq("client_id", user_id)

    response = query.execute()
    if not response.data:
        raise ValueError("Bot campaign not found")
    
    return BotCampaign.model_validate(response.data[0])

def update_bot_campaign(
    db: Client, 
    campaign_id: UUID, 
    user_id: Optional[UUID], 
    campaign_data: BotCampaignUpdate
) -> BotCampaign:
    """
    Update a bot campaign.
    """
    updates = {k: v for k, v in campaign_data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    query = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id)
    if user_id:
        query = query.eq("client_id", user_id)
        
    response = query.execute()
    if not response.data:
        raise ValueError("Bot campaign not found")
    
    return BotCampaign.model_validate(response.data[0])

def delete_bot_campaign(db: Client, campaign_id: UUID, user_id: Optional[UUID]) -> None:
    """
    Soft delete a bot campaign.
    """
    updates = {
        "is_deleted": True,
        "deleted_at": datetime.utcnow().isoformat()
    }
    
    query = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id)
    if user_id:
        query = query.eq("client_id", user_id)

    response = query.execute()
    if not response.data:
        raise ValueError("Bot campaign not found")

def update_campaign_stats(
    db: Client, 
    campaign_id: UUID, 
    user_id: Optional[UUID], 
    stats_data: CampaignStats
) -> BotCampaign:
    """
    Update statistics for a campaign.
    """
    updates = {k: v for k, v in stats_data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    
    query = db.table("discord_guild_campaigns").update(updates).eq("id", campaign_id)
    if user_id:
        query = query.eq("client_id", user_id)

    response = query.execute()
    if not response.data:
        raise ValueError("Bot campaign not found")
    
    return BotCampaign.model_validate(response.data[0])