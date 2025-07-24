# Virion Labs Platform: User Stories & API Endpoints

This document provides a comprehensive overview of the distinct user roles within the Virion Labs ecosystem. For each role, it outlines their primary goals, the specific user stories that drive their interaction with the platform, and the API endpoints that support these actions.

---

## 1. The Discord Member: The End-User

**Role Description:** The Discord Member is the target audience for the campaigns run on the Virion Labs platform. They are the community members, customers, and fans that Clients and Influencers aim to engage. Their journey is typically initiated by an external link or an interaction within a Discord server, and their experience is designed to be as seamless and intuitive as possible.

### User Stories:

*   **As a Discord Member, I want to click a referral link from an influencer so that I can easily join a community or get access to a special offer.**
*   **As a Discord Member, I want to join a Discord server from a landing page with a single click.**
*   **As a Discord Member, I want to be automatically guided through an onboarding process when I join a new server so I know what to do next.**
*   **As a Discord Member, I want to use simple slash commands like `/join` or `/start` to discover and participate in campaigns directly within Discord.**
*   **As a Discord Member, I want to fill out a simple form inside Discord to provide my information and get access to special roles or channels.**
*   **As a Discord Member, I want to receive a specific role automatically after completing a task, so I can unlock new permissions and content.**

### Supporting API Endpoints:

*   `[ ]` **GET /api/campaigns/available**
    *   **Description:** Fetches a list of campaigns available to a specific user based on their current roles within the Discord server.
    *   **Auth:** Bot-level authentication (API Key).
    *   **Query Params:** `guild_id`, `channel_id`, `user_id`, `user_roles[]`.
*   `[ ]` **GET /api/me/profile**
    *   **Description:** Allows a user to view their own profile, including which campaigns they've joined and the information they have submitted.
    *   **Auth:** Requires authentication via Discord user ID.

---

## 2. The Influencer: The Promoter

**Role Description:** The Influencer is a primary driver of user acquisition. They leverage their audience to bring new members into a Client's ecosystem. Their focus is on performance, monetization, and having access to tools that are both powerful and easy to use.

### User Stories:

*   **As an Influencer, I want to sign up to the platform easily to start monetizing my reach.**
*   **As an Influencer, I want to create unique, trackable referral links for different platforms.**
*   **As an Influencer, I want to track the performance of my links in real-time, including total clicks and successful conversions.**
*   **As an Influencer, I want to see my conversion rate to understand how effective my promotional content is.**
*   **As an Influencer, I want to manage all my referral links from a single dashboard.**
*   **As an Influencer, I want to discover and request access to new marketing campaigns.**
*   **As an Influencer, I want to generate QR codes for my links.**

### Supporting API Endpoints:

*   `[ ]` **GET /api/influencer/dashboard**
    *   **Description:** Retrieves all summary data required for the influencer's main dashboard view.
    *   **Auth:** Influencer user account.
*   `[ ]` **GET /api/referral-links**
    *   **Description:** Lists all referral links created by the authenticated influencer, along with their performance.
    *   **Auth:** Influencer user account.
*   `[ ]` **POST /api/referral-links**
    *   **Description:** Creates a new, unique, and trackable referral link for a specific campaign.
    *   **Auth:** Influencer user account.
    *   **Request Body:** `campaign_id`, `link_name`.
*   `[ ]` **PUT /api/referral-links/{link_id}**
    *   **Description:** Updates a referral link's properties, primarily its status.
    *   **Auth:** Influencer user account.
    *   **Request Body:** `status`.
*   `[ ]` **GET /api/campaigns/discoverable**
    *   **Description:** Allows influencers to find new marketing campaigns that are open for applications.
    *   **Auth:** Influencer user account.
*   `[ ]` **POST /api/campaigns/{campaign_id}/request-access**
    *   **Description:** Submits an application for an influencer to join a restricted campaign.
    *   **Auth:** Influencer user account.

---

## 3. The Client: The Brand

**Role Description:** The Client is the business or brand that funds and directs the marketing campaigns. They are focused on achieving specific business goals, such as community growth, lead generation, or sales. They require tools for campaign management, customization, and measuring return on investment (ROI).

### User Stories:

*   **As a Client, I want to be onboarded to the platform with a simple wizard to create my first campaign.**
*   **As a Client, I want to create and manage multiple marketing campaigns from a central dashboard.**
*   **As a Client, I want to customize a Discord bot with my own branding.**
*   **As a Client, I want to define a specific onboarding flow for new members.**
*   **As a Client, I want to track key metrics for my campaigns.**
*   **As a Client, I want to pause, resume, or archive campaigns.**
*   **As a Client, I want to view detailed analytics to understand the ROI of my marketing spend.**

### Supporting API Endpoints:

*   `[ ]` **GET /api/client/dashboard**
    *   **Description:** Retrieves a high-level overview of all campaign performance for the client.
    *   **Auth:** Client user account.
*   `[ ]` **GET /api/campaigns**
    *   **Description:** Lists all marketing campaigns owned by the authenticated client.
    *   **Auth:** Client user account.
*   `[ ]` **POST /api/campaigns**
    *   **Description:** Creates a new marketing campaign.
    *   **Auth:** Client user account.
    *   **Request Body:** Comprehensive campaign details object.
*   `[ ]` **GET /api/campaigns/{campaign_id}**
    *   **Description:** Gets the detailed configuration and full analytics for a specific campaign.
    *   **Auth:** Client user account.
*   `[ ]` **PUT /api/campaigns/{campaign_id}**
    *   **Description:** Updates a campaign's configuration or status.
    *   **Auth:** Client user account.
    *   **Request Body:** Specific fields to update.
*   `[ ]` **DELETE /api/campaigns/{campaign_id}**
    *   **Description:** Archives a campaign.
    *   **Auth:** Client user account.
*   `[ ]` **PUT /api/bot/branding**
    *   **Description:** Allows a client to customize their Discord bot's appearance and personality.
    *   **Auth:** Client user account.
    *   **Request Body:** `bot_name`, `logo_url`, `theme_color`, `welcome_message`.
*   `[ ]` **GET /api/client/influencers**
    *   **Description:** Lists all influencers participating in the client's campaigns.
    *   **Auth:** Client user account.

---

## 4. The Platform Administrator: The Operator

**Role Description:** The Administrator is a user from Virion Labs responsible for the overall health and management of the platform. They have the highest level of access and are tasked with managing clients, overseeing all platform activity, and ensuring the system's technical and operational integrity.

### User Stories:

*   **As an Administrator, I want to have a global view of all clients, influencers, and campaigns.**
*   **As an Administrator, I want to add, view, edit, and delete client accounts.**
*   **As an Administrator, I want to create and deploy new Discord bots for clients.**
*   **As an Administrator, I want to manage all bot campaigns across all clients.**
*   **As an Administrator, I want to approve or deny requests from influencers to join restricted campaigns.**
*   **As an Administrator, I want to ensure that key data points are automatically and accurately updated.**
*   **As an Administrator, I want to securely add other admin users via a command-line script.**

### Supporting API Endpoints:

*   `[ ]` **GET /api/admin/clients**
    *   **Description:** Lists all client accounts on the platform.
    *   **Auth:** Admin user account.
*   `[ ]` **POST /api/admin/clients**
    *   **Description:** Creates a new client account.
    *   **Auth:** Admin user account.
    *   **Request Body:** `client_name`, `contact_email`, `plan_level`.
*   `[ ]` **GET /api/admin/clients/{client_id}**
    *   **Description:** Views the detailed information for a specific client.
    *   **Auth:** Admin user account.
*   `[ ]` **GET /api/admin/campaigns**
    *   **Description:** Provides a global view of all campaigns across all clients.
    *   **Auth:** Admin user account.
*   `[ ]` **GET /api/admin/influencer-requests**
    *   **Description:** Lists all pending requests from influencers to join restricted campaigns.
    *   **Auth:** Admin user account.
*   `[ ]` **POST /api/admin/influencer-requests/{request_id}/approve**
    *   **Description:** Approves an influencer's request to join a campaign.
    *   **Auth:** Admin user account.
*   `[ ]` **POST /api/admin/influencer-requests/{request_id}/deny**
    *   **Description:** Denies an influencer's request to join a campaign.
    *   **Auth:** Admin user account.
