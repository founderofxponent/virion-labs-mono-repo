from typing import List, Optional, Dict
from core.strapi_client import strapi_client
from schemas.strapi import CampaignTemplate
import logging

logger = logging.getLogger(__name__)

class CampaignTemplateService:
    """Service layer for campaign template operations."""
    
    async def list_campaign_templates_operation(self, filters: Optional[Dict] = None) -> List[CampaignTemplate]:
        """Business operation for listing campaign templates."""
        try:
            strapi_filters = {}
            if filters and filters.get("category"):
                strapi_filters["filters[category][$eq]"] = filters["category"]
            
            templates = await strapi_client.get_campaign_templates(strapi_filters)
            logger.info(f"Retrieved {len(templates)} campaign templates")
            return templates
            
        except Exception as e:
            logger.error(f"Campaign template list operation failed: {e}")
            raise
    
    async def get_campaign_template_operation(self, template_id: str) -> Optional[CampaignTemplate]:
        """Business operation for getting a specific campaign template."""
        try:
            template = await strapi_client.get_campaign_template(template_id)
            if not template:
                return None
            logger.info(f"Retrieved campaign template: {template_id}")
            return template
            
        except Exception as e:
            logger.error(f"Get campaign template operation failed: {e}")
            raise

# Global service instance
campaign_template_service = CampaignTemplateService()