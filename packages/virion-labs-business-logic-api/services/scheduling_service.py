from datetime import datetime, timedelta
from typing import List, Dict, Any
from core.config import settings
from core.strapi_client import strapi_client
from schemas.strapi import StrapiDiscoveryCallCreate, DiscoveryCall


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

    async def book(self, start_iso: str, duration_minutes: int, lead_document_id: int | None = None) -> Dict[str, Any]:
        # Placeholder for Google Calendar: assume success and synthesize event details
        start_dt = datetime.fromisoformat(start_iso)
        meeting_url = "https://meet.google.com/" + start_dt.strftime("%H%M%S")
        event_id = start_dt.strftime("evt%Y%m%d%H%M%S")

        # Store discovery call in Strapi if we have a lead
        created: DiscoveryCall | None = None
        if lead_document_id is not None:
            payload = StrapiDiscoveryCallCreate(
                scheduled_at=start_dt,
                duration_minutes=duration_minutes,
                google_event_id=event_id,
                meeting_url=meeting_url,
                lead=lead_document_id,
            )
            created = await strapi_client.create_discovery_call(payload)

        return {
            "event_id": event_id,
            "meeting_url": meeting_url,
            "scheduled_at": start_dt.isoformat(),
            "duration_minutes": duration_minutes,
            "discovery_call": created.model_dump() if created else None,
        }


scheduling_service = SchedulingService()

