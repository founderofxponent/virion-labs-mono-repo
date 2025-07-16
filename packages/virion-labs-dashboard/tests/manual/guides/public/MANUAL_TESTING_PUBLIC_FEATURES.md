# Virion Labs - Manual Testing Guide: Public & User-Facing Features

This document provides a step-by-step guide for manually testing the public-facing features of the Virion Labs platform, primarily focusing on the user journey from a referral link.

**Last Updated:** {{CURRENT_DATE}}

---

## Table of Contents
1.  [Referral Landing Page](#1-referral-landing-page)
2.  [Click-Tracking and Invite Generation](#2-click-tracking-and-invite-generation)
3.  [User Authentication Flows](#3-user-authentication-flows)

---

## 1. Referral Landing Page

### 1.1 Objective
Verify that the referral landing page renders correctly with the appropriate campaign details.

### 1.2 Test Steps

#### 1.2.1 Valid Referral Link
1.  Obtain a valid and active referral link from an influencer.
2.  Open the link in a web browser (e.g., `http://localhost:3000/r/your-referral-code`).
3.  **Expected Result:** The landing page displays the correct campaign name, branding (logo and colors), welcome message, and any other specific offer details. The influencer's name should also be visible.

#### 1.2.2 Invalid or Expired Link
1.  Try to access a URL with a fake referral code or one that has expired.
2.  **Expected Result:** A user-friendly error page is displayed, indicating that the link is not valid or has expired.

---

## 2. Click-Tracking and Invite Generation

### 2.1 Objective
Ensure that clicks on referral links are tracked and that a unique Discord invite is generated.

### 2.2 Test Steps

#### 2.2.1 Click-Tracking
1.  Access a valid referral landing page.
2.  Log in to the influencer's dashboard who owns the link.
3.  Navigate to their analytics.
4.  **Expected Result:** The click count for the corresponding referral link should have incremented by one.

#### 2.2.2 Discord Invite Generation
1.  On the referral landing page, click the "Join Discord Server" button.
2.  **Expected Result:** You are redirected to a Discord invite link. This link should be a managed invite that allows the bot to track the new user's entry.

---

## 3. User Authentication Flows

### 3.1 Objective
Test standard user authentication flows like password reset and email confirmation.

### 3.2 Test Steps

#### 3.2.1 Password Reset
1.  Go to the login page.
2.  Click the "Forgot Password?" link.
3.  Enter the email address of a registered user (either admin or influencer).
4.  Submit the request.
5.  **Expected Result:** A password reset email is sent. The link in the email should allow the user to set a new password and then log in successfully.

#### 3.2.2 Email Confirmation
1.  This is tested as part of the [Influencer Signup](#1-influencer-signup--onboarding) process.
2.  After a new influencer signs up, they must confirm their email address before they can log in.
3.  **Expected Result:** The confirmation link in the email successfully activates the account. 