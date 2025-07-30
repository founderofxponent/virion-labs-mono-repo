from typing import Dict, Any, List
from core.strapi_client import strapi_client
import logging

logger = logging.getLogger(__name__)

class AdminService:
    """
    Service layer for admin-specific operations.
    """

    async def list_access_requests_operation(self) -> Dict[str, Any]:
        """
        Business operation for listing all access requests.
        """
        logger.info("Executing list access requests operation")

        # In a real-world scenario, you would call the domain to get enriched requests.
        # For now, we will call the strapi client directly.
        access_requests = await strapi_client.get_access_requests()

        return {
            "requests": access_requests,
            "total_count": len(access_requests)
        }

    async def approve_access_request_operation(self, request_id: str) -> Dict[str, Any]:
        """
        Business operation for approving an access request.
        """
        logger.info(f"Executing approve access request operation for request: {request_id}")

        updated_request = await strapi_client.update_access_request(request_id, {"status": "approved"})

        return {
            "request": updated_request,
            "message": "Access request approved successfully."
        }

    async def deny_access_request_operation(self, request_id: str) -> Dict[str, Any]:
        """
        Business operation for denying an access request.
        """
        logger.info(f"Executing deny access request operation for request: {request_id}")

        updated_request = await strapi_client.update_access_request(request_id, {"status": "denied"})

        return {
            "request": updated_request,
            "message": "Access request denied successfully."
        }

# Global service instance
admin_service = AdminService()