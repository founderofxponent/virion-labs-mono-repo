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

        # Example Rule: Add creation metadata
        client_data["join_date"] = datetime.utcnow().isoformat()
        client_data["client_status"] = "active" # Use the correct field name
        client_data["influencers"] = 0 # Default value

        return client_data

    def get_client_business_context(self, client_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriches client data with business-specific context.
        This is a simple example of a business rule.
        """
        context = {}
        # The status field is named 'client_status' in the response
        status = client_data.get("client_status")

        if status == "active":
            context["recommendation"] = "Consider an upsell campaign."
            context["is_active"] = True
        else:
            context["recommendation"] = "Consider a re-engagement campaign."
            context["is_active"] = False
        
        return context
