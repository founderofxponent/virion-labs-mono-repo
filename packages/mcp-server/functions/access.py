"""Access request management functions."""

from datetime import datetime
from typing import List
from functions.base import supabase, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


def list_access_requests(_params: dict) -> dict:
    """Retrieves a list of all access requests."""
    try:
        response = supabase.table("access_requests").select("*").execute()
        return {"access_requests": response.data}
    except Exception as e:
        logger.error(f"Error listing access requests: {e}")
        return {"error": str(e)}


def approve_access_request(params: dict) -> dict:
    """Approves a pending access request."""
    try:
        request_id = params["request_id"]
        update_data = {
            "status": "approved",
            "role_assigned_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        response = supabase.table("access_requests").update(update_data).eq("id", request_id).execute()
        return response.data[0] if response.data else {"error": "Access request not found"}
    except Exception as e:
        logger.error(f"Error approving access request: {e}")
        return {"error": str(e)}


def deny_access_request(params: dict) -> dict:
    """Denies a pending access request by marking it as updated."""
    try:
        request_id = params["request_id"]
        update_data = {
            "status": "denied",
            "updated_at": datetime.now().isoformat()
        }
        response = supabase.table("access_requests").update(update_data).eq("id", request_id).execute()
        return response.data[0] if response.data else {"error": "Access request not found"}
    except Exception as e:
        logger.error(f"Error denying access request: {e}")
        return {"error": str(e)}


class AccessPlugin(PluginBase):
    """Plugin for access request management functions."""
    
    @property
    def category(self) -> str:
        return "access"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="list_access_requests",
                func=apply_middleware(list_access_requests),
                category=self.category,
                description="Lists all access requests",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="approve_access_request",
                func=apply_middleware(approve_access_request, [
                    validation_middleware(["request_id"])
                ]),
                category=self.category,
                description="Approves an access request",
                schema={
                    "type": "object",
                    "properties": {
                        "request_id": {"type": "string", "description": "Access request UUID"}
                    },
                    "required": ["request_id"]
                }
            ),
            FunctionSpec(
                name="deny_access_request",
                func=apply_middleware(deny_access_request, [
                    validation_middleware(["request_id"])
                ]),
                category=self.category,
                description="Denies an access request",
                schema={
                    "type": "object",
                    "properties": {
                        "request_id": {"type": "string", "description": "Access request UUID"}
                    },
                    "required": ["request_id"]
                }
            )
        ]


def get_plugin() -> AccessPlugin:
    """Get the access plugin instance."""
    return AccessPlugin()