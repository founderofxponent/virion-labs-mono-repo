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
    Start the onboarding flow.
    """
    # Check if onboarding session already exists
    existing_session = db.table("onboarding_sessions").select("*").eq("discord_user_id", onboarding_data.discord_user_id).execute()
    if existing_session.data:
        raise ValueError("Onboarding session already exists")
    
    # Create onboarding session
    session_record = {
        "discord_user_id": onboarding_data.discord_user_id,
        "discord_username": onboarding_data.discord_username,
        "discord_guild_id": onboarding_data.discord_guild_id,
        "campaign_id": onboarding_data.campaign_id,
        "status": "started",
        "current_step": "initial",
        "data": {},
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    response = db.table("onboarding_sessions").insert(session_record).execute()
    if not response.data:
        raise Exception("Failed to create onboarding session")
    
    return {"message": "Onboarding started", "session_id": response.data[0]["id"]}

def submit_onboarding_modal(db: Client, modal_data: OnboardingModal) -> dict:
    """
    Submit an onboarding modal.
    """
    # Get existing session
    response = db.table("onboarding_sessions").select("*").eq("discord_user_id", modal_data.discord_user_id).execute()
    if not response.data:
        raise ValueError("Onboarding session not found")
    
    session = response.data[0]
    
    # Update session with modal data
    updated_data = session.get("data", {})
    updated_data.update({
        "full_name": modal_data.full_name,
        "email": modal_data.email,
        **(modal_data.additional_data or {})
    })
    
    db.table("onboarding_sessions").update({
        "status": "modal_submitted",
        "current_step": "verification",
        "data": updated_data,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", session["id"]).execute()
    
    return {"message": "Modal submitted successfully"}

def get_onboarding_session(db: Client, discord_user_id: str) -> OnboardingSession:
    """
    Get user's onboarding session state.
    """
    response = db.table("onboarding_sessions").select("*").eq("discord_user_id", discord_user_id).execute()
    if not response.data:
        raise ValueError("Onboarding session not found")
    
    return OnboardingSession.model_validate(response.data[0])

def complete_onboarding(db: Client, completion_data: OnboardingComplete) -> dict:
    """
    Finalize onboarding.
    """
    # Get existing session
    response = db.table("onboarding_sessions").select("*").eq("discord_user_id", completion_data.discord_user_id).execute()
    if not response.data:
        raise ValueError("Onboarding session not found")
    
    session = response.data[0]
    
    # Update session to completed
    db.table("onboarding_sessions").update({
        "status": "completed",
        "current_step": "completed",
        "data": {**session.get("data", {}), **(completion_data.final_data or {})},
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", session["id"]).execute()
    
    return {"message": "Onboarding completed successfully"}

def get_discord_config(db: Client, guild_id: str) -> DiscordConfig:
    """
    Get guild-specific configuration for the bot.
    """
    response = db.table("discord_configs").select("*").eq("guild_id", guild_id).execute()
    if not response.data:
        raise ValueError("Discord config not found")
    
    return DiscordConfig.model_validate(response.data[0])

def get_discord_invite_context(db: Client, code: str) -> DiscordInviteContext:
    """
    Get context for a managed Discord invite.
    """
    response = db.table("discord_invites").select("*").eq("invite_code", code).execute()
    if not response.data:
        raise ValueError("Discord invite not found")
    
    invite = response.data[0]
    
    # Get campaign info if available
    campaign_name = None
    if invite.get("campaign_id"):
        campaign_response = db.table("campaigns").select("name").eq("id", invite["campaign_id"]).execute()
        if campaign_response.data:
            campaign_name = campaign_response.data[0]["name"]
    
    return DiscordInviteContext(
        invite_code=code,
        campaign_id=invite.get("campaign_id"),
        campaign_name=campaign_name,
        guild_id=invite["guild_id"],
        guild_name=invite.get("guild_name"),
        context_data=invite.get("context_data")
    )

def assign_discord_role(db: Client, guild_id: str, member_id: str, role_data: DiscordRoleAssignment) -> dict:
    """
    Assign a role to a guild member.
    """
    # Record role assignment
    assignment_record = {
        "guild_id": guild_id,
        "member_id": member_id,
        "role_id": role_data.role_id,
        "reason": role_data.reason,
        "metadata": role_data.metadata or {},
        "assigned_at": datetime.utcnow().isoformat()
    }
    
    db.table("discord_role_assignments").insert(assignment_record).execute()
    
    return {"message": "Role assigned successfully"}

def get_member_roles(db: Client, guild_id: str, member_id: str) -> List[Dict[str, Any]]:
    """
    Get a member's roles.
    """
    response = db.table("discord_role_assignments").select("*").eq("guild_id", guild_id).eq("member_id", member_id).execute()
    if response.data:
        return response.data
    return []