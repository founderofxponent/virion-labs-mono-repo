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
            access_requests = await strapi_client.get_campaign_influencer_accesses(filters or {})
            
            # Transform to response models
            return [
                CampaignInfluencerAccessResponse(
                    id=access.id,
                    documentId=getattr(access, 'documentId', None),
                    campaign_id=access.campaign.id if access.campaign else 0,
                    user_id=access.user.id if access.user else 0,
                    request_message=access.request_message,
                    request_status=access.request_status,
                    requested_at=access.requested_at,
                    access_granted_at=access.access_granted_at,
                    is_active=access.is_active,
                    admin_response=access.admin_response
                )
                for access in access_requests
            ]
            
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