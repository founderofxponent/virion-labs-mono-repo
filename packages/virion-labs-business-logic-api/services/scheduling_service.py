from datetime import datetime, timedelta
from typing import List, Dict, Any
from core.config import settings
from core.strapi_client import strapi_client
from schemas.strapi import StrapiDiscoveryCallCreate, DiscoveryCall
from services.email_service import email_service, Email, TemplateEmail
import logging

logger = logging.getLogger(__name__)


class SchedulingService:
    def _get_working_hours(self):
        # Basic 9am-5pm window
        return 9, 17

    async def get_slots(self, date_iso: str) -> List[str]:
        # Generate 30-minute slots for the given day
        # Accept both YYYY-MM-DD and full ISO strings
        try:
            if len(date_iso) == 10:
                # Date only
                from datetime import date as _date
                d = _date.fromisoformat(date_iso)
                day = datetime(d.year, d.month, d.day)
            else:
                day = datetime.fromisoformat(date_iso)
        except Exception:
            # Fallback: parse first 10 chars
            from datetime import date as _date
            d = _date.fromisoformat(date_iso[:10])
            day = datetime(d.year, d.month, d.day)
        start_hour, end_hour = self._get_working_hours()
        start = day.replace(hour=start_hour, minute=0, second=0, microsecond=0)
        end = day.replace(hour=end_hour, minute=0, second=0, microsecond=0)
        slots: List[str] = []
        cur = start
        while cur < end:
            slots.append(cur.isoformat())
            cur += timedelta(minutes=30)
        return slots

    async def book(self, start_iso: str, duration_minutes: int, lead_document_id: str | int | None = None) -> Dict[str, Any]:
        # Placeholder for Google Calendar: assume success and synthesize event details
        start_dt = datetime.fromisoformat(start_iso)
        meeting_url = "https://meet.google.com/" + start_dt.strftime("%H%M%S")
        event_id = start_dt.strftime("evt%Y%m%d%H%M%S")

        # Store discovery call in Strapi if we have a lead
        created: DiscoveryCall | None = None
        if lead_document_id is not None:
            # If lead_document_id is a string (documentId), find the numeric id
            lead_id = lead_document_id
            if isinstance(lead_document_id, str):
                # Fetch the lead by documentId to get the numeric id
                leads = await strapi_client.get_client_leads({
                    "filters[documentId][$eq]": lead_document_id,
                    "populate": "*"
                })
                if not leads:
                    raise ValueError(f"Lead with documentId {lead_document_id} not found")
                lead_id = leads[0].id
            
            payload = StrapiDiscoveryCallCreate(
                scheduled_at=start_dt,
                duration_minutes=duration_minutes,
                google_event_id=event_id,
                meeting_url=meeting_url,
                lead=lead_id,
                timezone="UTC"  # Add timezone
            )
            logger.info(f"Creating discovery call with payload: {payload.model_dump()}")
            try:
                created = await strapi_client.create_discovery_call(payload)
                logger.info(f"Discovery call created successfully: {created}")
            except Exception as e:
                logger.error(f"Failed to create discovery call: {e}")
                raise

            # Notify admin of new discovery call booking
            try:
                # Use the lead we already fetched (if string) or fetch it (if int)
                if isinstance(lead_document_id, str):
                    lead = leads[0]  # Already fetched above
                else:
                    # Fetch by numeric id
                    leads_by_id = await strapi_client.get_client_leads({
                        "filters[id][$eq]": lead_id,
                        "populate": "*"
                    })
                    lead = leads_by_id[0] if leads_by_id else None
                    
                contact_email = getattr(lead, 'contact_email', None) if lead else None
                contact_name = getattr(lead, 'contact_name', None) if lead else None
                company_name = getattr(lead, 'company_name', None) if lead else None

                await email_service.send_template_email(TemplateEmail(
                    to=settings.ADMIN_EMAIL or "joshua@updates.virionlabs.io",
                    template_id="admin-client-discovery-booked",
                    variables={
                        "contact_name": contact_name or "Client",
                        "company_name": company_name or "",
                        "scheduled_at": start_dt.isoformat(),
                        "meeting_url": meeting_url
                    }
                ))
            except Exception as e:
                # Best-effort: do not fail booking if email fails, but log the error for visibility
                logger.exception(
                    "Failed to send admin discovery call notification email. Lead: %s, Start: %s, Duration: %s. Error: %s",
                    getattr(lead, 'documentId', None) if 'lead' in locals() and lead else None,
                    start_dt.isoformat(),
                    duration_minutes,
                    e
                )

        return {
            "event_id": event_id,
            "meeting_url": meeting_url,
            "scheduled_at": start_dt.isoformat(),
            "duration_minutes": duration_minutes,
            "discovery_call": created.model_dump() if created else None,
        }


scheduling_service = SchedulingService()

