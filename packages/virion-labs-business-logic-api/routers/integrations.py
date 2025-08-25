from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from schemas.integration_schemas import (
    GetCampaignsResponse,
    RequestAccessRequest,
    RequestAccessResponse,
    HasVerifiedRoleResponse,
    OnboardingStartRequest,
    OnboardingStartResponse,
    OnboardingSubmitRequest,
    OnboardingSubmitResponse,
    CreateManagedInviteRequest,
    CreateManagedInviteResponse,
    ClientDiscordConnectionCreateRequest,
    ClientDiscordConnectionResponse,
    ClientDiscordConnectionListResponse,
    ClientDiscordConnectionBotSyncRequest,
    ClientDiscordSyncStartRequest,
    AssignVerifiedRoleRequest,
    AssignVerifiedRoleResponse,
    ValidateBranchingLogicRequest,
    ValidateBranchingLogicResponse,
    SimulateBranchingRequest,
    SimulateBranchingResponse
)
from services.integration_service import integration_service
from core.auth import get_api_key
from core.auth import get_current_user, StrapiUser as User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/discord/campaigns/{guild_id}", response_model=GetCampaignsResponse)
async def get_discord_campaigns(guild_id: str, channel_id: str, join_campaigns_channel_id: str = None, api_key: str = Depends(get_api_key)):
    """
    Get campaigns for a Discord guild, filtered by channel.
    """
    try:
        campaigns = await integration_service.get_discord_campaigns(guild_id, channel_id, join_campaigns_channel_id)
        campaigns_dicts = [campaign.model_dump() for campaign in campaigns]
        
        # Debug logging to see what's being returned
        for i, campaign_dict in enumerate(campaigns_dicts):
            logger.info(f"🔍 Campaign {i+1} being returned to Discord bot:")
            logger.info(f"  - ID: {campaign_dict.get('id')}")
            logger.info(f"  - Name: {campaign_dict.get('name')}")
            logger.info(f"  - target_role_ids: {campaign_dict.get('target_role_ids')}")
            logger.info(f"  - auto_role_assignment: {campaign_dict.get('auto_role_assignment')}")
        
        return GetCampaignsResponse(campaigns=campaigns_dicts)
    except Exception as e:
        logger.error(f"Failed to get Discord campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve campaigns.")

@router.post("/discord/request-access", response_model=RequestAccessResponse)
async def request_discord_access(request: RequestAccessRequest, api_key: str = Depends(get_api_key)):
    """
    Handle a user's request for access in Discord.
    """
    try:
        result = await integration_service.request_discord_access(request.model_dump())
        return RequestAccessResponse(**result)
    except Exception as e:
        logger.error(f"Failed to process Discord access request: {e}")
        raise HTTPException(status_code=500, detail="Failed to process access request.")

@router.get("/discord/user/{user_id}/has-verified-role/{guild_id}", response_model=HasVerifiedRoleResponse)
async def has_verified_role(user_id: str, guild_id: str, api_key: str = Depends(get_api_key)):
    """
    Check if a Discord user has the verified role in a guild.
    """
    try:
        has_role = await integration_service.has_verified_role(user_id, guild_id)
        return HasVerifiedRoleResponse(has_role=has_role)
    except Exception as e:
        logger.error(f"Failed to check for verified role: {e}")
        raise HTTPException(status_code=500, detail="Failed to check user role.")

@router.post("/discord/onboarding/start", response_model=OnboardingStartResponse)
async def start_discord_onboarding(request: OnboardingStartRequest, api_key: str = Depends(get_api_key)):
    """
    Start Discord onboarding process and get campaign onboarding fields.
    """
    try:
        result = await integration_service.start_discord_onboarding(
            request.campaign_id,
            request.discord_user_id,
            request.discord_username
        )
        return OnboardingStartResponse(**result)
    except Exception as e:
        logger.error(f"Failed to start Discord onboarding: {e}")
        raise HTTPException(status_code=500, detail="Failed to start onboarding process.")

@router.post("/discord/onboarding/submit", response_model=OnboardingSubmitResponse)
async def submit_discord_onboarding(request: OnboardingSubmitRequest, api_key: str = Depends(get_api_key)):
    """
    Submit Discord onboarding responses and complete the onboarding process.
    """
    try:
        result = await integration_service.submit_discord_onboarding(
            request.campaign_id,
            request.discord_user_id,
            request.discord_username,
            request.responses
        )
        return OnboardingSubmitResponse(**result)
    except Exception as e:
        logger.error(f"Failed to submit Discord onboarding: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding.")

