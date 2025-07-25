from typing import Dict, Any, List

class ClientDomain:
    """
    Domain logic for client operations. This layer contains pure business rules.
    """
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
