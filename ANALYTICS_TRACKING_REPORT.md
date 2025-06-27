# Virion Labs Analytics & Tracking Report

This document provides a comprehensive overview of the analytics and data tracking mechanisms for both the Admin and Influencer dashboards.

## 1. Overview of the Tracking Mechanism

The analytics system is built around a set of core tables in the Supabase database. These tables log user actions and campaign performance, which are then aggregated and displayed in the dashboards.

### Core Database Tables:

-   `referral_links`: The central table for influencer marketing. Each link has its own `clicks` and `conversions` count.
-   `referrals`: Records each individual user who has successfully signed up or "converted" through a referral link.
-   `campaign_onboarding_starts`: Explicitly logs every time a user begins an onboarding process for a campaign. This is the primary source for tracking the top of the funnel.
-   `campaign_onboarding_completions`: Logs every time a user successfully completes all steps of an onboarding process.
-   `discord_referral_interactions`: A detailed event log of almost every interaction a user has with the Discord bot (messages, commands, etc.).

### Data Consistency Model:

The system uses a robust "eventual consistency" model for some metrics, particularly for referral conversions. Instead of updating the total conversion count on the `referral_links` table in real-time with every single conversion, the system first logs the event in the `referrals` table. A background process, triggered by visiting the "My Links" page, then synchronizes these records to update the total count. This ensures the user-facing conversion flow remains fast and responsive, while the analytics data becomes consistent shortly after.

---

## 2. Admin Dashboard Analytics

The Admin Dashboard provides a high-level, aggregated view of platform-wide performance. The data is sourced from two main SQL functions: `get_comprehensive_analytics_summary` and `get_daily_activity_metrics`.

| Metric | How It's Calculated | Database Source(s) | Step-by-Step Tracking Flow |
| :--- | :--- | :--- | :--- |
| **Users Started** | Counts the number of unique `discord_user_id`s. | `campaign_onboarding_starts` | 1. A user clicks a "Start" button in a Discord campaign modal.<br/>2. An entry is created in `campaign_onboarding_starts` linking the user to the campaign.<br/>3. The dashboard function counts these unique users. |
| **Users Completed** | Counts the number of unique `discord_user_id`s. | `campaign_onboarding_completions` | 1. A user successfully submits the final step of the onboarding modal.<br/>2. An entry is created in `campaign_onboarding_completions`.<br/>3. The dashboard function counts these unique users. |
| **Completion Rate** | `(Total Users Completed / Total Users Started) * 100` | `campaign_onboarding_starts`, `campaign_onboarding_completions` | This is a direct comparison between the number of unique users who started the process and the number of those who finished it. |
| **Total Clicks** | A `SUM` of the `clicks` column for all links. | `referral_links` | 1. A user clicks an influencer's referral link.<br/>2. The backend API increments the `clicks` column on that specific link's record. |
| **Total Conversions** | A `SUM` of the `conversions` column for all links. | `referral_links`, `referrals` | 1. A user signs up after clicking a referral link.<br/>2. An entry is created in the `referrals` table.<br/>3. A sync process counts these entries and updates the `conversions` column on the `referral_links` table. |
| **Click-Through Rate**| `(Total Conversions / Total Clicks) * 100` | `referral_links` | A standard marketing metric comparing total link clicks to total resulting conversions. |
| **Total Campaigns** | A `COUNT` of all campaigns. | `discord_guild_campaigns` | A simple count of all campaign records created in the system. |
| **Total Clients** | A `COUNT` of all unique clients. | `clients`, `discord_guild_campaigns` | A count of all clients who have one or more campaigns. |

---

## 3. Influencer Dashboard Analytics ("My Links" Page)

The Influencer Dashboard provides a granular, filtered view of performance, showing data relevant only to the logged-in influencer.

