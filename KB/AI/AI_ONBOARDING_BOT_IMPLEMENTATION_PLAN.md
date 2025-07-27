# Implementation Plan: AI-Powered Onboarding Bot and Admin Review Workflow

**Date:** 2025-07-27

**Author:** Gemini

**Status:** Proposed

## 1. Overview

This document outlines the implementation strategy for a new AI-powered Discord bot (`virion-labs-discord-bot-ai`) focused on conversational user onboarding. It also details the corresponding administrative workflow, which leverages the `mcp-server` within an AI chat interface (e.g., Claude Desktop) for asynchronous ticket review and processing.

This plan supersedes any previous plans regarding the AI discord bot.

## 2. Core Architecture & Workflow

The system is divided into two distinct user-facing experiences: the **Onboarding User's Journey** and the **Administrator's Journey**.

### 2.1. Onboarding User's Journey (Data Collection)

1.  A new user initiates an onboarding conversation with the Discord bot.
2.  The bot asks a series of questions in a natural, conversational manner.
3.  The bot uses a lightweight NLU/AI model to understand and validate the user's free-text answers (e.g., extracting an email from a sentence).
4.  The bot uses **templated responses** to guide the user, not AI-generated chat.
5.  Upon completion, the entire conversation transcript is saved to the database as an `OnboardingTicket`.
6.  The user is notified that their application is pending review.

### 2.2. Administrator's Journey (Ticket Processing)

1.  The administrator, using an AI Chat App with `mcp-server` loaded as a tool, requests to see pending tickets (e.g., "Show me new onboarding requests").
2.  The `mcp-server` calls the business logic API to fetch all `OnboardingTicket`s with a `pending` status.
3.  The conversation transcripts are displayed to the admin within their chat interface.
4.  The admin reviews the conversation and uses other `mcp-server` tools (via natural language) to approve or reject the ticket (e.g., "Approve ticket #123. Add to 'Summer Fest' campaign with 'Influencer' role.").
5.  The `mcp-server` calls the appropriate API endpoint to execute the admin's command, which updates the ticket status and performs the required actions (e.g., assigning a role in Discord via the bot).

### 2.3. Architectural Diagram

```mermaid
graph TD
    subgraph "User Onboarding"
        A[Discord User] --> B[virion-labs-discord-bot-ai];
        B --> |3. Save Conversation| C[POST /api/v1/workflows/onboarding/create-ticket];
    end

    subgraph "Admin Review"
        D[Admin in AI Chat App] --> E[mcp-server (as tool)];
        E --> |6. Fetch Tickets| F[GET /api/v1/operations/onboarding/pending-tickets];
        E --> |8. Approve/Reject| G[POST /api/v1/workflows/onboarding/process-ticket];
    end

    subgraph "Backend"
        C --> H[Business Logic API];
        F --> H;
        G --> H;
        H <--> I[Strapi/Database];
    end

    B <-.-> |9. Execute Actions (e.g., assign role)| H
```

## 3. Database Schema (`virion-labs-strapi-cms`)

A new Content-Type needs to be created in Strapi.

### 3.1. New Content-Type: `OnboardingTicket`

-   **Display Name:** Onboarding Ticket
-   **API ID:** `onboarding-ticket`
-   **Fields:**
    -   `discord_user_id` (Text, Required, Private)
    -   `discord_username` (Text, Required)
    -   `status` (Enumeration, Required, Default: `pending`)
        -   Values: `pending`, `approved`, `rejected`
    -   `conversation_thread` (JSON, Required) - Stores the structured conversation log.
    -   `campaign` (Relation, Required) - A one-to-one or many-to-one relationship to the `Campaign` content type.
    -   `admin_notes` (Text, Long text) - For admins to add notes during review.
    -   `processed_by` (Relation) - A relationship to the Admin User who processed the ticket.

## 4. API Strategy (`virion-labs-business-logic-api`)

The API needs new endpoints to manage the lifecycle of an `OnboardingTicket`. These will be added to the `workflows` and `operations` routers.

### 4.1. New Endpoints

