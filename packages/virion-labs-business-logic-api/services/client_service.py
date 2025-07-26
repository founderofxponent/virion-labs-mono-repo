from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import HTTPException
import asyncio
from core.strapi_client import strapi_client
from domain.clients.domain import ClientDomain
from schemas.operation_schemas import EnrichedClient
from core.auth import StrapiUser
import logging

logger = logging.getLogger(__name__)

class ClientService:
    """
    Service layer for client operations with authorization.
    """
    def __init__(self):
        self.client_domain = ClientDomain()

    def _get_user_role(self, current_user: StrapiUser) -> str:
        """Safely gets the user's role name."""
        if current_user.role and isinstance(current_user.role, dict):
            return current_user.role.get('name', 'Authenticated')
        return 'Authenticated'

    async def create_client_operation(self, client_data: Dict[str, Any], setup_options: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for client creation. (Admin Only)
        """
        logger.info("ClientService: Executing create_client_operation.")
        
        # Authorization Check
        if self._get_user_role(current_user) != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Only admins can create clients.")

        client_with_logic = self.client_domain.create_client_with_business_logic(client_data)
        created_client_attrs = await strapi_client.create_client(client_with_logic)
        created_client = {"id": created_client_attrs["id"], "attributes": created_client_attrs}
        logger.info(f"Client created and published with ID: {created_client['id']}")

        setup_results = {"default_settings_created": True, "analytics_enabled": True, "welcome_email_sent": True}
        business_context = self.client_domain.get_client_business_context(created_client['attributes'])

        return {"client": created_client, "business_context": business_context, **setup_results}

    async def update_client_operation(self, document_id: str, updates: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for updating a client. (Admin or Owner)
        """
        logger.info(f"ClientService: Executing update_client_operation for client {document_id}.")
        
        # Authorization Check
        user_role = self._get_user_role(current_user)
        if user_role != 'Platform Administrator':
            # If not an admin, must be the owner. Fetch client to verify.
            try:
                client_to_update = await strapi_client.get_client(document_id, populate=['owner'])
                owner_id = client_to_update.get('owner', {}).get('id')
                if not owner_id or owner_id != current_user.id:
                    raise HTTPException(status_code=403, detail="Forbidden: You do not own this resource.")
            except HTTPException as e:
                if e.status_code == 404:
                    raise HTTPException(status_code=404, detail="Client not found.")
                raise e

        updates_with_logic = self.client_domain.update_client_with_business_logic(updates)
        updated_client_attrs = await strapi_client.update_client(document_id, updates_with_logic)
        updated_client = {"id": updated_client_attrs["id"], "attributes": updated_client_attrs}
        business_context = self.client_domain.get_client_business_context(updated_client['attributes'])

        return {"client": updated_client, "business_context": business_context}

    async def get_client_operation(self, document_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for fetching a single client. (Admin or Owner)
        """
        logger.info(f"ClientService: Executing get_client_operation for client {document_id}.")
        
        client_attrs = await strapi_client.get_client(document_id, populate=['owner'])
        
        # Authorization Check
        user_role = self._get_user_role(current_user)
        if user_role != 'Platform Administrator':
            owner_id = client_attrs.get('owner', {}).get('id')
            if not owner_id or owner_id != current_user.id:
                raise HTTPException(status_code=403, detail="Forbidden: You do not own this resource.")

        return {"client": client_attrs}

    async def delete_client_operation(self, document_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for deleting a client (soft delete). (Admin Only)
        """
        logger.info(f"ClientService: Executing delete_client_operation for client {document_id}.")
        
        # Authorization Check
        if self._get_user_role(current_user) != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Only admins can delete clients.")

        update_data = {"client_status": "inactive"}
        deleted_client_attrs = await strapi_client.update_client(document_id, update_data)
        
        return {"client": deleted_client_attrs, "status": "archived"}

    async def list_clients_operation(self, filters: Optional[Dict[str, Any]] = None, current_user: StrapiUser = None) -> Dict[str, Any]:
        """
        Business operation for listing clients.
        This version is corrected to handle the flat data structure from Strapi.
        """
        user_role = self._get_user_role(current_user)
        logger.info(f"ClientService: Executing list_clients_operation for user with role: '{user_role}'.")
        
        if filters is None:
            filters = {}

        if user_role == 'Platform Administrator':
            logger.info("User is Admin, allowing access to all clients.")
        elif user_role == 'Client':
            logger.info(f"User is Client, filtering for owner ID: {current_user.id}.")
            filters["filters[owner][id][$eq]"] = current_user.id
        else:
            logger.warning(f"Forbidden: User with role '{user_role}' attempted to list clients.")
            raise HTTPException(status_code=403, detail=f"Forbidden: Your role ('{user_role}') does not have permission to list clients.")

        clients_from_db, campaigns_from_db = await asyncio.gather(
            strapi_client.get_clients(filters),
            strapi_client.get_campaigns()
        )

        campaign_counts = {}
        for campaign in campaigns_from_db:
            client_relation = campaign.get("attributes", {}).get("client", {}).get("data")
            if client_relation and client_relation.get("id"):
                client_id = client_relation["id"]
                campaign_counts[client_id] = campaign_counts.get(client_id, 0) + 1

        enriched_clients = []
        # Process the FLAT client objects from the database
        for client_obj in clients_from_db:
            if "id" in client_obj:
                client_id = client_obj["id"]
                
                # Add the campaign count directly to the flat object
                client_obj["campaign_count"] = campaign_counts.get(client_id, 0)
                
                # The domain function is robust enough to handle this flat structure
                business_context = self.client_domain.get_client_business_context(client_obj)
                
                # Manually construct the nested structure the MCP server/schema expects
                enriched_client_data = {
                    "id": client_id,
                    "attributes": client_obj, # Put the entire flat object here
                    "business_context": business_context
                }
                enriched_clients.append(EnrichedClient(**enriched_client_data))
            else:
                logger.warning(f"Skipping malformed client object from Strapi: {client_obj}")

        logger.info(f"Found {len(enriched_clients)} clients for role '{user_role}'.")
        return {"clients": enriched_clients, "total_count": len(enriched_clients)}

# Global service instance
client_service = ClientService()
