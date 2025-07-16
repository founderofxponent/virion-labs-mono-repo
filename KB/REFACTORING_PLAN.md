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
2.  **Implement Endpoints:** Based on a full audit of the `virion-labs-dashboard` and `virion-labs-discord-bot`, the following endpoints are required. They cover all functionality and business logic, which will be migrated from the client applications. The endpoint paths preserve the original naming conventions from the `app/api` directory to ensure a smoother client refactor.
3.  **Add Authentication:** Secure all endpoints using a robust authentication mechanism (e.g., API keys for service-to-service communication, JWTs for user sessions).

#### Final API Endpoint List (Original Naming Preserved)

##### Core
*   `GET /api/health`: Health check endpoint.

##### Authentication & User Profile
*   `POST /api/auth/signup`: User registration. *(New)*
*   `POST /api/auth/login`: User login. *(New)*
*   `POST /api/auth/logout`: User logout. *(New)*
*   `POST /api/auth/send-confirmation`: Resend confirmation email. *(Exists)*
*   `POST /api/auth/confirm`: Confirm user email. *(New, logic moved from client)*
*   `GET /api/user`: Get the current user's profile. *(New)*
*   `DELETE /api/user/delete`: Delete the current user's account. *(Exists)*

##### Admin
*   `GET /api/admin/users`: List all users. *(New)*
*   `GET /api/admin/access-requests`: List pending access requests. *(Exists)*
*   `POST /api/admin/access-requests`: Approve or deny an access request. *(Exists)*

##### Clients
*   `GET /api/clients`: List all clients. *(New)*
*   `POST /api/clients`: Create a new client. *(New)*
*   `GET /api/clients/{id}`: Get client details. *(New)*
*   `PATCH /api/clients/{id}`: Update client details. *(New)*
*   `DELETE /api/clients/{id}`: Delete a client. *(New)*

##### Campaigns & Bot Campaigns
*   `POST /api/bot-campaigns`: Create a new bot campaign. *(Exists)*
*   `GET /api/bot-campaigns`: Get campaigns for the bot. *(Exists)*
*   `GET /api/bot-campaigns/{id}`: Get a specific bot campaign. *(Exists)*
*   `PATCH /api/bot-campaigns/{id}`: Update a bot campaign. *(Exists)*
*   `DELETE /api/bot-campaigns/{id}`: Delete a bot campaign. *(Exists)*
*   `GET /api/campaigns/available`: List campaigns available to a user. *(Exists)*
*   `POST /api/campaigns/{id}/request-access`: Request access to a campaign. *(Exists)*
*   `POST /api/campaigns/{id}/referral-links`: Create a referral link. *(Exists)*
*   `GET /api/campaigns/{id}/referral-links`: List referral links for a campaign. *(Exists)*

##### Referrals & Public Pages
*   `GET /api/referral/{code}/validate`: Validate a referral code. *(Exists)*
*   `GET /api/referral/{code}/campaign`: Get campaign info for a referral code. *(Exists)*
*   `POST /api/referral/signup`: Process a signup from a referral. *(Exists)*
*   `POST /api/referral/complete`: Mark a referral as converted. *(Exists)*
*   *(Note: The `GET /r/{code}` page will be a client that calls these API endpoints).*

##### Onboarding & Discord Interactions
*   `POST /api/discord-bot/onboarding/start`: Start the onboarding flow. *(Exists)*
*   `POST /api/discord-bot/onboarding/modal`: Submit an onboarding modal. *(Exists)*
*   `GET /api/discord-bot/onboarding/session`: Get user's onboarding session state. *(Exists)*
*   `POST /api/discord-bot/onboarding/complete`: Finalize onboarding. *(Exists)*
*   `POST /api/access-requests`: Submit a new access request from the bot. *(Exists)*
*   `GET /api/discord-bot/config`: Get guild-specific configuration for the bot. *(Exists)*
*   `GET /api/discord/invite/{code}/context`: Get context for a managed Discord invite. *(Exists)*
*   `POST /api/discord/guilds/{guildId}/members/{memberId}/roles`: Assign a role to a guild member. *(Used after successful onboarding or access request approval)*.
*   `GET /api/discord/guilds/{guildId}/members/{memberId}/roles`: Get a member's roles. *(New, for role-based access checks)*.
*   `PATCH /api/bot-campaigns/{id}/stats`: Update statistics for a campaign (e.g., view or join counts). *(New)*

##### Analytics & Data Export
*   `POST /api/analytics/track`: Track a bot interaction or event. *(New)*
*   `GET /api/analytics/campaign-overview`: Get campaign performance overview. *(Exists)*
*   `GET /api/analytics/real-time`: Get real-time activity data. *(Exists)*
*   `GET /api/analytics/user-journey`: Get user journey analytics. *(Exists)*
*   `POST /api/campaigns/export-data`: Initiate a data export. *(Exists)*
*   `GET /api/campaigns/export-data/download`: Download an export file. *(Exists)*

##### Templates
*   `GET /api/campaign-templates`: List campaign templates. *(Exists)*
*   `POST /api/campaign-templates`: Create a new campaign template. *(Exists)*
*   `PATCH /api/campaign-templates/{id}`: Update a campaign template. *(Exists)*
*   `POST /api/campaign-onboarding-fields/apply-template`: Apply a field template to a campaign. *(Exists)*
*   `GET /api/landing-page-templates`: List landing page templates. *(Exists)*

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