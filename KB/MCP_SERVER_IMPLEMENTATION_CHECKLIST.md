# MCP Server Implementation Checklist

This document outlines the necessary features and API endpoints that need to be implemented in the `mcp-server` and the unified `api` package to mirror the functionalities of the admin dashboard. The goal is to create a unified API that the dashboard, Discord bot, and MCP server can all communicate with.

The checklist is prioritized based on the admin features available in the dashboard. For each feature, we will identify if the current API package already supports it.

## I. User Management

- [x] **List all users**: The admin can view a list of all users in the system.
  - **API Support**: `GET /api/admin/users`
  - **Notes**: The current implementation seems to cover this.
- [ ] **View user details**: The admin can view detailed information about a specific user, including their profile, roles, and associated campaigns.
  - **API Support**: `GET /api/auth/user` (for current user), but no endpoint for arbitrary user.
- [ ] **Edit user roles**: The admin can assign or revoke user roles (e.g., promote a user to admin).
  - **API Support**: None

## II. Access Request Management

- [x] **List access requests**: The admin can view all pending access requests.
  - **API Support**: `GET /api/admin/access-requests`
- [x] **Approve or deny access requests**: The admin can approve or deny pending access requests.
  - **API Support**: `POST /api/admin/access-requests`

## III. Campaign Management

- [x] **List all campaigns**: The admin can view a list of all campaigns.
  - **API Support**: `GET /api/campaigns/`
- [x] **Create a new campaign**: The admin can create a new campaign.
  - **API Support**: `POST /api/campaigns/`
- [x] **View campaign details**: The admin can view the detailed configuration of a campaign.
  - **API Support**: `GET /api/campaigns/{campaign_id}`
- [x] **Update a campaign**: The admin can update an existing campaign.
  - **API Support**: `PATCH /api/campaigns/{campaign_id}`
- [x] **Delete a campaign**: The admin can delete a campaign.
  - **API Support**: `DELETE /api/campaigns/{campaign_id}`

### Detailed Campaign Configuration
This section breaks down the specific attributes that can be configured when creating or updating a campaign.

#### 1. Vitals
- [x] **Set Campaign Name**: Define the name of the campaign.
- [x] **Assign Client**: Link the campaign to a client.
- [x] **Set Campaign Template**: Choose a template for the campaign.
- [x] **Set Description**: Provide a description for the campaign.
  - **API Support**: Handled by `POST /api/campaigns/` and `PATCH /api/campaigns/{campaign_id}`.

#### 2. Placement & Schedule
- [x] **Set Discord Guild ID**: Specify the Discord server for the campaign.
- [x] **Set Primary Channel ID**: Specify the primary channel for the bot.
- [x] **Set Start and End Dates**: Define the duration of the campaign.
  - **API Support**: Handled by `POST /api/campaigns/` and `PATCH /api/campaigns/{campaign_id}`.

#### 3. Bot Identity
- [x] **Set Bot Name**: Define the name of the bot for the campaign.
- [x] **Set Brand Logo URL**: Provide a URL for the bot's logo.
- [x] **Set Brand Color**: Choose a brand color for the bot's embeds.
- [x] **Set Bot Personality**: Define the bot's personality (e.g., helpful, witty).
- [x] **Set Bot Response Style**: Define the bot's response style (e.g., friendly, concise).
  - **API Support**: Handled by `POST /api/campaigns/` and `PATCH /api/campaigns/{campaign_id}`.

#### 4. Onboarding Flow
- [x] **Set Welcome Message**: Define the welcome message for the onboarding flow.
  - **API Support**: Handled by `POST /api/campaigns/` and `PATCH /api/campaigns/{campaign_id}`.
- [ ] **Manage Onboarding Questions**:
    - [ ] **Add Questions**: Add new questions to the onboarding flow.
    - [ ] **Edit Questions**: Edit existing questions (label, type, required, enabled).
    - [ ] **Reorder Questions**: Change the order of questions.
    - [ ] **Delete Questions**: Remove questions from the onboarding flow.
  - **API Support**: None. This requires new dedicated endpoints for question CRUD.

