# Dashboard Dependencies on `user-profile`

This document outlines the pages and features within the `virion-labs-dashboard` that are dependent on the `user-profile` content type, specifically the `role` attribute.

## Core Functionality

-   **Authentication & User Session (`components/auth-provider.tsx`)**: The entire user session and the `profile` object used throughout the dashboard are created based on data that currently originates from the `user-profile`. This is the most critical dependency.
-   **Role-Based Access Control (RBAC)**:
    -   **Protected Routes (`components/protected-route.tsx`)**: This component wraps pages and restricts access based on the `profile.role`.
    -   **Sidebar Navigation (`components/sidebar.tsx`)**: The navigation links are dynamically rendered based on the user's role (`admin`, `client`, or `influencer`).

## Main Pages & Views

-   **Main Dashboard (`components/unified-dashboard.tsx` & `hooks/use-unified-data.ts`)**: The content of this page—including stats, lists, and actions—is almost entirely dictated by the user's role.
-   **Analytics Page (`components/analytics-page.tsx`)**: Data and visualizations are filtered and presented differently based on the user's role.
-   **Bot Campaigns Page (`components/bot-campaigns-page.tsx`)**: Features like data export are restricted to `admin` users.
-   **Referrals Page (`components/referrals-page.tsx`)**: Similar to the campaigns page, certain actions are only available to admins.
-   **Settings Page (`components/settings-page.tsx`)**: Access to certain settings is restricted based on the user's role.

In summary, nearly every significant part of the dashboard relies on `profile.role` to control what the user can see and do.