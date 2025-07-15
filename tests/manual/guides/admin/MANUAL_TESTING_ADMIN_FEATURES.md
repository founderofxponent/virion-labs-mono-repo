# Virion Labs - Manual Testing Guide: Admin Features

This document provides a step-by-step guide for manually testing the admin features of the Virion Labs platform.

**Last Updated:** {{CURRENT_DATE}}

---

## Table of Contents
1.  [Admin Login/Authentication](#1-admin-loginauthentication)
2.  [Create a New Campaign](#2-create-a-new-campaign)
3.  [Configure Campaign Details](#3-configure-campaign-details)
4.  [Activate, Pause, and Archive Campaigns](#4-activate-pause-and-archive-campaigns)
5.  [Manage Campaign Templates](#5-manage-campaign-templates)
6.  [View Analytics and Export Data](#6-view-analytics-and-export-data)
7.  [System Health and Debugging](#7-system-health-and-debugging)
8.  [Manage Access Requests](#8-manage-access-requests)

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
2.  Enter the correct admin email and password.
3.  Click the "Login" button.
4.  **Expected Result:** The user is redirected to the admin dashboard.

#### 1.3.2 Failed Login (Incorrect Password)
1.  Navigate to the login page.
2.  Enter the correct admin email and an incorrect password.
3.  Click the "Login" button.
4.  **Expected Result:** An error message is displayed, and the user remains on the login page.

#### 1.3.3 Failed Login (Incorrect Email)
1.  Navigate to the login page.
2.  Enter an incorrect email and any password.
3.  Click the "Login" button.
4.  **Expected Result:** An error message is displayed, and the user remains on the login page.

---

## 2. Create a New Campaign

### 2.1 Objective
Ensure that an admin can create a new campaign using the campaign wizard.

### 2.2 Test Steps
1.  Log in as an admin.
2.  Navigate to the "Bot Campaigns" page from the main dashboard or side navigation.
3.  Click on the "Create Campaign" button.
4.  You should be redirected to the campaign wizard.
5.  Follow the steps in the wizard, filling in the required information. You can use a template or create a campaign from scratch.
6.  On the final step, click "Save" or "Create Campaign".
7.  **Expected Result:** A success message is displayed, and the new campaign appears in the list of bot campaigns.

---

## 3. Configure Campaign Details

### 3.1 Objective
Verify that an admin can edit and update the configuration of an existing campaign.

### 3.2 Test Steps
1.  Log in as an admin and navigate to the "Bot Campaigns" page.
2.  From the list of campaigns, click the "Edit" button or link for a specific campaign.
3.  You will be taken to the campaign wizard in "edit" mode.
4.  Navigate through the tabs and make changes to various fields, such as:
    *   Campaign name or description.
    *   Bot identity (name, personality).
    *   Onboarding flow questions.
    *   Access and moderation settings.
5.  Click "Save" to apply the changes.
6.  **Expected Result:** A success message is displayed. When you view the campaign details again, the changes you made should be reflected.

---

## 4. Activate, Pause, and Archive Campaigns

### 4.1 Objective
Confirm that an admin can change the status of a campaign (e.g., from active to paused).

### 4.2 Test Steps
1.  Log in as an admin and navigate to the "Bot Campaigns" page.
2.  In the list of campaigns, locate the status toggle or menu for a campaign.
3.  **To Pause:** If the campaign is active, use the control to change its status to "Paused".
4.  **To Activate:** If the campaign is paused, use the control to change its status to "Active".
5.  **To Archive:** Look for an "Archive" option in a dropdown menu or next to the campaign. Click it.
6.  **Expected Result:** The campaign's status is updated immediately in the UI. If you have a separate "Archived" tab or filter, the archived campaign should appear there. 

---

## 5. Manage Campaign Templates

### 5.1 Objective
Ensure that an admin can create, edit, and manage campaign onboarding and landing page templates.

### 5.2 Test Steps

#### 5.2.1 Create a New Template
1.  Log in as an admin.
2.  Navigate to a section for managing templates (e.g., "Settings" > "Templates" or a dedicated "Templates" page).
3.  Click "Create New Template".
4.  Fill in the template details, such as name, description, and the onboarding questions or landing page layout.
5.  Save the template.
6.  **Expected Result:** The new template is created and appears in the list of available templates.

#### 5.2.2 Edit an Existing Template
1.  Navigate to the template management page.
2.  Select a template to edit.
3.  Make changes to the template's fields or layout.
4.  Save the changes.
5.  **Expected Result:** The template is updated. When creating a new campaign, the changes to the template should be reflected.

---

## 6. View Analytics and Export Data

### 6.1 Objective
Verify that the admin can view platform-wide analytics and export data correctly.

### 6.2 Test Steps

#### 6.2.1 View Analytics Dashboard
1.  Log in as an admin.
2.  Navigate to the "Analytics" page.
3.  **Expected Result:** The dashboard displays various metrics, such as total clients, campaigns, onboarding responses, and performance charts. The data should appear accurate and up-to-date.

#### 6.2.2 Export Data
1.  On the "Analytics" page or a dedicated "Export" page, find the export options.
2.  Select the desired format (e.g., CSV, JSON) and data range.
3.  Initiate the export.
4.  **Expected Result:** A file is downloaded in the selected format containing the correct analytics data. Open the file to verify its contents.

---

## 7. System Health and Debugging

### 7.1 Objective
Confirm that the admin can check the system's health and access debugging tools.

### 7.2 Test Steps
1.  Log in as an admin.
2.  Find a "System Health," "Status," or "Debug" page, possibly under "Settings" or in the footer.
3.  **Expected Result:** The page should display the status of various services (e.g., Database, API, Discord Bot). If there are debugging tools, they should be accessible and provide relevant information.

---

## 8. Manage Access Requests

### 8.1 Objective
Ensure that the admin can view and act upon access requests from influencers.

### 8.2 Test Steps
1.  Log in as an admin.
2.  Navigate to the "Access Requests" page.
3.  **Expected Result:** A list of pending access requests is displayed, showing the influencer's name and the campaign they are requesting access to.
4.  For a pending request, click "Approve" or "Deny".
5.  **Expected Result:** The request's status is updated. If approved, the influencer should now have access to the campaign. If denied, the request should be moved to a "Denied" or "Archived" list. 