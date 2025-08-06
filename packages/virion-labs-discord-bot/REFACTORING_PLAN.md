# Refactoring Plan: Migrating `virion-labs-discord-bot` to the Unified Business Logic API

## 1. Overview

This document outlines the strategic plan to refactor the `virion-labs-discord-bot`. The primary objective is to decouple the bot from its embedded business logic by integrating it with the new `virion-labs-business-logic-api`. This will transform the bot into a lean "presentation layer" for Discord, making it more maintainable, scalable, and aligned with the new platform architecture.

## 2. Guiding Principles

The refactoring will adhere to the following core principles:

*   **The Bot as a Presentation Layer**: The bot's sole responsibility is to manage interactions with the Discord API. It will handle events, construct UI components (embeds, modals, buttons), and display data to users. It should not contain any business logic.
*   **The API as the Single Source of Truth**: All business logic, data validation, and decision-making will be centralized in the Unified Business Logic API. The bot will trust the API to enforce all rules and perform all complex operations.
*   **Eliminate Direct Database Knowledge**: The bot will have no knowledge of the database schema or data structures. It will only interact with the data contracts (schemas) defined by the API.

## 3. Separation of Concerns

This section defines the clear division of responsibilities between the bot and the API.

### Responsibilities of the Discord Bot (Stays in the bot)

*   **Event Handling**: Listening for and reacting to Discord Gateway events (e.g., `interactionCreate`, `guildMemberAdd`).
*   **UI Management**: Constructing and sending Discord-specific UI components like Embeds, Buttons, and Modals.
*   **Discord State Management**: Managing Discord-specific state, such as caching server invites to track referrals.
*   **API Communication**: Making authenticated API calls to the Unified API.
*   **API Response Translation**: Translating API responses into user-facing messages and UI updates.

### Responsibilities of the Unified API (Moves to the API)

*   **Business Logic**: All complex logic, such as filtering campaigns based on channel context, validating user eligibility, and processing onboarding data.
*   **Data Persistence**: All communication with the Strapi CMS for reading and writing data.
*   **Session Management**: Managing the state of multi-step processes like user onboarding.
*   **Role Assignment Logic**: Determining which roles a user should receive and instructing the bot to assign them.
*   **Analytics Tracking**: Logging all significant events and user interactions for business intelligence.

## 4. Refactoring Plan by Feature

### 4.1. Campaign Onboarding (`/join`)

*   **Current State**: The `JoinCommand` fetches all campaigns and performs filtering logic within the bot. The `OnboardingHandler` is a complex state machine that manages the entire multi-step form, including validation and data submission.
*   **Proposed Refactoring**:
    1.  The `JoinCommand` will be simplified to call a new API endpoint: `GET /api/v1/operations/discord/available-campaigns?channel_id={id}`. The API will return the precise list of campaigns to be displayed.
    2.  The `OnboardingHandler` will become stateless. When a user clicks "Start Onboarding," the bot will call `POST /api/v1/workflows/onboarding/start`. The API response will contain the exact questions and fields required for the modal.
    3.  When the user submits the modal, the bot will call `POST /api/v1/workflows/onboarding/submit-responses` with the user's answers. The API will handle all validation, data storage, and the logic for assigning roles. The bot will simply display the final success or error message returned by the API.

### 4.2. Access Request (`/request-access`)

*   **Current State**: The `RequestAccessHandler` contains logic to validate user input, directly assign Discord roles, and store the collected data.
*   **Proposed Refactoring**:
    1.  The handler will be simplified to only show the initial modal.
    2.  Upon modal submission, the bot will call a new endpoint: `POST /api/v1/workflows/access-request/submit`.
    3.  The API will perform all validation, store the data, and if successful, will include in its response the specific role ID that the bot should assign to the user. The bot will then execute the role assignment.

### 4.3. Referral System

*   **Current State**: The `OnboardingHandler` and `ReferralHandler` contain complex logic to compare invite caches, detect which invite was used, and validate referral codes against the old API.
*   **Proposed Refactoring**:
    1.  The bot will continue to be responsible for caching invites and detecting which invite was used when a new member joins, as this is a Discord-specific task.
    2.  Once the invite code is identified, the bot will call a new API endpoint: `POST /api/v1/integrations/discord/member-join`, providing the user's details and the invite code.
    3.  The API will contain all the business logic to check if it's a managed invite, associate the user with the correct campaign, track the conversion, and determine the appropriate next steps (e.g., sending a specific welcome message).

## 5. Refactoring the `services` Layer

The existing `services` directory in the bot will be completely overhauled.

*   The current services (`CampaignService.js`, `AnalyticsService.js`, `CampaignPublisher.js`) will be removed.
*   A new, single service, `ApiService.js`, will be created. This service will act as a simple and clean client for the `virion-labs-business-logic-api`. It will contain methods that map directly to the API endpoints required by the bot (e.g., `getAvailableCampaigns`, `startOnboarding`, `submitOnboardingResponses`).

## 6. Phased Implementation Plan

1.  **Phase 1: API Client Implementation**:
    *   Create the new `ApiService.js` within the bot's `services` directory.
    *   Implement the methods required for all features, ensuring they correctly handle authentication and data transformation.
2.  **Phase 2: Refactor Campaign Onboarding**:
    *   Update the `/join` command and `OnboardingHandler` to use the new `ApiService`.
    *   Remove all business logic from these components.
3.  **Phase 3: Refactor Access Request**:
    *   Update the `/request-access` command and `RequestAccessHandler` to use the new `ApiService`.
4.  **Phase 4: Refactor Referral System**:
    *   Update the `guildMemberAdd` event handler in `BotClient.js` or `OnboardingHandler.js` to call the new `member-join` API endpoint.
5.  **Phase 5: Cleanup**:
    *   Remove the old service files.
    *   Delete any redundant or now-unused logic from the handlers and commands.
    *   Ensure all direct API calls have been replaced by the `ApiService`.