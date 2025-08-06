from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from core.auth import get_current_user
from core.auth import StrapiUser as User
from core.strapi_client import strapi_client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/access-requests", summary="List Access Requests")
async def list_access_requests_operation(current_user: User = Depends(get_current_user)):
    """
    Business operation for an admin to list all access requests.
    """
    try:
        # Ensure the user has the 'Platform Administrator' role
        if current_user.role['name'] != "Platform Administrator":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for administrators only."
            )

        # Fetch access requests from Strapi with pending status
        filters = {
            "filters[request_status][$eq]": "pending",
            "populate[user][populate][0]": "role",
            "populate[campaign][populate][0]": "client"
        }
        
        access_requests = await strapi_client.get_access_requests(filters=filters)
        
        # Transform the data to match the expected frontend format
        formatted_requests = []
        for request in access_requests:
            attributes = request.get("attributes", {})
            user_data = attributes.get("user", {}).get("data", {})
            campaign_data = attributes.get("campaign", {}).get("data", {})
            
            if user_data and campaign_data:
                user_attrs = user_data.get("attributes", {})
                campaign_attrs = campaign_data.get("attributes", {})
                client_data = campaign_attrs.get("client", {}).get("data", {})
                client_attrs = client_data.get("attributes", {}) if client_data else {}
                
                formatted_request = {
                    "id": str(request.get("id")),
                    "campaign_id": str(campaign_data.get("id")),
                    "influencer_id": str(user_data.get("id")),
                    "request_status": attributes.get("request_status", "pending"),
                    "requested_at": attributes.get("requested_at"),
                    "request_message": attributes.get("request_message"),
                    "access_granted_at": attributes.get("access_granted_at"),
                    "access_granted_by": attributes.get("access_granted_by"),
                    "admin_response": attributes.get("admin_response"),
                    "discord_guild_campaigns": {
                        "id": str(campaign_data.get("id")),
                        "campaign_name": campaign_attrs.get("name", ""),
                        "campaign_type": campaign_attrs.get("campaign_type", ""),
                        "clients": {
                            "name": client_attrs.get("name", ""),
                            "industry": client_attrs.get("industry", "")
                        }
                    },
                    "user_profiles": {
                        "id": str(user_data.get("id")),
                        "full_name": user_attrs.get("full_name") or user_attrs.get("username", ""),
                        "email": user_attrs.get("email", ""),
                        "avatar_url": user_attrs.get("avatar_url")
                    }
                }
                formatted_requests.append(formatted_request)
        
        return {"requests": formatted_requests}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin access requests operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while fetching access requests.")

@router.put("/access-requests/{request_id}/approve", summary="Approve an Access Request")
async def approve_access_request_operation(request_id: str, current_user: User = Depends(get_current_user)):
    """
    Business operation for an admin to approve an access request.
    """
    try:
        if current_user.role['name'] != "Platform Administrator":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for administrators only."
            )

        # Update the access request status to approved
        update_data = {
            "request_status": "approved",
            "access_granted_at": "2025-01-01T00:00:00.000Z",  # Current timestamp would be better
            "access_granted_by": str(current_user.id)
        }
        
        result = await strapi_client.update_access_request(request_id, update_data)
        return {"message": "Access request approved successfully", "access_request": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin approve access request operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while approving the access request.")

@router.put("/access-requests/{request_id}/deny", summary="Deny an Access Request")
async def deny_access_request_operation(request_id: str, current_user: User = Depends(get_current_user)):
    """
    Business operation for an admin to deny an access request.
    """
    try:
        if current_user.role['name'] != "Platform Administrator":
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: This endpoint is for administrators only."
            )

        # Update the access request status to denied
        update_data = {
            "request_status": "denied",
            "access_granted_by": str(current_user.id)
        }
        
        result = await strapi_client.update_access_request(request_id, update_data)
        return {"message": "Access request denied successfully", "access_request": result}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Admin deny access request operation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while denying the access request.")