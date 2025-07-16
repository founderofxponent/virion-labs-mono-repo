"""Client management functions."""

from typing import List
from functions.base import supabase, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


def create_client(params: dict) -> dict:
    """Creates a new client."""
    try:
        client_data = {
            "name": params["name"],
            "industry": params["industry"],
            "logo": params.get("logo"),
            "website": params.get("website"),
            "primary_contact": params.get("primary_contact"),
            "contact_email": params.get("contact_email"),
            "status": params.get("status", "Active")
        }
        response = supabase.table("clients").insert(client_data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating client: {e}")
        return {"error": str(e)}


def update_client(params: dict) -> dict:
    """Updates an existing client."""
    try:
        client_id = params["client_id"]
        updates = params["updates"]
        
        if 'id' in updates:
            return {"error": "Cannot change the client ID."}
        response = supabase.table("clients").update(updates).eq("id", client_id).execute()
        return response.data[0] if response.data else {"error": "Client not found"}
    except Exception as e:
        logger.error(f"Error updating client: {e}")
        return {"error": str(e)}


def list_clients(_params: dict) -> dict:
    """Lists all clients."""
    try:
        response = supabase.table("clients").select("*").execute()
        return {"clients": response.data}
    except Exception as e:
        logger.error(f"Error listing clients: {e}")
        return {"error": str(e)}


def get_client(params: dict) -> dict:
    """Retrieves a single client by its ID."""
    try:
        client_id = params["client_id"]
        response = supabase.table("clients").select("*").eq("id", client_id).limit(1).execute()
        return response.data[0] if response.data else {"error": "Client not found"}
    except Exception as e:
        logger.error(f"Error getting client: {e}")
        return {"error": str(e)}


class ClientPlugin(PluginBase):
    """Plugin for client management functions."""
    
    @property
    def category(self) -> str:
        return "client"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="create_client",
                func=apply_middleware(create_client, [
                    validation_middleware(["name", "industry"])
                ]),
                category=self.category,
                description="Creates a new client",
                schema={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Client company name"},
                        "industry": {"type": "string", "description": "Client industry"},
                        "logo": {"type": "string", "format": "uri", "description": "Client logo URL"},
                        "website": {"type": "string", "format": "uri", "description": "Client website URL"},
                        "primary_contact": {"type": "string", "description": "Primary contact name"},
                        "contact_email": {"type": "string", "format": "email", "description": "Contact email"},
                        "status": {"type": "string", "enum": ["Active", "Inactive"], "default": "Active", "description": "Client status"}
                    },
                    "required": ["name", "industry"]
                }
            ),
            FunctionSpec(
                name="update_client",
                func=apply_middleware(update_client, [
                    validation_middleware(["client_id", "updates"])
                ]),
                category=self.category,
                description="Updates an existing client",
                schema={
                    "type": "object",
                    "properties": {
                        "client_id": {"type": "string", "description": "Client UUID"},
                        "updates": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "industry": {"type": "string"},
                                "logo": {"type": "string", "format": "uri"},
                                "website": {"type": "string", "format": "uri"},
                                "primary_contact": {"type": "string"},
                                "contact_email": {"type": "string", "format": "email"},
                                "status": {"type": "string", "enum": ["Active", "Inactive"]}
                            },
                            "description": "Object containing fields to update"
                        }
                    },
                    "required": ["client_id", "updates"]
                }
            ),
            FunctionSpec(
                name="list_clients",
                func=apply_middleware(list_clients),
                category=self.category,
                description="Lists all clients",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            ),
            FunctionSpec(
                name="get_client",
                func=apply_middleware(get_client, [
                    validation_middleware(["client_id"])
                ]),
                category=self.category,
                description="Gets a specific client",
                schema={
                    "type": "object",
                    "properties": {
                        "client_id": {"type": "string", "description": "Client UUID"}
                    },
                    "required": ["client_id"]
                }
            )
        ]


def get_plugin() -> ClientPlugin:
    """Get the client plugin instance."""
    return ClientPlugin()