from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, Dict, Any
from uuid import UUID
from supabase import Client
from starlette.requests import Request

from core.database import get_db
from services import discord_bot_service
from middleware.auth_middleware import AuthContext
from schemas.discord_bot import (
    OnboardingStart,
    OnboardingModal,
    OnboardingSession,
    OnboardingComplete,
    DiscordConfig,
    DiscordInviteContext,
    DiscordRoleAssignment
)

router = APIRouter(
    prefix="/api/discord-bot",
    tags=["Discord Bot"],
)

@router.post("/onboarding/start")
async def start_onboarding(
    onboarding_data: OnboardingStart,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Start the onboarding flow. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.start_onboarding(db, onboarding_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to start onboarding")

@router.post("/onboarding/modal")
async def submit_onboarding_modal(
    modal_data: OnboardingModal,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Submit an onboarding modal. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.submit_onboarding_modal(db, modal_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to submit onboarding modal")

@router.get("/onboarding/session", response_model=OnboardingSession)
async def get_onboarding_session(
    discord_user_id: str,
    campaign_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get user's onboarding session state. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.get_onboarding_session(db, discord_user_id, campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get onboarding session")

@router.post("/onboarding/complete")
async def complete_onboarding(
    completion_data: OnboardingComplete,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Finalize onboarding. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.complete_onboarding(db, completion_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to complete onboarding")

@router.get("/config", response_model=DiscordConfig)
async def get_discord_config(
    guild_id: str,
    campaign_id: UUID,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get guild-specific configuration for the bot. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.get_discord_config(db, guild_id, campaign_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get Discord config")

@router.get("/discord/invite/{code}/context", response_model=DiscordInviteContext)
async def get_discord_invite_context(
    code: str,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get context for a managed Discord invite. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.get_discord_invite_context(db, code)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get invite context")

@router.post("/discord/guilds/{guild_id}/members/{member_id}/roles")
async def assign_discord_role(
    guild_id: str,
    member_id: str,
    role_data: DiscordRoleAssignment,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Assign a role to a guild member. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.assign_discord_role(db, guild_id, member_id, role_data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to assign role")

@router.get("/discord/guilds/{guild_id}/members/{member_id}/roles")
async def get_member_roles(
    guild_id: str,
    member_id: str,
    request: Request,
    db: Client = Depends(get_db)
):
    """
    Get a member's roles. Requires service authentication.
    """
    try:
        auth_context: AuthContext = request.state.auth
        if not auth_context.is_service_auth:
            raise HTTPException(status_code=403, detail="Service authentication required")
        return discord_bot_service.get_member_roles(db, guild_id, member_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get member roles")