# 04: MCP Server Migration Plan

## Executive Summary

This document outlines the migration plan for the **MCP Server**. The server will be updated to use the new **Unified Business Logic API** (`localhost:8000`), which replaces the legacy API package (`localhost:8000`).

The Unified API provides a comprehensive and structured set of endpoints for all business functions. This migration will align the MCP Server with the new, robust architecture, centralizing all business logic and improving maintainability.

---

## Migration Strategy: Phased Replacement

The migration will be straightforward:
1.  The MCP Server's API client will be pointed to the new Unified API's base URL (`http://localhost:8000`).
2.  The function calls within the MCP Server's codebase will be updated to match the new `operationId`s exposed by the Unified API's OpenAPI schema.
3.  The request and response payloads will be updated to match the new, more descriptive schemas.

For an administrator using the MCP server, the relevant endpoints will be found in the `/api/v1/workflows/` and `/api/v1/operations/` categories.

---

## Function and Endpoint Mapping

This section maps the functions from the legacy API to their new equivalents in the Unified Business Logic API.

### **Client Management**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| `create_client` | `/api/v1/workflows/client/provision` | `POST` | Workflows |
| `list_clients` | `/api/v1/operations/client/list` | `GET` | Operations |
| `get_client` | `/api/v1/operations/client/{id}` | `GET` | Operations |
| `update_client` | `/api/v1/operations/client/{id}` | `PUT` | Operations |
| `delete_client` | `/api/v1/operations/client/{id}` | `DELETE` | Operations |

### **Campaign Management**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| `create_campaign` | `/api/v1/workflows/campaign/create` | `POST` | Workflows |
| `list_campaigns` | `/api/v1/operations/campaign/list` | `GET` | Operations |
| `get_campaign` | `/api/v1/operations/campaign/{id}` | `GET` | Operations |
| `update_campaign` | `/api/v1/operations/campaign/{id}` | `PUT` | Operations |
| `delete_campaign` | `/api/v1/workflows/campaign/archive` | `POST` | Workflows |
| `update_campaign_stats` | `/api/v1/operations/campaign/update-stats/{id}`| `PUT` | Operations |

### **Access Request Management**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| `list_access_requests` | `/api/v1/workflows/campaign-access/list-requests` | `GET` | Workflows |
| `update_access_request` | `/api/v1/workflows/campaign-access/approve` or `deny` | `POST` | Workflows |

### **Platform Administration (New Capabilities)**
| Legacy Function | New Unified API Endpoint | HTTP Method | Category |
|---|---|---|---|
| *(New)* | `/api/v1/operations/platform/overview` | `GET` | Operations |
| *(New)* | `/api/v1/operations/bot/deploy` | `POST` | Operations |

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
The new operation ID will be `provision_client_workflow`. The request body will also be more structured.
```python
# Example: Creating a client via the new workflow
provision_client_workflow({
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

---

## Migration Steps

1.  **Update Environment:** Change the `API_BASE_URL` in the MCP Server's `.env` file to `http://localhost:8000`.
2.  **Update Client Generation:** Rerun the script that generates the API client for the MCP server to fetch the new OpenAPI schema and create the updated functions.
3.  **Update Function Calls:** Manually update the parts of the MCP server codebase that call the API to use the new function names and request/response models.
4.  **Thorough Testing:** Test all MCP server commands to ensure they interact correctly with the new Unified API.

This migration will result in a more robust, maintainable, and powerful administrative tool that leverages the full capabilities of the new platform architecture.
