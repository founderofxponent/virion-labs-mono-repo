from typing import Dict, Any, List, Optional
from core.strapi_client import strapi_client
from domain.campaign_access.schemas import (
    CampaignInfluencerAccessCreate,
    CampaignInfluencerAccessUpdate,
    CampaignInfluencerAccessResponse
)
from schemas.strapi import CampaignInfluencerAccess
from core.auth import StrapiUser as User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CampaignAccessService:
    """Service layer for campaign access operations."""

    async def create_access_request_operation(
        self, 
        access_data: CampaignInfluencerAccessCreate, 
        current_user: User
    ) -> CampaignInfluencerAccessResponse:
        """Business operation for creating a campaign access request."""
        try:
            logger.info(f"Creating campaign access request for user {access_data.user_id} and campaign {access_data.campaign_id}")
            
            # First, validate that the campaign and user exist
            try:
                campaign = await strapi_client.get_campaign_by_id(access_data.campaign_id)
                if not campaign:
                    raise ValueError(f"Campaign with ID {access_data.campaign_id} not found")
                logger.info(f"Campaign {access_data.campaign_id} exists: {campaign.name}")
            except Exception as e:
                logger.error(f"Campaign validation failed: {e}")
                raise ValueError(f"Invalid campaign ID {access_data.campaign_id}: {e}")
            
            # Check if user exists
            try:
                user = await strapi_client.get_user(access_data.user_id)
                if not user:
                    raise ValueError(f"User with ID {access_data.user_id} not found")
                logger.info(f"User {access_data.user_id} exists: {user.get('email', 'unknown')}")
            except Exception as e:
                logger.error(f"User validation failed: {e}")
                raise ValueError(f"Invalid user ID {access_data.user_id}: {e}")
            
            # Prepare data for Strapi with validated relations
            strapi_data = {
                "request_status": access_data.request_status or "pending",
                "is_active": access_data.is_active if access_data.is_active is not None else True,
                "user": access_data.user_id,
                "campaign": access_data.campaign_id
            }
            
            # Add optional fields
            if access_data.request_message:
                strapi_data["request_message"] = access_data.request_message
                
            if access_data.requested_at:
                strapi_data["requested_at"] = access_data.requested_at
            else:
                strapi_data["requested_at"] = datetime.now().isoformat()

            logger.info(f"Strapi data being sent: {strapi_data}")
            
            # Create the access request in Strapi
            created_access = await strapi_client.create_campaign_influencer_access(strapi_data)
            
            # Transform to response model
            return CampaignInfluencerAccessResponse(
                id=created_access.id,
                documentId=getattr(created_access, 'documentId', None),
                campaign_id=access_data.campaign_id,
                user_id=access_data.user_id,
                request_message=created_access.request_message,
                request_status=created_access.request_status,
                requested_at=created_access.requested_at,
                access_granted_at=created_access.access_granted_at,
                is_active=created_access.is_active
            )
            
        except Exception as e:
            logger.error(f"Failed to create campaign access request: {e}")
            raise

    async def list_access_requests_operation(
        self, 
        filters: Optional[Dict[str, Any]] = None,
        current_user: User = None
    ) -> List[CampaignInfluencerAccessResponse]:
        """Business operation for listing campaign access requests."""
        try:
            # Get raw Strapi data directly instead of using complex parsing
            raw_response = await strapi_client._request("GET", "campaign-influencer-accesses", params={"populate": "*", **(filters or {})})
            raw_access_requests = raw_response.get("data", [])
            
            # Transform raw Strapi data directly to response models
            responses = []
            for raw_access in raw_access_requests:
                
                # Extract basic fields
                campaign_data = raw_access.get('campaign')
                user_data = raw_access.get('user')
                
                response = CampaignInfluencerAccessResponse(
                    id=raw_access.get("id"),
                    documentId=raw_access.get("documentId"),
                    campaign_id=campaign_data.get("id") if campaign_data else 0,
                    user_id=user_data.get("id") if user_data else 0,
                    request_message=raw_access.get("request_message"),
                    request_status=raw_access.get("request_status", "pending"),
                    requested_at=raw_access.get("requested_at"),
                    access_granted_at=raw_access.get("access_granted_at"),
                    is_active=raw_access.get("is_active", True),
                    admin_response=raw_access.get("admin_response")
                )
                
                # Add campaign info if available
                if campaign_data:
                    response.campaign = {
                        "id": campaign_data.get("id"),
                        "name": campaign_data.get("name", "Unknown Campaign"),
                        "description": campaign_data.get("description"),
                        "campaign_type": campaign_data.get("campaign_type")
                    }
                
                # Add user info if available
                if user_data:
                    user_dict = {
                        "id": user_data.get("id"),
                        "username": user_data.get("username", "Unknown User"),
                        "email": user_data.get("email"),
                        "full_name": user_data.get("full_name")
                    }
                    
                    # Handle avatar URL if present
                    avatar_url_data = user_data.get("avatar_url")
                    if avatar_url_data and isinstance(avatar_url_data, dict):
                        user_dict["avatar_url"] = {
                            "url": avatar_url_data.get("url"),
                            "alternativeText": avatar_url_data.get("alternativeText")
                        }
                    
                    response.user = user_dict
                
                responses.append(response)
            
            return responses
            
        except Exception as e:
            logger.error(f"Failed to list campaign access requests: {e}")
            raise

    async def update_access_request_operation(
        self,
        access_id: str,
        access_data: CampaignInfluencerAccessUpdate,
        current_user: User
    ) -> CampaignInfluencerAccessResponse:
        """Business operation for updating a campaign access request (approval/denial)."""
        try:
            # Prepare update data for Strapi
            strapi_data = {}
            
            if access_data.request_status:
                strapi_data["request_status"] = access_data.request_status
                if access_data.request_status == "approved":
                    strapi_data["access_granted_at"] = access_data.access_granted_at or datetime.now().isoformat()
            
            if access_data.admin_response:
                strapi_data["admin_response"] = access_data.admin_response
                
            if access_data.is_active is not None:
                strapi_data["is_active"] = access_data.is_active

            logger.info(f"Updating campaign access request {access_id} with status {access_data.request_status}")
            
            # Update the access request in Strapi
            updated_access = await strapi_client.update_campaign_influencer_access(access_id, strapi_data)
            
            # Transform to response model
            return CampaignInfluencerAccessResponse(
                id=updated_access.id,
                documentId=getattr(updated_access, 'documentId', None),
                campaign_id=updated_access.campaign.id if updated_access.campaign else 0,
                user_id=updated_access.user.id if updated_access.user else 0,
                request_message=updated_access.request_message,
                request_status=updated_access.request_status,
                requested_at=updated_access.requested_at,
                access_granted_at=updated_access.access_granted_at,
                is_active=updated_access.is_active,
                admin_response=updated_access.admin_response
            )
            
        except Exception as e:
            logger.error(f"Failed to update campaign access request: {e}")
            raise

    async def get_access_request_operation(
        self,
        access_id: str,
        current_user: User
    ) -> Optional[CampaignInfluencerAccessResponse]:
        """Business operation for getting a single campaign access request."""
        try:
            access_request = await strapi_client.get_campaign_influencer_access(access_id)
            
            if not access_request:
                return None
                
            return CampaignInfluencerAccessResponse(
                id=access_request.id,
                documentId=getattr(access_request, 'documentId', None),
                campaign_id=access_request.campaign.id if access_request.campaign else 0,
                user_id=access_request.user.id if access_request.user else 0,
                request_message=access_request.request_message,
                request_status=access_request.request_status,
                requested_at=access_request.requested_at,
                access_granted_at=access_request.access_granted_at,
                is_active=access_request.is_active,
                admin_response=access_request.admin_response
            )
            
        except Exception as e:
            logger.error(f"Failed to get campaign access request: {e}")
            raise

# Create singleton instance
campaign_access_service = CampaignAccessService()