#### 1. Create Onboarding Ticket
-   **Endpoint:** `POST /api/v1/workflows/onboarding/create-ticket`
-   **Purpose:** Called by the Discord bot to submit a completed onboarding conversation.
-   **Request Body:**
    ```json
    {
      "discord_user_id": "123456789012345678",
      "discord_username": "testuser#1234",
      "campaign_id": "strapi_document_id_of_campaign",
      "conversation_thread": [
        { "speaker": "bot", "text": "What is your email?" },
        { "speaker": "user", "text": "my email is test@example.com" },
        { "speaker": "bot", "text": "Thank you!" }
      ]
    }
    ```
-   **Action:** Creates a new `OnboardingTicket` entry in the database with `status: 'pending'`.

#### 2. List Pending Tickets
-   **Endpoint:** `GET /api/v1/operations/onboarding/pending-tickets`
-   **Purpose:** Called by the `mcp-server` to fetch all tickets requiring admin review.
-   **Response Body:** An array of `OnboardingTicket` objects.

#### 3. Process Onboarding Ticket
-   **Endpoint:** `POST /api/v1/workflows/onboarding/process-ticket`
-   **Purpose:** Called by the `mcp-server` to approve or reject a ticket. This is a workflow that orchestrates multiple actions.
-   **Request Body:**
    ```json
    {
      "ticket_id": "strapi_document_id_of_ticket",
      "action": "approve", // or "reject"
      "admin_notes": "User looks great. Approved.",
      "approval_details": { // Only required if action is 'approve'
        "role_to_assign": "Influencer" 
      }
    }
    ```
-   **Action (`approve`):**
    1.  Updates the ticket `status` to `approved`.
    2.  Logs `admin_notes` and the processing admin.
    3.  Initiates a call to the Discord bot (or a Discord integration service) to assign the specified role to the user in the Discord server.
    4.  Sends a confirmation DM to the user via the bot.
-   **Action (`reject`):**
    1.  Updates the ticket `status` to `rejected`.
    2.  Logs `admin_notes`.
    3.  Sends a rejection DM to the user via the bot.

## 5. `virion-labs-discord-bot-ai` Implementation

-   **State Management:** The bot needs a simple in-memory or Redis-based state machine to track which question a user is currently answering for a given campaign.
-   **Conversational Flow:** The bot will have a predefined script of questions. It will not generate questions using an LLM.
-   **NLU for Extraction:** For each user response, the bot will make a call to a lightweight NLU service (could be a simple function, a regex, or a targeted LLM call) to extract the specific entity required (e.g., email, name). If extraction fails, it will re-prompt the user with a templated message.
-   **API Client:** An API client will be implemented to call the `create-ticket` endpoint upon successful completion of the conversation.

## 6. `mcp-server` Integration

-   **New Tools:** The `mcp-server`'s function discovery mechanism will be updated to expose new tools to the admin's AI chat interface.
    -   `list_pending_onboarding_tickets()`: Calls the `GET` endpoint.
    -   `get_onboarding_ticket_details(ticket_id)`: Fetches a single ticket.
    -   `approve_onboarding_ticket(ticket_id, role, notes)`: Calls the `process-ticket` workflow.
    -   `reject_onboarding_ticket(ticket_id, notes)`: Calls the `process-ticket` workflow.

## 7. Phased Rollout Plan

1.  **Phase 1: Foundation (Backend)**
    -   **Strapi:** Create the `OnboardingTicket` Content-Type.
    -   **API:** Implement and test the three new endpoints (`/create-ticket`, `/pending-tickets`, `/process-ticket`).

2.  **Phase 2: Discord Bot (Data Collection)**
    -   Build the `virion-labs-discord-bot-ai` with the conversational onboarding flow.
    -   Integrate the NLU component for response validation/extraction.
    -   Connect the bot to the `create-ticket` endpoint.
    -   Test the user-facing onboarding experience thoroughly.

3.  **Phase 3: Admin Workflow (MCP-Server)**
    -   Add the new ticket-processing functions to the `mcp-server`.
    -   Test the ability to fetch and display tickets from within an AI chat environment.
    -   Test the approval and rejection workflows.

4.  **Phase 4: End-to-End Testing & Deployment**
    -   Conduct a full, end-to-end test: A user onboards via the bot, an admin reviews and approves the ticket via the MCP-server, and the user successfully receives their role in Discord.
    -   Deploy the new services.
