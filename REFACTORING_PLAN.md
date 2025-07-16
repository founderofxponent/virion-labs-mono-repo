# Refactoring Plan: Migrating to a Unified API

This document outlines the strategy and steps required to refactor the Virion Labs applications to use the new, centralized FastAPI server.

## 1. Primary Goal

The goal is to **decouple all client applications from the database** by channeling all data access and business logic through a single, authoritative API server. This will eliminate code duplication, improve security, and dramatically simplify future maintenance and development.

## 2. The New Three-Layer Architecture

1.  **Presentation Layer (Clients):**
    *   `virion-labs-dashboard`: Handles user interface and user experience.
    *   `virion-labs-discord-bot`: Handles Discord interactions.
    *   `mcp-server`: Acts as a specialized adapter for AI assistants.
    *   **Responsibility:** These clients will **only** be responsible for making HTTP requests to the API server and displaying the results. They will contain no direct database access or complex business logic.

2.  **Business Logic Layer (The Unified API):**
    *   `api` (FastAPI Server): The single source of truth for all business rules.
    *   **Responsibility:**
        *   Exposes clean, RESTful endpoints (e.g., `GET /campaigns`, `POST /clients`).
        *   Contains all business logic (e.g., what happens when a user joins a campaign).
        *   Handles all data validation and authentication.
        *   Is the **only** service that communicates directly with the database.

3.  **Data Layer:**
    *   **Supabase:** Remains our database provider.
    *   **Responsibility:** Securely stores and manages our data.

## 3. The Refactoring Roadmap

This process will be done incrementally to minimize disruption.

### Phase 1: Build Out the Unified API Service (`packages/api`)

This is the foundation. We cannot refactor any clients until the API is ready for them to consume.

1.  **Initialize Supabase Client:** Create a secure, singleton Supabase client within the FastAPI application.
2.  **Implement `Client` Endpoints:**
    *   `POST /clients`: Re-implement the `create_client` logic.
    *   `GET /clients`: Re-implement the `list_clients` logic.
    *   `GET /clients/{client_id}`: Re-implement the `get_client` logic.
    *   `PATCH /clients/{client_id}`: Re-implement the `update_client` logic.
3.  **Implement `Campaign` Endpoints:**
    *   `POST /campaigns`: Re-implement the `create_campaign` logic.
    *   `GET /campaigns`: Re-implement `list_available_campaigns`.
    *   And so on for all other campaign-related functions (`update`, `delete`, `set_status`).
4.  **Implement Other Endpoints:** Gradually migrate the logic from all other `mcp-server` function files (`analytics.py`, `access.py`, `referral.py`) into corresponding FastAPI endpoints.
5.  **Add Authentication:** Secure all endpoints using a robust authentication mechanism (e.g., API keys for service-to-service communication, JWTs for user sessions).

### Phase 2: Refactor Clients (One by One)

Once the API has endpoints, we can start migrating the clients.

1.  **Refactor the `mcp-server`:**
    *   **Remove Supabase Client:** Delete its direct connection to Supabase.
    *   **Update Tool Functions:** Change the implementation of each tool. Instead of talking to the database, they will now make authenticated HTTP requests to the new `api` service endpoints. For example, the `create_client` tool will now simply call `POST /clients`.

2.  **Refactor the `virion-labs-discord-bot`:**
    *   **Remove Supabase Client:** Remove the `@supabase/supabase-js` dependency and its client initialization.
    *   **Update Services:** Go into each service file (e.g., `src/services/CampaignService.js`) and replace all Supabase function calls with `axios` or `fetch` calls to the new `api` service.

3.  **Refactor the `virion-labs-dashboard` (Most Complex):**
    *   **Remove Supabase Client:** Remove the `@supabase/supabase-js` dependency and `lib/supabase.ts`.
    *   **Create an API Client:** Implement a new service (`lib/api-client.ts`) that is responsible for all communication with the `api` server.
    *   **Update Server-Side API Routes:** Go through all files in `app/api/` and replace their logic with calls to the new `api-client.ts`.
    *   **Update Hooks and Components:** Update all data-fetching hooks (e.g., `hooks/use-clients.ts`) and components to use the new API client.

### Phase 3: Final Cleanup

1.  **Remove Redundant Code:** Once all clients have been migrated, we can safely remove any old data access logic, Supabase client configurations, and related files from the client packages.
2.  **Archive Old Repository:** After confirming everything works in the monorepo, archive the old, standalone `virion-labs-mcp` GitHub repository to prevent confusion.

This phased approach ensures a controlled and manageable migration to our new, unified architecture. 