# API Operation ID Standardization Plan

## Overview
This document outlines the standardization of all API endpoints to follow a consistent `category.action` naming convention for operation_id parameters. Each router has one category followed by descriptive actions.

## Naming Convention
- **Pattern**: `category.action`
- **Rule**: Each router has exactly one category
- **Action naming**: Descriptive verbs that clearly indicate the operation purpose

---

## **Admin Router** (`packages/api/routers/admin.py`) - Category: `admin`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| admin.list_access_requests | `/api/admin/access-requests` | GET | `admin.list_access_requests` | `List[AccessRequest]` ✓ |
| admin.handle_access_request | `/api/admin/access-requests` | POST | `admin.handle_access_request` | `AccessRequest` ✓ |
| admin.get_all_users | `/api/admin/users` | GET | `admin.get_all_users` | `AdminUserListResponse` ✓ |

## **Clients Router** (`packages/api/routers/clients.py`) - Category: `clients`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| clients.list | `/api/clients/` | GET | `clients.list` | `List[Client]` ✓ |
| clients.create | `/api/clients/` | POST | `clients.create` | `Client` ✓ |
| clients.get | `/api/clients/{client_id}` | GET | `clients.get` | `Client` ✓ |
| clients.update | `/api/clients/{client_id}` | PATCH | `clients.update` | `Client` ✓ |
| clients.delete | `/api/clients/{client_id}` | DELETE | `clients.delete` | `MessageResponse` (NEW) |

## **Health Router** (`packages/api/routers/health.py`) - Category: `health`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| health.check | `/health` | GET | `health.check` | `HealthResponse` (NEW) |

## **Referral Router** (`packages/api/routers/referral.py`) - Category: `referral`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| referral.validate | `/api/referral/{code}/validate` | GET | `referral.validate` ⚠️ | `ReferralValidation` ✓ |
| referral.get_campaign | `/api/referral/{code}/campaign` | GET | `referral.get_campaign` ⚠️ | `ReferralCampaignInfo` ✓ |
| referral.process_signup | `/api/referral/signup` | POST | `referral.process_signup` ⚠️ | `ReferralSignupResponse` (NEW) |
| referral.complete | `/api/referral/complete` | POST | `referral.complete` ⚠️ | `ReferralCompleteResponse` (NEW) |

## **Campaigns Router** (`packages/api/routers/campaigns.py`) - Category: `campaigns`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| campaigns.list | `/api/campaigns/` | GET | `campaigns.list` ✓ | `List[DiscordGuildCampaign]` ✓ |
| campaigns.create | `/api/campaigns/` | POST | `campaigns.create` ✓ | `DiscordGuildCampaign` ⚠️ |
| campaigns.list_available | `/api/campaigns/available` | GET | `campaigns.list_available` ⚠️ | `List[DiscordGuildCampaign]` ✓ |
| campaigns.get | `/api/campaigns/{campaign_id}` | GET | `campaigns.get` ⚠️ | `DiscordGuildCampaign` ✓ |
| campaigns.update | `/api/campaigns/{campaign_id}` | PATCH | `campaigns.update` ✓ | `DiscordGuildCampaign` ✓ |
| campaigns.delete | `/api/campaigns/{campaign_id}` | DELETE | `campaigns.delete` ✓ | `MessageResponse` (NEW) |
| campaigns.update_stats | `/api/campaigns/{campaign_id}/stats` | PATCH | `campaigns.update_stats` ⚠️ | `DiscordGuildCampaign` ✓ |
| campaigns.request_access | `/api/campaigns/{campaign_id}/request-access` | POST | `campaigns.request_access` ⚠️ | `CampaignAccessRequestResponse` (NEW) |
| campaigns.create_referral_link | `/api/campaigns/{campaign_id}/referral-links` | POST | `campaigns.create_referral_link` ⚠️ | `ReferralLink` ✓ |
| campaigns.get_referral_links | `/api/campaigns/{campaign_id}/referral-links` | GET | `campaigns.get_referral_links` ⚠️ | `List[ReferralLink]` ✓ |
| campaigns.export_data | `/api/campaigns/export-data` | POST | `campaigns.export_data` ⚠️ | `DataExportResponse` ✓ |
| campaigns.download_export | `/api/campaigns/export-data/download` | GET | `campaigns.download_export` ⚠️ | `FileResponse` (No model needed) |

