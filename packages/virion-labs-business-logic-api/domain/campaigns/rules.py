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
        # Map frontend field names to Strapi field names
        field_mappings = {
            "campaign_template": "campaign_type",  # Frontend sends template, Strapi expects campaign_type
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
            "onboarding_flow", "metadata", "features",
            
            # Relationship fields
            "client"  # client_id should be mapped to client relation
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
        
        if not filtered_data.get("start_date"):
            filtered_data["start_date"] = datetime.utcnow().isoformat()

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
        # Map frontend field names to Strapi field names
        field_mappings = {
            "campaign_template": "campaign_type",  # Frontend sends template, Strapi expects campaign_type
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
            "onboarding_flow", "metadata", "features"
        }
        
        # Handle client relationship (but don't include it in updates as it shouldn't change)
        if "client_id" in campaign_data:
            campaign_data.pop("client_id")  # Remove from updates
        
        # Filter to only include valid fields
        filtered_data = {k: v for k, v in campaign_data.items() if k in valid_strapi_fields}
        
        # Don't include updated_at as Strapi handles this automatically
        return filtered_data