@router.post("/discord/create-managed-invite", response_model=CreateManagedInviteResponse)
async def create_managed_invite(request: CreateManagedInviteRequest, api_key: str = Depends(get_api_key)):
    """
    Create a managed Discord invite for a referral campaign.
    """
    try:
        result = await integration_service.create_managed_invite(request.referral_code)
        return CreateManagedInviteResponse(**result)
    except Exception as e:
        logger.error(f"Failed to create managed Discord invite: {e}")
        raise HTTPException(status_code=500, detail="Failed to create Discord invite.")

# --- Client Discord Connections (Integrations page) ---
@router.get("/discord/client/connections", response_model=ClientDiscordConnectionListResponse)
async def list_client_discord_connections(
    client_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    try:
        logger.info(
            f"list_client_discord_connections: user_id={getattr(current_user, 'id', None)}, "
            f"role={getattr(current_user, 'role', None)}, client_id_param={client_id}"
        )
        result = await integration_service.list_client_discord_connections(current_user, client_id)
        return ClientDiscordConnectionListResponse(connections=result)
    except Exception as e:
        logger.error(f"Failed to list client discord connections: {e}")
        raise HTTPException(status_code=500, detail="Failed to list connections")

@router.post("/discord/client/connections", response_model=ClientDiscordConnectionResponse)
async def upsert_client_discord_connection(request: ClientDiscordConnectionCreateRequest, current_user: User = Depends(get_current_user)):
    try:
        connection = await integration_service.upsert_client_discord_connection(request, current_user)
        return ClientDiscordConnectionResponse(connection=connection)
    except Exception as e:
        logger.error(f"Failed to upsert client discord connection: {e}")
        raise HTTPException(status_code=500, detail="Failed to save connection")

@router.post("/discord/client/bot-sync", dependencies=[Depends(get_api_key)])
async def client_bot_sync_webhook(request: ClientDiscordConnectionBotSyncRequest):
    """
    Webhook for the client-specific Discord bot to push guild, channel, and role data
    after running a sync command inside the client's server.
    """
    try:
        connection = await integration_service.upsert_client_discord_connection_from_bot(request)
        return {"status": "ok", "connection": connection.model_dump() if hasattr(connection, 'model_dump') else connection}
    except Exception as e:
        logger.error(f"Failed to handle client bot sync webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to process bot sync")

@router.get("/discord/client/install-url")
async def get_client_bot_install_url(current_user: User = Depends(get_current_user)):
    try:
        url = await integration_service.generate_client_bot_install_url(current_user)
        return {"install_url": url}
    except Exception as e:
        logger.error(f"Failed to generate install URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate install URL")

@router.get("/discord/campaign/install-url")
async def get_campaign_bot_install_url(current_user: User = Depends(get_current_user)):
    try:
        # Log the user details for debugging
        logger.info(f"Campaign bot install URL request from user: {getattr(current_user, 'id', None)}")
        logger.info(f"User role: {getattr(current_user, 'role', None)}")
        logger.info(f"User role type: {type(getattr(current_user, 'role', None))}")
        
        # Check user role - handle multiple possible role formats
        user_role = getattr(current_user, 'role', None)
        is_admin = False
        
        if user_role:
            # Handle string role
            if isinstance(user_role, str):
                is_admin = user_role.lower() in ['platform administrator', 'admin']
            # Handle role object with name attribute
            elif hasattr(user_role, 'name'):
                role_name = getattr(user_role, 'name', '').lower()
                is_admin = role_name in ['platform administrator', 'admin']
            # Handle role as dict
            elif isinstance(user_role, dict):
                role_name = user_role.get('name', '').lower()
                is_admin = role_name in ['platform administrator', 'admin']
            # Fallback - convert to string and check
            else:
                role_str = str(user_role).lower()
                is_admin = role_str in ['platform administrator', 'admin']
        
        logger.info(f"Is admin check result: {is_admin}")
        
        if not is_admin:
            raise HTTPException(status_code=403, detail="Only platform administrators can install campaign bot")
        
        url = await integration_service.generate_campaign_bot_install_url(current_user)
        return {"install_url": url}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate campaign bot install URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate campaign bot install URL")

@router.post("/discord/client/sync/start")
async def start_client_guild_sync(request: ClientDiscordSyncStartRequest, current_user: User = Depends(get_current_user)):
    try:
        result = await integration_service.start_client_guild_sync(request.guild_id, current_user)
        return result
    except Exception as e:
        logger.error(f"Failed to start guild sync: {e}")
        raise HTTPException(status_code=500, detail="Failed to start sync")

@router.post("/discord/client/assign-verified-role", response_model=AssignVerifiedRoleResponse)
async def assign_verified_role(request: AssignVerifiedRoleRequest, current_user: User = Depends(get_current_user)):
    """
    Assign a verified role to a specific Discord connection/server.
    """
    try:
        result = await integration_service.assign_verified_role_to_connection(
            request.connection_id, 
            request.guild_id, 
            request.role_id, 
            current_user
        )
        return AssignVerifiedRoleResponse(**result)
    except Exception as e:
        logger.error(f"Failed to assign verified role: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign verified role")

@router.get("/discord/client/oauth-callback")
async def discord_oauth_callback(code: str = None, state: str = None, guild_id: str = None, permissions: str = None, error: str = None):
    """Handle Discord OAuth callback after bot installation."""
    from fastapi.responses import JSONResponse
    
    if error:
        logger.error(f"Discord OAuth error: {error}")
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": f"Discord authorization failed: {error}"}
        )
    
    if not code or not state:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Missing required parameters"}
        )
    
    try:
        result = await integration_service.handle_discord_oauth_callback(code, state, guild_id, permissions)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Failed to handle Discord OAuth callback: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to process bot installation"}
        )

