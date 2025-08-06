from typing import Dict, Any, List
from datetime import datetime

class ClientDomain:
    """
    Domain logic for client operations. This layer contains pure business rules.
    """
    def create_client_with_business_logic(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies business rules before creating a new client.
        """
        # Example Rule: Set a default industry if not provided
        if not client_data.get("industry"):
            client_data["industry"] = "General"

        # Example Rule: Add creation and publication metadata
        now = datetime.utcnow().isoformat()
        client_data["join_date"] = now
        client_data["client_status"] = "active"
        client_data["influencers"] = 0
        client_data["publishedAt"] = now # Publish immediately

        return client_data

    def get_client_business_context(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriches client data with business-specific context.
        This is made robust to handle receiving either the full client object
        or just the attributes dictionary.
        """
        context = {}
        # Look for attributes, but fall back to the main dict if not found
        attributes = client_data.get("attributes", client_data)
        status = attributes.get("client_status")

        if status == "active":
            context["recommendation"] = "Consider an upsell campaign."
            context["is_active"] = True
        else:
            context["recommendation"] = "Consider a re-engagement campaign."
            context["is_active"] = False
        
        return context

    def update_client_with_business_logic(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies business rules before updating a client.
        """
        # This is where you would add rules, e.g. validation, enrichment.
        # For now, we just pass the data through.
        return client_data
