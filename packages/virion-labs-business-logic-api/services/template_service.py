from typing import List, Optional, Dict
from core.strapi_client import strapi_client
from schemas.strapi import EmailTemplate, StrapiEmailTemplateCreate, StrapiEmailTemplateUpdate
import logging

logger = logging.getLogger(__name__)

class TemplateService:
    """Service for managing email templates."""
    
    async def get_template_by_id(self, template_id: str) -> Optional[EmailTemplate]:
        """
        Fetch an email template by its template_id from Strapi.
        """
        try:
            logger.info(f"Fetching email template with template_id: {template_id}")
            filters = {
                "filters[template_id][$eq]": template_id,
                "filters[is_active][$eq]": True
            }
            templates = await strapi_client.get_email_templates(filters=filters)
            if templates:
                return templates[0]
            logger.warning(f"No active template found with template_id: {template_id}")
            return None
        except Exception as e:
            logger.error(f"Failed to fetch template {template_id}: {e}")
            raise

    async def get_templates(self, filters: Optional[Dict] = None) -> List[EmailTemplate]:
        """
        Fetch all email templates from Strapi.
        """
        try:
            logger.info("Fetching all email templates")
            return await strapi_client.get_email_templates(filters=filters)
        except Exception as e:
            logger.error(f"Failed to fetch templates: {e}")
            raise

    async def create_template(self, template_data: StrapiEmailTemplateCreate) -> EmailTemplate:
        """
        Create a new email template in Strapi.
        """
        try:
            logger.info(f"Creating email template: {template_data.template_id}")
            return await strapi_client.create_email_template(template_data)
        except Exception as e:
            logger.error(f"Failed to create template: {e}")
            raise

    async def update_template(self, document_id: str, template_data: StrapiEmailTemplateUpdate) -> EmailTemplate:
        """
        Update an existing email template in Strapi.
        """
        try:
            logger.info(f"Updating email template: {document_id}")
            return await strapi_client.update_email_template(document_id, template_data)
        except Exception as e:
            logger.error(f"Failed to update template: {e}")
            raise

    async def delete_template(self, document_id: str) -> Dict:
        """
        Delete an email template from Strapi.
        """
        try:
            logger.info(f"Deleting email template: {document_id}")
            return await strapi_client.delete_email_template(document_id)
        except Exception as e:
            logger.error(f"Failed to delete template: {e}")
            raise

    async def render_template(self, template_id: str, variables: Dict[str, str]) -> Dict[str, str]:
        """
        Render an email template with the provided variables.
        Returns a dict with 'subject' and 'body' keys.
        """
        try:
            template = await self.get_template_by_id(template_id)
            if not template:
                raise ValueError(f"Template with id '{template_id}' not found")
            
            rendered_subject = template.subject
            rendered_body = template.body or ""
            
            # Simple variable substitution using format strings
            for key, value in variables.items():
                placeholder = f"{{{key}}}"
                rendered_subject = rendered_subject.replace(placeholder, str(value))
                rendered_body = rendered_body.replace(placeholder, str(value))
            
            logger.info(f"Successfully rendered template: {template_id}")
            return {
                "subject": rendered_subject,
                "body": rendered_body
            }
        except Exception as e:
            logger.error(f"Failed to render template {template_id}: {e}")
            raise

template_service = TemplateService()