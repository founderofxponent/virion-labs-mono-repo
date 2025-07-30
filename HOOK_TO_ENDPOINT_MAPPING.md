# Comprehensive Hook-to-Endpoint Mapping and Discrepancy Report

## 1. Summary

This document provides a comprehensive mapping of all React hooks in the `virion-labs-dashboard` to all endpoints in the `business-logic-api`. It is organized into sections to clearly delineate the status of each component.

## 2. Connected Hooks and Endpoints

| Hook File | Endpoint Called | Notes |
|---|---|---|
| `use-access-requests-api.ts` | `GET /api/v1/admin/access-requests` | |
| | `PUT /api/v1/admin/access-requests/{id}/approve` | |
| | `PUT /api/v1/admin/access-requests/{id}/deny` | |
| `use-available-campaigns-api.ts` | `GET /api/v1/operations/campaign/list?influencer_id={id}` | |
| `use-bot-campaigns-api.ts` | `GET /api/v1/operations/campaign/list` | |
| | `PUT /api/v1/operations/campaign/update/{id}` | |
| | `GET /api/v1/operations/campaign/get/{id}` | |
| `use-clients.ts` | `GET /api/v1/operations/client/list` | |
| | `POST /api/v1/operations/client/create` | |
| | `PUT /api/v1/operations/client/update/{id}` | |
| | `GET /api/v1/operations/client/get/{id}` | |
| `use-dashboard-data.ts` | `GET /api/v1/operations/client/list` | |
| | `GET /api/users/me/settings` | |
| `use-campaign-landing-pages-api.ts` | `GET /api/v1/operations/campaign/{id}/landing-pages` | |
| | `POST /api/v1/operations/campaign/{id}/landing-pages` | |
| | `PUT /api/v1/operations/campaign/landing-pages/{id}` | |
| | `DELETE /api/v1/operations/campaign/landing-pages/{id}` | |
| `use-referral-links-api.ts` | `GET /api/v1/influencer/referral-links` | |
| | `POST /api/v1/influencer/referral-links` | |
| | `PUT /api/v1/influencer/referral-links/{id}` | |
| | `DELETE /api/v1/influencer/referral-links/{id}` | |
| `use-referrals-api.ts` | `GET /api/v1/influencer/referrals` | |
| | `PUT /api/v1/influencer/referrals/{id}` | |
| | `DELETE /api/v1/influencer/referrals/{id}` | |
| `use-user-settings.ts` | `GET /api/users/me/settings` | |
| | `PATCH /api/users/me/settings` | |

## 3. Hooks Calling Non-Existent Endpoints

| Hook File | Endpoint Called | Notes |
|---|---|---|
| `use-analytics.ts` | `/api/v1/operations/analytics/*` | Endpoint group does not exist. |
| `use-bot-campaigns-api.ts` | `POST /api/v1/operations/campaign/create` | |
| | `DELETE /api/v1/operations/campaign/delete/{id}` | |
| | `PATCH /api/v1/operations/campaign/unarchive/{id}` | |
| | `PATCH /api/v1/operations/campaign/archive/{id}` | Exists as `POST /client/archive/{id}`. |
| `use-campaign-template-complete-api.ts` | `/api/v1/operations/campaign-template/get/{id}` | |
| `use-campaign-template-complete.ts` | `/api/v1/operations/campaign-template/get/{id}` | |
| `use-clients.ts` | `DELETE /api/v1/operations/client/delete/{id}` | |
| `use-landing-page-templates-api.ts` | `/api/v1/operations/landing-page-template/*` | Endpoint group does not exist. |
| `use-onboarding-fields-api.ts` | `/api/v1/operations/campaign/onboarding-fields/*` | Endpoint group does not exist. |
| `useReferralLinks-api.ts` | `/api/v1/operations/analytics/influencer-metrics` | |

## 4. Hooks Calling Legacy Next.js API

| Hook File | Endpoint Called |
|---|---|
| `use-bot-campaigns.ts` | `/api/bot-campaigns` |
| `use-onboarding-fields.ts` | `/api/campaign-onboarding-fields` |

## 5. Other Unconnected Hooks

| Hook File | Reason for No Connection |
|---|---|
| `use-mobile.tsx` | UI hook, no API calls. |
| `use-toast.ts` | UI hook, no API calls. |

## 6. Unused API Endpoints

| Endpoint | Method | Router File |
|---|---|---|
| `/api/auth/login/{provider}` | `GET` | `auth.py` |
| `/api/auth/connect/{provider}/callback` | `GET` | `auth.py` |
| `/api/auth/token` | `POST` | `auth.py` |
| `/api/auth/me` | `GET` | `auth.py` |
| `/api/auth/register` | `POST` | `auth.py` |
| `/status/health` | `GET` | `health.py` |
| `/api/v1/influencer/campaigns/{campaign_id}/referral-links` | `POST` | `influencer.py` |
| `/api/v1/integrations/discord/campaigns/{guild_id}` | `GET` | `integrations.py` |
| `/api/v1/integrations/discord/request-access` | `POST` | `integrations.py` |
| `/api/v1/integrations/discord/user/{user_id}/has-verified-role/{guild_id}` | `GET` | `integrations.py` |
| `/api/v1/integrations/discord/onboarding/start` | `POST` | `integrations.py` |
| `/api/v1/integrations/discord/onboarding/submit` | `POST` | `integrations.py` |
| `/api/v1/operations/client/archive/{client_id}` | `POST` | `operations.py` |
| `/api/v1/operations/campaign/update-stats/{campaign_id}` | `PUT` | `operations.py` |
| `/api/v1/operations/campaign/available` | `GET` | `operations.py` |