| Metric | How It's Calculated | Database Source(s) | Step-by-Step Tracking Flow |
| :--- | :--- | :--- | :--- |
| **Total Links** | A `COUNT` of all links created by the influencer. | `referral_links` | A simple count of records in the `referral_links` table that belong to the current influencer. |
| **Total Clicks** | A client-side `SUM` of clicks from all the influencer's links. | `referral_links` | The dashboard fetches all of the influencer's links and adds up the `clicks` value from each one. The tracking flow is identical to the Admin Dashboard. |
| **Total Conversions** | A client-side `SUM` of conversions from all the influencer's links. | `referral_links` | Similar to clicks, the dashboard sums the `conversions` value from each of the influencer's links. The tracking and sync flow is identical to the Admin Dashboard. |
| **Avg. Conversion Rate** | `(Total Conversions / Total Clicks) * 100` | `referral_links` | This is calculated on the client-side using the influencer's total clicks and conversions. |
| **Individual Link Stats** | Clicks, Conversions, and Rate for each specific link. | `referral_links` | These values are read directly from the columns (`clicks`, `conversions`, `conversion_rate`) of each specific `referral_links` record. |

---

## 4. Relationship Between Dashboards

The Admin and Influencer dashboards are two different views of the same core data, creating a direct and symbiotic relationship.

### How They Relate:

-   **Filtered vs. Aggregated**: The Influencer Dashboard shows a **filtered** view of the data (e.g., "my clicks"). The Admin Dashboard shows an **aggregated** view of that same data (e.g., "all clicks from everyone").
-   **Direct Impact**: An influencer's performance directly impacts the admin's view. If an influencer's new video goes viral and their referral link gets 10,000 clicks and 500 conversions, the `total_clicks` and `total_conversions` on the admin dashboard will increase by exactly those amounts.
-   **Shared Funnel**: The user journey often starts with an influencer. A user clicks an influencer's link, which drives a "Click". They then start the Discord onboarding, which drives a "User Started". They finish, which drives a "User Completed" and a "Conversion". This single user journey contributes metrics to both dashboards simultaneously.

### How They Affect Each Other:

-   An admin can pause or delete a campaign from their dashboard. If an influencer's link is associated with that campaign, it may stop working or lose its context, directly impacting the influencer's ability to earn and their personal dashboard's metrics.
-   An admin, seeing poor overall conversion rates, might use their dashboard to identify which campaigns or influencers are underperforming. Conversely, seeing a high-performing influencer might lead an admin to invest more in that relationship.

## 5. Identified Issues & Recommendations

The following issues were identified during the audit of the analytics system and **have been confirmed with direct database queries**.

-   **CRITICAL: Stale & Inaccurate Conversion Data**: The `conversions` count in the `referral_links` table is not correctly synchronized with the `referrals` table.
    -   **Verification Finding**: A sample link showed **1 conversion** in the `referral_links` table, but a direct query of the `referrals` table revealed **2 actual conversions**. This is causing under-reporting.
    -   **Recommendation**: The `refresh-counts` API endpoint and its associated logic must be fixed to ensure it correctly and reliably syncs the total number of records from `referrals` to the `referral_links` table.
-   **CRITICAL: Stale & Inaccurate Click Data**: The `clicks` count in `referral_links` is not reliable.
    -   **Verification Finding**: A sample link showed **9 clicks** in the `referral_links` table, but a direct query of the `referral_analytics` table showed **10 actual clicks**.
    -   **Recommendation**: Implement a `referral_clicks` table, similar to the `referrals` table, to log every individual click event. Create a corresponding API endpoint and background job to periodically sync these records with the `clicks` column in the `referral_links` table. This will ensure click data is as accurate and reliable as conversion data.
-   **Incomplete "Recent" Analytics**: The influencer dashboard is missing time-based analytics (e.g., performance over the last 7 or 30 days), despite `TODO` comments in the code indicating this was planned.
    -   **Recommendation**: Complete the implementation of the "recent" analytics feature. This involves querying the `referral_analytics` table to get time-based data and adding new UI components to the influencer dashboard to display these trends. This will provide influencers with more actionable, real-time feedback on their performance.
-   **No Fail-Safe for Count Refresh**: The system does not alert the user if the background refresh of conversion counts fails, which could lead to them seeing stale data without realizing it.
    -   **Recommendation**: Add error handling to the `useReferralLinks` hook. If the `/api/referral/refresh-counts` endpoint fails, display a toast notification or other UI indicator to inform the user that the data may not be up-to-date. This will improve transparency and prevent user confusion.
