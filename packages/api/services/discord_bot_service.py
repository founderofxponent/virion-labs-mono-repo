from supabase import Client
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

from schemas.discord_bot import (
    OnboardingStart, 
    OnboardingModal, 
    OnboardingSession, 
    OnboardingComplete,
    AccessRequestCreate,
    DiscordConfig,
    DiscordInviteContext,
    DiscordRoleAssignment
)

def start_onboarding(db: Client, onboarding_data: OnboardingStart) -> dict:
    """
    Start the onboarding flow for a user in a specific campaign.
    """
    start_record = {
        "campaign_id": onboarding_data.campaign_id,
        "discord_user_id": onboarding_data.discord_user_id,
        "discord_username": onboarding_data.discord_username,
        "guild_id": onboarding_data.guild_id,
        "started_at": datetime.utcnow().isoformat()
    }
    db.table("campaign_onboarding_starts").insert(start_record).execute()
    return {"message": "Onboarding started successfully."}

def submit_onboarding_modal(db: Client, modal_data: OnboardingModal) -> dict:
    """
    Submit responses from an onboarding modal.
    """
    for field_key, field_value in modal_data.responses.items():
        response_record = {
            "campaign_id": modal_data.campaign_id,
            "discord_user_id": modal_data.discord_user_id,
            "field_key": field_key,
            "field_value": field_value,
        }
        db.table("campaign_onboarding_responses").insert(response_record).execute()
    return {"message": "Modal responses submitted successfully."}

def get_onboarding_session(db: Client, discord_user_id: str, campaign_id: UUID) -> OnboardingSession:
    """
    Get a user's onboarding session state for a specific campaign.
    """
    responses = db.table("campaign_onboarding_responses").select("*").eq("discord_user_id", discord_user_id).eq("campaign_id", campaign_id).execute().data
    
    # This is a simplified representation. A real implementation would be more complex.
    return OnboardingSession(
        discord_user_id=discord_user_id,
        campaign_id=campaign_id,
        status="in_progress" if responses else "not_started",
        current_step=len(responses),
        responses={r["field_key"]: r["field_value"] for r in responses},
        created_at=min(r["created_at"] for r in responses) if responses else None,
        updated_at=max(r["updated_at"] for r in responses) if responses else None
    )

def complete_onboarding(db: Client, completion_data: OnboardingComplete) -> dict:
    """
    Mark a user's onboarding as complete for a campaign.
    """
    completion_record = {
        "campaign_id": completion_data.campaign_id,
        "discord_user_id": completion_data.discord_user_id,
        "completed_at": datetime.utcnow().isoformat()
    }
    db.table("campaign_onboarding_completions").insert(completion_record).execute()
    return {"message": "Onboarding completed successfully."}

def get_discord_config(db: Client, guild_id: str, campaign_id: UUID) -> DiscordConfig:
    """
    Get guild-specific bot configuration for a campaign.
    """
    response = db.table("discord_guild_campaigns").select("*").eq("guild_id", guild_id).eq("id", campaign_id).execute()
    if not response.data:
        raise ValueError("Campaign config not found for the given guild and campaign ID.")
    
    campaign = response.data[0]
    onboarding_fields = db.table("campaign_onboarding_fields").select("*").eq("campaign_id", campaign_id).execute().data

    return DiscordConfig(
        guild_id=guild_id,
        campaign_name=campaign["campaign_name"],
        welcome_message=campaign.get("welcome_message"),
        onboarding_flow=[{"key": f["field_key"], "label": f["field_label"], "type": f["field_type"]} for f in onboarding_fields]
    )

def get_discord_invite_context(db: Client, code: str) -> DiscordInviteContext:
    """
    Get context for a managed Discord invite.
    """
    response = db.table("discord_invite_links").select("*, discord_guild_campaigns(id, campaign_name, guild_id)").eq("discord_invite_code", code).execute()
    if not response.data:
        raise ValueError("Discord invite not found")
        
    invite = response.data[0]
    campaign = invite["discord_guild_campaigns"]

    return DiscordInviteContext(
        invite_code=code,
        campaign_id=campaign["id"],
        campaign_name=campaign["campaign_name"],
        guild_id=campaign["guild_id"]
    )

def assign_discord_role(db: Client, guild_id: str, member_id: str, role_data: DiscordRoleAssignment) -> dict:
    """
    This is a placeholder. In a real application, this would interact with the Discord API.
    For now, we'll just log the request to the access_requests table.
    """
    request_record = {
        "discord_user_id": member_id,
        "discord_guild_id": guild_id,
        "verified_role_id": role_data.role_id,
        "full_name": "N/A",  # Or retrieve from user profile
        "email": "N/A", # Or retrieve from user profile
        "status": "approved",
        "role_assigned_at": datetime.utcnow().isoformat(),
        "reason": role_data.reason
    }
    db.table("access_requests").insert(request_record).execute()
    return {"message": f"Role assignment for {member_id} logged."}

def get_member_roles(db: Client, guild_id: str, member_id: str) -> List[Dict[str, Any]]:
    """
    This is a placeholder. In a real application, this would interact with the Discord API.
    For now, we'll return logged role assignments.
    """
    response = db.table("access_requests").select("verified_role_id, role_assigned_at, reason").eq("guild_id", guild_id).eq("discord_user_id", member_id).eq("status", "approved").execute()
    return response.data if response.data else []