## **Authentication Router** (`packages/api/routers/auth.py`) - Category: `auth`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| auth.signup | `/api/auth/signup` | POST | `auth.signup` ⚠️ | `AuthResponse` ✓ |
| auth.login | `/api/auth/login` | POST | `auth.login` ⚠️ | `AuthResponse` ✓ |
| auth.logout | `/api/auth/logout` | POST | `auth.logout` ⚠️ | `MessageResponse` (NEW) |
| auth.resend_confirmation | `/api/auth/send-confirmation` | POST | `auth.resend_confirmation` ⚠️ | `MessageResponse` (NEW) |
| auth.confirm_email | `/api/auth/confirm` | POST | `auth.confirm_email` ⚠️ | `MessageResponse` (NEW) |
| auth.get_current_user | `/api/auth/user` | GET | `auth.get_current_user` ⚠️ | `UserProfile` ✓ |
| auth.delete_user | `/api/auth/user/delete` | DELETE | `auth.delete_user` ⚠️ | `MessageResponse` (NEW) |
| auth.google_login | `/api/auth/google/login` | GET | `auth.google_login` ⚠️ | `RedirectResponse` (No model needed) |
| auth.google_callback | `/api/auth/google/callback` | GET | `auth.google_callback` ⚠️ | `RedirectResponse` (No model needed) |

## **Discord Router** (`packages/api/routers/discord_bot.py`) - Category: `discord`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| discord.start_onboarding | `/api/discord-bot/onboarding/start` | POST | `discord.start_onboarding` ⚠️ | `OnboardingStartResponse` (NEW) |
| discord.submit_onboarding | `/api/discord-bot/onboarding/modal` | POST | `discord.submit_onboarding` ⚠️ | `MessageResponse` (NEW) |
| discord.get_onboarding_session | `/api/discord-bot/onboarding/session` | GET | `discord.get_onboarding_session` ⚠️ | `OnboardingSession` ✓ |
| discord.complete_onboarding | `/api/discord-bot/onboarding/complete` | POST | `discord.complete_onboarding` ⚠️ | `MessageResponse` (NEW) |
| discord.get_config | `/api/discord-bot/config` | GET | `discord.get_config` ⚠️ | `DiscordConfig` ✓ |
| discord.get_invite_context | `/api/discord-bot/discord/invite/{code}/context` | GET | `discord.get_invite_context` ⚠️ | `DiscordInviteContext` ✓ |
| discord.assign_role | `/api/discord-bot/discord/guilds/{guild_id}/members/{member_id}/roles` | POST | `discord.assign_role` ⚠️ | `MessageResponse` (NEW) |
| discord.get_member_roles | `/api/discord-bot/discord/guilds/{guild_id}/members/{member_id}/roles` | GET | `discord.get_member_roles` ⚠️ | `MemberRolesResponse` (NEW) |

## **Access Router** (`packages/api/routers/access_requests.py`) - Category: `access`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| access.submit_request | `/api/access-requests/` | POST | `access.submit_request` ⚠️ | `AccessRequest` (NEW) |

## **Analytics Router** (`packages/api/routers/analytics.py`) - Category: `analytics`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| analytics.track | `/api/analytics/track` | POST | `analytics.track` ⚠️ | `AnalyticsTrackResponse` ✓ |
| analytics.get_guild | `/api/analytics/guild/{guild_id}` | GET | `analytics.get_guild` ⚠️ | `GuildAnalyticsResponse` ✓ |
| analytics.get_campaign_overview | `/api/analytics/campaign-overview` | GET | `analytics.get_campaign_overview` ⚠️ | `CampaignOverviewResponse` (NEW) |
| analytics.get_real_time | `/api/analytics/real-time` | GET | `analytics.get_real_time` ⚠️ | `RealTimeAnalyticsResponse` (NEW) |
| analytics.get_user_journey | `/api/analytics/user-journey` | GET | `analytics.get_user_journey` ⚠️ | `UserJourneyResponse` (NEW) |

## **Templates Router** (`packages/api/routers/templates.py`) - Category: `templates`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| templates.list | `/api/campaign-templates` | GET | `templates.list` ✓ | `CampaignTemplateListResponse` ✓ |
| templates.get | `/api/campaign-templates/{template_id}` | GET | `templates.get` ⚠️ | `CampaignTemplateResponse` ✓ |
| templates.create | `/api/campaign-templates` | POST | `templates.create` ✓ | `CampaignTemplateResponse` ✓ |
| templates.update | `/api/campaign-templates/{template_id}` | PATCH | `templates.update` ✓ | `CampaignTemplateResponse` ✓ |
| templates.delete | `/api/campaign-templates/{template_id}` | DELETE | `templates.delete` ✓ | `MessageResponse` (NEW) |
| templates.get_by_category | `/api/campaign-templates/by-category/{category}` | GET | `templates.get_by_category` ⚠️ | `CampaignTemplateListResponse` (NEW) |
| templates.get_by_type | `/api/campaign-templates/by-type/{campaign_type}` | GET | `templates.get_by_type` ⚠️ | `CampaignTemplateListResponse` (NEW) |
| templates.list_landing_pages | `/api/landing-page-templates` | GET | `templates.list_landing_pages` ⚠️ | `LandingPageTemplateListResponse` ✓ |
| templates.apply_to_campaign | `/api/campaign-onboarding-fields/apply-template` | POST | `templates.apply_to_campaign` ⚠️ | `ApplyTemplateResponse` ✓ |
| templates.get_defaults | `/api/templates/default` | GET | `templates.get_defaults` ⚠️ | `DefaultTemplatesResponse` (NEW) |

