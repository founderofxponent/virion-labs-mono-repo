import asyncio
import httpx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
BASE_URL = "http://localhost:8000/api/v1/operations"
# This should be a valid user token obtained from your authentication flow
# For now, we will proceed without it, but a real test would require it.
AUTH_TOKEN = None 

async def test_create_client():
    """
    Tests the client creation endpoint of the Unified Business Logic API.
    """
    url = f"{BASE_URL}/client/create"
    
    headers = {}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"

    client_payload = {
        "client_data": {
            "name": "Test Corp Inc.",
            "contact_email": "contact@testcorp.com",
            "industry": "SaaS"
        },
        "setup_options": {
            "create_default_settings": True,
            "enable_analytics": True,
            "send_welcome_email": False
        }
    }

    logger.info(f"Attempting to create client at: {url}")
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, json=client_payload, headers=headers)
            
            logger.info(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                logger.info("Client created successfully!")
                logger.info("Response JSON: %s", response.json())
            else:
                logger.error("Failed to create client.")
                logger.error("Response Body: %s", response.text)
                
        except httpx.RequestError as e:
            logger.error(f"An error occurred while requesting {e.request.url!r}.")
            logger.error(str(e))

if __name__ == "__main__":
    # Ensure your virion-labs-business-logic-api server is running before executing this script.
    asyncio.run(test_create_client())
