from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from core.strapi_client import strapi_client
from domain.campaigns.models import BotCampaign, BotCampaignCreate, BotCampaignUpdate
from domain.campaigns.rules import CampaignDomain
from core.auth import StrapiUser
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class CampaignService:
    """
    Service layer for campaign operations with authorization.
    """
    def __init__(self):
        self.campaign_domain = CampaignDomain()

    def _get_user_role(self, current_user: StrapiUser) -> str:
        """Safely gets the user's role name."""
        if current_user.role and isinstance(current_user.role, dict):
            return current_user.role.get('name', 'Authenticated')
        return 'Authenticated'

    async def list_campaigns_operation(self, filters: Optional[Dict[str, Any]] = None, current_user: StrapiUser = None) -> Dict[str, Any]:
        """
        Business operation for listing campaigns.
        """
        user_role = self._get_user_role(current_user)
        
        if filters is None:
            filters = {}

        if user_role == 'Platform Administrator':
            pass  # Admin can access all campaigns
        elif user_role == 'Client':
            # This is a simplified filter. You might need to adjust based on your data model.
            # This assumes campaigns are directly linked to a user (client).
            filters["filters[client][owner][id][$eq]"] = current_user.id
        else:
            logger.warning(f"Forbidden: User with role '{user_role}' attempted to list campaigns.")
            raise HTTPException(status_code=403, detail=f"Forbidden: Your role ('{user_role}') does not have permission to list campaigns.")

        campaigns_from_db = await strapi_client.get_campaigns(filters)

        # The strapi_client.get_campaigns() already returns transformed data
        # that should match our BotCampaign model
        campaigns = []
        for campaign_data in campaigns_from_db:
            try:
                campaign = BotCampaign(**campaign_data)
                campaigns.append(campaign)
                
            except Exception as e:
                logger.error(f"Failed to create BotCampaign from data: {campaign_data}")
                logger.error(f"Validation error: {e}")
                # Skip invalid campaigns for now
                continue

        return {"campaigns": campaigns, "total_count": len(campaigns)}

    async def create_campaign_operation(self, campaign_data: Dict[str, Any], setup_options: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for campaign creation.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to create campaigns.")

        # campaign_type is now passed directly from frontend, no need to lookup template

        campaign_with_logic = self.campaign_domain.create_campaign_with_business_logic(campaign_data)
        
        document_id = campaign_with_logic.get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="documentId is required to create a campaign.")
        
        created_campaign_attrs = await strapi_client.create_campaign(campaign_with_logic, document_id)
        
        # Manually add documentId to the response attributes if it's missing
        if 'documentId' not in created_campaign_attrs and 'documentId' in campaign_with_logic:
            created_campaign_attrs['documentId'] = campaign_with_logic['documentId']

        # Assuming the created_campaign_attrs has the full campaign data.
        created_campaign = BotCampaign(**created_campaign_attrs)

        business_context = self.campaign_domain.get_campaign_business_context(created_campaign.model_dump())

        return {"campaign": created_campaign, "business_context": business_context}

    async def get_campaign_operation(self, campaign_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for fetching a single campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this campaign.")

        # For campaign operations, we need to find the campaign by ID first to get its documentId
        # Since the frontend might be using numeric ID, we need to search for it
        campaigns = await strapi_client.get_campaigns()
        campaign_attrs = None
        
        for campaign in campaigns:
            if str(campaign.get("id")) == str(campaign_id) or campaign.get("documentId") == campaign_id:
                campaign_attrs = campaign
                break
        
        if not campaign_attrs:
            raise HTTPException(status_code=404, detail="Campaign not found")

        # TODO: Add ownership check for Client role

        campaign = BotCampaign(**campaign_attrs)
        return {"campaign": campaign}

    async def update_campaign_operation(self, campaign_id: str, updates: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for updating a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to update campaigns.")

        # TODO: Add ownership check for Client role

        # Find the campaign to get its documentId for the update
        campaigns = await strapi_client.get_campaigns()
        campaign_to_update = None
        
        for campaign in campaigns:
            if str(campaign.get("id")) == str(campaign_id) or campaign.get("documentId") == campaign_id:
                campaign_to_update = campaign
                break
        
        if not campaign_to_update:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Use documentId for the update
        document_id = campaign_to_update.get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="Campaign documentId not found")

        # campaign_type is now passed directly from frontend, no need to lookup template

        updates_with_logic = self.campaign_domain.update_campaign_with_business_logic(updates)
        
        updated_campaign_attrs = await strapi_client.update_campaign(document_id, updates_with_logic)
        
        # Manually add documentId to the response attributes if it's missing
        if 'documentId' not in updated_campaign_attrs:
            updated_campaign_attrs['documentId'] = document_id

        updated_campaign = BotCampaign(**updated_campaign_attrs)

        business_context = self.campaign_domain.get_campaign_business_context(updated_campaign.model_dump())

        return {"campaign": updated_campaign, "business_context": business_context}

    async def delete_campaign_operation(self, campaign_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for deleting a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to delete campaigns.")

        # TODO: Add ownership check for Client role

        # Find the campaign to get its documentId for deletion
        campaigns = await strapi_client.get_campaigns()
        campaign_to_delete = None
        
        for campaign in campaigns:
            if str(campaign.get("id")) == str(campaign_id) or campaign.get("documentId") == campaign_id:
                campaign_to_delete = campaign
                break
        
        if not campaign_to_delete:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Use documentId for the delete
        document_id = campaign_to_delete.get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="Campaign documentId not found")

        await strapi_client.delete_campaign(document_id)
        
        return {"status": "deleted"}

    async def pause_campaign_operation(self, campaign_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for pausing a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to pause campaigns.")

        # TODO: Add ownership check for Client role

        # Find the campaign to get its documentId
        campaigns = await strapi_client.get_campaigns()
        campaign_to_pause = None
        
        for campaign in campaigns:
            if str(campaign.get("id")) == str(campaign_id) or campaign.get("documentId") == campaign_id:
                campaign_to_pause = campaign
                break
        
        if not campaign_to_pause:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        document_id = campaign_to_pause.get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="Campaign documentId not found")

        # Note: paused_at field doesn't exist in actual schema, so just use is_active
        update_data = {"is_active": False}
        await strapi_client.update_campaign(document_id, update_data)
        
        return {"status": "paused"}

    async def resume_campaign_operation(self, campaign_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for resuming a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to resume campaigns.")

        # TODO: Add ownership check for Client role

        # Find the campaign to get its documentId
        campaigns = await strapi_client.get_campaigns()
        campaign_to_resume = None
        
        for campaign in campaigns:
            if str(campaign.get("id")) == str(campaign_id) or campaign.get("documentId") == campaign_id:
                campaign_to_resume = campaign
                break
        
        if not campaign_to_resume:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        document_id = campaign_to_resume.get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="Campaign documentId not found")

        update_data = {"is_active": True}
        await strapi_client.update_campaign(document_id, update_data)
        
        return {"status": "resumed"}

    async def archive_campaign_operation(self, campaign_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for archiving a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to archive campaigns.")

        # TODO: Add ownership check for Client role

        # Find the campaign to get its documentId
        campaigns = await strapi_client.get_campaigns()
        campaign_to_archive = None
        
        for campaign in campaigns:
            if str(campaign.get("id")) == str(campaign_id) or campaign.get("documentId") == campaign_id:
                campaign_to_archive = campaign
                break
        
        if not campaign_to_archive:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        document_id = campaign_to_archive.get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="Campaign documentId not found")

        update_data = {"is_active": False, "end_date": datetime.utcnow().isoformat()}
        await strapi_client.update_campaign(document_id, update_data)
        
        return {"status": "archived"}

    async def get_onboarding_fields_operation(self, campaign_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for fetching onboarding fields for a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view onboarding fields.")

        # TODO: Add ownership check for Client role

        fields = await strapi_client.get_onboarding_fields(campaign_id)
        
        return {"fields": fields}

    async def create_onboarding_field_operation(self, campaign_id: str, field_data: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for creating an onboarding field for a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to create onboarding fields.")

        # TODO: Add ownership check for Client role

        field = await strapi_client.create_onboarding_field(campaign_id, field_data)
        
        return {"field": field}

    async def update_onboarding_field_operation(self, document_id: str, field_data: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for updating an onboarding field for a campaign.
        Uses detach-update-reattach logic to handle Strapi v5 relationship constraints.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to update onboarding fields.")

        # TODO: Add ownership check for Client role

        try:
            # Use the updated Strapi client method that handles detach-update-reattach internally
            updated_field = await strapi_client.update_onboarding_field(document_id, field_data)
            
            if not updated_field:
                raise HTTPException(status_code=404, detail="Onboarding field not found")
                
            logger.info(f"Successfully updated onboarding field {document_id}")
            return {"field": updated_field}
            
        except ValueError as e:
            # Handle specific validation errors from the Strapi client
            logger.error(f"Validation error updating onboarding field: {e}")
            raise HTTPException(status_code=404, detail=str(e))
        except Exception as e:
            logger.error(f"Error updating onboarding field {document_id}: {e}")
            raise HTTPException(status_code=500, detail="Could not update onboarding field.")

    async def get_campaign_template_operation(self, document_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for fetching a single campaign template by document ID.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view campaign templates.")

        template = await strapi_client.get_campaign_template(document_id)
        
        return {"template": template}

    async def list_campaign_templates_operation(self, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for listing all campaign templates.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view campaign templates.")

        templates = await strapi_client.get_campaign_templates()
        
        return {"templates": templates}

    async def delete_onboarding_field_operation(self, document_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for deleting an onboarding field for a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to delete onboarding fields.")

        # TODO: Add ownership check for Client role

        await strapi_client.delete_onboarding_field(document_id)
        
        return {"status": "deleted"}

# Global service instance
campaign_service = CampaignService()
