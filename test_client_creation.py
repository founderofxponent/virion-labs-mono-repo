import asyncio
import httpx
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Configuration ---
BASE_URL = "http://localhost:8000/api/v1/operations"
AUTH_TOKEN = None 

async def test_client_lifecycle():
    """
    Tests the full lifecycle (Create, Update, Delete) of a client.
    """
    headers = {}
    if AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"

    client_id = None
    document_id = None

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Test CREATE
        create_payload = {
            "client_data": {
                "name": "Lifecycle Test Client",
                "contact_email": "lifecycle@test.com",
                "industry": "Testing"
            },
            "setup_options": {"create_default_settings": False}
        }
        logger.info("--- Testing Client CREATE ---")
        try:
            response = await client.post(f"{BASE_URL}/client/create", json=create_payload, headers=headers)
            if response.status_code == 200:
                # Extract both numeric and document IDs
                client_id = response.json()["client"]["id"]
                document_id = response.json()["client"]["attributes"]["documentId"]
                logger.info(f"CREATE successful. Numeric ID: {client_id}, Document ID: {document_id}")
            else:
                logger.error(f"CREATE failed. Status: {response.status_code}, Body: {response.text}")
                return 
        except httpx.RequestError as e:
            logger.error(f"CREATE request failed: {e}")
            return

        # 2. Test GET
        if document_id:
            logger.info(f"--- Testing Client GET for ID: {document_id} ---")
            try:
                response = await client.get(f"{BASE_URL}/client/get/{document_id}", headers=headers)
                if response.status_code == 200:
                    logger.info("GET successful. Client is visible to the API.")
                else:
                    logger.error(f"GET failed. Status: {response.status_code}, Body: {response.text}")
                    return
            except httpx.RequestError as e:
                logger.error(f"GET request failed: {e}")
                return

        # 3. Test UPDATE
        if document_id:
            update_payload = {"name": "Lifecycle Test Client (Updated)"}
            logger.info(f"--- Testing Client UPDATE for ID: {document_id} ---")
            try:
                response = await client.put(f"{BASE_URL}/client/update/{document_id}", json=update_payload, headers=headers)
                if response.status_code == 200:
                    logger.info("UPDATE successful.")
                else:
                    logger.error(f"UPDATE failed. Status: {response.status_code}, Body: {response.text}")
            except httpx.RequestError as e:
                logger.error(f"UPDATE request failed: {e}")

        # 4. Test DELETE (Soft Delete)
        if document_id:
            logger.info(f"--- Testing Client DELETE for ID: {document_id} ---")
            try:
                response = await client.delete(f"{BASE_URL}/client/delete/{document_id}", headers=headers)
                if response.status_code == 200:
                    logger.info("DELETE successful.")
                else:
                    logger.error(f"DELETE failed. Status: {response.status_code}, Body: {response.text}")
            except httpx.RequestError as e:
                logger.error(f"DELETE request failed: {e}")


if __name__ == "__main__":
    # Ensure your virion-labs-business-logic-api server is running before executing this script.
    asyncio.run(test_client_lifecycle())
