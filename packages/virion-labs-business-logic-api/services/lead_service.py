from typing import Dict, Any
from core.strapi_client import strapi_client
from schemas.strapi import StrapiClientLeadCreate, ClientLead


class LeadService:
    async def create_lead(self, payload: Dict[str, Any]) -> ClientLead:
        lead_payload = StrapiClientLeadCreate(**payload)
        return await strapi_client.create_client_lead(lead_payload)


lead_service = LeadService()

