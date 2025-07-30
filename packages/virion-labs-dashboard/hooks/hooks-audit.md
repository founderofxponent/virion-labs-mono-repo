# Hooks API Audit & Migration Plan

This document outlines the status of each custom data-fetching hook in the dashboard, identifying whether it points to the modern `business-logic-api` or a legacy data source. It also classifies each legacy hook based on whether it is actively in use.

## Modern Hooks (business-logic-api)

These hooks are correctly implemented and are the standard for all data-fetching.

- `use-analytics.ts`
- `use-bot-campaigns-api.ts`
- `use-campaign-template-complete-api.ts`
- `use-campaign-template-complete.ts`
- `use-clients.ts`
- `use-dashboard-data.ts`
- `use-landing-page-templates-api.ts`
- `use-onboarding-fields-api.ts`
- `use-user-settings.ts`

## Legacy Hooks to be Migrated

These hooks point to a legacy data source but are **actively in use** by the dashboard. Each must be migrated by creating a new hook with an `-api` suffix and updating the components that use it.

- `use-access-requests.ts`
- `use-available-campaigns.ts`
- `use-campaign-landing-pages.ts`
- `use-landing-page-templates.ts`
- `use-referral-links.ts`
- `use-referrals.ts`

## Legacy Hooks to be Deleted

These hooks point to a legacy data source and are **not in use** by any component. They can be safely deleted.

- `use-bot-campaigns.ts`
- `use-onboarding-fields.ts`
- `use-unified-data.ts`