@router.get("/discord/client/find-by-guild/{guild_id}", dependencies=[Depends(get_api_key)])
async def find_client_by_guild(guild_id: str):
    """Find client document ID associated with a Discord guild."""
    try:
        client_document_id = await integration_service.find_client_by_guild(guild_id)
        if client_document_id:
            return {"client_document_id": client_document_id}
        else:
            raise HTTPException(status_code=404, detail="No client found for this guild")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to find client by guild: {e}")
        raise HTTPException(status_code=500, detail="Failed to find client")

@router.get("/discord/client/pending-connections", dependencies=[Depends(get_api_key)])
async def get_pending_connections():
    """Get all pending Discord connections that need to be synced."""
    try:
        pending_connections = await integration_service.get_pending_connections()
        return pending_connections
    except Exception as e:
        logger.error(f"Failed to get pending connections: {e}")
        raise HTTPException(status_code=500, detail="Failed to get pending connections")

# Branching Logic API Endpoints

@router.post("/branching/validate", response_model=ValidateBranchingLogicResponse, dependencies=[Depends(get_api_key)])
async def validate_branching_logic(request: ValidateBranchingLogicRequest):
    """
    Validate branching logic rules for correctness and consistency.
    
    This endpoint checks:
    - Valid operators and actions
    - Field key existence
    - Rule structure and syntax
    - Potential conflicts between rules
    - Value formats for specific operators
    """
    try:
        # Convert request to dict format for the service
        branching_rules = [rule.model_dump() for rule in request.branching_rules]
        
        result = integration_service.validate_branching_logic(branching_rules, request.field_keys)
        return ValidateBranchingLogicResponse(**result)
    except Exception as e:
        logger.error(f"Failed to validate branching logic: {e}")
        raise HTTPException(status_code=500, detail="Failed to validate branching logic")

@router.post("/branching/simulate", response_model=SimulateBranchingResponse, dependencies=[Depends(get_api_key)])
async def simulate_branching_flow(request: SimulateBranchingRequest):
    """
    Simulate how branching logic would be applied given specific user responses.
    
    This endpoint:
    - Evaluates all branching rules against provided responses
    - Returns which fields would be visible/hidden/required
    - Shows what field values would be set automatically
    - Indicates the next step in multi-step flows
    - Provides metadata about which rules were applied
    """
    try:
        # Convert request to dict format for the service
        branching_rules = [rule.model_dump() for rule in request.branching_rules]
        all_fields = [field.model_dump() for field in request.all_fields]
        
        result = integration_service.simulate_branching_flow(branching_rules, request.responses, all_fields)
        return SimulateBranchingResponse(**result)
    except Exception as e:
        logger.error(f"Failed to simulate branching flow: {e}")
        raise HTTPException(status_code=500, detail="Failed to simulate branching flow")