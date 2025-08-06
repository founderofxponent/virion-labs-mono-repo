# Refactoring Plan: Centralizing Authentication with Strapi

**Date:** 2025-07-26

**Author:** Gemini

## 1. Objective

This document outlines the plan to refactor the authentication and authorization system for the Virion Labs platform. The primary goal is to deprecate the custom Supabase-based OAuth proxy in the `virion-labs-business-logic-api` and designate the `virion-labs-strapi-cms` as the single, authoritative OAuth 2.0 provider for all current and future client applications (MCP Server, Dashboard, Discord Bot, etc.).

## 2. Background

### 2.1. Current Architecture

The current system uses a complex, indirect authentication flow:

1.  The `mcp-server` initiates an OAuth flow with the `virion-labs-business-logic-api`.
2.  The `business-logic-api` acts as a proxy, managing its own internal JWTs to orchestrate a separate authentication flow with Supabase.
3.  It captures the Supabase access token and passes it back to the `mcp-server`.
4.  The `mcp-server` validates this token by making a call directly to Supabase (`supabase.auth.get_user(token)`).

This architecture, while functional, introduces significant maintenance overhead, couples the `mcp-server` directly to Supabase's implementation, and is not easily scalable to other clients like the Dashboard.

### 2.2. Proposed Architecture

The new architecture will be simpler, more robust, and more scalable:

1.  **Strapi as the Auth Server:** Strapi will be configured with the necessary OAuth providers (e.g., Google, Discord). It will be the single source of truth for user identity.
2.  **Business Logic API as the Auth Gateway:** The `business-logic-api` will no longer implement custom OAuth logic. Instead, it will act as a secure gateway that:
    *   Redirects clients to Strapi for authentication.
    *   Handles the callback from Strapi, receiving a Strapi-issued JWT.
    *   Provides a token introspection endpoint (`/api/auth/me`) for clients to validate their tokens against.
3.  **Clients (MCP Server, Dashboard):** All clients will be updated to:
    *   Initiate authentication with the `business-logic-api`.
    *   Validate tokens by calling the new introspection endpoint on the `business-logic-api`. They will no longer have any direct dependency on Supabase for authentication.

![Proposed Architecture Diagram](https://i.imgur.com/example.png)
*(Note: A diagram would be inserted here in a real document)*

## 3. Justification

This refactoring offers substantial benefits:

*   **Maintainability:** Eliminates complex, custom OAuth logic in favor of a mature, well-maintained system in Strapi.
*   **Scalability:** Any new client can use the exact same, standardized authentication flow. Adding new social logins is a simple configuration change in Strapi.
*   **Decoupling:** Clients like the `mcp-server` no longer need to know *how* users are authenticated (Supabase, Strapi, etc.). They only need to trust the `business-logic-api`.
*   **Security:** Centralizes security policy and user management within Strapi's robust Roles & Permissions system.

## 4. Phased Refactoring Plan

This project will be executed in three main phases.

### Phase 1: Configure Strapi as the OAuth Provider

**Location:** `packages/virion-labs-strapi-cms`

1.  **Install Providers:** Install the required authentication providers via `npm` or `yarn`.
    ```bash
    npm install @strapi/provider-authentication-google
    # or yarn add @strapi/provider-authentication-google
    ```
2.  **Configure Environment:** Add the necessary credentials for each provider to the `.env` file.
    ```env
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    ```
3.  **Enable Providers:** Enable and configure the providers in the Strapi admin panel under `Settings -> Users & Permissions Plugin -> Providers`.
4.  **Set Up Roles:** Define or confirm the "Authenticated" user role in Strapi, which will be assigned to users who log in via the providers.

### Phase 2: Refactor the Business Logic API

**Location:** `packages/virion-labs-business-logic-api`

1.  **Remove Old OAuth Logic:**
    *   Delete `routers/oauth.py`.
    *   Delete `routers/oauth_api.py`.
    *   Remove their inclusion from `main.py`.
2.  **Create New Authentication Router (`routers/auth.py`):**
    *   **`GET /api/auth/{provider}`:** This endpoint will construct and redirect to the correct Strapi authentication URL (e.g., `http://strapi-url/api/connect/google`).
    *   **`GET /api/auth/{provider}/callback`:** This is the redirect URI that Strapi will call back to. It will receive the Strapi JWT and pass it back to the requesting client in a secure manner (e.g., as a cookie or in a URL parameter for the client to handle).
    *   **`GET /api/auth/me`:** This is the new token introspection endpoint. It will require an `Authorization: Bearer <token>` header. It will validate the received token by making a request to Strapi's `/api/users/me` endpoint and return the user's profile if the token is valid.
3.  **Update Dependencies:** Ensure `httpx` or `requests` is available for making server-to-server calls to Strapi.
4.  **Update Configuration:** Add Strapi's URL to the `core/config.py` settings.

### Phase 3: Refactor the MCP Server Client

**Location:** `packages/mcp-server`

1.  **Update Authentication Flow Initiation:**
    *   Modify any client-side logic (e.g., in `test_oauth.py` or a UI) to point to the new `GET /api/auth/google` endpoint on the `business-logic-api` instead of the old `/authorize` flow.
2.  **Modify `AuthMiddleware` in `server.py`:**
    *   Remove the Supabase client dependency.
    *   Replace the `supabase.auth.get_user(token)` call.
    *   The new logic will make an HTTP GET request to the `business-logic-api`'s `/api/auth/me` endpoint, passing the Bearer token.
    *   If the request returns a 200 OK, authentication is successful. If it returns a 401 Unauthorized, it fails.
3.  **Update Environment:** The `mcp-server` no longer needs `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` for authentication. These can be removed if they are not used for other purposes.

## 5. Rollout and Testing

1.  Implement and deploy the changes for Strapi and the Business Logic API first.
2.  Thoroughly test the new authentication flow using a tool like Postman or `curl` before modifying any clients.
3.  Update the `mcp-server` and test its integration with the refactored API.
4.  Finally, update the Dashboard and any other clients to use the new, unified authentication system.
