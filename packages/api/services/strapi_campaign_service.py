from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timedelta
import secrets
import json
import logging
from core.strapi_client import strapi_client

logger = logging.getLogger(__name__)

# Import existing schemas
from schemas.api.campaign import (
    CampaignAccessRequest,
    DataExportRequest,
    DataExportResponse,
    DataExport,
    DataExportStatus,
    ExportType,
    CampaignCreate,
    CampaignUpdate,
    CampaignStats
)

async def get_campaigns(user_id: Optional[str] = None, page: int = 1, limit: int = 50) -> List[Dict]:
    """
    Get campaigns from Strapi. If user_id is provided, returns campaigns for that user.
    """
    try:
        filters = {}
        if user_id:
            filters["filters[client_id][$eq]"] = user_id
        
        # Add pagination
        filters["pagination[page]"] = page
        filters["pagination[pageSize]"] = limit

        campaigns = await strapi_client.get_campaigns(filters)
        return campaigns
    except Exception as e:
        logger.error(f"Error fetching campaigns: {e}")
        return []


async def create_campaign(user_id: Optional[str], campaign_data: Dict) -> Dict:
    """
    Create a new campaign in Strapi.
    """
    try:
        # Add metadata
        campaign_data.update({
            "client_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "is_active": True,
            "is_deleted": False
        })

        campaign = await strapi_client.create_campaign(campaign_data)
        return campaign
    except Exception as e:
        logger.error(f"Error creating campaign: {e}")
        raise Exception(f"Failed to create campaign: {str(e)}")


async def get_campaign_by_id(campaign_id: int, user_id: Optional[str] = None) -> Optional[Dict]:
    """
    Get a specific campaign by ID from Strapi.
    """
    try:
        campaign = await strapi_client.get_campaign(campaign_id)
        
        # Check ownership if user_id provided
        if user_id and campaign and campaign.get("attributes", {}).get("client_id") != user_id:
            return None
            
        return campaign
    except Exception as e:
        logger.error(f"Error fetching campaign {campaign_id}: {e}")
        return None


async def update_campaign(campaign_id: int, user_id: Optional[str], campaign_data: Dict) -> Optional[Dict]:
    """
    Update a campaign in Strapi.
    """
    try:
        # Check ownership first
        existing_campaign = await get_campaign_by_id(campaign_id, user_id)
        if not existing_campaign:
            raise ValueError("Campaign not found or access denied")

        # Add update timestamp
        campaign_data["updated_at"] = datetime.utcnow().isoformat()

        campaign = await strapi_client.update_campaign(campaign_id, campaign_data)
        return campaign
    except Exception as e:
        logger.error(f"Error updating campaign {campaign_id}: {e}")
        raise


