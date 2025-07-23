from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any
from core.database import get_supabase_client
from services import search_service
from supabase import Client

router = APIRouter(
    tags=["Search"],
)

@router.get(
    "/resources", 
    response_model=List[str],
    operation_id="searchable.list",
    summary="[Search] Get a list of all resources that can be searched."
)
def list_searchable_resources():
    """
    Returns a list of resources that can be searched.
    """
    return search_service.get_searchable_resources()

@router.get(
    "/query", 
    response_model=List[Dict[str, Any]],
    operation_id="search.search",
    summary="[Search] Perform a full-text search on a specified resource."
)
def search(
    resource: str = Query(..., description="The resource to search (e.g., 'clients', 'campaigns')."),
    q: str = Query(..., description="The search query."),
    db: Client = Depends(get_supabase_client)
):
    """
    Performs a search on the specified resource.
    """
    try:
        results = search_service.search_resource(db, resource, q)
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred during search.") 