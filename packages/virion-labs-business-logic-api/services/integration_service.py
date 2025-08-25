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
                logger.debug(f"Campaign {i+1} target_role_ids: {getattr(campaign, 'target_role_ids', None)}")
                logger.debug(f"Campaign {i+1} auto_role_assignment: {getattr(campaign, 'auto_role_assignment', None)}")
            
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
    async def list_client_discord_connections(self, current_user, client_id: Optional[str] = None) -> List[ClientDiscordConnection]:
        """List connections for the current user's client (Client role) or filtered by client_id for Admins."""
        # Determine client scope
        role_name = current_user.role if isinstance(current_user.role, str) else (current_user.role or {}).get('name') if isinstance(current_user.role, dict) else 'Client'
        logger.info(
            f"IntegrationService.list_client_discord_connections: user_id={getattr(current_user, 'id', None)}, "
            f"role_name={role_name}, client_id_param={client_id}"
        )
        filters = {"populate": "*"}
        
        if role_name == 'Client':
            # Resolve the client's numeric ID and filter connections
            from services.client_service import client_service
            result = await client_service.list_clients_operation(filters={}, current_user=current_user)
            clients = result.get('clients', [])
            if not clients:
                return []
            resolved_client_id = clients[0].get('id')
            filters["filters[client][id][$eq]"] = resolved_client_id
        elif role_name == 'Platform Administrator' and client_id:
            # For Platform Administrator users, filter by the provided client_id parameter
            filters["filters[client][id][$eq]"] = client_id
        elif role_name == 'Platform Administrator' and not client_id:
            # For Platform Administrator users without client_id, return all connections
            logger.info("Platform Administrator without client_id param - returning all connections.")
            # No filters needed - return all connections
            pass

        # Use generic Strapi request for now (no typed schema yet for this CT)
        logger.info(f"IntegrationService.list_client_discord_connections: calling Strapi with params={filters}")
        response = await strapi_client._request("GET", "client-discord-connections", params=filters)
        items = response.get("data", [])
        connections: List[ClientDiscordConnection] = []
        for item in items:
            # Support both flat and attributes structure
            attrs = item.get('attributes', item)
            logger.debug(f"Processing item: {item}")
            logger.debug(f"Attributes: {attrs}")
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
                connection_status=attrs.get('connection_status'),
                last_synced_at=attrs.get('last_synced_at'),
                verified_role_id=attrs.get('verified_role_id')
            ))
        logger.info(f"IntegrationService.list_client_discord_connections: returning {len(connections)} connections")
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
            "connection_status": "connected"
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
            connection_status=attrs.get('connection_status'),
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
            "connection_status": "connected"
        }

        # Debug log a small sample to verify memberCount is flowing through
        try:
            sample_roles = payload.get("roles") or []
            sample_preview = [
                {
                    "id": r.get("id"),
                    "name": r.get("name"),
                    "memberCount": r.get("memberCount"),
                }
                for r in (sample_roles[:3] if isinstance(sample_roles, list) else [])
            ]
            logger.info(
                f"Bot sync upsert for guild {request.guild_id}: roles={len(sample_roles)} sample={sample_preview}"
            )
        except Exception:
            pass

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
            connection_status=attrs.get('connection_status'),
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

    async def generate_campaign_bot_install_url(self, current_user) -> str:
        """Generate OAuth2 install URL for campaign bot."""
        try:
            from urllib.parse import quote
            
            campaign_bot_client_id = getattr(settings, 'DISCORD_CAMPAIGN_BOT_CLIENT_ID', None)
            logger.info(f"Discord campaign bot client ID: {campaign_bot_client_id}")
            if not campaign_bot_client_id:
                raise ValueError("Campaign bot client ID not configured")
            
            # For platform administrators, we don't need a specific client context
            # Use a generic state or admin identifier
            state = "platform_admin_campaign_bot"
            
            scopes = ["bot", "applications.commands"]
            permissions = 268435456  # View Channels + Send Messages + Use Slash Commands
            redirect_uri = f"{settings.FRONTEND_URL}/admin/integrations/discord-callback"
            
            logger.info(f"Generated Discord campaign bot install URL for admin")
            
            return (
                f"https://discord.com/api/oauth2/authorize?client_id={campaign_bot_client_id}"
                f"&permissions={permissions}&scope={'%20'.join(scopes)}"
                f"&state={quote(state)}&redirect_uri={quote(redirect_uri)}&response_type=code"
            )
        except Exception as e:
            logger.error(f"Error generating campaign bot install URL: {str(e)}", exc_info=True)
            raise

    async def start_client_guild_sync(self, guild_id: str, current_user) -> Dict[str, Any]:
        """Optional server-side kick-off; for now, just acknowledges request."""
        # In future, we could DM the client bot or schedule a job. For MVP, return ack
        return {"connection_status": "pending", "guild_id": guild_id}
    
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
                    "connection_status": "pending",  # Waiting for /sync command
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
                    "filters[connection_status][$eq]": "pending",
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
                        "connection_status": attrs.get('connection_status'),
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
            
            # Get the verified role ID from client discord connection and assign it
            role_assigned = False
            verified_role_id = None
            
            # First, try to get the verified role ID from the client discord connection
            try:
                client_connections = await strapi_client._request(
                    "GET", 
                    "client-discord-connections",
                    params={
                        "filters[guild_id][$eq]": guild_id,
                        "populate[0]": "client"
                    }
                )
                
                connections = client_connections.get('data', [])
                if connections:
                    attrs = connections[0].get('attributes', connections[0])
                    verified_role_id = attrs.get('verified_role_id')
                    logger.info(f"Found client-specific verified role ID: {verified_role_id} for guild {guild_id}")
                else:
                    logger.warning(f"No client discord connection found for guild {guild_id}")
                    
            except Exception as e:
                logger.error(f"Failed to fetch client discord connection for guild {guild_id}: {e}")
            
            # Fallback to global Discord settings if no client-specific role ID is configured
            if not verified_role_id:
                logger.info("No client-specific verified role ID found, falling back to global Discord settings")
                discord_settings = await strapi_client.get_discord_setting()
                if discord_settings and discord_settings.verified_role_id:
                    verified_role_id = discord_settings.verified_role_id
                    logger.info(f"Using global verified role ID: {verified_role_id}")
                else:
                    logger.warning("No verified role ID configured in Discord settings")
            
            # Assign the role if we found a verified role ID
            if verified_role_id:
                role_assigned = await self._assign_discord_role(
                    guild_id, 
                    discord_user_id, 
                    verified_role_id
                )
                
                if role_assigned:
                    logger.info(f"Successfully assigned verified role {verified_role_id} to user {discord_user_id}")
                else:
                    logger.warning(f"Failed to assign verified role to user {discord_user_id}")
            else:
                logger.warning("No verified role ID found - neither client-specific nor global")
            
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
            # Fields are already sorted by sort_order in strapi_client.get_onboarding_fields_by_campaign
            fields_data = await strapi_client.get_onboarding_fields_by_campaign(document_id)
            
            # Sort fields by sort_order to ensure correct ordering
            sorted_fields = sorted(fields_data, key=lambda x: x.sort_order or 0)
            
            # Transform Strapi field data to match our schema format while preserving order
            transformed_fields = []
            for field in sorted_fields:
                transformed_field = {
                    "field_key": field.field_key or "",
                    "field_label": field.field_label or "",
                    "field_type": field.field_type or "text",
                    "field_placeholder": field.field_placeholder,
                    "field_description": field.field_description,
                    "field_options": self._extract_field_options(field.field_options),
                    "is_required": field.is_required or False,
                    "validation_rules": field.validation_rules,
                    "sort_order": field.sort_order or 0,
                    "step_number": field.step_number or 1,
                    "step_role_ids": field.step_role_ids or [],
                    "branching_logic": field.branching_logic or []
                }
                transformed_fields.append(transformed_field)
            
            logger.info(f"Returning {len(transformed_fields)} onboarding fields for campaign {document_id}, ordered by sort_order")
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
            verified_role_id = None
            
            # First, try to get the verified role ID from the client discord connection
            try:
                client_connections = await strapi_client._request(
                    "GET", 
                    "client-discord-connections",
                    params={
                        "filters[guild_id][$eq]": guild_id,
                        "populate[0]": "client"
                    }
                )
                
                connections = client_connections.get('data', [])
                if connections:
                    attrs = connections[0].get('attributes', connections[0])
                    verified_role_id = attrs.get('verified_role_id')
                    logger.info(f"Using client-specific verified role ID: {verified_role_id} for guild {guild_id}")
                else:
                    logger.warning(f"No client discord connection found for guild {guild_id}")
                    
            except Exception as e:
                logger.error(f"Failed to fetch client discord connection for guild {guild_id}: {e}")
            
            # Fallback to global Discord settings if no client-specific role ID is configured
            if not verified_role_id:
                logger.info("No client-specific verified role ID found, falling back to global Discord settings")
                discord_settings = await strapi_client.get_discord_setting()
                if not discord_settings or not discord_settings.verified_role_id:
                    logger.warning("No verified role ID configured in Discord settings")
                    return False
                verified_role_id = discord_settings.verified_role_id
                logger.info(f"Using global verified role ID: {verified_role_id}")
            
            if not verified_role_id:
                logger.warning("No verified role ID found - neither client-specific nor global")
                return False
            
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

    async def assign_verified_role_to_connection(self, connection_id: str, guild_id: str, role_id: str, current_user) -> dict:
        """
        Assign a verified role to a specific Discord connection.
        """
        try:
            # Check if user has permissions to modify this connection
            role_name = current_user.role if isinstance(current_user.role, str) else current_user.role.get('name', 'Client') if isinstance(current_user.role, dict) else 'Client'
            is_admin = role_name.lower() in ['admin', 'platform administrator']
            
            # Get the connection to verify it exists and user has access
            connections = await self.list_client_discord_connections(current_user, None)
            target_connection = None
            
            for conn in connections:
                if (conn.documentId == connection_id or str(conn.id) == connection_id) and conn.guild_id == guild_id:
                    target_connection = conn
                    break
            
            if not target_connection:
                return {
                    "success": False, 
                    "message": "Connection not found or you don't have permission to modify it"
                }
            
            # Update the connection with the verified role ID
            update_data = {
                "verified_role_id": role_id
            }
            
            # Update in Strapi
            if target_connection.documentId:
                await strapi_client._request(
                    "PUT", 
                    f"client-discord-connections/{target_connection.documentId}", 
                    data={"data": update_data}
                )
            else:
                # This shouldn't happen in normal cases, but handle it gracefully
                logger.warning(f"No documentId found for connection {connection_id}")
                return {
                    "success": False, 
                    "message": "Unable to update connection - invalid document ID"
                }
            
            # Return the updated connection
            updated_connections = await self.list_client_discord_connections(current_user, None)
            updated_connection = None
            
            for conn in updated_connections:
                if (conn.documentId == connection_id or str(conn.id) == connection_id) and conn.guild_id == guild_id:
                    updated_connection = conn
                    break
            
            return {
                "success": True,
                "message": f"Successfully assigned verified role {role_id} to server {guild_id}",
                "connection": updated_connection
            }
            
        except Exception as e:
            logger.error(f"Failed to assign verified role: {e}")
            return {
                "success": False,
                "message": "Failed to assign verified role. Please try again."
            }

    def evaluate_branching_logic(self, responses: Dict[str, Any], branching_rules: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Enhanced evaluates branching logic with support for complex conditions, nested logic, and AND/OR operators.
        Returns dict with visible_fields list, hidden_fields list, next_step number, and metadata.
        
        Enhanced branching rule structure:
        {
            "conditions": {
                "logic": "AND" | "OR",
                "conditions": [
                    {
                        "field_key": "field_name",
                        "operator": "equals" | "not_equals" | ...,
                        "value": "comparison_value",
                        "case_sensitive": bool
                    }
                ],
                "groups": [  # Optional nested condition groups
                    {
                        "logic": "AND" | "OR",
                        "conditions": [...]
                    }
                ]
            },
            "action": "show" | "hide" | "skip_to_step" | "require_field" | "set_field_value",
            "target_fields": ["field1", "field2"],
            "target_step": int,
            "target_value": any,
            "priority": int,
            "description": "Human readable description"
        }
        """
        visible_fields = set()
        hidden_fields = set()
        required_fields = set()
        field_values = {}
        next_step = None
        applied_rules = []
        
        # Sort rules by priority (higher priority first)
        sorted_rules = sorted(branching_rules, key=lambda x: x.get('priority', 0), reverse=True)

        for rule in sorted_rules:
            condition_met = False
            
            # Handle both new and legacy rule formats
            if 'conditions' in rule and isinstance(rule['conditions'], dict):
                # New enhanced format with nested conditions
                condition_met = self._evaluate_condition_group(responses, rule['conditions'])
            elif 'condition' in rule:
                # Legacy single condition format
                condition_met = self._evaluate_condition(responses, rule.get('condition', {}))
            
            if condition_met:
                action = rule.get('action')
                rule_description = rule.get('description', f'Rule with action: {action}')
                applied_rules.append({
                    'action': action,
                    'description': rule_description,
                    'priority': rule.get('priority', 0)
                })
                
                # Handle different actions
                if action == 'show':
                    target_fields = rule.get('target_fields', [])
                    for field in target_fields:
                        visible_fields.add(field)
                        hidden_fields.discard(field)  # Remove from hidden if was there
                        
                elif action == 'hide':
                    target_fields = rule.get('target_fields', [])
                    for field in target_fields:
                        hidden_fields.add(field)
                        visible_fields.discard(field)  # Remove from visible if was there
                        
                elif action == 'require_field':
                    target_fields = rule.get('target_fields', [])
                    for field in target_fields:
                        required_fields.add(field)
                        
                elif action == 'set_field_value':
                    target_fields = rule.get('target_fields', [])
                    target_value = rule.get('target_value')
                    for field in target_fields:
                        field_values[field] = target_value
                        
                elif action == 'skip_to_step':
                    target_step = rule.get('target_step')
                    if target_step is not None:
                        next_step = target_step

        return {
            "visible_fields": list(visible_fields),
            "hidden_fields": list(hidden_fields),
            "required_fields": list(required_fields),
            "field_values": field_values,
            "next_step": next_step,
            "applied_rules": applied_rules
        }

    def _evaluate_condition_group(self, responses: Dict[str, Any], condition_group: Dict[str, Any]) -> bool:
        """
        Evaluates a group of conditions with AND/OR logic and supports nested groups.
        
        Structure:
        {
            "logic": "AND" | "OR",
            "conditions": [
                {
                    "field_key": "field_name",
                    "operator": "equals",
                    "value": "test_value",
                    "case_sensitive": false
                }
            ],
            "groups": [  # Optional nested groups
                {
                    "logic": "OR",
                    "conditions": [...]
                }
            ]
        }
        """
        logic = condition_group.get('logic', 'AND').upper()
        conditions = condition_group.get('conditions', [])
        nested_groups = condition_group.get('groups', [])
        
        condition_results = []
        
        # Evaluate individual conditions
        for condition in conditions:
            result = self._evaluate_condition(responses, condition)
            condition_results.append(result)
        
        # Evaluate nested groups recursively
        for group in nested_groups:
            result = self._evaluate_condition_group(responses, group)
            condition_results.append(result)
        
        # If no conditions, return True (empty condition group is considered satisfied)
        if not condition_results:
            return True
        
        # Apply logic operator
        if logic == 'AND':
            return all(condition_results)
        elif logic == 'OR':
            return any(condition_results)
        else:
            logger.warning(f"Unknown logic operator: {logic}, defaulting to AND")
            return all(condition_results)

    def _evaluate_condition(self, responses: Dict[str, Any], condition: Dict[str, Any]) -> bool:
        """
        Enhanced evaluates a single branching condition with support for advanced operators.
        
        Supported operators:
        - Basic: equals, not_equals, contains, not_contains, empty, not_empty
        - Numeric: greater_than, less_than, greater_than_or_equal, less_than_or_equal, between, not_between
        - String: starts_with, ends_with, matches_regex
        - List: in_list, not_in_list, array_contains, array_length_equals
        - Date: before_date, after_date, between_dates
        """
        import re
        from datetime import datetime, date
        
        field_key = condition.get('field_key')
        operator = condition.get('operator')
        condition_value = condition.get('value')
        case_sensitive = condition.get('case_sensitive', False)

        if not field_key or not operator:
            return False

        field_value = responses.get(field_key)
        string_value = str(field_value or '')
        
        # Handle case sensitivity for string comparisons
        if not case_sensitive and isinstance(field_value, str):
            string_value = string_value.lower()
            if isinstance(condition_value, str):
                condition_value = condition_value.lower()
        
        # Parse numeric value
        numeric_value = None
        try:
            numeric_value = float(field_value) if field_value is not None else None
        except (ValueError, TypeError):
            pass

        # Parse date value
        date_value = None
        try:
            if isinstance(field_value, str) and field_value:
                # Try common date formats
                for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%d/%m/%Y', '%m/%d/%Y']:
                    try:
                        date_value = datetime.strptime(field_value, fmt).date()
                        break
                    except ValueError:
                        continue
            elif isinstance(field_value, (datetime, date)):
                date_value = field_value.date() if isinstance(field_value, datetime) else field_value
        except (ValueError, TypeError):
            pass

        # Basic operators
        if operator == 'equals':
            return string_value == str(condition_value)

        elif operator == 'not_equals':
            return string_value != str(condition_value)

        elif operator == 'contains':
            return str(condition_value) in string_value

        elif operator == 'not_contains':
            return str(condition_value) not in string_value

        elif operator == 'empty':
            return string_value.strip() == ''

        elif operator == 'not_empty':
            return string_value.strip() != ''

        # String operators
        elif operator == 'starts_with':
            return string_value.startswith(str(condition_value))

        elif operator == 'ends_with':
            return string_value.endswith(str(condition_value))

        elif operator == 'matches_regex':
            try:
                pattern = condition_value
                flags = 0 if case_sensitive else re.IGNORECASE
                return bool(re.search(pattern, string_value, flags))
            except re.error:
                logger.warning(f"Invalid regex pattern: {condition_value}")
                return False

        # Numeric operators
        elif operator == 'greater_than':
            if numeric_value is not None:
                try:
                    return numeric_value > float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'less_than':
            if numeric_value is not None:
                try:
                    return numeric_value < float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'greater_than_or_equal':
            if numeric_value is not None:
                try:
                    return numeric_value >= float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'less_than_or_equal':
            if numeric_value is not None:
                try:
                    return numeric_value <= float(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'between':
            if numeric_value is not None and isinstance(condition_value, (list, tuple)) and len(condition_value) == 2:
                try:
                    min_val, max_val = float(condition_value[0]), float(condition_value[1])
                    return min_val <= numeric_value <= max_val
                except (ValueError, TypeError):
                    return False
            return False

        elif operator == 'not_between':
            if numeric_value is not None and isinstance(condition_value, (list, tuple)) and len(condition_value) == 2:
                try:
                    min_val, max_val = float(condition_value[0]), float(condition_value[1])
                    return not (min_val <= numeric_value <= max_val)
                except (ValueError, TypeError):
                    return False
            return False

        # List/Array operators
        elif operator == 'in_list':
            if isinstance(condition_value, (list, tuple)):
                return field_value in condition_value or string_value in [str(v) for v in condition_value]
            return False

        elif operator == 'not_in_list':
            if isinstance(condition_value, (list, tuple)):
                return field_value not in condition_value and string_value not in [str(v) for v in condition_value]
            return True

        elif operator == 'array_contains':
            if isinstance(field_value, (list, tuple)):
                return condition_value in field_value
            return False

        elif operator == 'array_length_equals':
            if isinstance(field_value, (list, tuple)):
                try:
                    return len(field_value) == int(condition_value)
                except (ValueError, TypeError):
                    return False
            return False

        # Date operators
        elif operator == 'before_date':
            if date_value:
                try:
                    target_date = datetime.strptime(str(condition_value), '%Y-%m-%d').date()
                    return date_value < target_date
                except ValueError:
                    return False
            return False

        elif operator == 'after_date':
            if date_value:
                try:
                    target_date = datetime.strptime(str(condition_value), '%Y-%m-%d').date()
                    return date_value > target_date
                except ValueError:
                    return False
            return False

        elif operator == 'between_dates':
            if date_value and isinstance(condition_value, (list, tuple)) and len(condition_value) == 2:
                try:
                    start_date = datetime.strptime(str(condition_value[0]), '%Y-%m-%d').date()
                    end_date = datetime.strptime(str(condition_value[1]), '%Y-%m-%d').date()
                    return start_date <= date_value <= end_date
                except ValueError:
                    return False
            return False

        else:
            logger.warning(f"Unknown condition operator: {operator}")
            return False

    def calculate_next_step_enhanced(self, current_step: int, responses: Dict[str, Any], all_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Enhanced next step calculation with detailed branching information.
        Returns comprehensive step calculation results including applied rules and skipped steps.
        """
        logger.info(f"Calculating next step from step {current_step} with responses: {responses}")
        
        # Check if any fields in current step have branching logic that affects next step
        current_step_fields = [f for f in all_fields if f.get('step_number') == current_step]
        
        applied_rules = []
        next_step = None
        highest_priority = -1
        skipped_steps = []
        
        for field in current_step_fields:
            branching_logic = field.get('branching_logic', [])
            if branching_logic:
                logger.info(f"Evaluating branching logic for field: {field.get('field_key')}")
                
                # Sort rules by priority (higher priority first)
                sorted_rules = sorted(branching_logic, key=lambda x: x.get('priority', 0), reverse=True)
                
                for rule in sorted_rules:
                    rule_priority = rule.get('priority', 0)
                    condition_met = False
                    
                    # Handle both enhanced and legacy formats
                    if rule.get('actions') and rule['actions'].get('set_next_step'):
                        # Enhanced format with actions
                        if rule.get('condition'):
                            condition_met = self._evaluate_condition(responses, rule['condition'])
                        elif rule.get('condition_group'):
                            condition_met = self._evaluate_condition_group(responses, rule['condition_group'])
                        
                        if condition_met and rule_priority > highest_priority:
                            next_step = rule['actions']['set_next_step'].get('step_number')
                            highest_priority = rule_priority
                            
                            applied_rules.append({
                                'field_key': field.get('field_key'),
                                'rule_id': rule.get('id', 'unnamed_rule'),
                                'description': rule.get('description', 'No description'),
                                'priority': rule_priority,
                                'next_step': next_step
                            })
                            
                            logger.info(f"Enhanced rule matched: {rule.get('description')} -> Step {next_step}")
                    
                    elif rule.get('action') == 'skip_to_step' and rule.get('target_step'):
                        # Legacy format support
                        if rule.get('condition'):
                            condition_met = self._evaluate_condition(responses, rule['condition'])
                        
                        if condition_met and rule_priority > highest_priority:
                            next_step = rule['target_step']
                            highest_priority = rule_priority
                            
                            applied_rules.append({
                                'field_key': field.get('field_key'),
                                'rule_id': rule.get('id', 'legacy_rule'),
                                'description': rule.get('description', 'Legacy skip rule'),
                                'priority': rule_priority,
                                'next_step': next_step
                            })
                            
                            logger.info(f"Legacy rule matched: Skip to step {next_step}")
        
        # If no branching logic determined next step, move to next sequential step
        if next_step is None:
            max_step = max([f.get('step_number', 1) for f in all_fields], default=1)
            next_step = current_step + 1 if current_step < max_step else None
            reason = "Sequential progression - no branching logic applied"
            branching_occurred = False
        else:
            # Calculate which steps were skipped
            expected_next_step = current_step + 1
            if next_step > expected_next_step:
                skipped_steps = list(range(expected_next_step, next_step))
            reason = f"Branching logic applied - {len(applied_rules)} rule(s) matched"
            branching_occurred = True
        
        result = {
            'next_step': next_step,
            'skipped_steps': skipped_steps,
            'applied_rules': applied_rules,
            'branching_occurred': branching_occurred,
            'reason': reason
        }
        
        logger.info(f"Next step calculation result: {result}")
        return result

    def calculate_next_step(self, current_step: int, responses: Dict[str, Any], all_fields: List[Dict[str, Any]]) -> Optional[int]:
        """
        Calculates the next step based on current responses and branching logic.
        (Legacy method for backward compatibility)
        """
        result = self.calculate_next_step_enhanced(current_step, responses, all_fields)
        return result.get('next_step')

    def validate_branching_logic(self, branching_rules: List[Dict[str, Any]], field_keys: List[str]) -> Dict[str, Any]:
        """
        Validates branching logic rules for correctness and consistency.
        Returns validation results with errors and warnings.
        """
        errors = []
        warnings = []
        
        valid_operators = [
            'equals', 'not_equals', 'contains', 'not_contains', 'empty', 'not_empty',
            'starts_with', 'ends_with', 'matches_regex', 'greater_than', 'less_than',
            'greater_than_or_equal', 'less_than_or_equal', 'between', 'not_between',
            'in_list', 'not_in_list', 'array_contains', 'array_length_equals',
            'before_date', 'after_date', 'between_dates'
        ]
        
        valid_actions = ['show', 'hide', 'skip_to_step', 'require_field', 'set_field_value']
        valid_logics = ['AND', 'OR']
        
        def validate_condition_recursive(condition_data: Dict[str, Any], path: str = ""):
            """Recursively validate condition groups and individual conditions"""
            
            # Handle condition groups (new format)
            if 'logic' in condition_data or 'conditions' in condition_data or 'groups' in condition_data:
                logic = condition_data.get('logic', 'AND').upper()
                if logic not in valid_logics:
                    errors.append(f"{path}: Invalid logic operator '{logic}'. Must be 'AND' or 'OR'")
                
                # Validate individual conditions
                conditions = condition_data.get('conditions', [])
                for i, condition in enumerate(conditions):
                    validate_condition_recursive(condition, f"{path}.conditions[{i}]")
                
                # Validate nested groups
                groups = condition_data.get('groups', [])
                for i, group in enumerate(groups):
                    validate_condition_recursive(group, f"{path}.groups[{i}]")
                
                # Check if group has any conditions or nested groups
                if not conditions and not groups:
                    warnings.append(f"{path}: Empty condition group - will always evaluate to true")
            
            # Handle individual conditions
            elif 'field_key' in condition_data and 'operator' in condition_data:
                field_key = condition_data.get('field_key')
                operator = condition_data.get('operator')
                value = condition_data.get('value')
                
                # Validate field key exists
                if field_key not in field_keys:
                    errors.append(f"{path}: Field '{field_key}' does not exist in available fields")
                
                # Validate operator
                if operator not in valid_operators:
                    errors.append(f"{path}: Invalid operator '{operator}'")
                
                # Validate value based on operator
                if operator in ['between', 'not_between', 'between_dates']:
                    if not isinstance(value, (list, tuple)) or len(value) != 2:
                        errors.append(f"{path}: Operator '{operator}' requires a list/array of 2 values")
                
                if operator in ['in_list', 'not_in_list']:
                    if not isinstance(value, (list, tuple)):
                        errors.append(f"{path}: Operator '{operator}' requires a list/array of values")
                
                if operator == 'matches_regex':
                    import re
                    try:
                        re.compile(str(value))
                    except re.error as e:
                        errors.append(f"{path}: Invalid regex pattern '{value}': {e}")
                
                if operator in ['array_length_equals']:
                    try:
                        int(value)
                    except (ValueError, TypeError):
                        errors.append(f"{path}: Operator '{operator}' requires an integer value")
        
        # Validate each rule
        for i, rule in enumerate(branching_rules):
            rule_path = f"rule[{i}]"
            
            # Validate action
            action = rule.get('action')
            if action not in valid_actions:
                errors.append(f"{rule_path}: Invalid action '{action}'")
            
            # Validate action-specific requirements
            if action in ['show', 'hide', 'require_field']:
                target_fields = rule.get('target_fields', [])
                if not target_fields:
                    errors.append(f"{rule_path}: Action '{action}' requires target_fields")
                else:
                    for field in target_fields:
                        if field not in field_keys:
                            errors.append(f"{rule_path}: Target field '{field}' does not exist")
            
            if action == 'skip_to_step':
                target_step = rule.get('target_step')
                if target_step is None:
                    errors.append(f"{rule_path}: Action 'skip_to_step' requires target_step")
                elif not isinstance(target_step, int) or target_step < 1:
                    errors.append(f"{rule_path}: target_step must be a positive integer")
            
            if action == 'set_field_value':
                target_fields = rule.get('target_fields', [])
                target_value = rule.get('target_value')
                if not target_fields:
                    errors.append(f"{rule_path}: Action 'set_field_value' requires target_fields")
                if target_value is None:
                    warnings.append(f"{rule_path}: Action 'set_field_value' has no target_value (will set to None)")
            
            # Validate conditions (both new and legacy formats)
            if 'conditions' in rule:
                validate_condition_recursive(rule['conditions'], f"{rule_path}.conditions")
            elif 'condition' in rule:
                validate_condition_recursive(rule['condition'], f"{rule_path}.condition")
            else:
                errors.append(f"{rule_path}: Rule must have either 'conditions' or 'condition'")
        
        # Check for potential conflicts
        show_fields = set()
        hide_fields = set()
        for rule in branching_rules:
            action = rule.get('action')
            target_fields = rule.get('target_fields', [])
            
            if action == 'show':
                show_fields.update(target_fields)
            elif action == 'hide':
                hide_fields.update(target_fields)
        
        conflicting_fields = show_fields.intersection(hide_fields)
        if conflicting_fields:
            warnings.append(f"Fields have conflicting show/hide rules: {list(conflicting_fields)} - priority will determine final visibility")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }

    def simulate_branching_flow(self, branching_rules: List[Dict[str, Any]], responses: Dict[str, Any], all_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Simulates how branching logic would be applied given specific user responses.
        Useful for testing and previewing branching behavior.
        """
        try:
            result = self.evaluate_branching_logic(responses, branching_rules)
            
            # Add additional simulation metadata
            result['simulation_metadata'] = {
                'total_rules': len(branching_rules),
                'total_responses': len(responses),
                'total_fields': len(all_fields),
                'rules_applied': len(result.get('applied_rules', [])),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error simulating branching flow: {e}")
            return {
                "visible_fields": [],
                "hidden_fields": [],
                "required_fields": [],
                "field_values": {},
                "next_step": None,
                "applied_rules": [],
                "simulation_metadata": {
                    "error": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            }

integration_service = IntegrationService()