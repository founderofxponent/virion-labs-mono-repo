from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from core.strapi_client import strapi_client
from core.auth import StrapiUser
import logging

logger = logging.getLogger(__name__)

class LandingPageTemplateService:
    """
    Service layer for landing page template operations with authorization.
    """

    def _get_user_role(self, current_user: StrapiUser) -> str:
        """Safely gets the user's role name."""
        if current_user.role and isinstance(current_user.role, dict):
            return current_user.role.get('name', 'Authenticated')
        return 'Authenticated'

    async def list_landing_page_templates_operation(self, filters: Optional[Dict[str, Any]] = None, current_user: StrapiUser = None) -> Dict[str, Any]:
        """
        Business operation for listing landing page templates.
        """
        user_role = self._get_user_role(current_user)
        
        # Landing page templates are generally accessible to authenticated users
        if user_role not in ['Platform Administrator', 'Client', 'Authenticated']:
            logger.warning(f"Forbidden: User with role '{user_role}' attempted to list landing page templates.")
            raise HTTPException(status_code=403, detail=f"Forbidden: Your role ('{user_role}') does not have permission to list landing page templates.")

        if filters is None:
            filters = {}

        # Add filter for active templates only (unless admin)
        if user_role != 'Platform Administrator':
            filters["filters[is_active][$eq]"] = True

        landing_page_templates_from_db = await strapi_client.get_landing_page_templates(filters)

        return {"landing_page_templates": landing_page_templates_from_db, "total_count": len(landing_page_templates_from_db)}

    async def get_landing_page_template_operation(self, template_id: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for fetching a single landing page template.
        """
        user_role = self._get_user_role(current_user)
        if user_role not in ['Platform Administrator', 'Client', 'Authenticated']:
            raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this landing page template.")

        # Try to get the template by document ID or search by numeric ID
        template_attrs = None
        
        try:
            # First, try as documentId directly
            template_attrs = await strapi_client.get_landing_page_template(template_id)
        except Exception as e:
            logger.info(f"Template not found by documentId {template_id}, searching by numeric ID: {e}")
            
            # If that fails, search by numeric ID
            all_templates = await strapi_client.get_landing_page_templates()
            for template in all_templates:
                if str(template.get("id")) == str(template_id):
                    template_attrs = template
                    break
        
        if not template_attrs:
            raise HTTPException(status_code=404, detail="Landing page template not found")

        # Check if template is active (unless admin)
        if user_role != 'Platform Administrator' and not template_attrs.get('attributes', {}).get('is_active', False):
            raise HTTPException(status_code=404, detail="Landing page template not found")

        return {"landing_page_template": template_attrs}

    async def list_landing_page_templates_by_campaign_type_operation(self, campaign_type: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for listing landing page templates filtered by campaign type.
        """
        user_role = self._get_user_role(current_user)
        
        if user_role not in ['Platform Administrator', 'Client', 'Authenticated']:
            logger.warning(f"Forbidden: User with role '{user_role}' attempted to list landing page templates by campaign type.")
            raise HTTPException(status_code=403, detail=f"Forbidden: Your role ('{user_role}') does not have permission to list landing page templates.")

        # Remove filtering for now - just return all templates
        filters = {}

        # Add filter for active templates only (unless admin)
        if user_role != 'Platform Administrator':
            filters["filters[is_active][$eq]"] = True

        landing_page_templates_from_db = await strapi_client.get_landing_page_templates(filters)

        return {"landing_page_templates": landing_page_templates_from_db, "total_count": len(landing_page_templates_from_db)}

    async def list_landing_page_templates_by_category_operation(self, category: str, current_user: StrapiUser) -> Dict[str, Any]:
        """
        Business operation for listing landing page templates filtered by category.
        """
        user_role = self._get_user_role(current_user)
        
        if user_role not in ['Platform Administrator', 'Client', 'Authenticated']:
            logger.warning(f"Forbidden: User with role '{user_role}' attempted to list landing page templates by category.")
            raise HTTPException(status_code=403, detail=f"Forbidden: Your role ('{user_role}') does not have permission to list landing page templates.")

        filters = {
            "filters[category][$eq]": category
        }

        # Add filter for active templates only (unless admin)
        if user_role != 'Platform Administrator':
            filters["filters[is_active][$eq]"] = True

        landing_page_templates_from_db = await strapi_client.get_landing_page_templates(filters)

        return {"landing_page_templates": landing_page_templates_from_db, "total_count": len(landing_page_templates_from_db)}

# Create a singleton instance
landing_page_template_service = LandingPageTemplateService()