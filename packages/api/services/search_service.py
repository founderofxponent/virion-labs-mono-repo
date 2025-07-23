import logging
from typing import List, Dict, Any
from supabase import Client
from schemas.db.clients import Client as ClientSchema
from schemas.db.discord_guild_campaigns import DiscordGuildCampaign

logger = logging.getLogger(__name__)

SEARCHABLE_RESOURCES = {
    "clients": {
        "model": ClientSchema,
        "searchable_fields": ["name", "industry", "primary_contact", "contact_email"],
    },
    "campaigns": {
        "model": DiscordGuildCampaign,
        "searchable_fields": ["campaign_name", "campaign_type", "description"],
    },
}

def get_searchable_resources() -> List[str]:
    return list(SEARCHABLE_RESOURCES.keys())

def search_resource(db: Client, resource: str, query: str) -> List[Dict[str, Any]]:
    if resource not in SEARCHABLE_RESOURCES:
        raise ValueError(f"Resource '{resource}' is not configured for searching.")

    config = SEARCHABLE_RESOURCES[resource]
    searchable_fields = config["searchable_fields"]

    try:
        # Build the 'or' filter string for the RPC call
        # The format is (field.ilike.%query%,field.ilike.%query%)
        or_filter = ",".join([f"{field}.ilike.%{query}%" for field in searchable_fields])

        # The `or` filter needs to be applied to the query builder
        query_builder = db.from_(resource).select("*").or_(or_filter)
        result = query_builder.execute()

        if result.data:
            return result.data
        return []

    except Exception as e:
        logger.error(f"Error querying resource '{resource}' with query '{query}': {e}")
        return []