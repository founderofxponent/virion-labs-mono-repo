from typing import Dict, Any
from core.strapi_client import strapi_client
from services.email_service import email_service, TemplateEmail
from core.config import settings
from schemas.strapi import StrapiClientLeadCreate, ClientLead, StrapiClientCreate, StrapiClientLeadUpdate


class LeadService:
    async def create_lead(self, payload: Dict[str, Any]) -> ClientLead:
        lead_payload = StrapiClientLeadCreate(**payload)
        created = await strapi_client.create_client_lead(lead_payload)

        # Create a corresponding pending Client in Strapi for admin approval
        try:
            client_payload = StrapiClientCreate(
                name=payload.get("company_name"),
                contact_email=payload.get("contact_email"),
                industry=payload.get("industry"),
                website=payload.get("website"),
                primary_contact=payload.get("contact_name"),
                client_status="pending"
            )
            new_client = await strapi_client.create_client(client_payload)
            # Link the lead to the new client
            try:
                if getattr(created, 'documentId', None):
                    await strapi_client.update_client_lead(created.documentId, StrapiClientLeadUpdate(client=new_client.id))
            except Exception:
                pass
        except Exception:
            # Do not block lead creation if client creation/linking fails
            pass
        # Notify admin of new lead submission
        try:
            await email_service.send_template_email(TemplateEmail(
                to=settings.ADMIN_EMAIL or "joshua@updates.virionlabs.io",
                template_id="admin-client-lead-submitted",
                variables={
                    "company_name": payload.get("company_name", ""),
                    "contact_name": payload.get("contact_name", ""),
                    "contact_email": payload.get("contact_email", ""),
                }
            ))
        except Exception:
            # Do not block lead creation on email failure
            pass
        return created


lead_service = LeadService()