#### 5. Access & Moderation
- [x] **Toggle Auto Role Assignment**: Enable or disable automatic role assignment.
- [x] **Set Target Role IDs**: Specify the roles to be assigned.
- [x] **Toggle Moderation**: Enable or disable rate-limiting.
- [x] **Set Rate Limit**: Define the number of interactions per user per hour.
  - **API Support**: Handled by `POST /api/campaigns/` and `PATCH /api/campaigns/{campaign_id}`.

#### 6. Advanced
- [x] **Toggle Referral Tracking**: Enable or disable the referral system for the campaign.
- [x] **Set Webhook URL**: Specify a webhook URL to send campaign events to.
  - **API Support**: Handled by `POST /api/campaigns/` and `PATCH /api/campaigns/{campaign_id}`.
- [ ] **Manage Landing Page Configuration**:
  - **API Support**: None. This requires new dedicated endpoints for landing page CRUD.
  - **Details**:
    - [ ] **Template Selection**: Choose a template or start from blank.
    - [ ] **Content**: Set the offer title, description, value, highlights, and expiry date.
    - [ ] **Media**: Set the hero image, demo video, and product images.
    - [ ] **Details**: Set "What You Get," "How It Works," "Requirements," and "Support Information."

### Other Campaign Features
- [ ] **Publish Campaigns to Discord**:
  - **API Support**: None. This is currently handled by the dashboard's backend and requires a new dedicated endpoint.

## IV. Client Management

- [x] **List all clients**: The admin can view a list of all clients.
  - **API Support**: `GET /api/clients/`
- [x] **Add a new client**: The admin can add a new client to the system.
  - **API Support**: `POST /api/clients/`
- [x] **View client details**: The admin can view detailed information about a client, including their active campaigns.
  - **API Support**: `GET /api/clients/{client_id}`
- [x] **Edit client details**: The admin can edit the information of an existing client.
  - **API Support**: `PATCH /api/clients/{client_id}`
- [x] **Delete a client**: The admin can delete a client from the system.
  - **API Support**: `DELETE /api/clients/{client_id}`

## V. Analytics

- [x] **View campaign analytics**: The admin can view analytics for a specific campaign, including real-time data on user engagement and conversions.
  - **API Support**: `GET /api/analytics/campaign-overview`, `GET /api/analytics/real-time`, `GET /api/analytics/user-journey`, `GET /api/analytics/guild/{guild_id}`
- [x] **Export analytics data**: The admin can export campaign analytics data in various formats (e.g., CSV, JSON).
  - **API Support**: `POST /api/campaigns/export-data`, `GET /api/campaigns/export-data/download`

## VI. Onboarding Fields Management

- [ ] **List all onboarding fields**: The admin can view all the fields used in the onboarding forms.
  - **API Support**: None
- [ ] **Create new onboarding fields**: The admin can create new fields for the onboarding forms.
  - **API Support**: None

## VII. Template Management

- [x] **List campaign templates**: The admin can list all campaign templates.
    - **API Support**: `GET /api/campaign-templates`
- [x] **Create campaign template**: The admin can create a new campaign template.
    - **API Support**: `POST /api/campaign-templates`
- [x] **Update campaign template**: The admin can update an existing campaign template.
    - **API Support**: `PATCH /api/campaign-templates/{template_id}`
- [x] **Delete campaign template**: The admin can delete a campaign template.
    - **API Support**: `DELETE /api/campaign-templates/{template_id}`
- [x] **List landing page templates**: The admin can list all landing page templates.
    - **API Support**: `GET /api/landing-page-templates`
- [x] **Apply template to campaign**: The admin can apply a template to a campaign.
    - **API Support**: `POST /api/campaign-onboarding-fields/apply-template`

## VIII. Settings

- [ ] **Manage admin settings**: The admin can configure system-wide settings.
  - **API Support**: None 