from fastapi import APIRouter, HTTPException
from typing import Any, Dict
from services.lead_service import lead_service

router = APIRouter()


@router.post("/api/v1/clients/leads")
async def create_lead(payload: Dict[str, Any]):
    # Public endpoint to create leads (top-of-funnel)
    try:
        lead = await lead_service.create_lead(payload)
        return {"lead": lead.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

