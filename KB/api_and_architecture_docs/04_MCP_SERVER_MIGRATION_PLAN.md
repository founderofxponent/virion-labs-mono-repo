# MCP Server Migration Plan to the Unified Business Logic API

## Executive Summary

This document outlines the migration plan for the **MCP Server**. The server will be updated to use the new **Unified Business Logic API** (`localhost:8001`), which replaces the legacy API package (`localhost:8000`).

The Unified API provides a comprehensive and structured set of endpoints for all business functions, including those used by administrators via the MCP Server. This migration will align the MCP Server with the new, robust architecture, centralizing all business logic and improving maintainability.

---

## Migration Strategy: Phased Replacement

The migration will be straightforward:
1.  The MCP Server's API client will be pointed to the new Unified API's base URL (`http://localhost:8001`).
2.  The function calls within the MCP Server's codebase will be updated to match the new `operationId`s exposed by the Unified API's OpenAPI schema.
3.  The request and response payloads will be updated to match the new, more descriptive schemas.

The Unified API is organized into clear categories. For an administrator using the MCP server, the relevant endpoints will primarily fall under:
-   `/api/v1/operations/*` for direct business operations.
-   `/api/v1/workflows/*` for initiating multi-step business processes.
-   `/api/v1/admin/*` for platform-wide analytics and management.

---

## Function and Endpoint Mapping

This section maps the functions from the legacy API to their new equivalents in the Unified Business Logic API.

### **Client Management**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| `create_client` | `/api/v1/operations/client/create` | `POST` | Operations |
| `list_clients` | `/api/v1/operations/client/list` | `GET` | Operations |
| `get_client` | `/api/v1/operations/client/get/{id}` | `GET` | Operations |
| `update_client` | `/api/v1/operations/client/update/{id}` | `PUT` | Operations |
| `delete_client` | `/api/v1/operations/client/archive/{id}` | `POST` | Operations |

### **Campaign Management**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| `create_campaign` | `/api/v1/workflows/campaign/create` | `POST` | Workflows |
| `list_campaigns` | `/api/v1/operations/campaign/list` | `GET` | Operations |
| `get_campaign` | `/api/v1/operations/campaign/get/{id}` | `GET` | Operations |
| `update_campaign` | `/api/v1/operations/campaign/update/{id}` | `PUT` | Operations |
| `delete_campaign` | `/api/v1/workflows/campaign/archive/{id}` | `POST` | Workflows |
| `update_campaign_stats` | `/api/v1/operations/campaign/update-stats/{id}` | `PUT` | Operations |

### **Access Request Management**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| `list_access_requests` | `/api/v1/admin/access/list-requests` | `GET` | Admin |
| `update_access_request` | `/api/v1/admin/access/process-request` | `POST` | Admin |

### **Admin & Platform Analytics (New Capabilities)**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| *(New)* | `/api/v1/admin/analytics/dashboard` | `GET` | Admin |
| *(New)* | `/api/v1/admin/analytics/platform-overview` | `GET` | Admin |
| *(New)* | `/api/v1/admin/user/list` | `GET` | Admin |

---

## MCP Server Tool Usage Evolution

The MCP Server dynamically discovers function names from the API's OpenAPI schema. The new `operationId`s will be more descriptive.

**Before (Legacy API):**
```python
# Example: Creating a client
create_client({
  "company_name": "Legacy Corp",
  "contact_email": "contact@legacy.com"
})
```

**After (Unified API):**
The new operation ID will be `create_client_operation`. The request body will also be more structured.
```python
# Example: Creating a client via the new operation
create_client_operation({
  "client_data": {
    "company_name": "Unified Corp",
    "contact_email": "contact@unified.com",
    "industry": "Technology"
  },
  "setup_options": {
    "create_default_settings": True,
    "enable_analytics": True,
    "send_welcome_email": True
  }
})
```

**Example: Using a Workflow**
```python
# Example: Creating a campaign via the new workflow
create_campaign_workflow({
  "campaign_data": {
    "name": "Q3 Marketing Push",
    "client_id": "client-uuid-123",
    "budget": 25000
  },
  "automation_options": {
    "setup_discord_bot": True,
    "generate_referral_links": True,
    "setup_analytics": True
  }
})
```

---

## Migration Steps

1.  **Update Environment:** Change the `API_BASE_URL` in the MCP Server's `.env` file to `http://localhost:8001`.
2.  **Update Client Generation:** Rerun the script that generates the API client for the MCP server to fetch the new OpenAPI schema and create the updated functions.
3.  **Update Function Calls:** Manually update the parts of the MCP server codebase that call the API to use the new function names and request/response models.
4.  **Thorough Testing:** Test all MCP server commands to ensure they interact correctly with the new Unified API.

This migration will result in a more robust, maintainable, and powerful administrative tool that leverages the full capabilities of the new platform architecture.
