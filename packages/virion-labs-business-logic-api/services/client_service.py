from typing import Dict, Any, List, Optional
from datetime import datetime
from core.strapi_client import strapi_client
from domain.clients.domain import ClientDomain
from schemas.operation_schemas import EnrichedClient
import logging

logger = logging.getLogger(__name__)

class ClientService:
    """
    Service layer for client operations.
    """
    def __init__(self):
        self.client_domain = ClientDomain()

    async def create_client_operation(self, client_data: Dict[str, Any], setup_options: Dict[str, Any]) -> Dict[str, Any]:
        """
        Business operation for client creation.
        """
        logger.info("ClientService: Executing create_client_operation.")

        # 1. Apply domain logic (which includes publishing)
        client_with_logic = self.client_domain.create_client_with_business_logic(client_data)

        # 2. Save and publish in a single call to Strapi
        created_client_attrs = await strapi_client.create_client(client_with_logic)
        created_client = {"id": created_client_attrs["id"], "attributes": created_client_attrs}
        logger.info(f"Client created and published with ID: {created_client['id']}")

        # 3. Perform mock setup operations
        setup_results = {}
        if setup_options.get("create_default_settings"):
            setup_results["default_settings_created"] = True
        if setup_options.get("enable_analytics"):
            setup_results["analytics_enabled"] = True
        if setup_options.get("send_welcome_email"):
            setup_results["welcome_email_sent"] = True

        # 4. Get business context
        business_context = self.client_domain.get_client_business_context(created_client['attributes'])

        return {
            "client": created_client,
            "business_context": business_context,
            **setup_results
        }

    async def update_client_operation(self, document_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Business operation for updating a client.
        """
        logger.info(f"ClientService: Executing update_client_operation for client {document_id}.")

        # 1. Apply domain logic
        updates_with_logic = self.client_domain.update_client_with_business_logic(updates)

        # 2. Save to Strapi
        updated_client_attrs = await strapi_client.update_client(document_id, updates_with_logic)
        updated_client = {"id": updated_client_attrs["id"], "attributes": updated_client_attrs}

        # 3. Get business context for the response
        business_context = self.client_domain.get_client_business_context(updated_client['attributes'])

        return {
            "client": updated_client,
            "business_context": business_context
        }

    async def get_client_operation(self, document_id: str) -> Dict[str, Any]:
        """
        Business operation for fetching a single client.
        """
        logger.info(f"ClientService: Executing get_client_operation for client {document_id}.")
        client_attrs = await strapi_client.get_client(document_id)
        return {"client": client_attrs}

    async def delete_client_operation(self, document_id: str) -> Dict[str, Any]:
        """
        Business operation for deleting a client (soft delete).
        """
        logger.info(f"ClientService: Executing delete_client_operation for client {document_id}.")
        
        # Perform a soft delete by updating the status
        update_data = {"client_status": "inactive"}
        deleted_client_attrs = await strapi_client.update_client(document_id, update_data)
        
        return {"client": deleted_client_attrs, "status": "archived"}

    async def list_clients_operation(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Business operation for listing clients.
        """
        logger.info("ClientService: Executing list_clients_operation.")
        
        # 1. Get data from the data source
        clients_from_db = await strapi_client.get_clients(filters)

        # 2. Apply business logic from the domain layer
        from schemas.operation_schemas import EnrichedClient

# ... inside list_clients_operation ...
        enriched_clients = []
        for client in clients_from_db:
            # The entire client object is now the "attributes"
            if "id" in client:
                business_context = self.client_domain.get_client_business_context(client)
                enriched_client_data = {
                    "id": client["id"],
                    "attributes": client, # Pass the whole object as attributes
                    "business_context": business_context
                }
                enriched_clients.append(EnrichedClient(**enriched_client_data))
            else:
                logger.warning(f"Skipping malformed client object from Strapi: {client}")

        return {
            "clients": enriched_clients,
            "total_count": len(enriched_clients)
        }

# Global service instance
client_service = ClientService()
