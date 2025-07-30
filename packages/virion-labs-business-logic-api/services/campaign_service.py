from typing import Dict, Any, List, Optional
from core.strapi_client import strapi_client
from domain.campaigns.domain import CampaignDomain
import logging

logger = logging.getLogger(__name__)

class CampaignService:
    """Service layer for campaign operations."""
    
    def __init__(self):
        self.campaign_domain = CampaignDomain()
    
    async def create_campaign_workflow(self, campaign_data: Dict[str, Any], automation_options: Dict[str, Any]) -> Dict[str, Any]:
        """Multi-step workflow for campaign creation."""
        
        workflow_results = {
            "workflow_id": f"campaign_create_{secrets.token_hex(4)}",
            "steps_completed": [],
            "campaign": None
        }
        
        # Step 1: Apply domain logic and create campaign
        business_campaign = self.campaign_domain.create_campaign_with_business_logic(campaign_data)
        created_campaign = await strapi_client.create_campaign(business_campaign)
        workflow_results["campaign"] = created_campaign
        workflow_results["steps_completed"].append("campaign_created")
        
        # Step 2: Setup Discord bot (if enabled)
        if automation_options.get("setup_discord_bot", False):
            discord_setup = await self._setup_discord_bot(created_campaign["id"])
            workflow_results["discord_setup"] = discord_setup
            workflow_results["steps_completed"].append("discord_bot_setup")
        
        # Step 3: Generate referral links (if enabled)
        if automation_options.get("generate_referral_links", False):
            referral_links = await self._generate_referral_links(created_campaign["id"])
            workflow_results["referral_links"] = referral_links
            workflow_results["steps_completed"].append("referral_links_generated")
        
        # Step 4: Setup analytics (if enabled)
        if automation_options.get("setup_analytics", False):
            analytics_setup = await self._setup_analytics(created_campaign["id"])
            workflow_results["analytics_setup"] = analytics_setup
            workflow_results["steps_completed"].append("analytics_setup")
        
        # Step 5: Send notifications (if enabled)
        if automation_options.get("notify_influencers", False):
            notifications = await self._send_notifications(created_campaign["id"])
            workflow_results["notifications_sent"] = notifications
            workflow_results["steps_completed"].append("notifications_sent")
        
        workflow_results["status"] = "completed"
        workflow_results["completed_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"Campaign creation workflow completed: {workflow_results['workflow_id']}")
        
        return workflow_results
    
    async def list_campaigns_operation(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Business operation for listing campaigns."""
        
        # Get campaigns from Strapi
        campaigns = await strapi_client.get_campaigns(filters)
        
        return {
            "campaigns": campaigns,
            "total_count": len(campaigns),
            "filters_applied": filters or {}
        }
    async def list_available_campaigns_for_influencer(self, influencer_id: str, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Lists campaigns available to a specific influencer, enriching them with access status.
        """
        logger.info(f"Fetching available campaigns for influencer {influencer_id}")
        
        # 1. Get all active campaigns based on provided filters
        all_campaigns_filters = filters.copy() if filters else {}
        all_campaigns_filters["filters[is_active][$eq]"] = True
        all_campaigns = await strapi_client.get_campaigns(all_campaigns_filters)

        # 2. Get all access requests for that influencer
        access_requests_filters = {
            "filters[user][id][$eq]": influencer_id,
            "populate": "campaign"
        }
        access_requests = await strapi_client.get_access_requests(access_requests_filters)
        
        # 3. Create a map of campaign_id to request_status and has_access
        access_map = {}
        for req in access_requests:
            req_attrs = req.get('attributes', {})
            campaign_relation = req_attrs.get('campaign', {})
            if campaign_relation and campaign_relation.get('data'):
                campaign_id = str(campaign_relation['data']['id'])
                access_map[campaign_id] = {
                    "request_status": req_attrs.get('request_status'),
                    "has_access": req_attrs.get('request_status') == 'approved'
                }

        # 4. Augment campaign data
        for campaign in all_campaigns:
            campaign_id = str(campaign['id'])
            access_info = access_map.get(campaign_id)
            if access_info:
                campaign['has_access'] = access_info['has_access']
                campaign['request_status'] = access_info['request_status']
                campaign['can_request_access'] = False
            else:
                campaign['has_access'] = False
                campaign['request_status'] = None
                campaign['can_request_access'] = True
                
        return all_campaigns

    async def list_landing_pages_operation(self, campaign_id: str) -> Dict[str, Any]:
        """Business operation for listing landing pages for a campaign."""
        
        # Get landing pages from Strapi
        landing_pages = await strapi_client.get_campaign_landing_pages(campaign_id)
        
        return {
            "pages": landing_pages,
            "total_count": len(landing_pages),
            "campaign_id": campaign_id
        }

    async def create_landing_page_operation(self, campaign_id: str, page_data: Dict[str, Any]) -> Dict[str, Any]:
        """Business operation for creating a new landing page for a campaign."""
        logger.info(f"Executing create landing page operation for campaign: {campaign_id}")

        # Add the campaign to the page data
        page_data['campaign'] = campaign_id

        created_page = await strapi_client.create_campaign_landing_page(page_data)

        return {
            "page": created_page,
            "message": "Campaign landing page created successfully."
        }

    async def update_landing_page_operation(self, page_id: str, page_data: Dict[str, Any]) -> Dict[str, Any]:
        """Business operation for updating a landing page."""
        logger.info(f"Executing update landing page operation for page: {page_id}")

        updated_page = await strapi_client.update_campaign_landing_page(page_id, page_data)

        return {
            "page": updated_page,
            "message": "Campaign landing page updated successfully."
        }

    async def delete_landing_page_operation(self, page_id: str) -> Dict[str, Any]:
        """Business operation for deleting a landing page."""
        logger.info(f"Executing delete landing page operation for page: {page_id}")

        await strapi_client.delete_campaign_landing_page(page_id)

        return {
            "message": "Campaign landing page deleted successfully."
        }

    async def get_onboarding_fields_operation(self, campaign_id: str) -> Dict[str, Any]:
        """Business operation for getting campaign onboarding fields."""
        logger.info(f"Executing get onboarding fields operation for campaign: {campaign_id}")

        fields = await strapi_client.get_onboarding_fields(campaign_id)

        return {
            "fields": fields,
            "campaign_id": campaign_id,
            "total_count": len(fields)
        }

    async def update_onboarding_fields_batch_operation(self, campaign_id: str, fields_data: List[Dict[str, Any]], delete_ids: List[str] = []) -> Dict[str, Any]:
        """Business operation for batch updating campaign onboarding fields."""
        logger.info(f"Executing batch update onboarding fields operation for campaign: {campaign_id}")

        updated_fields = []
        deleted_count = 0
        errors = []

        # Process deletions
        for field_id in delete_ids:
            try:
                await strapi_client.delete_onboarding_field(field_id)
                deleted_count += 1
            except Exception as e:
                errors.append({
                    "field_id": field_id,
                    "error": f"Failed to delete: {e}"
                })

        # Process updates and creates
        for field_data in fields_data:
            try:
                field_dict = field_data.model_dump()
                document_id = field_dict.get('documentId')
                if document_id:
                    # Update existing field
                    updated_field = await strapi_client.update_onboarding_field(document_id, field_dict)
                    updated_fields.append(updated_field)
                else:
                    # Create new field
                    field_dict['campaign'] = campaign_id
                    created_field = await strapi_client.create_onboarding_field(campaign_id, field_dict)
                    updated_fields.append(created_field)
            except Exception as e:
                errors.append({
                    "field_data": field_data,
                    "error": str(e)
                })

        return {
            "updated_fields": updated_fields,
            "deleted_count": deleted_count,
            "errors": errors,
            "campaign_id": campaign_id,
            "success_count": len(updated_fields),
            "error_count": len(errors)
        }

    async def _setup_discord_bot(self, campaign_id: int) -> Dict[str, Any]:
        """Setup Discord bot for campaign."""
        # Mock implementation - replace with actual Discord integration
        return {
            "bot_configured": True,
            "roles_created": ["Influencer", "VIP"],
            "channels_setup": ["#announcements", "#referrals"]
        }
    
    async def _generate_referral_links(self, campaign_id: int, quantity: int = 10) -> List[Dict[str, Any]]:
        """Generate referral links for campaign."""
        links = []
        for i in range(quantity):
            link_data = {
                "code": f"REF{campaign_id}_{i+1:03d}",
                "campaign": campaign_id,
                "created_at": datetime.utcnow().isoformat(),
                "is_active": True
            }
            created_link = await strapi_client.create_referral_link(link_data)
            links.append(created_link)
        
        return links
    
    async def _setup_analytics(self, campaign_id: int) -> Dict[str, Any]:
        """Setup analytics tracking for campaign."""
        # Mock implementation - replace with actual analytics setup
        return {
            "tracking_enabled": True,
            "dashboard_created": True,
            "metrics_configured": ["views", "clicks", "conversions"]
        }
    
    async def _send_notifications(self, campaign_id: int) -> Dict[str, Any]:
        """Send notifications for new campaign."""
        # Mock implementation - replace with actual notification system
        return {
            "stakeholders_notified": 5,
            "influencers_notified": 25,
            "emails_sent": 30
        }

# Global service instance
campaign_service = CampaignService()
