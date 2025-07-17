from supabase import Client
from typing import Optional
from uuid import UUID
from datetime import datetime

from schemas.referral import ReferralValidation, ReferralCampaignInfo, ReferralSignup, ReferralComplete
from schemas.campaign import ReferralLink

def validate_referral_code(db: Client, code: str) -> ReferralValidation:
    """
    Validate a referral code.
    """
    response = db.table("referral_links").select("*").eq("referral_code", code).eq("is_active", True).execute()
    if not response.data:
        return ReferralValidation(is_valid=False, code=code)
    
    referral_link = response.data[0]
    
    campaign_response = db.table("discord_guild_campaigns").select("id, campaign_name").eq("id", referral_link.get("campaign_id")).execute()
    campaign = campaign_response.data[0] if campaign_response.data else None
    
    return ReferralValidation(
        is_valid=True,
        code=code,
        campaign_id=referral_link.get("campaign_id"),
        campaign_name=campaign.get("campaign_name") if campaign else None
    )

def get_referral_campaign_info(db: Client, code: str) -> ReferralCampaignInfo:
    """
    Get campaign info for a referral code.
    """
    response = db.table("referral_links").select("*").eq("referral_code", code).eq("is_active", True).execute()
    if not response.data:
        raise ValueError("Invalid referral code")
    
    referral_link_data = response.data[0]
    referral_link = ReferralLink.model_validate(referral_link_data)

    campaign_response = db.table("discord_guild_campaigns").select("*").eq("id", referral_link.campaign_id).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    campaign = campaign_response.data[0]
    
    return ReferralCampaignInfo(
        campaign_id=campaign["id"],
        campaign_name=campaign["campaign_name"],
        campaign_description=campaign.get("description"),
        referral_link_name=referral_link.title,
        referral_link_description=referral_link.description
    )

def process_referral_signup(db: Client, signup_data: ReferralSignup) -> dict:
    """
    Process a signup from a referral.
    """
    validation = validate_referral_code(db, signup_data.referral_code)
    if not validation.is_valid:
        raise ValueError("Invalid referral code")

    referral_link_response = db.table("referral_links").select("id, influencer_id").eq("referral_code", signup_data.referral_code).execute()
    if not referral_link_response.data:
        raise ValueError("Referral link not found")
    
    referral_link = referral_link_response.data[0]

    referral_record = {
        "referral_link_id": referral_link["id"],
        "influencer_id": referral_link["influencer_id"],
        "campaign_id": validation.campaign_id,
        "discord_user_id": signup_data.discord_user_id,
        "discord_username": signup_data.discord_username,
        "email": signup_data.email,
        "full_name": signup_data.full_name,
        "status": "pending",
        "metadata": signup_data.additional_data or {}
    }

    referral_response = db.table("referrals").insert(referral_record).execute()
    if not referral_response.data:
        raise Exception("Failed to create referral record")

    return {"message": "Referral signup processed successfully", "referral_id": referral_response.data[0]["id"]}

def complete_referral(db: Client, completion_data: ReferralComplete) -> dict:
    """
    Mark a referral as converted.
    """
    response = db.table("referrals").select("*").eq("id", completion_data.referral_id).execute()
    if not response.data:
        raise ValueError("Referral record not found")

    db.table("referrals").update({
        "status": "completed",
        "completed_at": datetime.utcnow().isoformat(),
        "metadata": completion_data.conversion_data or {}
    }).eq("id", completion_data.referral_id).execute()

    return {"message": "Referral marked as converted"}