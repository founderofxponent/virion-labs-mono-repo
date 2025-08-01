from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from core.strapi_client import strapi_client
from core.auth import StrapiUser as User
from domain.landing_page_templates.schemas import (
    LandingPageTemplateCreate,
    LandingPageTemplateUpdate,
)
from schemas.strapi import (
    LandingPageTemplate,
    StrapiLandingPageTemplateCreate,
    StrapiLandingPageTemplateUpdate,
)
import logging

logger = logging.getLogger(__name__)

class LandingPageTemplateService:
    """Service layer for landing page template operations."""

    def _get_user_role(self, current_user: User) -> str:
        """Safely gets the user's role name."""
        if current_user.role and isinstance(current_user.role, dict):
            return current_user.role.get('name', 'Authenticated')
        return 'Authenticated'

    def _is_admin(self, current_user: User) -> bool:
        """Checks if the user is an administrator."""
        return self._get_user_role(current_user) in ['Platform Administrator', 'admin']

    async def list_templates_operation(self, filters: Optional[Dict[str, Any]], current_user: User) -> List[LandingPageTemplate]:
        """Lists landing page templates with authorization."""
        if not self._is_admin(current_user):
            if filters is None:
                filters = {}
            filters["filters[is_active][$eq]"] = True
        return await strapi_client.get_landing_page_templates(filters)

    async def get_template_operation(self, document_id: str, current_user: User) -> Optional[LandingPageTemplate]:
        """Gets a single landing page template with authorization."""
        template = await strapi_client.get_landing_page_template(document_id)
        if not template:
            return None
        if not self._is_admin(current_user) and not template.is_active:
            return None
        return template

    async def create_template_operation(self, template_data: LandingPageTemplateCreate, current_user: User) -> LandingPageTemplate:
        """Creates a new landing page template with authorization."""
        if not self._is_admin(current_user):
            raise HTTPException(status_code=403, detail="Forbidden: Only administrators can create landing page templates.")
        
        strapi_data = StrapiLandingPageTemplateCreate(**template_data.model_dump())
        return await strapi_client.create_landing_page_template(strapi_data)

    async def update_template_operation(self, document_id: str, template_data: LandingPageTemplateUpdate, current_user: User) -> LandingPageTemplate:
        """Updates a landing page template with authorization."""
        if not self._is_admin(current_user):
            raise HTTPException(status_code=403, detail="Forbidden: Only administrators can update landing page templates.")
        
        # Ensure template exists before updating
        existing_template = await self.get_template_operation(document_id, current_user)
        if not existing_template:
            raise HTTPException(status_code=404, detail="Landing page template not found")

        strapi_data = StrapiLandingPageTemplateUpdate(**template_data.model_dump(exclude_unset=True))
        return await strapi_client.update_landing_page_template(document_id, strapi_data)

    async def delete_template_operation(self, document_id: str, current_user: User) -> Dict[str, Any]:
        """Deletes a landing page template with authorization."""
        if not self._is_admin(current_user):
            raise HTTPException(status_code=403, detail="Forbidden: Only administrators can delete landing page templates.")

        # Ensure template exists before deleting
        existing_template = await self.get_template_operation(document_id, current_user)
        if not existing_template:
            raise HTTPException(status_code=404, detail="Landing page template not found")

        return await strapi_client.delete_landing_page_template(document_id)

# Create a singleton instance
landing_page_template_service = LandingPageTemplateService()