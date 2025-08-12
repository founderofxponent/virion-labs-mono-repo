from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any
from services.scheduling_service import scheduling_service

router = APIRouter()


@router.get("/api/v1/scheduling/slots")
async def get_slots(date: str = Query(..., description="ISO date YYYY-MM-DD")):
    try:
        slots = await scheduling_service.get_slots(date)
        return {"slots": slots}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/api/v1/scheduling/book")
async def book(payload: Dict[str, Any]):
    try:
        start = payload.get("start")
        duration = int(payload.get("duration_minutes", 30))
        lead_document_id = payload.get("lead_document_id")
        result = await scheduling_service.book(start, duration, lead_document_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

