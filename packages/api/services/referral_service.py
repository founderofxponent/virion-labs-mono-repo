from supabase import Client
from typing import Optional
from uuid import UUID
from datetime import datetime

from schemas.referral import ReferralValidation, ReferralCampaignInfo, ReferralSignup, ReferralComplete

def validate_referral_code(db: Client, code: str) -> ReferralValidation:
    """
    Validate a referral code.
    """
    response = db.table("referral_links").select("*").eq("code", code).eq("is_active", True).execute()
    if not response.data:
        return ReferralValidation(is_valid=False, code=code)
    
    referral_link = response.data[0]
    
    # Get campaign info
    campaign_response = db.table("campaigns").select("*").eq("id", referral_link["campaign_id"]).execute()
    campaign = campaign_response.data[0] if campaign_response.data else None
    
    return ReferralValidation(
        is_valid=True,
        code=code,
        campaign_id=referral_link["campaign_id"],
        campaign_name=campaign["name"] if campaign else None
    )

def get_referral_campaign_info(db: Client, code: str) -> ReferralCampaignInfo:
    """
    Get campaign info for a referral code.
    """
    response = db.table("referral_links").select("*").eq("code", code).eq("is_active", True).execute()
    if not response.data:
        raise ValueError("Invalid referral code")
    
    referral_link = response.data[0]
    
    # Get campaign info
    campaign_response = db.table("campaigns").select("*").eq("id", referral_link["campaign_id"]).execute()
    if not campaign_response.data:
        raise ValueError("Campaign not found")
    
    campaign = campaign_response.data[0]
    
    return ReferralCampaignInfo(
        campaign_id=campaign["id"],
        campaign_name=campaign["name"],
        campaign_description=campaign.get("description"),
        referral_link_name=referral_link["name"],
        referral_link_description=referral_link.get("description")
    )

def process_referral_signup(db: Client, signup_data: ReferralSignup) -> dict:
    """
    Process a signup from a referral.
    """
    # Validate referral code
    validation = validate_referral_code(db, signup_data.referral_code)
    if not validation.is_valid:
        raise ValueError("Invalid referral code")
    
    # Create user record
    user_record = {
        "email": signup_data.email,
        "full_name": signup_data.full_name,
        "discord_user_id": signup_data.discord_user_id,
        "discord_username": signup_data.discord_username,
        "email_confirmed": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    user_response = db.table("users").insert(user_record).execute()
    if not user_response.data:
        raise Exception("Failed to create user")
    
    user = user_response.data[0]
    
    # Create referral tracking record
    tracking_record = {
        "referral_code": signup_data.referral_code,
        "user_id": user["id"],
        "signup_data": signup_data.additional_data or {},
        "status": "signed_up",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    db.table("referral_tracking").insert(tracking_record).execute()
    
    return {"message": "Referral signup processed successfully", "user_id": user["id"]}

def complete_referral(db: Client, completion_data: ReferralComplete) -> dict:
    """
    Mark a referral as converted.
    """
    # Find referral tracking record
    response = db.table("referral_tracking").select("*").eq("referral_code", completion_data.referral_code).eq("user_id", completion_data.user_id).execute()
    if not response.data:
        raise ValueError("Referral tracking record not found")
    
    tracking_record = response.data[0]
    
    # Update tracking record
    db.table("referral_tracking").update({
        "status": "converted",
        "conversion_data": completion_data.conversion_data or {},
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", tracking_record["id"]).execute()
    
    return {"message": "Referral marked as converted"}