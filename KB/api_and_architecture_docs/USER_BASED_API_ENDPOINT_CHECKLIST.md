# User-Based API Endpoint Implementation Checklist

This document outlines the necessary API endpoints to support the full functionality of the Virion Labs platform for all user roles. It serves as a checklist for development, ensuring that all user stories related to data interaction are covered.

---

## 1. Discord Member Endpoints

These endpoints are primarily consumed by the Discord bot on behalf of the end-user.

*   `[ ]` **GET /api/campaigns/available**
    *   **Description:** Fetches a list of campaigns available to a specific user based on their current roles within the Discord server. This is a critical update to the existing concept to enforce access control.
    *   **Auth:** Bot-level authentication (API Key).
    *   **Query Params:** `guild_id`, `channel_id`, `user_id`, `user_roles[]` (array of role IDs).
    *   **Response Data:** An array of campaign objects, filtered according to the user's permissions.

*   `[ ]` **GET /api/me/profile**
    *   **Description:** Allows a user to view their own profile, including which campaigns they've joined and the information they have submitted.
    *   **Auth:** Requires authentication via Discord user ID.
    *   **Response Data:** A user object containing their profile details, a list of joined campaigns, and associated roles.

---

## 2. Influencer Endpoints

These endpoints support the Influencer Dashboard, focusing on performance tracking and campaign discovery.

*   `[ ]` **GET /api/influencer/dashboard**
    *   **Description:** Retrieves all summary data required for the influencer's main dashboard view.
    *   **Auth:** Influencer user account.
    *   **Response Data:** An object with summary stats (e.g., total clicks, conversions, conversion rate, estimated earnings) and a feed of recent activity.

*   `[ ]` **GET /api/referral-links**
    *   **Description:** Lists all referral links created by the authenticated influencer, along with their performance.
    *   **Auth:** Influencer user account.
    *   **Response Data:** An array of referral link objects, each including its unique URL, performance metrics (clicks, conversions), and current status (active/inactive).

*   `[ ]` **POST /api/referral-links**
    *   **Description:** Creates a new, unique, and trackable referral link for a specific campaign.
    *   **Auth:** Influencer user account.
    *   **Request Body:** `campaign_id`, `link_name` (a friendly name for tracking, e.g., "youtube_video_1").
    *   **Response Data:** The newly created referral link object.

*   `[ ]` **PUT /api/referral-links/{link_id}**
    *   **Description:** Updates a referral link's properties, primarily its status.
    *   **Auth:** Influencer user account.
    *   **Request Body:** `status` (e.g., 'active' or 'inactive').
    *   **Response Data:** The updated referral link object.

*   `[ ]` **GET /api/campaigns/discoverable**
    *   **Description:** Allows influencers to find new marketing campaigns that are open for applications.
    *   **Auth:** Influencer user account.
    *   **Response Data:** A list of public or invite-only campaigns with their descriptions, terms, and potential rewards.

*   `[ ]` **POST /api/campaigns/{campaign_id}/request-access**
    *   **Description:** Submits an application for an influencer to join a restricted campaign.
    *   **Auth:** Influencer user account.
    *   **Response Data:** A success message confirming the application was submitted for review.

---

## 3. Client Endpoints

These endpoints support the Client Dashboard for managing campaigns, branding, and analytics.

*   `[ ]` **GET /api/client/dashboard**
    *   **Description:** Retrieves a high-level overview of all campaign performance for the client.
    *   **Auth:** Client user account.
    *   **Response Data:** Aggregated stats (total interactions, successful onboardings, referral conversions), performance graphs, and budget tracking.

*   `[ ]` **GET /api/campaigns**
    *   **Description:** Lists all marketing campaigns owned by the authenticated client.
    *   **Auth:** Client user account.
    *   **Response Data:** An array of campaign objects with their current status and summary stats.

*   `[ ]` **POST /api/campaigns**
    *   **Description:** Creates a new marketing campaign.
    *   **Auth:** Client user account.
    *   **Request Body:** A comprehensive object with all campaign details (e.g., name, description, onboarding flow questions, target roles, completion rewards).
    *   **Response Data:** The newly created campaign object.

*   `[ ]` **GET /api/campaigns/{campaign_id}**
    *   **Description:** Gets the detailed configuration, full analytics, and user responses for a specific campaign.
    *   **Auth:** Client user account.
    *   **Response Data:** The complete campaign object, including all settings and associated analytics data.

*   `[ ]` **PUT /api/campaigns/{campaign_id}**
    *   **Description:** Updates a campaign's configuration or status (e.g., pause, resume).
    *   **Auth:** Client user account.
    *   **Request Body:** The specific fields to update (e.g., `status: 'paused'`, `onboarding_flow: {...}`).
    *   **Response Data:** The updated campaign object.

*   `[ ]` **DELETE /api/campaigns/{campaign_id}**
    *   **Description:** Archives a campaign, hiding it from active views but retaining its historical data.
    *   **Auth:** Client user account.
    *   **Response Data:** A success message.

*   `[ ]` **PUT /api/bot/branding**
    *   **Description:** Allows a client to customize their Discord bot's appearance and personality.
    *   **Auth:** Client user account.
    *   **Request Body:** `bot_name`, `logo_url`, `theme_color`, `welcome_message`.
    *   **Response Data:** The updated branding configuration object.

*   `[ ]` **GET /api/client/influencers**
    *   **Description:** Lists all influencers participating in the client's campaigns, along with their performance.
    *   **Auth:** Client user account.
    *   **Response Data:** An array of influencer objects, each with their performance stats related to the client's campaigns.

---

## 4. Administrator Endpoints

These endpoints are for platform-level management and are accessible only to administrators.

*   `[ ]` **GET /api/admin/clients**
    *   **Description:** Lists all client accounts on the platform.
    *   **Auth:** Admin user account.
    *   **Response Data:** An array of all client objects with their details.

*   `[ ]` **POST /api/admin/clients**
    *   **Description:** Creates a new client account.
    *   **Auth:** Admin user account.
    *   **Request Body:** `client_name`, `contact_email`, `plan_level`.
    *   **Response Data:** The new client object.

*   `[ ]` **GET /api/admin/clients/{client_id}**
    *   **Description:** Views the detailed information for a specific client, including all their campaigns and bots.
    *   **Auth:** Admin user account.
    *   **Response Data:** The detailed client object.

*   `[ ]` **GET /api/admin/campaigns**
    *   **Description:** Provides a global view of all campaigns across all clients for monitoring purposes.
    *   **Auth:** Admin user account.
    *   **Response Data:** An array of all campaign objects on the platform.

*   `[ ]` **GET /api/admin/influencer-requests**
    *   **Description:** Lists all pending requests from influencers to join restricted campaigns.
    *   **Auth:** Admin user account.
    *   **Response Data:** An array of pending request objects, including influencer and campaign details.

*   `[ ]` **POST /api/admin/influencer-requests/{request_id}/approve**
    *   **Description:** Approves an influencer's request to join a campaign.
    *   **Auth:** Admin user account.
    *   **Response Data:** A success message.

*   `[ ]` **POST /api/admin/influencer-requests/{request_id}/deny**
    *   **Description:** Denies an influencer's request to join a campaign.
    *   **Auth:** Admin user account.
    *   **Response Data:** A success message.
