# API Security & Implementation Guide

**Date:** 2025-07-26

**Author:** Gemini

## 1. Overview

This document summarizes the key learnings from the initial API implementation and provides a clear, repeatable guide for developing new, secure endpoints. Following this guide will ensure that the platform remains robust, secure, and easy to debug.

---

## 2. Key Learnings & Guiding Principles

### 2.1. Authentication is Not Authorization (AuthN vs. AuthZ)

This is the most critical concept for our security model.

*   **Authentication (AuthN):** Proving a user's identity. Our system correctly handles this via the Google login flow, which provides a JSON Web Token (JWT).
*   **Authorization (AuthZ):** Determining what an authenticated user is allowed to do. This is where we apply business rules, checking the user's role and resource ownership.

### 2.2. Strapi's Dual Role Systems

Strapi has two independent role systems. Understanding the difference is essential.

*   **Administration Panel Roles:**
    *   **Location:** `Settings` -> `Administration Panel` -> `Roles`
    *   **Purpose:** For users who log into the Strapi backend (`/admin`). These roles (`Super Admin`, `Editor`) manage the content and have **no effect** on API users.
*   **Users & Permissions Roles:**
    *   **Location:** `Settings` -> `Users & Permissions` -> `Roles`
    *   **Purpose:** For your application's end-users (`Authenticated`, `Public`, and our custom `Platform Administrator`). **This is the only system the API uses for authorization.**

### 2.3. Explicit Failure is Better Than Implicit Failure

A service that fails silently by returning an empty list (`[]`) is difficult to debug. Our improved approach is to be explicit.

*   **DON'T:** Return an empty list if a user lacks permissions.
*   **DO:** Raise a `403 Forbidden` error. This immediately clarifies that the issue is related to permissions.

### 2.4. Avoid Hardcoded "Magic Strings"

Our final bug was caused by the API code checking for the role `"Admin"` while the role in Strapi was named `"Platform Administrator"`.

*   **Rule:** The role names used in the API's authorization logic must **exactly match** the names configured in Strapi's `Users & Permissions` roles.

---

## 3. Your Guide: A Step-by-Step Plan for New Endpoints

Follow this workflow to ensure all new functionality is secure by default.

### Step 1: Define the Business Logic in the Service Layer

Before creating an endpoint, go to the appropriate service file (e.g., `services/campaign_service.py`) and create the function that will contain the core business logic.

### Step 2: Implement Authorization FIRST

Inside your new service function, the very first step is to implement the security checks using the `current_user` object that will be passed in from the router.

**Example:**
```python
# In a service file, e.g., services/campaign_service.py

async def get_campaign_details(self, campaign_id: str, current_user: StrapiUser):
    
    # 1. Get the user's role first for clear logging and checks.
    user_role = self._get_user_role(current_user)
    logger.info(f"User '{current_user.email}' with role '{user_role}' is requesting campaign '{campaign_id}'.")

    # 2. Fetch the resource needed to check for ownership.
    campaign = await strapi_client.get_campaign(campaign_id, populate=['owner'])
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    # 3. Write the authorization logic: "Default Deny".
    if user_role == 'Platform Administrator':
        # Admins can always proceed.
        pass
    elif user_role == 'Client' and campaign.get('owner', {}).get('id') == current_user.id:
        # A Client can proceed IF they are the owner of the campaign.
        pass
    else:
        # If none of the above conditions are met, deny access.
        raise HTTPException(status_code=403, detail="Forbidden: You do not have permission to view this campaign.")
    
    # --- Authorization Complete: Continue with function logic below ---
    
    # ... your business logic here ...
    return campaign
```

### Step 3: Create the API Endpoint in the Router Layer

Go to the relevant router file (e.g., `routers/operations.py`) and define the new API endpoint.

### Step 4: Secure the Endpoint with the Authentication Dependency

Add `user: StrapiUser = Depends(get_current_user)` to the endpoint's signature. This is the gatekeeper that enforces authentication before any of your code runs. It provides the `current_user` object that your service layer needs.

**Example:**
```python
# In a router file, e.g., routers/operations.py

from core.auth import get_current_user, StrapiUser

@router.get("/campaign/get/{campaign_id}")
async def get_campaign_operation(campaign_id: str, user: StrapiUser = Depends(get_current_user)):
    """
    Business operation for fetching a single campaign.
    (Protected)
    """
    try:
        # Pass the user object from the dependency down to the service layer.
        result = await campaign_service.get_campaign_details(campaign_id, current_user=user)
        return result
    except HTTPException:
        # Re-raise HTTP exceptions (403, 404) directly to preserve the correct status code.
        raise
    except Exception as e:
        # Catch any other unexpected errors.
        logger.error(f"Get campaign operation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

By following this "secure-by-default" pattern, we ensure that every new piece of functionality is robust, predictable, and easy to debug.
