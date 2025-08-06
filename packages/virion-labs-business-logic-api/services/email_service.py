from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
import logging
from core.strapi_client import strapi_client
from services.template_service import template_service

logger = logging.getLogger(__name__)

class Email(BaseModel):
    to: EmailStr
    subject: str
    html: str
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None

class TemplateEmail(BaseModel):
    to: EmailStr
    template_id: str
    variables: Dict[str, str]
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None

class EmailService:
    async def send_email(self, email_data: Email):
        """
        Sends an email using the Strapi email service.
        """
        try:
            # The Strapi email plugin expects a flat JSON object
            payload = {
                "to": email_data.to,
                "subject": email_data.subject,
                "html": email_data.html,
            }
            # Add optional 'from' if provided, otherwise Strapi uses default
            if email_data.from_email:
                payload['from'] = f"{email_data.from_name} <{email_data.from_email}>" if email_data.from_name else email_data.from_email

            logger.info(f"Sending email to {email_data.to} with subject '{email_data.subject}'")
            await strapi_client.send_email(payload)
            logger.info("Email sent successfully.")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            # Depending on requirements, you might want to re-raise or handle differently
            raise

    async def send_template_email(self, template_email_data: TemplateEmail):
        """
        Sends an email using a template from Strapi with variable substitution.
        """
        try:
            # Render the template with variables
            rendered = await template_service.render_template(
                template_email_data.template_id, 
                template_email_data.variables
            )
            
            # Create an Email object with the rendered content
            email_data = Email(
                to=template_email_data.to,
                subject=rendered["subject"],
                html=rendered["body"],
                from_email=template_email_data.from_email,
                from_name=template_email_data.from_name
            )
            
            # Send the email using the existing send_email method
            await self.send_email(email_data)
            logger.info(f"Template email sent successfully using template: {template_email_data.template_id}")
            
        except Exception as e:
            logger.error(f"Failed to send template email: {e}")
            raise

# Global instance of the service
email_service = EmailService()
