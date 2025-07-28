from typing import Dict, Any
from datetime import datetime

class CampaignDomain:
    """
    Domain logic for campaign operations. This layer contains pure business rules.
    """
    def create_campaign_with_business_logic(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies business rules before creating a new campaign.
        """
        # Handle template lookup separately - we need to resolve the template documentId to campaign_type
        # Note: The template lookup will be handled in the service layer before calling this method
        
        # Map frontend field names to Strapi field names
        field_mappings = {
            "campaign_name": "name",
            "campaign_start_date": "start_date",
            "campaign_end_date": "end_date",
        }
        
        for frontend_name, strapi_name in field_mappings.items():
            if frontend_name in campaign_data:
                campaign_data[strapi_name] = campaign_data.pop(frontend_name)
        
        # Define valid Strapi campaign fields for creation
        valid_strapi_fields = {
            # Core campaign fields
            "name", "description", "campaign_type", "is_active", 
            "start_date", "end_date", "guild_id", "channel_id", 
            "webhook_url", "welcome_message",
            
            # Bot configuration fields
            "bot_name", "bot_avatar_url", "brand_color", "brand_logo_url",
            
            # Stats fields (will be set to defaults)
            "total_interactions", "successful_onboardings", "referral_conversions",
            
            # Configuration fields
            "metadata", "features", "landing_page_data", "auto_role_assignment", "target_role_ids",
            
            # Relationship fields
            "client",  # client_id should be mapped to client relation
            "documentId"
        }
        
        # Handle client relationship
        if "client_id" in campaign_data:
            campaign_data["client"] = campaign_data.pop("client_id")
        
        # Filter to only include valid fields
        filtered_data = {k: v for k, v in campaign_data.items() if k in valid_strapi_fields}
        
        # Set default values for creation
        filtered_data["is_active"] = True
        filtered_data["total_interactions"] = 0
        filtered_data["successful_onboardings"] = 0
        filtered_data["referral_conversions"] = 0
        
        # Handle start_date - convert empty strings to None or set default
        start_date = filtered_data.get("start_date")
        if not start_date or start_date == "":
            filtered_data["start_date"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        elif isinstance(start_date, str) and start_date:
            # If frontend sends YYYY-MM-DD format, convert to full datetime
            try:
                if len(start_date) == 10:  # YYYY-MM-DD format
                    parsed_date = datetime.strptime(start_date, "%Y-%m-%d")
                    filtered_data["start_date"] = parsed_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            except ValueError:
                # If parsing fails, use current datetime
                filtered_data["start_date"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")

        # Handle end_date - convert empty strings to None
        end_date = filtered_data.get("end_date")
        if end_date == "":
            filtered_data.pop("end_date", None)  # Remove empty string, let Strapi handle None
        elif isinstance(end_date, str) and end_date:
            # If frontend sends YYYY-MM-DD format, convert to full datetime
            try:
                if len(end_date) == 10:  # YYYY-MM-DD format
                    parsed_date = datetime.strptime(end_date, "%Y-%m-%d")
                    # Set end date to end of day
                    parsed_date = parsed_date.replace(hour=23, minute=59, second=59)
                    filtered_data["end_date"] = parsed_date.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            except ValueError:
                # If parsing fails, remove the field
                filtered_data.pop("end_date", None)

        return filtered_data

    def get_campaign_business_context(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriches campaign data with business-specific context.
        """
        # TODO: Implement business context enrichment for campaigns
        return {}

    def update_campaign_with_business_logic(self, campaign_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies business rules before updating a campaign.
        """
        # Handle template lookup separately - we need to resolve the template documentId to campaign_type
        # Note: The template lookup will be handled in the service layer before calling this method
        
        # Map frontend field names to Strapi field names
        field_mappings = {
            "campaign_name": "name",
            "campaign_start_date": "start_date",
            "campaign_end_date": "end_date",
        }
        
        for frontend_name, strapi_name in field_mappings.items():
            if frontend_name in campaign_data:
                campaign_data[strapi_name] = campaign_data.pop(frontend_name)
        
        # Define valid Strapi campaign fields based on the actual schema
        # From schema.json in virion-labs-strapi-cms/src/api/campaign/content-types/campaign/
        valid_strapi_fields = {
            # Core campaign fields
            "name", "description", "campaign_type", "is_active", 
            "start_date", "end_date", "guild_id", "channel_id", 
            "webhook_url", "welcome_message",
            
            # Bot configuration fields
            "bot_name", "bot_avatar_url", "brand_color", "brand_logo_url",
            
            # Stats fields (read-only but included in schema)
            "total_interactions", "successful_onboardings", "referral_conversions",
            
            # Configuration fields
            "metadata", "features", "landing_page_data", "auto_role_assignment", "target_role_ids"
        }
        
        # Handle client relationship (but don't include it in updates as it shouldn't change)
        if "client_id" in campaign_data:
            campaign_data.pop("client_id")  # Remove from updates
        
        # Filter to only include valid fields
        filtered_data = {k: v for k, v in campaign_data.items() if k in valid_strapi_fields}
        
        # Don't include updated_at as Strapi handles this automatically
        return filtered_data
