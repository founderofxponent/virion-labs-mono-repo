"""Base module for shared utilities and database client."""

import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
from enum import Enum

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Supabase client (deprecated - use core.database instead)
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key, options=ClientOptions()) if url and key else None

class CampaignType(str, Enum):
    referral_onboarding = "referral_onboarding"
    product_promotion = "product_promotion"
    community_engagement = "community_engagement"
    support = "support"
    custom = "custom"
    vip_support = "vip_support"