async def delete_campaign(campaign_id: int, user_id: Optional[str]) -> None:
    """
    Soft delete a campaign in Strapi.
    """
    try:
        campaign_data = {
            "is_deleted": True,
            "deleted_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await update_campaign(campaign_id, user_id, campaign_data)
    except Exception as e:
        logger.error(f"Error deleting campaign {campaign_id}: {e}")
        raise


async def get_available_campaigns(user_id: Optional[str] = None, page: int = 1, limit: int = 50) -> List[Dict]:
    """
    Get active campaigns available to users from Strapi.
    """
    try:
        filters = {
            "filters[is_active][$eq]": True,
            "filters[is_deleted][$eq]": False,
            "pagination[page]": page,
            "pagination[pageSize]": limit
        }

        campaigns = await strapi_client.get_campaigns(filters)
        return campaigns
    except Exception as e:
        logger.error(f"Error fetching available campaigns: {e}")
        return []


async def set_campaign_status(campaign_id: int, is_active: bool, user_id: Optional[str] = None) -> Optional[Dict]:
    """
    Set campaign active status in Strapi.
    """
    try:
        campaign_data = {
            "is_active": is_active,
            "updated_at": datetime.utcnow().isoformat()
        }

        if not is_active:
            campaign_data["paused_at"] = datetime.utcnow().isoformat()
        else:
            campaign_data["paused_at"] = None

        campaign = await update_campaign(campaign_id, user_id, campaign_data)
        return campaign
    except Exception as e:
        logger.error(f"Error updating campaign status {campaign_id}: {e}")
        raise


async def create_referral_link(campaign_id: int, user_id: str, link_data: Dict) -> Dict:
    """
    Create a referral link for a campaign in Strapi.
    """
    try:
        # Check if campaign exists
        campaign = await get_campaign_by_id(campaign_id)
        if not campaign:
            raise ValueError("Campaign not found")

        # Generate unique referral code if not provided
        if not link_data.get("code"):
            code = secrets.token_urlsafe(8)
            
            # Check if code is unique (simplified - in production you'd want better collision handling)  
            existing_link = await strapi_client.get_referral_link_by_code(code)
            while existing_link:
                code = secrets.token_urlsafe(8)
                existing_link = await strapi_client.get_referral_link_by_code(code)
                
            link_data["code"] = code

        # Add metadata
        link_data.update({
            "campaign": campaign_id,
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "is_active": True
        })

        referral_link = await strapi_client.create_referral_link(link_data)
        return referral_link
    except Exception as e:
        logger.error(f"Error creating referral link: {e}")
        raise


async def get_campaign_referral_links(campaign_id: int, user_id: str) -> List[Dict]:
    """
    Get referral links for a campaign from Strapi.
    """
    try:
        filters = {
            "filters[campaign][id][$eq]": campaign_id,
            "filters[user_id][$eq]": user_id
        }
        
        links = await strapi_client.get_referral_links(filters)
        return links
    except Exception as e:
        logger.error(f"Error fetching referral links for campaign {campaign_id}: {e}")
        return []


async def get_referral_links_by_user(user_id: str) -> List[Dict]:
    """
    Get all referral links for a user from Strapi.
    """
    try:
        filters = {
            "filters[user_id][$eq]": user_id
        }
        
        links = await strapi_client.get_referral_links(filters)
        return links
    except Exception as e:
        logger.error(f"Error fetching referral links for user {user_id}: {e}")
        return []


async def create_onboarding_response(user_id: str, campaign_id: int, response_data: Dict) -> Dict:
    """
    Create an onboarding response in Strapi.
    """
    try:
        # Add metadata
        response_data.update({
            "user_id": user_id,
            "campaign": campaign_id,
            "submitted_at": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        })

        response = await strapi_client.create_onboarding_response(response_data)
        return response
    except Exception as e:
        logger.error(f"Error creating onboarding response: {e}")
        raise


async def get_user_onboarding_responses(user_id: str, campaign_id: Optional[int] = None) -> List[Dict]:
    """
    Get onboarding responses for a user from Strapi.
    """
    try:
        filters = {
            "filters[user_id][$eq]": user_id
        }
        
        if campaign_id:
            filters["filters[campaign][id][$eq]"] = campaign_id
        
        responses = await strapi_client.get_onboarding_responses(filters)
        return responses
    except Exception as e:
        logger.error(f"Error fetching onboarding responses for user {user_id}: {e}")
        return []


async def track_analytics_event(event_type: str, campaign_id: Optional[int], user_id: Optional[str], event_data: Dict) -> Dict:
    """
    Track an analytics event in Strapi.
    """
    try:
        analytics_data = {
            "event_type": event_type,
            "event_data": event_data,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        if campaign_id:
            analytics_data["campaign"] = campaign_id

        event = await strapi_client.create_analytics_event(analytics_data)
        return event
    except Exception as e:
        logger.error(f"Error tracking analytics event: {e}")
        raise


async def get_campaign_analytics(campaign_id: int, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> List[Dict]:
    """
    Get analytics events for a campaign from Strapi.
    """
    try:
        filters = {
            "filters[campaign][id][$eq]": campaign_id
        }
        
        if start_date:
            filters["filters[timestamp][$gte]"] = start_date.isoformat()
        
        if end_date:
            filters["filters[timestamp][$lte]"] = end_date.isoformat()
        
        events = await strapi_client.get_analytics_events(filters)
        return events
    except Exception as e:
        logger.error(f"Error fetching analytics for campaign {campaign_id}: {e}")
        return []