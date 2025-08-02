from pydantic import BaseModel, EmailStr
from typing import Optional
import logging
from core.strapi_client import strapi_client

logger = logging.getLogger(__name__)

class Email(BaseModel):
    to: EmailStr
    subject: str
    html: str
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

# Global instance of the service
email_service = EmailService()
