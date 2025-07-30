from typing import Dict, Any, List, Optional
from core.strapi_client import strapi_client
import logging

logger = logging.getLogger(__name__)

class CampaignTemplateService:
    """Service layer for campaign template operations."""
    
    async def list_campaign_templates_operation(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Business operation for listing campaign templates."""
        try:
            # Get campaign templates from Strapi
            templates = await strapi_client.get_campaign_templates()
            
            # Apply category filter if provided
            if filters and filters.get("category"):
                category = filters["category"]
                templates = [
                    template for template in templates 
                    if template.get("attributes", {}).get("category") == category
                ]
            
            logger.info(f"Retrieved {len(templates)} campaign templates")
            
            return {
                "templates": templates,
                "total_count": len(templates),
                "filters_applied": filters or {}
            }
            
        except Exception as e:
            logger.error(f"Campaign template list operation failed: {e}")
            raise
    
    async def get_campaign_template_operation(self, template_id: str) -> Dict[str, Any]:
        """Business operation for getting a specific campaign template."""
        try:
            template = await strapi_client.get_campaign_template(template_id)
            
            if not template:
                return None
            
            logger.info(f"Retrieved campaign template: {template_id}")
            
            return {
                "template": template
            }
            
        except Exception as e:
            logger.error(f"Get campaign template operation failed: {e}")
            raise

# Global service instance
campaign_template_service = CampaignTemplateService()