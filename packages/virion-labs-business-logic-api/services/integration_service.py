from typing import Dict, Any, List, Optional
import httpx
from core.strapi_client import strapi_client
from schemas.strapi import StrapiCampaignOnboardingStartCreate, StrapiCampaignOnboardingResponseCreate, StrapiCampaignOnboardingCompletionCreate
from domain.integrations.discord.domain import DiscordDomain
from schemas.integration_schemas import (
    Campaign,
    ClientDiscordConnection,
    ClientDiscordConnectionCreateRequest,
    ClientDiscordConnectionBotSyncRequest,
)
from core.config import settings
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class IntegrationService:
    """Service layer for integration operations."""

    def __init__(self):
        self.discord_domain = DiscordDomain()

    async def create_managed_invite(self, referral_code: str) -> Dict[str, Any]:
        """
        Create a managed Discord invite for a referral campaign.
        """
        try:
            logger.info(f"Creating managed Discord invite for referral code: {referral_code}")
            
            # Find the referral link to get campaign info
            filters = {
                "filters[referral_code][$eq]": referral_code,
                "populate[0]": "campaign",
            }
            referral_links = await strapi_client.get_referral_links(filters=filters)
            
            if not referral_links:
                return {
                    "success": False,
                    "message": f"Referral link with code '{referral_code}' not found"
                }
            
            referral_link = referral_links[0]
            campaign = referral_link.campaign
            
            if not campaign or not campaign.guild_id:
                return {
                    "success": False,
                    "message": "Campaign Discord server not configured"
                }
            
            # Create Discord invite using Discord API
            if not settings.DISCORD_BOT_TOKEN:
                logger.warning("DISCORD_BOT_TOKEN not configured, cannot create managed invite")
                # Return fallback to existing discord_invite_url if available
                fallback_url = getattr(referral_link, 'discord_invite_url', None)
                if fallback_url:
                    return {
                        "success": True,
                        "invite_url": fallback_url,
                        "message": "Using fallback invite URL"
                    }
                return {
                    "success": False,
                    "message": "Discord bot not configured and no fallback invite available"
                }
            
            # Use Discord API to create a managed invite
            # First, get the guild's channels to find a suitable channel for the invite
            guild_id = campaign.guild_id
            
            async with httpx.AsyncClient() as client:
                # Get guild channels
                headers = {"Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}"}
                
                channels_response = await client.get(
                    f"https://discord.com/api/v10/guilds/{guild_id}/channels",
                    headers=headers
                )
                
                if channels_response.status_code != 200:
                    logger.error(f"Failed to get guild channels: {channels_response.status_code} - {channels_response.text}")
                    return {
                        "success": False,
                        "message": "Failed to access Discord server"
                    }
                
                channels = channels_response.json()
                
                # Find a suitable channel (preferably general or system channel)
                target_channel_id = campaign.channel_id  # Use campaign's specific channel if set
                
                if not target_channel_id:
                    # Find the first text channel that the bot can create invites in
                    for channel in channels:
                        if channel.get('type') == 0:  # Text channel
                            target_channel_id = channel['id']
                            break
                
                if not target_channel_id:
                    return {
                        "success": False,
                        "message": "No suitable channel found for invite creation"
                    }
                
                # Create the invite
                invite_data = {
                    "max_age": 0,  # Never expires
                    "max_uses": 0,  # Unlimited uses
                    "temporary": False,  # Permanent membership
                    "unique": True  # Create a unique invite
                }
                
                invite_response = await client.post(
                    f"https://discord.com/api/v10/channels/{target_channel_id}/invites",
                    headers=headers,
                    json=invite_data
                )
                
                if invite_response.status_code == 200:
                    invite_json = invite_response.json()
                    invite_url = f"https://discord.gg/{invite_json['code']}"
                    
                    logger.info(f"Successfully created Discord invite: {invite_url}")
                    return {
                        "success": True,
                        "invite_url": invite_url,
                        "message": "Discord invite created successfully"
                    }
                else:
                    logger.error(f"Failed to create Discord invite: {invite_response.status_code} - {invite_response.text}")
                    return {
                        "success": False,
                        "message": "Failed to create Discord invite"
                    }
                    
        except Exception as e:
            logger.error(f"Error creating managed Discord invite: {e}")
            return {
                "success": False,
                "message": "Internal error creating Discord invite"
            }


    async def get_discord_campaigns(self, guild_id: str, channel_id: str, join_campaigns_channel_id: str) -> List[Campaign]:
        """
        Business operation for fetching Discord campaigns.
        """
        try:
            logger.info(f"🔍 Fetching campaigns for guild_id: {guild_id}, channel_id: {channel_id}, join_campaigns_channel_id: {join_campaigns_channel_id}")
            
            all_campaigns = await strapi_client.get_campaigns({"filters[guild_id][$eq]": guild_id})
            logger.info(f"📊 Retrieved {len(all_campaigns)} total campaigns from Strapi")
            
            # Log all campaign details for debugging
            for i, campaign in enumerate(all_campaigns):
                logger.debug(f"Campaign {i+1}: id={campaign.id}, documentId={getattr(campaign, 'documentId', None)}, name={campaign.name}, channel_id={getattr(campaign, 'channel_id', None)}")
            
            filtered_campaigns = self.discord_domain.filter_campaigns_for_channel(
                all_campaigns, channel_id, join_campaigns_channel_id
            )
            logger.info(f"🎯 After filtering: {len(filtered_campaigns)} campaigns remain")
            
            # Log filtered campaign details
            for i, campaign in enumerate(filtered_campaigns):
                logger.info(f"Filtered Campaign {i+1}: id={campaign.id}, documentId={getattr(campaign, 'documentId', None)}, name={campaign.name}")
            
            # Check for duplicate documentIds
            document_ids = [getattr(c, 'documentId', None) for c in filtered_campaigns]
            unique_document_ids = set(document_ids)
            if len(document_ids) != len(unique_document_ids):
                logger.warning(f"⚠️  DUPLICATE DOCUMENT IDs DETECTED!")
                logger.warning(f"Total campaigns: {len(document_ids)}, Unique documentIds: {len(unique_document_ids)}")
                logger.warning(f"DocumentIds: {document_ids}")
                
                # Log which documentIds are duplicated
                from collections import Counter
                id_counts = Counter(document_ids)
                duplicates = {doc_id: count for doc_id, count in id_counts.items() if count > 1}
                logger.warning(f"Duplicate documentIds: {duplicates}")
            
            result_campaigns = filtered_campaigns
            logger.info(f"✅ Returning {len(result_campaigns)} campaigns to Discord bot")
            
            return result_campaigns
        except Exception as e:
            logger.error(f"Failed to get Discord campaigns: {e}")
            raise

    # --- Client Discord Connections (Integrations page) ---
    async def list_client_discord_connections(self, current_user) -> List[ClientDiscordConnection]:
        """List connections for the current user's client (Client role) or all for Admins."""
        # Determine client scope
        role_name = (current_user.role or {}).get('name') if isinstance(current_user.role, dict) else None
        filters = {"populate": "*"}
        if role_name == 'Client':
            # Resolve the client's numeric ID and filter connections
            from services.client_service import client_service
            result = await client_service.list_clients_operation(filters={}, current_user=current_user)
            clients = result.get('clients', [])
            if not clients:
                return []
            client_id = clients[0].get('id')
            filters["filters[client][id][$eq]"] = client_id

        # Use generic Strapi request for now (no typed schema yet for this CT)
        response = await strapi_client._request("GET", "client-discord-connections", params=filters)
        items = response.get("data", [])
        connections: List[ClientDiscordConnection] = []
        for item in items:
            # Support both flat and attributes structure
            attrs = item.get('attributes', item)
            connections.append(ClientDiscordConnection(
                id=item.get('id'),
                documentId=item.get('documentId'),
                client_id=(attrs.get('client') or {}).get('id') if isinstance(attrs.get('client'), dict) else None,
                guild_id=attrs.get('guild_id'),
                guild_name=attrs.get('guild_name'),
                guild_icon_url=attrs.get('guild_icon_url'),
                discord_user_id=attrs.get('discord_user_id'),
                discord_username=attrs.get('discord_username'),
                channels=attrs.get('channels'),
                roles=attrs.get('roles'),
                status=attrs.get('status'),
                last_synced_at=attrs.get('last_synced_at')
            ))
        return connections

    async def upsert_client_discord_connection(self, request: ClientDiscordConnectionCreateRequest, current_user) -> ClientDiscordConnection:
        """Create or update a client's discord connection for a guild."""
        # Resolve client id
        from services.client_service import client_service
        result = await client_service.list_clients_operation(filters={}, current_user=current_user)
        clients = result.get('clients', [])
        if not clients:
            raise ValueError("No client associated with current user")
        client_id = clients[0].get('id')

        # Check if existing record
        filters = {
            "filters[guild_id][$eq]": request.guild_id,
            "filters[client][id][$eq]": client_id
        }
        existing = await strapi_client._request("GET", "client-discord-connections", params=filters)
        items = existing.get('data', [])

        payload = {
            "client": client_id,
            "guild_id": request.guild_id,
            "guild_name": request.guild_name,
            "guild_icon_url": request.guild_icon_url,
            "discord_user_id": getattr(request, 'discord_user_id', None),
            "discord_username": getattr(request, 'discord_username', None),
            "channels": [c.model_dump() if hasattr(c, 'model_dump') else c for c in (request.channels or [])],
            "roles": [r.model_dump() if hasattr(r, 'model_dump') else r for r in (request.roles or [])],
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "status": "connected"
        }

        if items:
            # In Strapi v5, use documentId for updates instead of numeric id
            record_document_id = items[0].get('documentId')
            if not record_document_id:
                # Fallback to numeric id if documentId not available
                record_document_id = items[0].get('id')
            resp = await strapi_client._request("PUT", f"client-discord-connections/{record_document_id}", data={"data": payload})
            data = resp.get('data', {})
        else:
            resp = await strapi_client._request("POST", "client-discord-connections", data={"data": payload})
            data = resp.get('data', {})

        attrs = data.get('attributes', data)
        return ClientDiscordConnection(
            id=data.get('id'),
            documentId=data.get('documentId'),
            client_id=client_id,
            guild_id=attrs.get('guild_id'),
            guild_name=attrs.get('guild_name'),
            guild_icon_url=attrs.get('guild_icon_url'),
            discord_user_id=attrs.get('discord_user_id'),
            discord_username=attrs.get('discord_username'),
            channels=attrs.get('channels'),
            roles=attrs.get('roles'),
            status=attrs.get('status'),
            last_synced_at=attrs.get('last_synced_at')
        )

    async def upsert_client_discord_connection_from_bot(self, request: ClientDiscordConnectionBotSyncRequest) -> ClientDiscordConnection:
        """Bot-authenticated sync path: identify client by client_document_id."""
        # Resolve client numeric ID from documentId
        client_doc_id = request.client_document_id
        # Strapi client is a collection; get by filter
        client_resp = await strapi_client._request("GET", "clients", params={"filters[documentId][$eq]": client_doc_id, "fields[0]": "id"})
        items = client_resp.get('data', [])
        if not items:
            raise ValueError("Client not found for provided client_document_id")
        client_id = items[0].get('id')

        # Upsert same as above but without current_user context
        filters = {
            "filters[guild_id][$eq]": request.guild_id,
            "filters[client][id][$eq]": client_id
        }
        existing = await strapi_client._request("GET", "client-discord-connections", params=filters)
        items = existing.get('data', [])

        payload = {
            "client": client_id,
            "guild_id": request.guild_id,
            "guild_name": request.guild_name,
            "guild_icon_url": request.guild_icon_url,
            "discord_user_id": request.discord_user_id,
            "discord_username": request.discord_username,
            "channels": [c.model_dump() if hasattr(c, 'model_dump') else c for c in (request.channels or [])],
            "roles": [r.model_dump() if hasattr(r, 'model_dump') else r for r in (request.roles or [])],
            "last_synced_at": datetime.now(timezone.utc).isoformat(),
            "status": "connected"
        }

        if items:
            # In Strapi v5, use documentId for updates instead of numeric id
            record_document_id = items[0].get('documentId')
            if not record_document_id:
                # Fallback to numeric id if documentId not available
                record_document_id = items[0].get('id')
            resp = await strapi_client._request("PUT", f"client-discord-connections/{record_document_id}", data={"data": payload})
            data = resp.get('data', {})
        else:
            resp = await strapi_client._request("POST", "client-discord-connections", data={"data": payload})
            data = resp.get('data', {})

        attrs = data.get('attributes', data)
        return ClientDiscordConnection(
            id=data.get('id'),
            documentId=data.get('documentId'),
            client_id=client_id,
            guild_id=attrs.get('guild_id'),
            guild_name=attrs.get('guild_name'),
            guild_icon_url=attrs.get('guild_icon_url'),
            discord_user_id=attrs.get('discord_user_id'),
            discord_username=attrs.get('discord_username'),
            channels=attrs.get('channels'),
            roles=attrs.get('roles'),
            status=attrs.get('status'),
            last_synced_at=attrs.get('last_synced_at')
        )

    async def generate_client_bot_install_url(self, current_user) -> str:
        """Generate OAuth2 install URL with client document ID as state parameter."""
        try:
            from urllib.parse import quote
            
            client_bot_client_id = getattr(settings, 'DISCORD_CLIENT_BOT_CLIENT_ID', None)
            logger.info(f"Discord client bot client ID: {client_bot_client_id}")
            if not client_bot_client_id:
                raise ValueError("Client bot client ID not configured")
            
            # Get client document ID
            from services.client_service import client_service
            result = await client_service.list_clients_operation(filters={}, current_user=current_user)
            clients = result.get('clients', [])
            if not clients:
                raise ValueError("No client associated with current user")
            
            client_document_id = clients[0].get('documentId')
            if not client_document_id:
                raise ValueError("Client document ID not found")
            
            # Use client document ID directly as state parameter - no database storage needed!
            state = client_document_id
            
            scopes = ["bot", "applications.commands"]
            permissions = 268435456  # View Channels + Send Messages + Use Slash Commands
            redirect_uri = f"{settings.FRONTEND_URL}/clients/integrations/discord-callback"
            
            logger.info(f"Generated Discord install URL for client {client_document_id}")
            
            return (
                f"https://discord.com/api/oauth2/authorize?client_id={client_bot_client_id}"
                f"&permissions={permissions}&scope={'%20'.join(scopes)}"
                f"&state={quote(state)}&redirect_uri={quote(redirect_uri)}&response_type=code"
            )
        except Exception as e:
            logger.error(f"Error generating install URL: {str(e)}", exc_info=True)
            raise

    async def start_client_guild_sync(self, guild_id: str, current_user) -> Dict[str, Any]:
        """Optional server-side kick-off; for now, just acknowledges request."""
        # In future, we could DM the client bot or schedule a job. For MVP, return ack
        return {"status": "pending", "guild_id": guild_id}
    
    async def handle_discord_oauth_callback(self, code: str, state: str, guild_id: str = None, permissions: str = None) -> Dict[str, Any]:
        """Handle Discord OAuth callback - state parameter contains client document ID."""
        try:
            # State parameter IS the client document ID!
            client_document_id = state
            logger.info(f"Processing OAuth callback for client document ID: {client_document_id}")
            
            # Validate that client exists and get numeric ID
            client_resp = await strapi_client._request(
                "GET", 
                "clients", 
                params={
                    "filters[documentId][$eq]": client_document_id,
                    "fields[0]": "id"
                }
            )
            
            items = client_resp.get('data', [])
            if not items:
                logger.warning(f"Client not found for document ID: {client_document_id}")
                return {"success": False, "message": "Invalid client ID"}
            
            client_id = items[0].get('id')
            logger.info(f"Found client ID {client_id} for document ID {client_document_id}")
            
            # Create client-discord-connection if guild_id provided
            if guild_id:
                connection_data = {
                    "client": client_id,
                    "guild_id": guild_id,
                    "status": "pending",  # Waiting for /sync command
                    "last_synced_at": None
                }
                
                # Check if connection already exists
                existing_connections = await strapi_client._request(
                    "GET",
                    "client-discord-connections",
                    params={
                        "filters[guild_id][$eq]": guild_id,
                        "filters[client][id][$eq]": client_id
                    }
                )
                
                if not existing_connections.get('data'):
                    # Create new connection
                    await strapi_client._request(
                        "POST", 
                        "client-discord-connections", 
                        data={"data": connection_data}
                    )
                    logger.info(f"Created new Discord connection for client {client_document_id}, guild {guild_id}")
                else:
                    logger.info(f"Discord connection already exists for client {client_document_id}, guild {guild_id}")
                
                return {
                    "success": True, 
                    "message": "Bot installed successfully! Run /sync in your Discord server to complete setup.",
                    "client_document_id": client_document_id,
                    "guild_id": guild_id
                }
            else:
                return {
                    "success": True, 
                    "message": "Bot installation completed. Run /sync in your Discord server to link it to your account.",
                    "client_document_id": client_document_id
                }
                
        except Exception as e:
            logger.error(f"Failed to handle Discord OAuth callback: {e}")
            return {"success": False, "message": "Failed to process bot installation"}
    
    async def find_client_by_guild(self, guild_id: str) -> Optional[str]:
        """Find client document ID associated with a guild."""
        try:
            # Find via client-discord-connection (created during OAuth callback)
            connections = await strapi_client._request(
                "GET",
                "client-discord-connections", 
                params={
                    "filters[guild_id][$eq]": guild_id,
                    "populate[0]": "client"
                }
            )
            
            connection_records = connections.get('data', [])
            if connection_records:
                client_data = connection_records[0]['client']
                if client_data:
                    logger.info(f"Found client {client_data['documentId']} for guild {guild_id}")
                    return client_data['documentId']
            
            logger.warning(f"No client found for guild {guild_id}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to find client by guild {guild_id}: {e}")
            return None

    async def get_pending_connections(self) -> List[Dict[str, Any]]:
        """Get all Discord connections with pending status that need to be synced."""
        try:
            # Find all connections with status 'pending'
            connections = await strapi_client._request(
                "GET",
                "client-discord-connections", 
                params={
                    "filters[status][$eq]": "pending",
                    "populate[0]": "client"
                }
            )
            
            connection_records = connections.get('data', [])
            pending_connections = []
            
            for record in connection_records:
                attrs = record.get('attributes', record)
                client_data = attrs.get('client')
                
                if client_data:
                    pending_connections.append({
                        "id": record.get('id'),
                        "guild_id": attrs.get('guild_id'),
                        "guild_name": attrs.get('guild_name'),
                        "client_document_id": client_data.get('documentId'),
                        "status": attrs.get('status'),
                        "last_synced_at": attrs.get('last_synced_at')
                    })
            
            logger.info(f"Found {len(pending_connections)} pending connections")
            return pending_connections
            
        except Exception as e:
            logger.error(f"Failed to get pending connections: {e}")
            return []

    async def request_discord_access(self, access_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Business operation for handling a Discord access request.
        This creates a Discord request access record for admin review.
        """
        try:
            discord_user_id = access_data["user_id"]
            guild_id = access_data["guild_id"]
            
            # Check if a request already exists for this user with pending or approved status
            existing_requests = await strapi_client.get_discord_request_accesses({
                "filters[discord_user_id][$eq]": discord_user_id,
                "filters[guild_id][$eq]": guild_id,
                "filters[$or][0][request_status][$eq]": "pending",
                "filters[$or][1][request_status][$eq]": "approved"
            })
            
            if existing_requests:
                logger.info(f"Duplicate request attempt for discord_user_id: {discord_user_id}, guild_id: {guild_id}")
                return {
                    "success": False, 
                    "message": "You already have a pending or approved request for this server."
                }
            
            # Construct data payload for Discord Request Access content type
            request_data = {
                "full_name": access_data["name"],
                "email": access_data["email"],
                "discord_user_id": discord_user_id,
                "discord_username": access_data["user_tag"],
                "guild_id": guild_id,
                "request_status": "approved"
            }
            
            # Create the Discord request access record
            await strapi_client.create_discord_request_access(request_data)
            
            # Get the verified role ID from Discord settings and assign it
            discord_settings = await strapi_client.get_discord_setting()
            role_assigned = False
            
            if discord_settings and discord_settings.verified_role_id:
                role_assigned = await self._assign_discord_role(
                    guild_id, 
                    discord_user_id, 
                    discord_settings.verified_role_id
                )
                
                if role_assigned:
                    logger.info(f"Successfully assigned verified role {discord_settings.verified_role_id} to user {discord_user_id}")
                else:
                    logger.warning(f"Failed to assign verified role to user {discord_user_id}")
            else:
                logger.warning("No verified role ID configured in Discord settings")
            
            logger.info(f"Successfully created and auto-approved Discord access request for user {discord_user_id} in guild {guild_id}")
            
            if role_assigned:
                return {"success": True, "message": "Access granted! You have been approved and the verified role has been assigned."}
            else:
                return {"success": True, "message": "Access granted! You have been approved, but the role assignment failed. Please contact an admin."}
            
        except Exception as e:
            logger.error(f"Failed to process Discord access request: {e}")
            return {"success": False, "message": "An error occurred."}

    async def start_discord_onboarding(self, campaign_id: str, discord_user_id: str, discord_username: str) -> Dict[str, Any]:
        """
        Business operation for starting Discord onboarding and fetching campaign fields.
        """
        try:
            # First, check if campaign_id is numeric ID or documentId
            # If it's numeric, we need to get the campaign first to get its documentId
            document_id = campaign_id
            
            # If campaign_id looks like a numeric ID, fetch the campaign to get its documentId
            if campaign_id.isdigit():
                logger.info(f"Campaign ID {campaign_id} appears to be numeric, fetching campaign to get documentId")
                campaigns = await strapi_client.get_campaigns({"filters[id][$eq]": campaign_id})
                if campaigns:
                    document_id = getattr(campaigns[0], 'documentId', None)
                    logger.info(f"Found documentId {document_id} for campaign ID {campaign_id}")
                else:
                    logger.error(f"Campaign with ID {campaign_id} not found")
                    return {"success": False, "fields": [], "message": "Campaign not found"}

            # Check if user has already completed onboarding for this campaign
            existing_completions = await strapi_client.get_onboarding_completions({
                "filters[discord_user_id][$eq]": discord_user_id,
                "filters[campaign][documentId][$eq]": document_id
            })
            if existing_completions:
                logger.info(f"User {discord_user_id} has already completed onboarding for campaign {document_id}")
                return {"success": False, "fields": [], "message": "You have already completed the onboarding for this campaign."}
            
            # Create a record to signify the start of the onboarding process
            try:
                # Get the numeric campaign ID from the document ID
                numeric_campaign_id = await strapi_client.get_campaign_id_by_document_id(document_id)
                if numeric_campaign_id:
                    # Fetch the campaign data to get guild_id
                    campaign_data = await strapi_client.get_campaign(document_id)
                    guild_id = campaign_data.guild_id if campaign_data else None
                    
                    start_data = StrapiCampaignOnboardingStartCreate(
                        discord_user_id=discord_user_id,
                        discord_username=discord_username,
                        campaign=numeric_campaign_id,
                        guild_id=guild_id
                    )
                    await strapi_client.create_onboarding_start(start_data)
                    logger.info(f"Successfully created onboarding_start record for user {discord_user_id} on campaign {document_id}")
                else:
                    logger.warning(f"Could not find numeric ID for campaign {document_id}")
            except Exception as e:
                # Log a warning but don't fail the entire process
                logger.warning(f"Could not create onboarding_start record for user {discord_user_id} on campaign {document_id}: {e}")

            # Fetch onboarding fields from Strapi using documentId
            fields_data = await strapi_client.get_onboarding_fields_by_campaign(document_id)
            
            # Transform Strapi field data to match our schema format
            transformed_fields = []
            for field in fields_data:
                transformed_field = {
                    "field_key": field.field_key or "",
                    "field_label": field.field_label or "",
                    "field_type": field.field_type or "text",
                    "field_placeholder": field.field_placeholder,
                    "field_description": field.field_description,
                    "field_options": self._extract_field_options(field.field_options),
                    "is_required": field.is_required or False,
                    "validation_rules": field.validation_rules
                }
                transformed_fields.append(transformed_field)
            
            return {"success": True, "fields": transformed_fields}
            
        except Exception as e:
            logger.error(f"Failed to start Discord onboarding: {e}")
            return {"success": False, "fields": [], "message": "Failed to fetch onboarding fields."}

    async def submit_discord_onboarding(self, campaign_id: str, discord_user_id: str, discord_username: str, responses: Dict[str, Any]) -> Dict[str, Any]:
        """
        Business operation for handling Discord onboarding submission.
        This creates a user profile with the onboarding responses.
        """
        try:
            # First, check if campaign_id is numeric ID or documentId
            # If it's numeric, we need to get the campaign first to get its documentId
            document_id = campaign_id
            
            # If campaign_id looks like a numeric ID, fetch the campaign to get its documentId
            if campaign_id.isdigit():
                logger.info(f"Campaign ID {campaign_id} appears to be numeric, fetching campaign to get documentId")
                campaigns = await strapi_client.get_campaigns({"filters[id][$eq]": campaign_id})
                if campaigns:
                    document_id = getattr(campaigns[0], 'documentId', None)
                    logger.info(f"Found documentId {document_id} for campaign ID {campaign_id}")
                else:
                    logger.error(f"Campaign with ID {campaign_id} not found")
                    return {"success": False, "message": "Campaign not found"}
            
            # Get the numeric campaign ID from the document ID for Strapi relations
            numeric_campaign_id = await strapi_client.get_campaign_id_by_document_id(document_id)
            if not numeric_campaign_id:
                logger.error(f"Could not find numeric campaign ID for document ID: {document_id}")
                return {"success": False, "message": "Campaign not found"}

            # Save each onboarding response
            for field_key, field_value in responses.items():
                response_data = StrapiCampaignOnboardingResponseCreate(
                    discord_user_id=discord_user_id,
                    discord_username=discord_username,
                    field_key=field_key,
                    field_value=field_value,
                    campaign=numeric_campaign_id
                )
                await strapi_client.create_onboarding_response(response_data)

            # Create a single record to mark the onboarding as complete
            # First fetch campaign data to get guild_id and for stats update
            campaign_data = await strapi_client.get_campaign(document_id)  # Use documentId here
            guild_id = campaign_data.guild_id if campaign_data else None
            
            completion_data = StrapiCampaignOnboardingCompletionCreate(
                discord_user_id=discord_user_id,
                discord_username=discord_username,
                campaign=numeric_campaign_id,
                guild_id=guild_id
            )
            await strapi_client.create_onboarding_completion(completion_data)

            # Update campaign statistics (increment successful_onboardings)
            try:
                if campaign_data:
                    current_count = getattr(campaign_data, 'successful_onboardings', 0)
                    update_data = {
                        "successful_onboardings": current_count + 1
                    }
                    logger.info(f"IntegrationService: Preparing to update campaign {document_id} with data: {update_data}")
                    await strapi_client.update_campaign(document_id, update_data)
            except Exception as stats_error:
                logger.warning(f"Failed to update campaign statistics: {stats_error}")
                # Don't fail the entire operation if statistics update fails
            
            # Assign Discord role if configured
            role_assigned = False
            if getattr(campaign_data, 'auto_role_assignment', False) and getattr(campaign_data, 'target_role_ids', None):
                guild_id = getattr(campaign_data, 'guild_id', None)
                for role_id in campaign_data.target_role_ids:
                    role_assigned = await self._assign_discord_role(guild_id, discord_user_id, role_id)
                    if not role_assigned:
                        logger.warning(f"Failed to assign role {role_id} to user {discord_user_id}")

            logger.info(f"Discord onboarding completed for user {discord_user_id} on campaign {campaign_id}")
            return {"success": True, "message": "Onboarding completed successfully!", "role_assigned": role_assigned}
            
        except Exception as e:
            logger.error(f"Failed to submit Discord onboarding: {e}")
            return {"success": False, "message": "Failed to complete onboarding. Please try again."}

    async def has_verified_role(self, user_id: str, guild_id: str) -> bool:
        """
        Check if a Discord user has the verified role in a guild using Discord API.
        """
        try:
            # Get the verified role ID from Discord settings
            discord_settings = await strapi_client.get_discord_setting()
            if not discord_settings or not discord_settings.verified_role_id:
                logger.warning("No verified role ID configured in Discord settings")
                return False
            
            verified_role_id = discord_settings.verified_role_id
            
            # Check if Discord bot token is configured
            if not settings.DISCORD_BOT_TOKEN:
                logger.warning("DISCORD_BOT_TOKEN not configured, cannot check role")
                return False
            
            # Use Discord API to check if user has the role
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}"}
                
                # Get guild member info
                response = await client.get(
                    f"https://discord.com/api/v10/guilds/{guild_id}/members/{user_id}",
                    headers=headers
                )
                
                if response.status_code == 404:
                    # User is not a member of the guild
                    return False
                elif response.status_code != 200:
                    logger.error(f"Discord API error checking member: {response.status_code} - {response.text}")
                    return False
                
                member_data = response.json()
                user_role_ids = member_data.get("roles", [])
                
                # Check if user has the verified role
                has_role = verified_role_id in user_role_ids
                logger.info(f"User {user_id} has verified role {verified_role_id}: {has_role}")
                return has_role
                
        except Exception as e:
            logger.error(f"Failed to check verified role: {e}")
            return False

    def _extract_field_options(self, field_options: Any) -> Optional[List[str]]:
        """
        Extract field options from Strapi response format.
        Handles both direct list format and nested dictionary format.
        """
        if not field_options:
            return None
        
        # If it's already a list, return as is
        if isinstance(field_options, list):
            return field_options
        
        # If it's a dictionary with 'options' key, extract the list
        if isinstance(field_options, dict) and 'options' in field_options:
            return field_options['options']
        
        # Fallback: return None for unexpected formats
        return None

    async def _assign_discord_role(self, guild_id: str, user_id: str, role_id: str) -> bool:
        """
        Assigns a role to a user in a specific guild using the Discord API.
        """
        if not settings.DISCORD_BOT_TOKEN:
            logger.warning("DISCORD_BOT_TOKEN is not configured. Cannot assign roles.")
            return False

        url = f"https://discord.com/api/v10/guilds/{guild_id}/members/{user_id}/roles/{role_id}"
        headers = {
            "Authorization": f"Bot {settings.DISCORD_BOT_TOKEN}"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.put(url, headers=headers)
                response.raise_for_status()
                logger.info(f"Successfully assigned role {role_id} to user {user_id} in guild {guild_id}")
                return True
            except httpx.HTTPStatusError as e:
                logger.error(f"Failed to assign role {role_id} to user {user_id} in guild {guild_id}. Status: {e.response.status_code}, Response: {e.response.text}")
                return False
            except Exception as e:
                logger.error(f"An unexpected error occurred while assigning a Discord role: {e}")
                return False

integration_service = IntegrationService()