## **OAuth Router** (`packages/api/routers/oauth.py`) - Category: `oauth`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| oauth.register_client | `/api/oauth/register` | POST | `oauth.register_client` ⚠️ | `OAuthClientResponse` (NEW) |
| oauth.authorize | `/api/oauth/authorize` | GET | `oauth.authorize` ⚠️ | `RedirectResponse` (No model needed) |
| oauth.callback | `/api/oauth/callback` | GET | `oauth.callback` ⚠️ | `RedirectResponse` (No model needed) |
| oauth.token | `/api/oauth/token` | POST | `oauth.token` ⚠️ | `OAuthTokenResponse` (NEW) |

## **Status Router** (`packages/api/routers/status.py`) - Category: `status`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| status.health | `/status/health` | GET | `status.health` ⚠️ | `HealthResponse` (NEW) |

## **Root Router** (`packages/api/main.py`) - Category: `root`
| MCP Function | Endpoint | Method | operation_id | Response Model |
|--------------|----------|--------|--------------|----------------|
| root.read | `/` | GET | `root.read` ⚠️ | `MessageResponse` (NEW) |
| root.oauth_metadata | `/.well-known/oauth-authorization-server` | GET | `root.oauth_metadata` ⚠️ | `OAuthAuthorizationServerMetadata` (NEW) |

---

## **Implementation Summary**

### **Categories by Router:**
- **admin** - Administrative functions
- **clients** - Client management
- **health** - Health monitoring
- **referral** - Referral system
- **campaigns** - Campaign management
- **auth** - Authentication & user management
- **discord** - Discord bot functionality
- **access** - Access request management
- **analytics** - Analytics & tracking
- **templates** - Template management
- **oauth** - OAuth provider functionality
- **status** - System status
- **root** - Root/metadata endpoints

### **Action Patterns:**
- **list** - Get multiple items
- **get** - Get single item or specific data
- **create** - Create new resource
- **update** - Modify existing resource
- **delete** - Remove resource
- **validate** - Check validity
- **process** - Handle workflow
- **track** - Record events
- **assign** - Grant permissions/roles
- **submit** - Send requests
- **resend** - Retry operations
- **confirm** - Verify actions

### **Required Changes Summary:**
- **Total Functions**: 60
- **Functions needing operation_id**: 55 (following new consistent pattern)
- **Functions needing response_model**: 25

### **New Response Models Needed:**
- `MessageResponse` - For success/error messages
- `HealthResponse` - For health check status
- `ReferralSignupResponse` - For referral signup success
- `ReferralCompleteResponse` - For referral completion
- `CampaignAccessRequestResponse` - For access request status
- `OnboardingStartResponse` - For onboarding initiation
- `MemberRolesResponse` - For Discord member roles
- `CampaignOverviewResponse` - For campaign analytics overview
- `RealTimeAnalyticsResponse` - For real-time analytics
- `UserJourneyResponse` - For user journey analytics
- `DefaultTemplatesResponse` - For default templates
- `OAuthClientResponse` - For OAuth client registration
- `OAuthTokenResponse` - For OAuth token response
- `OAuthAuthorizationServerMetadata` - For OAuth server metadata

### **Legend:**
- ✓ = Already correct
- ⚠️ = Missing, needs to be added
- (NEW) = New response model needs to be created

## **Next Steps**
1. Update all router files to include missing operation_id parameters
2. Create new Pydantic response models for structured responses
3. Add response_model parameters to endpoints returning data
4. Update MCP function registry to match new operation_id naming
5. Test all endpoints to ensure consistency

## **Benefits of Standardization**
- **Consistency**: All endpoints follow the same naming pattern
- **Maintainability**: Easy to understand which router handles which operations
- **Documentation**: Clear API documentation with consistent operation IDs
- **MCP Integration**: Seamless integration with MCP function names
- **Developer Experience**: Predictable naming makes API easier to use