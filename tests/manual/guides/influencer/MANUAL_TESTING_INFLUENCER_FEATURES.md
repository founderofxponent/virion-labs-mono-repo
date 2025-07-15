# Virion Labs - Manual Testing Guide: Influencer Features

This document provides a step-by-step guide for manually testing the influencer-specific features of the Virion Labs platform.

**Last Updated:** {{CURRENT_DATE}}

---

## Table of Contents
1.  [Influencer Signup & Onboarding](#1-influencer-signup--onboarding)
2.  [Influencer Login/Authentication](#2-influencer-loginauthentication)
3.  [Manage Profile and Settings](#3-manage-profile-and-settings)
4.  [Browse and View Campaigns](#4-browse-and-view-campaigns)
5.  [Request Access to a Campaign](#5-request-access-to-a-campaign)
6.  [Create and Manage Referral Links](#6-create-and-manage-referral-links)
7.  [View Personal Analytics](#7-view-personal-analytics)

---

## 1. Influencer Signup & Onboarding

### 1.1 Objective
Verify that a new user can sign up as an influencer and complete the initial onboarding process.

### 1.2 Test Steps

#### 1.2.1 Successful Signup
1.  Navigate to the signup page: [http://localhost:3000/signup](http://localhost:3000/signup)
2.  Fill in the registration form with a unique email, a password, and your full name.
3.  Submit the form.
4.  **Expected Result:** A confirmation email is sent to the provided address. You should see a page instructing you to check your email to confirm your account.

#### 1.2.2 Email Confirmation
1.  Open the confirmation email and click the confirmation link.
2.  **Expected Result:** You are redirected to the login page or directly to the dashboard with a success message.

#### 1.2.3 Onboarding
1.  After the first login, you may be prompted to complete an onboarding process.
2.  Fill in any required profile information (e.g., social media links, areas of interest).
3.  **Expected Result:** The onboarding information is saved, and you are taken to the main influencer dashboard.

---

## 2. Influencer Login/Authentication

### 2.1 Objective
Ensure that a registered influencer can log in successfully.

### 2.2 Test Steps
1.  Navigate to the login page: [http://localhost:3000/login](http://localhost:3000/login)
2.  Enter the email and password of a registered influencer account.
3.  Click "Login".
4.  **Expected Result:** You are redirected to the influencer dashboard.

---

## 3. Manage Profile and Settings

### 3.1 Objective
Verify that an influencer can update their profile information and settings.

### 3.2 Test Steps
1.  Log in as an influencer.
2.  Navigate to the "Settings" or "Profile" page.
3.  Update fields such as your name, bio, or connected social media accounts.
4.  Save the changes.
5.  **Expected Result:** A success message is shown. When you reload the page, the new information is displayed.

---

## 4. Browse and View Campaigns

### 4.1 Objective
Confirm that an influencer can see the list of available campaigns.

### 4.2 Test Steps
1.  Log in as an influencer.
2.  Navigate to the "Campaigns" or "Available Campaigns" page.
3.  **Expected Result:** A list or grid of campaigns published by the admin is displayed, showing details like the campaign name, description, and client.

---

## 5. Request Access to a Campaign

### 5.1 Objective
Ensure an influencer can request access to a private campaign.

### 5.2 Test Steps
1.  In the list of available campaigns, find one that is marked as "Private" or requires access.
2.  Click a "Request Access" button.
3.  You may need to provide a short message for the admin.
4.  Submit the request.
5.  **Expected Result:** A confirmation message is displayed, indicating that the request has been sent to the admin for approval. The campaign status should now show as "Pending Approval."

---

## 6. Create and Manage Referral Links

### 6.1 Objective
Verify that an influencer can create and manage their referral links for approved campaigns.

### 6.2 Test Steps

#### 6.2.1 Create a Referral Link
1.  Navigate to a campaign for which you have been granted access.
2.  Find and click the "Create Referral Link" button.
3.  Fill in the form with a title for your link and any other required details.
4.  Save the link.
5.  **Expected Result:** A unique referral link is generated and displayed.

#### 6.2.2 Manage Links
1.  Go to a "My Links" or "Referrals" page.
2.  **Expected Result:** You should see a list of all your created referral links, along with options to copy, edit, or view stats for each link.

---

## 7. View Personal Analytics

### 7.1 Objective
Confirm that an influencer can view their personal analytics dashboard.

### 7.2 Test Steps
1.  Log in as an influencer.
2.  Navigate to the "Analytics" or "Dashboard" page.
3.  **Expected Result:** The dashboard displays performance metrics for your referral links, including clicks, conversions, and earnings. The data should be specific to your account. 