from typing import Dict, Any, List, Optional
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

        # 1. Apply domain logic
        client_with_logic = self.client_domain.create_client_with_business_logic(client_data)

        # 2. Save to Strapi
        created_client_attrs = await strapi_client.create_client(client_with_logic)
        created_client = {"id": created_client_attrs["id"], "attributes": created_client_attrs}


        # 3. Perform mock setup operations based on options
        setup_results = {}
        if setup_options.get("create_default_settings"):
            setup_results["default_settings_created"] = True # Mocked
            logger.info(f"Mock: Created default settings for client {created_client['id']}")
        if setup_options.get("enable_analytics"):
            setup_results["analytics_enabled"] = True # Mocked
            logger.info(f"Mock: Enabled analytics for client {created_client['id']}")
        if setup_options.get("send_welcome_email"):
            setup_results["welcome_email_sent"] = True # Mocked
            logger.info(f"Mock: Sent welcome email to {created_client['attributes']['contact_email']}")

        # 4. Get business context for the response
        business_context = self.client_domain.get_client_business_context(created_client['attributes'])

        return {
            "client": created_client,
            "business_context": business_context,
            **setup_results
        }

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
