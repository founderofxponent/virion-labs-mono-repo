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
        
        # Authorization Check
        if self._get_user_role(current_user) != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Only admins can create clients.")

        client_with_logic = self.client_domain.create_client_with_business_logic(client_data)
        created_client_attrs = await strapi_client.create_client(client_with_logic)
        created_client = {"id": created_client_attrs["id"], "attributes": created_client_attrs}

        setup_results = {"default_settings_created": True, "analytics_enabled": True, "welcome_email_sent": True}
        business_context = self.client_domain.get_client_business_context(created_client['attributes'])

        return {"client": created_client, "business_context": business_context, **setup_results}

    async def update_client_operation(self, document_id: str, updates: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for updating a client. (Admin or Owner)
        """
        
        # Authorization Check - for now, Platform Administrators can update all clients
        user_role = self._get_user_role(current_user)
        if user_role != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Access denied.")

        # First, find the actual documentId if we were passed a numeric ID
        actual_document_id = document_id
        
        # If document_id is numeric, we need to find the actual documentId
        if document_id.isdigit():
            try:
                all_clients = await strapi_client.get_clients()
                for client in all_clients:
                    if str(client.get("id")) == document_id:
                        actual_document_id = client.get("documentId")
                        break
                else:
                    logger.error(f"Could not find client with numeric ID: {document_id}")
                    raise HTTPException(status_code=404, detail=f"Client with ID {document_id} not found")
            except Exception as e:
                logger.error(f"Failed to lookup client by numeric ID {document_id}: {e}")
                raise HTTPException(status_code=404, detail=f"Client with ID {document_id} not found")

        updates_with_logic = self.client_domain.update_client_with_business_logic(updates)
        updated_client_attrs = await strapi_client.update_client(actual_document_id, updates_with_logic)
        updated_client = {
            "id": updated_client_attrs["id"], 
            "documentId": updated_client_attrs.get("documentId", actual_document_id),
            "attributes": updated_client_attrs
        }
        business_context = self.client_domain.get_client_business_context(updated_client['attributes'])

        return {"client": updated_client, "business_context": business_context, "documentId": actual_document_id}

    async def get_client_operation(self, document_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for fetching a single client. (Admin or Owner)
        """
        
        # Authorization Check - for now, Platform Administrators can access all clients
        user_role = self._get_user_role(current_user)
        if user_role != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Access denied.")
        
        # Try different approaches to find the client
        client_attrs = None
        error_messages = []
        
        # Approach 1: Try as documentId directly
        try:
            client_attrs = await strapi_client.get_client(document_id)
        except Exception as e:
            error_messages.append(f"documentId '{document_id}': {str(e)}")
            logger.warning(f"Failed to fetch client with documentId {document_id}: {e}")
        
        # Approach 2: If that fails and document_id is numeric, try searching by numeric ID
        if not client_attrs and document_id.isdigit():
            try:
                # Get all clients and find the one with matching numeric ID
                all_clients = await strapi_client.get_clients()
                for client in all_clients:
                    if str(client.get("id")) == document_id:
                        client_attrs = client
                        break
                if not client_attrs:
                    error_messages.append(f"numeric ID '{document_id}': not found in client list")
            except Exception as e:
                error_messages.append(f"numeric ID search '{document_id}': {str(e)}")
                logger.warning(f"Failed to search clients by numeric ID {document_id}: {e}")
        
        if not client_attrs:
            logger.error(f"Client not found using any method. Tried: {'; '.join(error_messages)}")
            raise HTTPException(status_code=404, detail=f"Client not found. Tried: {'; '.join(error_messages)}")
        
        # Return client in the expected format for the dashboard
        # Need to structure it like the list operation expects it
        structured_client = {
            "id": client_attrs.get("id"),
            "attributes": client_attrs
        }
        
        return {"client": structured_client}

    async def delete_client_operation(self, document_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for deleting a client (soft delete). (Admin Only)
        """
        
        # Authorization Check
        if self._get_user_role(current_user) != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Only admins can delete clients.")

        # First, find the actual documentId if we were passed a numeric ID
        actual_document_id = document_id
        
        # If document_id is numeric, we need to find the actual documentId
        if document_id.isdigit():
            try:
                all_clients = await strapi_client.get_clients()
                for client in all_clients:
                    if str(client.get("id")) == document_id:
                        actual_document_id = client.get("documentId")
                        break
                else:
                    logger.error(f"Could not find client with numeric ID: {document_id}")
                    raise HTTPException(status_code=404, detail=f"Client with ID {document_id} not found")
            except Exception as e:
                logger.error(f"Failed to lookup client by numeric ID {document_id}: {e}")
                raise HTTPException(status_code=404, detail=f"Client with ID {document_id} not found")

        update_data = {"client_status": "inactive"}
        deleted_client_attrs = await strapi_client.update_client(actual_document_id, update_data)
        
        return {"client": deleted_client_attrs, "status": "archived"}

    async def list_clients_operation(self, filters: Optional[Dict[str, Any]] = None, current_user: StrapiUser = None) -> Dict[str, Any]:
        """
        Business operation for listing clients.
        This version is corrected to handle the flat data structure from Strapi.
        """
        user_role = self._get_user_role(current_user)
        
        if filters is None:
            filters = {}

        if user_role == 'Platform Administrator':
            pass  # Admin can access all clients
        elif user_role == 'Client':
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
                document_id = client_obj.get("documentId", "NO_DOC_ID")
                
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

        return {"clients": enriched_clients, "total_count": len(enriched_clients)}

# Global service instance
client_service = ClientService()
