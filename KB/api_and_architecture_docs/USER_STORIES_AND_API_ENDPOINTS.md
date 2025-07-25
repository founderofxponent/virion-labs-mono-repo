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

### Supporting Business Logic API Endpoints:

*   `[ ]` **GET /api/v1/workflows/onboarding/start**
    *   **Description:** Initiates onboarding flow and fetches available campaigns for a Discord user.
    *   **Auth:** Bot-level authentication (API Key).
    *   **Query Params:** `guild_id`, `channel_id`, `user_id`, `user_roles[]`.
*   `[ ]` **POST /api/v1/workflows/onboarding/complete**
    *   **Description:** Completes user onboarding, assigns Discord roles, and tracks campaign participation.
    *   **Auth:** Bot-level authentication (API Key).
    *   **Request Body:** `user_id`, `campaign_id`, `onboarding_responses`, `guild_id`.
*   `[ ]` **POST /api/v1/integrations/discord/server-join**
    *   **Description:** Handles Discord server join events and triggers appropriate onboarding workflows.
    *   **Auth:** Bot-level authentication (API Key).
    *   **Request Body:** `user_id`, `guild_id`, `invite_source`.

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

### Supporting Business Logic API Endpoints:

*   `[ ]` **GET /api/v1/operations/analytics/generate-dashboard**
    *   **Description:** Aggregates and generates influencer dashboard data including performance metrics and earnings.
    *   **Auth:** Influencer user account.
    *   **Query Params:** `time_range`, `campaign_filter`.
*   `[ ]` **POST /api/v1/workflows/referral-tracking/generate-link**
    *   **Description:** Creates a new trackable referral link with analytics setup and campaign validation.
    *   **Auth:** Influencer user account.
    *   **Request Body:** `campaign_id`, `link_name`, `utm_parameters`.
*   `[ ]` **POST /api/v1/workflows/referral-tracking/click**
    *   **Description:** Tracks referral link clicks and handles attribution logic.
    *   **Auth:** Public endpoint with validation.
    *   **Request Body:** `link_id`, `user_agent`, `ip_address`, `referrer`.
*   `[ ]` **POST /api/v1/workflows/referral-tracking/convert**
    *   **Description:** Tracks successful conversions and calculates commissions.
    *   **Auth:** Internal/Bot authentication.
    *   **Request Body:** `link_id`, `user_id`, `conversion_type`, `value`.
*   `[ ]` **GET /api/v1/operations/analytics/influencer-metrics**
    *   **Description:** Calculates comprehensive influencer performance metrics and conversion rates.
    *   **Auth:** Influencer user account.
    *   **Query Params:** `campaign_id`, `date_range`.
*   `[ ]` **POST /api/v1/workflows/campaign-access/request**
    *   **Description:** Submits campaign access request with validation and notification workflows.
    *   **Auth:** Influencer user account.
    *   **Request Body:** `campaign_id`, `application_message`, `portfolio_links`.

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

### Supporting Business Logic API Endpoints:

*   `[ ]` **GET /api/v1/operations/analytics/generate-dashboard**
    *   **Description:** Aggregates campaign performance data, ROI calculations, and client metrics overview.
    *   **Auth:** Client user account.
    *   **Query Params:** `time_range`, `campaign_filter`, `metric_type`.
*   `[ ]` **POST /api/v1/workflows/client-onboarding/start-wizard**
    *   **Description:** Initiates client onboarding process with guided campaign setup.
    *   **Auth:** Client user account.
    *   **Request Body:** `business_type`, `target_audience`, `goals`.
*   `[ ]` **POST /api/v1/workflows/client-onboarding/create-first-campaign**
    *   **Description:** Completes onboarding by creating first campaign with bot deployment.
    *   **Auth:** Client user account.
    *   **Request Body:** `campaign_config`, `bot_branding`, `discord_server_id`.
