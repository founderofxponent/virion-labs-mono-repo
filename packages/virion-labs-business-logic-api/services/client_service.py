from typing import Dict, Any, List, Optional
from fastapi import HTTPException
import asyncio
import logging

from core.strapi_client import strapi_client
from core.auth import StrapiUser
from domain.clients.domain import ClientDomain
from domain.clients.schemas import Client, ClientCreate, ClientUpdate
from schemas.strapi import StrapiClientCreate, StrapiClientUpdate

logger = logging.getLogger(__name__)

class ClientService:
    """
    Service layer for client operations, refactored to use Pydantic models for type safety and clarity.
    """
    def __init__(self):
        self.client_domain = ClientDomain()

    def _get_user_role(self, current_user: StrapiUser) -> str:
        """Safely gets the user's role name."""
        if current_user.role and isinstance(current_user.role, dict):
            return current_user.role.get('name', 'Authenticated')
        return 'Authenticated'

    from typing import Dict, Any, List, Optional
from fastapi import HTTPException
import asyncio
import logging

from core.strapi_client import strapi_client
from core.auth import StrapiUser
from domain.clients.domain import ClientDomain
from domain.clients.schemas import Client, ClientCreate, ClientUpdate
from schemas.strapi import StrapiClientCreate, StrapiClientUpdate
from services.email_service import email_service, Email

logger = logging.getLogger(__name__)

class ClientService:
    """
    Service layer for client operations, refactored to use Pydantic models for type safety and clarity.
    """
    def __init__(self):
        self.client_domain = ClientDomain()

    def _get_user_role(self, current_user: StrapiUser) -> str:
        """Safely gets the user's role name."""
        if current_user.role and isinstance(current_user.role, dict):
            return current_user.role.get('name', 'Authenticated')
        return 'Authenticated'

    async def create_client_operation(self, client_data: ClientCreate, current_user: StrapiUser) -> Client:
        """
        Business operation for client creation. (Admin Only)
        """
        if self._get_user_role(current_user) != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Only admins can create clients.")

        # Business logic can be applied here before creating the Strapi model
        client_data_with_logic = self.client_domain.create_client_with_business_logic(client_data.model_dump())
        strapi_payload = StrapiClientCreate(**client_data_with_logic)
        
        created_client = await strapi_client.create_client(strapi_payload)

        # Send welcome email to the client's contact person
        try:
            if created_client.contact_email:
                email_data = Email(
                    to=created_client.contact_email,
                    subject="Welcome to Virion Labs!",
                    html=f"""
                    <h1>Welcome, {created_client.name}!</h1>
                    <p>Your client profile has been created in the Virion Labs platform.</p>
                    <p>We're excited to partner with you.</p>
                    """
                )
                await email_service.send_email(email_data)
        except Exception as e:
            logger.error(f"Failed to send welcome email to new client {created_client.name}: {e}")
        
        # The response from strapi_client is already a validated Pydantic model
        return created_client

    async def update_client_operation(self, document_id: str, updates: ClientUpdate, current_user: StrapiUser) -> Client:
        """
        Business operation for updating a client. (Admin or Owner)
        """
        user_role = self._get_user_role(current_user)
        if user_role != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Access denied.")

        # Ensure the client exists before attempting an update
        existing_client = await strapi_client.get_client(document_id)
        if not existing_client:
            raise HTTPException(status_code=404, detail=f"Client with ID {document_id} not found")

        # Map service-layer update model to Strapi-layer update model
        strapi_update_payload = StrapiClientUpdate(**updates.model_dump(exclude_unset=True))
        
        updated_client = await strapi_client.update_client(document_id, strapi_update_payload)
        
        return updated_client

    async def get_client_operation(self, document_id: str, current_user: StrapiUser) -> Client:
        """
        Business operation for fetching a single client. (Admin or Owner)
        """
        user_role = self._get_user_role(current_user)
        if user_role != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Access denied.")
        
        client = await strapi_client.get_client(document_id)
        if not client:
            raise HTTPException(status_code=404, detail=f"Client with ID {document_id} not found")
            
        return client

    async def delete_client_operation(self, document_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for deleting a client (soft delete). (Admin Only)
        """
        if self._get_user_role(current_user) != 'Platform Administrator':
            raise HTTPException(status_code=403, detail="Forbidden: Only admins can delete clients.")

        # Ensure the client exists before attempting to delete
        existing_client = await strapi_client.get_client(document_id)
        if not existing_client:
            raise HTTPException(status_code=404, detail=f"Client with ID {document_id} not found")

        # Perform a soft delete by updating the status
        update_payload = StrapiClientUpdate(client_status="inactive")
        deleted_client = await strapi_client.update_client(document_id, update_payload)
        
        return {"client": deleted_client.model_dump(), "status": "archived"}

    async def list_clients_operation(self, filters: Optional[Dict[str, Any]] = None, current_user: StrapiUser = None) -> Dict[str, Any]:
        """
        Business operation for listing clients, enriched with campaign counts and business context.
        """
        user_role = self._get_user_role(current_user)
        
        if filters is None:
            filters = {}

        if user_role == 'Platform Administrator':
            pass  # Admin can access all clients
        elif user_role == 'Client':
            # This logic might need adjustment based on how ownership is determined
            filters["filters[owner][id][$eq]"] = current_user.id
        else:
            logger.warning(f"Forbidden: User with role '{user_role}' attempted to list clients.")
            raise HTTPException(status_code=403, detail=f"Forbidden: Your role ('{user_role}') does not have permission to list clients.")

        clients_from_db, campaigns_from_db = await asyncio.gather(
            strapi_client.get_clients(filters),
            strapi_client.get_campaigns()  # Consider filtering campaigns if performance is an issue
        )

        campaign_counts = {}
        for campaign in campaigns_from_db:
            # campaign is a Pydantic Campaign model with a client relationship
            if campaign.client and campaign.client.id:
                client_id = campaign.client.id
                campaign_counts[client_id] = campaign_counts.get(client_id, 0) + 1

        enriched_clients = []
        for client in clients_from_db:
            # client is now a Pydantic model
            client_dict = client.model_dump()
            client_dict["campaign_count"] = campaign_counts.get(client.id, 0)
            
            # Get business context using the dictionary representation of the client
            business_context = self.client_domain.get_client_business_context(client_dict)
            client_dict["business_context"] = business_context
            
            enriched_clients.append(client_dict)

        return {"clients": enriched_clients, "total_count": len(enriched_clients)}

# Global service instance
client_service = ClientService()
