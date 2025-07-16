"""Client management functions."""

import asyncio
from typing import List
from functions.base import api_client, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


async def create_client(params: dict) -> dict:
    """Creates a new client."""
    try:
        client_data = {
            "name": params["name"],
            "email": params.get("contact_email"),
            "phone": params.get("phone"),
            "company": params.get("industry"),
            "notes": params.get("notes")
        }
        result = await api_client.create_client(client_data)
        return result
    except Exception as e:
        logger.error(f"Error creating client: {e}")
        return {"error": str(e)}


async def update_client(params: dict) -> dict:
    """Updates an existing client."""
    try:
        client_id = params["client_id"]
        updates = params["updates"]
        
        # Map old field names to new API field names
        mapped_updates = {}
        if "name" in updates:
            mapped_updates["name"] = updates["name"]
        if "contact_email" in updates:
            mapped_updates["email"] = updates["contact_email"]
        if "phone" in updates:
            mapped_updates["phone"] = updates["phone"]
        if "industry" in updates:
            mapped_updates["company"] = updates["industry"]
        if "notes" in updates:
            mapped_updates["notes"] = updates["notes"]
        
        result = await api_client.update_client(client_id, mapped_updates)
        return result
    except Exception as e:
        logger.error(f"Error updating client: {e}")
        return {"error": str(e)}


async def list_clients(_params: dict) -> dict:
    """Lists all clients."""
    try:
        clients = await api_client.list_clients()
        return {"clients": clients}
    except Exception as e:
        logger.error(f"Error listing clients: {e}")
        return {"error": str(e)}


async def get_client(params: dict) -> dict:
    """Retrieves a single client by its ID."""
    try:
        client_id = params["client_id"]
        result = await api_client.get_client(client_id)
        return result
    except Exception as e:
        logger.error(f"Error getting client: {e}")
        return {"error": str(e)}


async def delete_client(params: dict) -> dict:
    """Deletes a client by its ID."""
    try:
        client_id = params["client_id"]
        result = await api_client.delete_client(client_id)
        return result
    except Exception as e:
        logger.error(f"Error deleting client: {e}")
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
                    validation_middleware(["name"])
                ]),
                category=self.category,
                description="Creates a new client",
                schema={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "Client company name"},
                        "contact_email": {"type": "string", "format": "email", "description": "Contact email"},
                        "phone": {"type": "string", "description": "Contact phone number"},
                        "industry": {"type": "string", "description": "Client industry"},
                        "notes": {"type": "string", "description": "Additional notes"}
                    },
                    "required": ["name"]
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
                                "contact_email": {"type": "string", "format": "email"},
                                "phone": {"type": "string"},
                                "industry": {"type": "string"},
                                "notes": {"type": "string"}
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
            ),
            FunctionSpec(
                name="delete_client",
                func=apply_middleware(delete_client, [
                    validation_middleware(["client_id"])
                ]),
                category=self.category,
                description="Deletes a client",
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