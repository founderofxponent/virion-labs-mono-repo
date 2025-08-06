from typing import Dict, Any, List, Optional, Union
from core.strapi_client import strapi_client
from domain.campaigns.schemas import (
    CampaignCreate,
    CampaignUpdate,
    CampaignLandingPageCreate,
    CampaignLandingPageUpdate,
    CampaignOnboardingFieldCreate,
    CampaignOnboardingFieldUpdate,
)
from schemas.strapi import (
    Campaign,
    StrapiCampaignCreate,
    StrapiCampaignUpdate,
    CampaignLandingPage,
    StrapiCampaignLandingPageCreate,
    StrapiCampaignLandingPageUpdate,
    StrapiCampaignOnboardingFieldCreate,
    StrapiCampaignOnboardingFieldUpdate,
    CampaignOnboardingField,
)
import logging

logger = logging.getLogger(__name__)

class CampaignService:
    """Service layer for campaign operations."""

    async def list_campaigns_operation(self, filters: Optional[Dict[str, Any]] = None) -> List[Campaign]:
        """Business operation for listing campaigns."""
        return await strapi_client.get_campaigns(filters)

    async def get_campaign_operation(self, document_id: str) -> Optional[Campaign]:
        """Business operation for getting a single campaign."""
        return await strapi_client.get_campaign(document_id)

    async def create_campaign_operation(self, campaign_data: CampaignCreate) -> Campaign:
        """Business operation for creating a new campaign."""
        logger.info(f"Executing create campaign operation for: {campaign_data.name}")

        # Resolve client documentId to numeric ID
        client_doc_id = campaign_data.client
        client = await strapi_client.get_client(client_doc_id)
        if not client:
            raise ValueError(f"Client with documentId {client_doc_id} not found.")

        create_payload = campaign_data.model_dump(mode='json')
        create_payload['client'] = client.id

        strapi_data = StrapiCampaignCreate(**create_payload)
        return await strapi_client.create_campaign(strapi_data)

    async def update_campaign_operation(self, document_id: str, campaign_data: CampaignUpdate) -> Campaign:
        """Business operation for updating a campaign."""
        logger.info(f"Executing update campaign operation for campaign: {document_id}")

        update_dict = campaign_data.model_dump(exclude_unset=True, mode='json')

        # Resolve client documentId to numeric ID if provided
        if 'client' in update_dict and isinstance(update_dict['client'], str):
            client_doc_id = update_dict.pop('client')
            client = await strapi_client.get_client(client_doc_id)
            if client:
                update_dict['client'] = client.id
            else:
                logger.warning(f"Could not find client with documentId: {client_doc_id}. Relation will not be updated.")

        strapi_data = StrapiCampaignUpdate(**update_dict)
        return await strapi_client.update_campaign(document_id, strapi_data)

    async def delete_campaign_operation(self, document_id: str) -> Dict[str, Any]:
        """Business operation for deleting a campaign."""
        logger.info(f"Executing delete campaign operation for campaign: {document_id}")
        await strapi_client.delete_campaign(document_id)
        return {"message": f"Campaign {document_id} deleted successfully."}
    
    async def archive_campaign_operation(self, document_id: str) -> Campaign:
        """Business operation for archiving a campaign."""
        logger.info(f"Executing archive campaign operation for campaign: {document_id}")
        
        # Archive by setting is_active to False and end_date to now
        from datetime import datetime, timezone
        archive_data = StrapiCampaignUpdate(
            is_active=False,
            end_date=datetime.now(timezone.utc)
        )
        return await strapi_client.update_campaign(document_id, archive_data)
    
    async def unarchive_campaign_operation(self, document_id: str) -> Campaign:
        """Business operation for unarchiving a campaign."""
        logger.info(f"Executing unarchive campaign operation for campaign: {document_id}")
        
        # Unarchive by setting is_active to True and clearing end_date
        unarchive_data = StrapiCampaignUpdate(
            is_active=True,
            end_date=None
        )
        return await strapi_client.update_campaign(document_id, unarchive_data)

    async def get_landing_page_operation(self, campaign_id: str) -> Optional[CampaignLandingPage]:
        """Business operation for getting the landing page for a campaign."""
        return await strapi_client.get_campaign_landing_page(campaign_id)

    async def create_landing_page_operation(self, page_data: CampaignLandingPageCreate) -> CampaignLandingPage:
        """Business operation for creating a new landing page for a campaign."""
        logger.info(f"Executing create landing page operation for campaign: {page_data.campaign}")

        campaign_doc_id = page_data.campaign
        campaign_id = await strapi_client.get_campaign_id_by_document_id(campaign_doc_id)
        if not campaign_id:
            raise ValueError(f"Campaign with documentId {campaign_doc_id} not found.")

        create_payload = page_data.model_dump(mode='json')
        create_payload['campaign'] = campaign_id

        # Convert landing_page_template documentId to numeric ID if present
        if 'landing_page_template' in create_payload and isinstance(create_payload['landing_page_template'], str):
            template_doc_id = create_payload['landing_page_template']
            template_id = await strapi_client.get_landing_page_template_id_by_document_id(template_doc_id)
            if template_id:
                create_payload['landing_page_template'] = template_id
            else:
                logger.warning(f"Could not find landing page template with documentId: {template_doc_id}. Removing from payload to prevent validation errors.")
                create_payload.pop('landing_page_template', None)

        strapi_data = StrapiCampaignLandingPageCreate(**create_payload)
        return await strapi_client.create_campaign_landing_page(strapi_data)

    async def update_landing_page_operation(self, page_id: str, page_data: CampaignLandingPageUpdate) -> Dict[str, Any]:
        """Business operation for updating a landing page."""
        logger.info(f"SERVICE: Executing update landing page operation for page: {page_id}")

        update_dict = page_data.model_dump(exclude_unset=True, mode='json')

        # If campaign is present as a document ID string, convert it to a numeric ID
        if 'campaign' in update_dict and isinstance(update_dict['campaign'], str):
            campaign_doc_id = update_dict.pop('campaign')
            campaign_id = await strapi_client.get_campaign_id_by_document_id(campaign_doc_id)
            if campaign_id:
                update_dict['campaign'] = campaign_id
            else:
                logger.warning(f"Could not find campaign with documentId: {campaign_doc_id}. Relation will not be updated.")

        # If landing_page_template is present as a document ID string, convert it to a numeric ID
        if 'landing_page_template' in update_dict and isinstance(update_dict['landing_page_template'], str):
            template_doc_id = update_dict['landing_page_template']
            template_id = await strapi_client.get_landing_page_template_id_by_document_id(template_doc_id)
            if template_id:
                update_dict['landing_page_template'] = template_id
            else:
                logger.warning(f"Could not find landing page template with documentId: {template_doc_id}. Removing from payload to prevent validation errors.")
                update_dict.pop('landing_page_template', None)

        # Map the service model to the Strapi data model
        strapi_page_data = StrapiCampaignLandingPageUpdate(**update_dict)

        updated_page = await strapi_client.update_campaign_landing_page(page_id, strapi_page_data)

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

    async def get_onboarding_fields_operation(self, campaign_id: str) -> List[CampaignOnboardingField]:
        """Business operation for getting campaign onboarding fields."""
        logger.info(f"Executing get onboarding fields operation for campaign: {campaign_id}")
        return await strapi_client.get_onboarding_fields_by_campaign(campaign_id)

    async def create_onboarding_field_operation(self, field_data: CampaignOnboardingFieldCreate) -> CampaignOnboardingField:
        """Business operation for creating a campaign onboarding field."""
        logger.info(f"Executing create onboarding field operation.")
        
        # Convert campaign documentId to numeric ID for Strapi
        campaign_doc_id = field_data.campaign
        campaign_id = await strapi_client.get_campaign_id_by_document_id(campaign_doc_id)
        if not campaign_id:
            raise ValueError(f"Campaign with documentId {campaign_doc_id} not found.")

        create_payload = field_data.model_dump()
        create_payload['campaign'] = campaign_id

        strapi_data = StrapiCampaignOnboardingFieldCreate(**create_payload)
        return await strapi_client.create_onboarding_field(strapi_data)

    async def get_onboarding_field_operation(self, field_id: Union[int, str]) -> Optional[CampaignOnboardingField]:
        """
        Business operation for getting a single campaign onboarding field by its numeric ID or documentId.
        """
        logger.info(f"Executing get onboarding field operation for field: {field_id}")
        
        if isinstance(field_id, int) or field_id.isdigit():
            return await strapi_client.get_onboarding_field(int(field_id))
        else:
            return await strapi_client.get_onboarding_field_by_document_id(field_id)

    async def update_onboarding_field_operation(self, field_id: int, field_data: CampaignOnboardingFieldUpdate) -> CampaignOnboardingField:
        """Business operation for updating a campaign onboarding field."""
        logger.info(f"Executing update onboarding field operation for field: {field_id}")
        
        update_dict = field_data.model_dump(exclude_unset=True)
        
        strapi_data = StrapiCampaignOnboardingFieldUpdate(**update_dict)
        return await strapi_client.update_onboarding_field(field_id, strapi_data)

    async def delete_onboarding_field_operation(self, field_id: int) -> Dict[str, Any]:
        """Business operation for deleting a campaign onboarding field."""
        logger.info(f"Executing delete onboarding field operation for field: {field_id}")
        await strapi_client.delete_onboarding_field(field_id)
        return {"message": f"Onboarding field {field_id} deleted successfully."}

    async def batch_update_onboarding_fields_operation(
        self, campaign_id: str, updates: List[Dict[str, Any]], deletes: List[str], current_user: Any
    ) -> List[CampaignOnboardingField]:
        """
        Business operation for batch updating campaign onboarding fields.
        This includes creating, updating, and deleting fields in a single transaction.
        """
        logger.info(f"Executing batch update for onboarding fields for campaign: {campaign_id}")

        # Get the numeric campaign ID from the document ID
        numeric_campaign_id = await strapi_client.get_campaign_id_by_document_id(campaign_id)
        if not numeric_campaign_id:
            raise ValueError(f"Campaign with documentId {campaign_id} not found.")

        # Process deletions
        for field_id in deletes:
            try:
                # Ensure field_id is an integer for deletion
                await self.delete_onboarding_field_operation(int(field_id))
            except ValueError as e:
                logger.warning(f"Could not delete field with ID {field_id}: {e}")
            except Exception as e:
                logger.error(f"Error deleting onboarding field {field_id}: {e}", exc_info=True)
                # Decide if you want to raise or just log
                # For now, we log and continue
                pass

        # Process creations and updates
        for field_data in updates:
            field_id = field_data.get("id")
            
            try:
                if field_id and "template" not in str(field_id):
                    # This is an update
                    update_data = CampaignOnboardingFieldUpdate(**field_data)
                    await self.update_onboarding_field_operation(int(field_id), update_data)
                else:
                    # This is a new field, remove temporary ID if it exists
                    field_data.pop("id", None)
                    create_data = CampaignOnboardingFieldCreate(campaign=campaign_id, **field_data)
                    await self.create_onboarding_field_operation(create_data)
            except Exception as e:
                logger.error(f"Error processing field update/create for campaign {campaign_id}: {e}", exc_info=True)
                # Decide if you want to raise or just log
                # For now, we log and continue
                pass
        
        # Return the updated list of fields for the campaign
        return await self.get_onboarding_fields_operation(campaign_id)

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