*   `[ ]` **POST /api/v1/operations/campaign/deploy**
    *   **Description:** Deploys campaign with Discord bot setup, webhook configuration, and activation.
    *   **Auth:** Client user account.
    *   **Request Body:** `campaign_id`, `discord_config`, `deployment_settings`.
*   `[ ]` **POST /api/v1/operations/campaign/pause**
    *   **Description:** Pauses campaign operations, disables bot interactions, and updates referral links.
    *   **Auth:** Client user account.
    *   **Request Body:** `campaign_id`, `pause_reason`.
*   `[ ]` **POST /api/v1/operations/campaign/resume**
    *   **Description:** Resumes paused campaign with validation and re-activation workflows.
    *   **Auth:** Client user account.
    *   **Request Body:** `campaign_id`.
*   `[ ]` **POST /api/v1/operations/campaign/archive**
    *   **Description:** Archives campaign with data cleanup and final analytics generation.
    *   **Auth:** Client user account.
    *   **Request Body:** `campaign_id`, `archive_settings`.
*   `[ ]` **PUT /api/v1/operations/campaign/configure-branding**
    *   **Description:** Updates Discord bot branding with validation and deployment to active servers.
    *   **Auth:** Client user account.
    *   **Request Body:** `campaign_id`, `bot_name`, `logo_url`, `theme_color`, `welcome_message`.
*   `[ ]` **GET /api/v1/operations/analytics/calculate-roi**
    *   **Description:** Calculates comprehensive ROI metrics across campaigns with attribution analysis.
    *   **Auth:** Client user account.
    *   **Query Params:** `campaign_ids[]`, `time_range`, `cost_basis`.
*   `[ ]` **GET /api/v1/operations/analytics/performance-report**
    *   **Description:** Generates detailed performance reports with influencer breakdowns and trends.
    *   **Auth:** Client user account.
    *   **Query Params:** `report_type`, `date_range`, `export_format`.

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

### Supporting Business Logic API Endpoints:

*   `[ ]` **GET /api/v1/operations/admin/platform-overview**
    *   **Description:** Generates comprehensive platform analytics with client, campaign, and revenue metrics.
    *   **Auth:** Admin user account.
    *   **Query Params:** `time_range`, `metric_breakdown`, `include_forecasts`.
*   `[ ]` **POST /api/v1/operations/admin/provision-client**
    *   **Description:** Creates new client account with infrastructure setup, bot provisioning, and initial configuration.
    *   **Auth:** Admin user account.
    *   **Request Body:** `client_name`, `contact_email`, `plan_level`, `initial_config`.
*   `[ ]` **POST /api/v1/operations/admin/deploy-bot**
    *   **Description:** Deploys new Discord bot instance for client with server setup and webhook configuration.
    *   **Auth:** Admin user account.
    *   **Request Body:** `client_id`, `bot_config`, `discord_permissions`, `server_id`.
*   `[ ]` **POST /api/v1/workflows/campaign-access/approve**
    *   **Description:** Approves influencer campaign access with notification workflows and access provisioning.
    *   **Auth:** Admin user account.
    *   **Request Body:** `request_id`, `approval_notes`, `access_level`.
*   `[ ]` **POST /api/v1/workflows/campaign-access/deny**
    *   **Description:** Denies influencer campaign access with automated notification and feedback collection.
    *   **Auth:** Admin user account.
    *   **Request Body:** `request_id`, `denial_reason`, `feedback_message`.
*   `[ ]` **GET /api/v1/operations/admin/platform-health**
    *   **Description:** Monitors platform health with system metrics, error rates, and performance indicators.
    *   **Auth:** Admin user account.
    *   **Query Params:** `include_alerts`, `metric_depth`.
*   `[ ]` **POST /api/v1/operations/admin/maintenance-mode**
    *   **Description:** Manages platform maintenance mode with graceful service degradation and user notifications.
    *   **Auth:** Admin user account.
    *   **Request Body:** `action`, `services[]`, `duration`, `notification_message`.
