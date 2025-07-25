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
