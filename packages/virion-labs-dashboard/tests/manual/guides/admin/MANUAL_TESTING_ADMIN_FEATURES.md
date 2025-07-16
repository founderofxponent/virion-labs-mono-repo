# Virion Labs - Manual Testing Guide: Admin Features

This document provides a step-by-step guide for manually testing the admin features of the Virion Labs platform.

**Last Updated:** 2025-07-15

---

## Table of Contents
1.  [Admin Login/Authentication](#1-admin-loginauthentication)
2.  [Create a New Campaign](#2-create-a-new-campaign)
3.  [Configure Campaign Details](#3-configure-campaign-details)
4.  [Activate, Pause, and Archive Campaigns](#4-activate-pause-and-archive-campaigns)
5.  [View Analytics and Export Data](#5-view-analytics-and-export-data)
6.  [System Health and Debugging](#6-system-health-and-debugging)
7.  [Manage Access Requests](#7-manage-access-requests)

---

## 1. Admin Login/Authentication

### 1.1 Objective
Verify that an admin user can successfully log in and that unauthorized users are denied access.

### 1.2 Credentials
-   **Email:** `vercilliusjrmila+johnadmin@gmail.com`
-   **Password:** `johnadmin`

### 1.3 Test Steps

#### 1.3.1 Successful Login
1.  Navigate to the login page: [http://localhost:3000/login](http://localhost:3000/login)
2.  Enter the email `vercilliusjrmila+johnadmin@gmail.com` and password `johnadmin`.
3.  Click the "Sign in" button.
4.  **Expected Result:** The user is redirected to the admin dashboard at `http://localhost:3000/`.

#### 1.3.2 Failed Login (Incorrect Password)
1.  Navigate to the login page.
2.  Enter the email `vercilliusjrmila+johnadmin@gmail.com` and the password `wrongpassword`.
3.  Click the "Sign in" button.
4.  **Expected Result:** An error message "Invalid email or password. Please check your credentials and try again." is displayed, and the user remains on the login page.

#### 1.3.3 Failed Login (Incorrect Email)
1.  Navigate to the login page.
2.  Enter the email `wrong@email.com` and the password `johnadmin`.
3.  Click the "Sign in" button.
4.  **Expected Result:** An error message "Invalid email or password. Please check your credentials and try again." is displayed, and the user remains on the login page.

---

## 2. Create a New Campaign

### 2.1 Objective
Ensure that an admin can create a new campaign using the campaign wizard with detailed and specific values.

### 2.2 Test Steps
1.  Log in as an admin.
2.  Navigate to the "Bot Campaigns" page from the side navigation.
3.  Click on the "Create Campaign" button.
4.  You will be redirected to the campaign wizard. Fill out each tab with the following details:

    ---
    
    #### **Tab 1: Vitals**
    -   **Campaign Name:** `Summer Festival Giveaway - 2024`
    -   **Client:** `Test Client` (Select from the dropdown.)
    -   **Campaign Template:** `Custom`
    -   **Description:** `A campaign to promote the Summer Festival event. Influencers will invite their followers to join a special Discord server for a chance to win exclusive in-game items.`

    ---

    #### **Tab 2: Placement & Schedule**
    -   **Discord Server ID (Guild ID):** `111222333444555666`
    -   **Primary Channel ID:** `777888999000111222`
    -   **Campaign Start Date:** `2025-07-15`
    -   **Campaign End Date:** `2025-08-15`

    ---

    #### **Tab 3: Bot Identity**
    -   **Bot Name:** `SummerBot`
    -   **Bot Logo URL:** `https://example.com/summer-logo.png`
    -   **Brand Color:** `#FFD700`
    -   **Bot Personality:** `Enthusiastic`
    -   **Bot Response Style:** `Friendly`

    ---

    #### **Tab 4: Onboarding Flow**
    -   **Welcome Message:** `Welcome to the Summer Festival Giveaway! I'm SummerBot, and I'll help you get set up. Let's get started!`
    -   **Onboarding Questions:**
        1.  **Question 1:**
            -   **Label:** `What is your primary gaming platform?`
            -   **Field Type:** `Text`
            -   **Required:** Yes
        2.  **Question 2:**
            -   **Label:** `How many hours a week do you typically play games?`
            -   **Field Type:** `Text`
            -   **Required:** No
        3.  **Question 3:**
            -   **Label:** `Which of our games have you played before?`
            -   **Field Type:** `Text`
            -   **Required:** Yes

    ---

    #### **Tab 5: Access & Moderation**
    -   **Auto Role Assignment:** Enabled
        -   **Target Role ID:** `987654321098765432`
    -   **Enable Moderation:** Enabled
        -   **Interactions per User (per hour):** `10`

    ---

    #### **Tab 6: Advanced**
    -   **Enable Referral System:** Enabled
        -   **Note:** Enabling the referral system will automatically apply the landing page configuration associated with the selected campaign template. There are no additional fields to configure here.
    -   **Webhook URL:** `https://your-test-api.com/webhook/summer-festival`

5.  Click the "Save Campaign" button.
6.  **Expected Result:** The user is redirected to the "Bot Campaigns" page, and the new campaign, "Summer Festival Giveaway - 2024", is visible at the top of the campaign list with an "Active" status.

---

## 3. Configure Campaign Details

### 3.1 Objective
Ensure that an admin can successfully edit an existing campaign's details.

### 3.2 Test Steps
1.  On the "Bot Campaigns" page, locate the "Summer Festival Giveaway - 2024" campaign.
2.  Click the three-dots menu on the right side of the campaign row and select "Edit Campaign".
3.  In the "Vitals" tab, change the **Description** to: `This is an updated description for the Summer Festival Giveaway campaign. We've added new prizes and extended the end date!`
4.  Navigate to the "Advanced" tab and click the "Save Campaign" button.
5.  **Expected Result:** A success message "Campaign updated successfully!" appears, and the changes are saved.

---

## 4. Activate, Pause, and Archive Campaigns

### 4.1 Objective
Verify that an admin can change the status of a campaign.

### 4.2 Test Steps
1.  On the "Bot Campaigns" page, locate the "Summer Festival Giveaway - 2024" campaign.
2.  Click the three-dots menu on the right side of the campaign row.

#### 4.2.1 Pause Campaign
1.  Select "Pause" from the dropdown menu.
2.  **Expected Result:** The campaign's status changes to "Paused".

#### 4.2.2 Activate Campaign
1.  Click the three-dots menu again and select "Resume".
2.  **Expected Result:** The campaign's status changes to "Active".

#### 4.2.3 Archive Campaign
1.  Click the three-dots menu and select "Archive".
2.  A confirmation dialog will appear. Click "OK".
3.  **Expected Result:** The campaign is removed from the default list view.

---

## 5. View Analytics and Export Data

### 5.1 Objective
Verify that the admin can view analytics and export data.

### 5.2 Test Steps
1. Navigate to the "Analytics" page.
2. **Expected Result:** The dashboard displays key metrics. You should see at least one onboarding response from your previous test activities.
3. Find the "Export Data" section, select "CSV", and choose "All Time".
4. Click "Export".
5. **Expected Result:** A file named `analytics-export-[date].csv` is downloaded. Open it and verify it contains the test data you generated.

---

## 6. Verify Landing Page Updates

### 6.1 Objective
Ensure that changing a campaign's template correctly updates the public-facing landing page using existing assets.

### 6.2 Test Steps

#### 6.2.1 Initial State Verification
1.  Navigate to **Bot Campaigns**.
2.  Find the "Summer Festival Giveaway - 2024" campaign and click the three-dots menu.
3.  Select **Edit Campaign**.
4.  In the **Vitals** tab, ensure the **Campaign Template** is set to `Custom`.
5.  Navigate to the **Advanced** tab.
6.  **Expected Result:** The "Landing Page Configuration" section is not visible, as the "Custom" template has no associated landing page.
7.  Save the campaign and return to the **Bot Campaigns** list.
8.  Select **Preview Landing Page**.
9.  **Expected Result:** A blank landing page is displayed, or a page with a default "Custom" title.

#### 6.2.2 Update and Re-verify
1.  From the **Bot Campaigns** list, edit the "Summer Festival Giveaway - 2024" campaign again.
2.  In the **Vitals** tab, change the **Campaign Template** to `Product Promotion`.
3.  Navigate to the **Advanced** tab and wait for the "Landing Page Configuration" section to load.
4.  **Expected Result:** The "Landing Page Configuration" section is now visible, and the "Nike Sneaker Drop" template is automatically selected.
5.  Save the campaign.
6.  Return to the **Bot Campaigns** list, find the campaign again, and select **Preview Landing Page**.
7.  **Expected Result:** The landing page now displays the title "Early Access to Nike Zoom Collection".

---

## 7. System Health and Debugging

### 7.1 Objective
Confirm the admin can check system health.

### 7.2 Test Steps
1.  Go to "Settings" > "System Health".
2.  **Expected Result:** The page shows the status of all services:
    -   **Database:** `Connected`
    -   **API:** `OK`
    -   **Discord Bot:** `Running`

---

## 7. Manage Access Requests

### 7.1 Objective
Ensure the admin can approve or deny access requests.

### 7.2 Test Steps
1.  **Prerequisite:** Using a separate (non-admin) account, navigate to a campaign landing page that requires access approval and submit a request. Use the `Summer Festival Giveaway - 2024` campaign for this.
2.  Log in as the admin.
3.  Go to the "Access Requests" page.
4.  **Expected Result:** You see a pending request from the non-admin user for the `Summer Festival Giveaway - 2024` campaign.
5.  Click "Approve" for the request.
6.  **Expected Result:** The request status changes to "Approved". The non-admin user should now have access.
7.  If another request is pending, click "Deny".
8.  **Expected Result:** The request status changes to "Denied". 