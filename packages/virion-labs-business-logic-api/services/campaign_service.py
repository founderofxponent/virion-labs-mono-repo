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

    async def unarchive_campaign_operation(self, campaign_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for unarchiving a campaign.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to unarchive campaigns.")

        # TODO: Add ownership check for Client role

        # Find the campaign to get its documentId
        campaigns = await strapi_client.get_campaigns()
        campaign_to_unarchive = None
        
        for campaign in campaigns:
            if str(campaign.get("id")) == str(campaign_id) or campaign.get("documentId") == campaign_id:
                campaign_to_unarchive = campaign
                break
        
        if not campaign_to_unarchive:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        document_id = campaign_to_unarchive.get("documentId")
        if not document_id:
            raise HTTPException(status_code=400, detail="Campaign documentId not found")

        update_data = {"is_active": True, "end_date": None}
        await strapi_client.update_campaign(document_id, update_data)
        
        return {"status": "unarchived"}

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

    async def batch_update_onboarding_fields_operation(self, campaign_id: str, batch_data: Dict[str, Any], current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for batch updating onboarding fields for a campaign.
        Processes all operations sequentially to prevent deadlocks.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to update onboarding fields.")

        # TODO: Add ownership check for Client role

        fields_data = batch_data.get('fields', [])
        delete_ids = batch_data.get('delete_ids', [])
        
        results = {
            'created': [],
            'updated': [],
            'deleted': [],
            'errors': []
        }

        try:
            # Process deletions first
            for document_id in delete_ids:
                try:
                    await strapi_client.delete_onboarding_field(document_id)
                    results['deleted'].append(document_id)
                    logger.info(f"Deleted onboarding field: {document_id}")
                except Exception as e:
                    error_msg = f"Failed to delete field {document_id}: {str(e)}"
                    logger.error(error_msg)
                    results['errors'].append(error_msg)

            # Process creates and updates sequentially to prevent deadlocks
            for field_data in fields_data:
                try:
                    # Check if this is an update (has id) or create (no id)
                    if 'id' in field_data and field_data['id']:
                        # This is an update operation
                        document_id = field_data.get('documentId') or field_data['id']
                        
                        # Validate that the field belongs to the target campaign
                        if 'campaign' in field_data and field_data['campaign']:
                            field_campaign_id = field_data['campaign'].get('documentId')
                            if field_campaign_id != campaign_id:
                                error_msg = f"Field {field_data.get('field_label', 'Unknown')} belongs to campaign {field_campaign_id}, not {campaign_id}"
                                logger.error(error_msg)
                                results['errors'].append(error_msg)
                                continue
                        
                        # Remove fields that shouldn't be sent to Strapi
                        clean_data = {k: v for k, v in field_data.items() 
                                    if k not in ['campaign', 'campaign_id', 'id', 'documentId', 'created_at', 'updated_at', 'createdAt', 'updatedAt', 'publishedAt']}
                        
                        updated_field = await strapi_client.update_onboarding_field(document_id, clean_data)
                        results['updated'].append(updated_field)
                        logger.info(f"Updated onboarding field: {document_id}")
                    else:
                        # This is a create operation
                        # Ensure campaign_id is included and remove id
                        create_data = {k: v for k, v in field_data.items() 
                                     if k not in ['id', 'campaign', 'created_at', 'updated_at', 'createdAt', 'updatedAt', 'publishedAt']}
                        create_data['campaign_id'] = campaign_id
                        
                        created_field = await strapi_client.create_onboarding_field(campaign_id, create_data)
                        results['created'].append(created_field)
                        logger.info(f"Created onboarding field for campaign: {campaign_id}")
                        
                except Exception as e:
                    error_msg = f"Failed to process field {field_data.get('field_label', 'Unknown')}: {str(e)}"
                    logger.error(error_msg)
                    results['errors'].append(error_msg)

            # If there were errors but some operations succeeded, log a warning
            if results['errors'] and (results['created'] or results['updated'] or results['deleted']):
                logger.warning(f"Batch update completed with {len(results['errors'])} errors out of {len(fields_data) + len(delete_ids)} operations")

            return {
                'success': len(results['errors']) == 0,
                'results': results,
                'summary': {
                    'created': len(results['created']),
                    'updated': len(results['updated']),
                    'deleted': len(results['deleted']),
                    'errors': len(results['errors'])
                }
            }

        except Exception as e:
            logger.error(f"Batch update operation failed completely: {e}")
            raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")

# Global service instance
campaign_service = CampaignService()
