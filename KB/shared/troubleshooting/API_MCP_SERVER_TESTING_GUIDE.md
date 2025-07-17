### Campaign API and MCP-Server Testing Guide

This guide provides a summary of the issues encountered during the testing of the new campaign creation flow and a checklist for future testing and debugging. The primary goal is to ensure that the `mcp-server` (the client) and the FastAPI `api` (the server) are correctly synchronized.

---

### 1. Summary of Issues Encountered

The core problem was a persistent `500 Internal Server Error` when creating a campaign. This was caused by a chain of issues, starting with outdated client code and ending with subtle data serialization problems in the API.

**Key Issues:**
*   **Client/Server Mismatch**: The `mcp-server` was using an outdated contract (old parameters, old endpoint) to call the API.
*   **Vague API Errors**: The API initially returned a generic `500` error, which hid the real cause: a `400 Bad Request` from the database due to invalid data.
*   **Data Validation & Serialization**: The most critical issues were in the API's service layer, where data was either being stripped during validation or not correctly formatted for the database.
    1.  **Missing `client_id`**: The Pydantic schema (`BotCampaignCreate`) was missing the `client_id` field, causing it to be dropped from the request payload.
    2.  **`UUID` Serialization**: The `model_dump()` method on the Pydantic model produced `UUID` objects, which are not directly JSON serializable by the database driver, causing the final crash.

---

### 2. Testing & Debugging Checklist

#### **A. API Server (`packages/api/`)**

If you encounter a `500` or `422` error from the API, follow these steps:

1.  **Check API Error Details First**:
    *   The most effective step we took was to improve the API's error handling. Ensure your endpoints have a `try...except` block that returns the specific exception message. This can turn a generic `500` into a clear error like `"null value in column 'client_id' violates not-null constraint"`.
    *   **Location**: `packages/api/routers/bot_campaigns.py`
    ```python
    # Good Practice:
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process request: {e}")
    ```

2.  **Verify Pydantic Schemas (`packages/api/schemas/`)**:
    *   **Fields Match**: Ensure the `Create` schema (e.g., `BotCampaignCreate`) includes *all* fields required by the database, especially foreign keys like `client_id`. If a field is missing here, it will be stripped from the request and will be `null` in the service layer.
    *   **Enums Match**: Check that `Enum` definitions in your schemas match the valid values in your database. We had an issue where `"brand_awareness"` was sent, but the database only allowed values like `"product_promotion"`.

3.  **Inspect the Service Layer (`packages/api/services/`)**:
    *   **Data Serialization**: **This was the key fix.** Before the database call, ensure all non-standard data types (like `UUID`) are converted to strings. The database driver may not handle this automatically.
    *   **Location**: `packages/api/services/bot_campaign_service.py`
    ```python
    # Good Practice:
    campaign_dict = campaign_data.model_dump()

    # Convert UUIDs to strings before database insertion
    for key, value in campaign_dict.items():
        if isinstance(value, UUID):
            campaign_dict[key] = str(value)

    response = db.table("discord_guild_campaigns").insert(campaign_dict).execute()
    ```
    *   **Database Defaults**: Avoid setting values like `created_at` or `updated_at` in the code if the database table is configured to set them automatically with `now()`.

#### **B. MCP Server (`packages/mcp-server/`)**

If the API seems fine but calls from the `mcp-server` fail:

1.  **Check Function Definition (`packages/mcp-server/functions/`)**:
    *   **Endpoint URL**: Is the URL correct? We initially used `/api/campaigns/...` instead of the correct `/api/bot-campaigns/`.
    *   **HTTP Method**: Ensure you are using the correct method (e.g., `POST`, `PUT`).
    *   **Parameters**: Do the parameters in the `mcp-server` function match exactly what the API's `Create`/`Update` schema expects? Check for correct names and data structures (e.g., nesting parameters inside an `updates` object for the update function).

2.  **Isolate with a `curl` Command**:
    *   This was our breakthrough. Bypassing the `mcp-server` and calling the API directly with `curl` gave us the first truly informative error message. This is the best way to determine if the issue is in the client or the server.
    *   **Example `curl` Command**:
        ```bash
        curl -X POST 'http://0.0.0.0:8000/api/bot-campaigns/' \
        -H 'Authorization: Bearer <your_api_key>' \
        -H 'Content-Type: application/json' \
        -d '{"client_id": "...", "guild_id": "...", "campaign_name": "...", "campaign_type": "..."}'
        ```

#### **C. General Tools**

1.  **Check Supabase Logs**: This should always be a first step. Use the `get_logs` tool to check for errors in the `api` service. While it wasn't helpful in our case due to the error's nature, it often provides valuable clues.
2.  **Query the Database Directly**: Use `execute_sql` to:
    *   Check if a record was created despite an error.
    *   Inspect a table's schema to verify column names, data types, and constraints (`NOT NULL`, enums).

By following this guide, future testing should be much smoother, allowing for quicker identification and resolution of issues between the API and its clients. 