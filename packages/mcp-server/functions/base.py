"""Base module for shared utilities and API client."""

import os
import logging
import asyncio
from dotenv import load_dotenv
from enum import Enum

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Global API client instance (will be initialized by the server)
api_client = None

def set_api_client(client):
    """Set the global API client instance."""
    global api_client
    api_client = client

def get_api_client():
    """Get the global API client instance."""
    return api_client

class CampaignType(str, Enum):
    referral_onboarding = "referral_onboarding"
    product_promotion = "product_promotion"
    community_engagement = "community_engagement"
    support = "support"
    custom = "custom"
    vip_support = "vip_support"

# Async wrapper for synchronous functions
def run_async(func, *args, **kwargs):
    """Run an async function and return the result."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in an async context, create a task
            task = asyncio.create_task(func(*args, **kwargs))
            return task
        else:
            # If we're in a sync context, run the async function
            return asyncio.run(func(*args, **kwargs))
    except RuntimeError:
        # Fallback for cases where asyncio is not properly set up
        return asyncio.run(func(*args, **kwargs))