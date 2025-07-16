"""Referral link management functions."""

from typing import List
from functions.base import supabase, logger
from core.plugin import PluginBase, FunctionSpec
from core.middleware import apply_middleware, validation_middleware


def create_referral_link(params: dict) -> dict:
    """Creates a new referral link for a campaign."""
    try:
        campaign_id = params["campaign_id"]
        link_title = params["link_title"]
        influencer_email = params["influencer_email"]
        
        influencer_response = supabase.table("user_profiles").select("id").eq("email", influencer_email).limit(1).execute()
        if not influencer_response.data:
            return {"error": f"Influencer with email '{influencer_email}' not found."}
        influencer_id = influencer_response.data[0]['id']

        referral_code = f"{campaign_id[:8]}-{influencer_id[:8]}-{link_title.replace(' ', '-').lower()}"
        referral_link_data = {
            "campaign_id": campaign_id,
            "influencer_id": influencer_id,
            "title": link_title,
            "platform": "Other",
            "original_url": f"https://virion-labs.com/campaigns/{campaign_id}",
            "referral_code": referral_code,
            "referral_url": f"https://virion-labs.com/r/{referral_code}",
            "clicks": 0,
            "conversions": 0,
            "earnings": 0,
            "is_active": True
        }
        response = supabase.table("referral_links").insert(referral_link_data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating referral link: {e}")
        return {"error": str(e)}


def get_my_referral_links(_params: dict) -> dict:
    """Retrieves a list of all referral links."""
    try:
        response = supabase.table("referral_links").select("*").execute()
        return {"referral_links": response.data}
    except Exception as e:
        logger.error(f"Error getting referral links: {e}")
        return {"error": str(e)}


class ReferralPlugin(PluginBase):
    """Plugin for referral link management functions."""
    
    @property
    def category(self) -> str:
        return "referral"
    
    def get_functions(self) -> List[FunctionSpec]:
        return [
            FunctionSpec(
                name="create_referral_link",
                func=apply_middleware(create_referral_link, [
                    validation_middleware(["campaign_id", "link_title", "influencer_email"])
                ]),
                category=self.category,
                description="Creates a new referral link",
                schema={
                    "type": "object",
                    "properties": {
                        "campaign_id": {"type": "string", "description": "Campaign UUID"},
                        "link_title": {"type": "string", "description": "Title for the referral link"},
                        "influencer_email": {"type": "string", "format": "email", "description": "Influencer email address"}
                    },
                    "required": ["campaign_id", "link_title", "influencer_email"]
                }
            ),
            FunctionSpec(
                name="get_my_referral_links",
                func=apply_middleware(get_my_referral_links),
                category=self.category,
                description="Gets all referral links",
                schema={
                    "type": "object",
                    "properties": {},
                    "description": "No parameters required"
                }
            )
        ]


def get_plugin() -> ReferralPlugin:
    """Get the referral plugin instance."""
    return ReferralPlugin()