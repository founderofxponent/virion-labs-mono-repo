# Virion Labs - Manual Testing Guide: Discord Bot Features

This document provides a step-by-step guide for manually testing the features of the Virion Labs Discord Bot.

**Last Updated:** {{CURRENT_DATE}}

---

## Table of Contents
1.  [Automatic Onboarding (Managed Invite)](#1-automatic-onboarding-managed-invite)
2.  [Manual Onboarding (`/join` command)](#2-manual-onboarding-join-command)
3.  [Member Attribution](#3-member-attribution)
4.  [Automatic Role Assignment](#4-automatic-role-assignment)
5.  [Request Access Command (`/request-access`)](#5-request-access-command-request-access)
6.  [API Communication and Event Tracking](#6-api-communication-and-event-tracking)

---

## 1. Automatic Onboarding (Managed Invite)

### 1.1 Objective
Verify that a new user who joins via a managed referral invite is automatically put into the onboarding flow.

### 1.2 Test Steps
1.  Use an influencer account to generate a referral link for an active campaign.
2.  Open the referral link in a browser and click the "Join Discord Server" button.
3.  Accept the invite to join the Discord server with a fresh test user account (not an admin or influencer).
4.  **Expected Result:** Upon joining, the bot should send a welcome message in a public channel (e.g., #general) and send a direct message (DM) to the new user with a "Start Onboarding" button.

---

## 2. Manual Onboarding (`/join` command)

### 2.1 Objective
Ensure a user can manually trigger the onboarding process using a slash command.

### 2.2 Test Steps
1.  As a new user in the Discord server (who has not completed onboarding), go to any channel.
2.  Type `/join` and send the command.
3.  **Expected Result:** The bot should respond with a list of available public campaigns or a prompt to start onboarding for the current channel's campaign if applicable.

---

## 3. Member Attribution

### 3.1 Objective
Confirm that new members are correctly attributed to the influencer and campaign they joined through.

### 3.2 Test Steps
1.  A new user joins and completes onboarding via a specific influencer's referral link.
2.  Log in to the admin dashboard and navigate to the "Analytics" or "Referrals" section.
3.  **Expected Result:** A new referral or conversion event should be recorded and correctly attributed to the campaign and the influencer who owned the referral link.

---

## 4. Automatic Role Assignment

### 4.1 Objective
Verify that a user is automatically assigned the correct Discord role upon successful onboarding.

### 4.2 Test Steps
1.  Ensure a campaign is configured to assign a specific role upon completion.
2.  As a new user, complete the entire onboarding flow (answering all questions in the DM).
3.  **Expected Result:** After the final onboarding step, the bot should assign the designated role to the user in the Discord server. You can check this by viewing the user's roles.

---

## 5. Request Access Command (`/request-access`)

### 5.1 Objective
Test the command for requesting access to private campaigns or channels.

### 5.2 Test Steps
1.  As a user who does not have access to a private campaign, go to the designated "request-access" channel.
2.  Type `/request-access` and send the command.
3.  The bot should prompt you for any required information.
4.  **Expected Result:** After submitting the request, the bot should confirm that the request has been sent to the admins. The corresponding access request should appear in the admin dashboard.

---

## 6. API Communication and Event Tracking

### 6.1 Objective
Verify that the bot correctly communicates with the backend API to track key events.

### 6.2 Test Steps
1.  Perform various actions as a user in Discord: start onboarding, answer a question, complete onboarding.
2.  Check the application logs or the database.
3.  **Expected Result:** For each action, there should be corresponding API calls and data recorded. For example:
    *   An "Onboarding Started" event is logged when a user begins the flow.
    *   Each answer to an onboarding question is saved.
    *   An "Onboarding Completed" event is logged when the user finishes. 