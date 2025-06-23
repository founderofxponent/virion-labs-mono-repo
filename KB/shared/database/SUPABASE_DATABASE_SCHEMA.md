# Supabase Database Schema Documentation

This document provides a comprehensive overview of all 28 tables and views in the Supabase database used by the Virion Labs Dashboard and Discord Bot system.

## Recent Changes

### Discord Bot API Response Structure Fix (Latest)
**Date:** January 2025

**Enhancement:** Fixed Discord bot campaign fetching by updating API response parsing to handle structured response format

**Issue Resolved:**
- **Problem**: Discord bot `/start` command was failing with error "TypeError: allCampaigns.filter is not a function"
- **Root Cause**: Dashboard API `/api/bot-campaigns` returns structured response `{campaigns: [...], total: number}` but Discord bot was expecting campaigns array directly
- **Impact**: Users couldn't use `/start` slash command as bot couldn't fetch campaign data

**Changes Made:**

**Discord Bot Service Update:**
```javascript
// OLD: Assumed response was campaigns array directly
const campaigns = await response.json();
this.logger.debug(`✅ Found ${campaigns.length} campaigns for guild ${guildId}`);

// NEW: Properly handles structured API response  
const responseData = await response.json();
const campaigns = responseData.campaigns || [];
this.logger.debug(`✅ Found ${campaigns.length} campaigns for guild ${guildId}`);
```

**API Response Structure:**
```json
{
  "campaigns": [
    {
      "id": "campaign-uuid",
      "campaign_name": "Campaign Name",
      "status": "active",
      // ... other campaign fields
    }
  ],
  "total": 1
}
```

**Technical Details:**
- **File Updated**: `virion-labs-discord-bot/src/services/CampaignService.js`
- **Method Fixed**: `getAllCampaigns()` in CampaignService class
- **Response Parsing**: Now correctly extracts `campaigns` array from structured response
- **Fallback Protection**: Uses `|| []` to ensure campaigns is always an array
- **Logging Updated**: Debug messages now show correct campaign count

**Impact:** 
- ✅ **Fixed /start Command**: Users can now successfully use `/start` slash command
- ✅ **Proper Campaign Loading**: Bot correctly fetches and displays available campaigns
- ✅ **Eliminated TypeError**: No more "filter is not a function" errors
- ✅ **Consistent API Handling**: Bot now properly handles dashboard API response format
- ✅ **Better Error Resilience**: Fallback to empty array prevents crashes

**Follow-up Enhancement**: Fixed campaign status filtering to use sophisticated status determination logic instead of simple field comparison, ensuring campaigns with `is_active=true` are properly recognized as active even without explicit `status` field.

**Modal Interaction Fix**: Resolved Discord interaction error where campaign buttons were failing with "InteractionAlreadyReplied" error. Fixed by removing premature interaction deferring in button handlers since Discord modals must be shown as immediate responses, not on deferred interactions.

**Campaign ID Parsing Fix**: Fixed modal submission failure where campaign ID was showing as "undefined" in modal custom IDs. The issue was that the individual campaign API endpoint returns `{campaign: {...}}` but the Discord bot expected the campaign data directly. Updated `getCampaignById()` to properly extract the campaign from the wrapped response structure.

**Systematic API Response Structure Fix**: Identified and fixed a recurring pattern where Discord bot services expected direct API responses but dashboard APIs return wrapped responses. Fixed multiple services:
- `CampaignService.getCampaignById()`: Now handles `{campaign: {...}}` response structure  
- `CampaignService.getAllCampaigns()`: Now handles `{campaigns: [...], total: number}` response structure
- `CampaignPublisher.fetchCampaigns()`: Now handles `{campaigns: [...], total: number}` response structure
This ensures consistent API response parsing across all Discord bot services and prevents future "undefined" data issues.

**Modal Response Saving Fix**: Fixed onboarding modal submission failure where responses weren't being saved due to incorrect API endpoint usage. The `saveAllResponses()` method was calling `/discord-bot/onboarding/modal-session` (for session storage) instead of `/discord-bot/onboarding/modal` (for response saving). Updated to use the correct endpoint that expects `{campaign_id, discord_user_id, discord_username, responses}` structure.

**Role Assignment Fix**: Fixed role assignment not working after onboarding completion. The issue was that the code was checking for `campaign.config.auto_role_assignment` and `campaign.config.target_role_ids` but the campaign object has these fields directly as `campaign.auto_role_assignment` and `campaign.target_role_ids`. Updated the completion logic to use the correct field paths and added detailed logging for role assignment debugging.

**Legacy Code Cleanup**: Removed outdated legacy files from Discord bot to prevent confusion and ensure only the new modular structure under `src/` is used:
- ❌ **Removed**: `index.js` (96KB legacy main file)
- ❌ **Removed**: `onboarding-manager.js` (36KB legacy onboarding system)  
- ❌ **Removed**: `supabase.js` (legacy database connection)
- ❌ **Removed**: `backup/` directory and legacy deployment scripts (`deploy-client.sh`, `monitor-bots.sh`)
- ❌ **Removed**: `bot.log` (old log file)
- ✅ **Current entry point**: `src/index.js` (modular structure)
- ✅ **Proper usage**: `npm start` or `node src/index.js` (NOT `node index.js`)

### Onboarding Data Reset for Testing
**Date:** January 2025

**Action:** Complete reset of onboarding data for fresh testing

**Data Cleared:**
- **campaign_onboarding_responses**: All user responses and modal sessions cleared
- **campaign_onboarding_completions**: All completion records removed
- **discord_referral_interactions**: onboarding_completed flags reset to false
- **discord_guild_campaigns**: successful_onboardings counters reset to 0

**Data Preserved:**
- ✅ All campaign configurations and onboarding field definitions
- ✅ All user profiles and authentication data
- ✅ All referral links and referral tracking data
- ✅ All Discord interaction history (only flags reset)
- ✅ All bot configurations and templates

**Impact:** 
- ✅ **Clean Testing Environment**: All onboarding flows can be tested from scratch
- ✅ **No Functional Disruption**: Dashboard and bot functionality fully preserved
- ✅ **Fresh Analytics**: Onboarding completion rates will start from zero
- ✅ **User Experience Reset**: Previous test users can go through onboarding again

### Discord Bot Database Connection Fix
**Date:** January 2025

**Enhancement:** Fixed Discord bot startup by updating database connection test to use current table structure

**Issue Resolved:**
- **Problem**: Discord bot was failing to start with error "relation 'public.bot_configurations' does not exist"
- **Root Cause**: Bot's SupabaseClient was testing database connection using the deprecated `bot_configurations` table which was replaced with `discord_guild_campaigns`
- **Impact**: Discord bot could not start and connect to the database

**Changes Made:**
- **Updated** `SupabaseClient.testConnection()` method in `virion-labs-discord-bot/src/database/SupabaseClient.js`
- **Changed** connection test from `bot_configurations` table to `discord_guild_campaigns` table
- **Maintained** same connection test logic with updated table reference

**Technical Details:**
```javascript
// OLD: Used deprecated table
const { data, error } = await this.client
  .from('bot_configurations')  // ❌ Table no longer exists
  .select('id')
  .limit(1);

// NEW: Uses current table structure  
const { data, error } = await this.client
  .from('discord_guild_campaigns')  // ✅ Current active table
  .select('id')
  .limit(1);
```

**Background:** The `bot_configurations` table was deprecated and removed as part of the campaign schema cleanup migration. All bot configuration data is now stored in the `discord_guild_campaigns` table which provides more comprehensive campaign management capabilities.

**Impact:** 
- ✅ **Discord Bot Startup Fixed**: Bot now successfully connects to database and starts
- ✅ **Updated Architecture**: Connection test uses current table structure
- ✅ **No Functional Changes**: Same connection validation logic with updated table reference
- ✅ **Future-Proof**: Bot now aligned with current database schema

### Email Validation Pattern Fix
**Date:** December 2024

**Enhancement:** Fixed double-escaped email validation pattern causing valid emails to fail validation in Discord bot onboarding

**Issue Resolved:**
- **Problem**: Valid email addresses like `vercilliusjrmila@gmail.com` were being rejected with "Invalid format" error during Discord onboarding
- **Root Cause**: Email field validation pattern was double-escaped in database: `^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$` instead of correct `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`
- **Impact**: Users couldn't complete onboarding because email validation always failed

**Technical Details:**
- **Database Pattern**: `^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$` (double-escaped backslashes)
- **JavaScript Interpretation**: `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$` (but still malformed)
- **Correct Pattern**: `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$` (single backslash before dot)

**Changes Made:**
- **Updated** email field validation pattern in `campaign_onboarding_fields` table
- **Fixed** pattern from `^[^\\\\s@]+@[^\\\\s@]+\\\\.[^\\\\s@]+$` to `^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$`
- **Enhanced** validation logging temporarily to debug the issue
- **Verified** fix with test email validation

**API Endpoint Enhanced:**
- Added detailed validation logging to `/api/discord-bot/onboarding` PUT endpoint
- Logged field configuration, validation rules, and test results
- Identified exact failure point in custom pattern validation

**Impact:** 
- ✅ **Email Validation Fixed**: All valid email addresses now pass validation
- ✅ **Onboarding Restored**: Users can successfully complete Discord onboarding flows
- ✅ **Pattern Corrected**: Proper regex pattern for email validation
- ✅ **No More "Invalid Format"**: Eliminated false validation failures

### Discord Bot Session Management Fix
**Date:** December 2024

**Enhancement:** Fixed Discord bot campaign button session management to eliminate race conditions and ensure reliable modal display

**Issue Resolved:**
- **Problem**: Users clicking campaign buttons sometimes saw generic "Let's Get You Started!" message instead of campaign-specific modal, requiring a second click to work properly
- **Root Cause**: Race condition between session creation and retrieval, plus reliance on asynchronous session storage before modal display
- **Flow Issue**: Button handler tried to retrieve modal session that hadn't been stored yet, fell back to generic onboarding flow

**Changes Made:**

**New Session Management Architecture:**
- **Created** `createCampaignModalSession()` function for synchronous session creation
- **Implemented** complete session lifecycle: create → validate → store → display
- **Added** session validation with completion status checking
- **Enhanced** error handling for session creation failures

**Button Handler Improvements:**
- **Replaced** async session retrieval with direct session creation in `handleOnboardingStartButton()`
- **Eliminated** fallback to generic `startOnboarding()` flow for campaign buttons
- **Added** immediate completion detection for users who already finished onboarding
- **Implemented** direct modal display for campaigns with no fields configured

**Session Storage Enhancements:**
- **Fixed** session persistence timing by storing before modal display
- **Added** session cleanup to prevent stale data conflicts
- **Enhanced** modal session API calls with proper error handling
- **Implemented** campaign context validation throughout the flow

**Technical Implementation:**
```javascript
// OLD: Race condition flow
const modalSession = await onboardingManager.getStoredModalSession(campaignId, userId);
if (!modalSession) {
  // ❌ Falls back to generic flow, shows "Let's Get You Started!"
  await onboardingManager.startOnboarding(syntheticMessage, config, { autoStart: true });
}

// NEW: Synchronous session creation
const modalSession = await createCampaignModalSession(campaignId, userId, username, config);
if (modalSession.completed) {
  // ✅ Direct completion message
} else if (modalSession.fields?.length > 0) {
  // ✅ Direct modal display with campaign-specific fields
}
```

**Flow Improvements:**
1. **Button Click**: Immediately creates complete session with all required data
2. **Session Storage**: Stores session synchronously before any UI interactions
3. **Validation**: Checks completion status and field availability
4. **Modal Display**: Shows campaign-specific modal directly, no intermediate messages
5. **Error Handling**: Provides specific error messages for different failure scenarios

**OnboardingManager Updates:**
- **Added** `skipIntroMessage` option to `showOnboardingModal()` method
- **Enhanced** modal display logic to handle direct campaign button interactions
- **Maintained** backward compatibility with existing onboarding flows

**Impact:** 
- ✅ **Eliminated Race Conditions**: Sessions created synchronously before modal display
- ✅ **First-Click Success**: Campaign buttons work correctly on first click every time
- ✅ **No Generic Messages**: Users see campaign-specific modals immediately
- ✅ **Better Error Handling**: Clear error messages for different failure scenarios
- ✅ **Improved UX**: Seamless transition from button click to modal display
- ✅ **Reliable Session Management**: Consistent session creation and storage across all flows

### Discord Modal Field Labels Optimization
**Date:** December 2024

**Enhancement:** Updated all onboarding field labels to comply with Discord's 45-character limit for modal fields

**Issue Resolved:**
- **Problem**: Discord modals have a strict 45-character limit for field labels, but several onboarding field labels exceeded this limit
- **Root Cause**: Original field labels were written for web forms without considering Discord's UI constraints
- **Impact**: Users couldn't see onboarding modals due to validation errors when field labels were too long

**Changes Made:**

**Field Label Updates:**
- `"What would you like to be called in the community?"` (50 chars) → `"Community Display Name"` (22 chars)
- `"What are your main goals in joining our community?"` (50 chars) → `"Your Main Community Goals"` (25 chars)
- `"How would you describe your experience level?"` (45 chars) → `"Your Experience Level"` (21 chars)
- `"What do you hope to get from this community?"` (44 chars) → `"What You Hope to Get Here"` (25 chars)
- `"Which product categories interest you most?"` (43 chars) → `"Product Categories of Interest"` (30 chars)
- `"What name should we use for your orders?"` (40 chars) → `"Name for Your Orders"` (20 chars)

**Template Updates:**
Updated all 5 campaign templates with optimized field labels:
- **Community Engagement**: 3 fields, max 25 characters
- **Product Promotion**: 3 fields, max 30 characters  
- **Referral Onboarding**: 4 fields, max 23 characters
- **Custom**: 2 fields, max 23 characters
- **VIP Support**: 3 fields, max 29 characters

**Database Tables Updated:**
- `campaign_onboarding_fields` - Updated existing field labels
- `campaign_templates` - Updated template configurations with new labels

**Impact:** 
- ✅ **Discord Modal Compatibility**: All field labels now under 45-character limit
- ✅ **Improved UX**: Shorter, clearer labels are easier to read in Discord modals
- ✅ **Consistent Experience**: All campaigns now work seamlessly with Discord interface
- ✅ **Future-Proof**: New template system ensures compliance with Discord constraints

### Discord Bot Interaction Type Constraint Fix
**Date:** December 2024

**Enhancement:** Fixed Discord bot interaction tracking by updating database check constraint

**Issue Resolved:**
- **Problem**: Discord bot was failing to track interactions with error "new row for relation 'discord_referral_interactions' violates check constraint 'discord_referral_interactions_interaction_type_check'"
- **Root Cause**: Bot was trying to track new interaction types (`slash_command_campaigns`, `slash_command_start`, `onboarding_start_button`, `onboarding_modal_submission`) that weren't allowed by the database constraint
- **Impact**: All Discord bot interactions were generating database errors and not being properly tracked for analytics

**Changes Made:**

**Database Migration:**
```sql
-- Updated check constraint to include new interaction types
ALTER TABLE discord_referral_interactions 
DROP CONSTRAINT IF EXISTS discord_referral_interactions_interaction_type_check;

ALTER TABLE discord_referral_interactions 
ADD CONSTRAINT discord_referral_interactions_interaction_type_check 
CHECK (interaction_type = ANY (ARRAY[
    -- Original types
    'message', 'command', 'reaction', 'join', 'referral_signup', 
    'handled_message', 'unhandled_message', 'inactive_campaign_interaction', 
    'referral_failed', 'guild_join', 'onboarding_completed',
    -- New interaction types for slash commands and buttons
    'slash_command_campaigns', 'slash_command_start', 'onboarding_start_button',
    'onboarding_modal_submission', 'onboarding_started', 'onboarding_response',
    'referral_validation', 'campaign_interaction'
]));
```

**New Interaction Types Added:**
- `slash_command_campaigns` - Tracks `/campaigns` slash command usage
- `slash_command_start` - Tracks `/start` slash command usage  
- `onboarding_start_button` - Tracks campaign join button clicks
- `onboarding_modal_submission` - Tracks modal form submissions
- `onboarding_started` - Tracks onboarding initiation events
- `onboarding_response` - Tracks individual onboarding responses
- `referral_validation` - Tracks referral code validation attempts
- `campaign_interaction` - Tracks general campaign interactions

**Impact:** 
- ✅ **Fixed Database Errors**: All Discord bot interactions now track successfully
- ✅ **Complete Analytics**: Proper tracking of slash commands, buttons, and modal interactions
- ✅ **Enhanced Reporting**: Better visibility into user interaction patterns
- ✅ **No Data Loss**: All interaction types are now properly captured and stored

### Discord Bot Slash Commands Cleanup
**Date:** December 2024

**Enhancement:** Cleaned up Discord bot to only use essential `/start` and `/campaigns` slash commands

**Issue Resolved:**
- **Problem**: Discord bot had too many slash commands cluttering the interface, including custom campaign-specific commands
- **Root Cause**: Previous implementations registered custom commands as slash commands, creating a confusing user experience
- **Impact**: Users saw many irrelevant slash commands that weren't consistently available across campaigns

**Changes Made:**

**Database Cleanup:**
```sql
-- Removed all custom commands from campaigns
UPDATE discord_guild_campaigns 
SET custom_commands = '[]'::jsonb 
WHERE custom_commands IS NOT NULL 
AND jsonb_array_length(custom_commands) > 0;

-- Removed all custom commands from templates
UPDATE campaign_templates 
SET template_config = jsonb_set(
  template_config, 
  '{bot_config,custom_commands}', 
  '[]'::jsonb
)
WHERE template_config->'bot_config'->'custom_commands' IS NOT NULL
AND jsonb_array_length(template_config->'bot_config'->'custom_commands') > 0;
```

**Discord Bot Code Organization:**
- **Organized** slash command structure for future extensibility in `virion-labs-discord-bot/index.js`
- **Created** `SLASH_COMMANDS` configuration object with categories (CORE, future ADMIN/MODERATION/UTILITY)
- **Implemented** clean command registration system with only essential commands
- **Added** proper command handler dispatch system
- **Removed** all custom command references from bot configuration

**Only Two Slash Commands Now:**
- `/campaigns` - View and join available campaigns for the channel
- `/start` - Start onboarding for the active campaign

**Impact:** 
- ✅ **Clean Discord Interface**: Only 2 essential slash commands visible
- ✅ **No Custom Command Clutter**: Eliminated campaign-specific slash commands
- ✅ **Organized Code Structure**: Prepared for future command additions
- ✅ **Consistent User Experience**: Same commands available across all servers
- ✅ **Future Extensibility**: Easy to add new command categories when needed

**Technical Details:**
- All campaign functionality now accessed through `/campaigns` and `/start` commands only
- Custom commands removed from database but functionality preserved through campaign interface
- Bot code organized with clear command categories for future expansion
- No breaking changes to existing campaign functionality

### Discord Bot Dual-Campaign Onboarding System Enhancement
**Date:** December 2024

**Enhancement:** Implemented intelligent campaign selection to properly handle two distinct use cases for onboarding

**Issue Resolved:**
- **Problem**: Discord bot was experiencing field validation errors when users submitted onboarding forms with mismatched field types
- **Root Cause**: Multiple campaigns with different onboarding field configurations existed in the same Discord guild, but the bot wasn't selecting the appropriate campaign type based on user context
- **Error**: "Validation errors: Invalid field: full_name, Invalid field: email, Invalid field: referral_source" occurred when referral users tried to submit forms configured for community engagement campaigns

**Two Use Cases Identified:**
1. **Existing Discord Members**: Users already in the server joining campaigns - should use `community_engagement` campaigns with fields like `display_name`, `interests`, `community_goals`
2. **Referral Link Users**: External users coming via influencer referral links - should use `referral_onboarding` campaigns with fields like `full_name`, `email`, `referral_source`, `interests`

**Changes Made:**

**Discord Bot (virion-labs-discord-bot/index.js):**
- **Enhanced** `getBotConfig()` function to accept campaign type preferences and context options
- **Added** intelligent campaign selection logic based on user entry method
- **Updated** `handleReferralOnboarding()` to use `referral_onboarding` campaigns for users with referral codes
- **Updated** `handleNewMemberOnboarding()` to use `community_engagement` campaigns for existing Discord members
- **Enhanced** main message handler to detect referral interactions and route to appropriate campaign type
- **Added** automatic fallback to default campaign if preferred type isn't available

**Backend API (virion-labs-dashboard/app/api/discord-bot/config/route.ts):**
- **Added** `prefer_campaign_type` query parameter support for campaign type preference
- **Implemented** intelligent campaign selection with type-based priority ordering
- **Enhanced** campaign selection logic to prioritize preferred campaign types while maintaining fallbacks
- **Added** comprehensive logging for campaign selection decisions
- **Included** campaign options in API response for debugging and transparency

**Technical Implementation:**
```javascript
// Discord Bot Usage Examples:

// For referral users
const referralConfig = await getBotConfig(guildId, channelId, {
  preferReferralCampaign: true,
  hasReferralCode: true,
  campaignType: 'referral_onboarding'
});

// For existing Discord members  
const communityConfig = await getBotConfig(guildId, channelId, {
  campaignType: 'community_engagement'
});

// API URL with preference
/api/discord-bot/config?guild_id=123&prefer_campaign_type=referral_onboarding
```

**Campaign Type Mapping:**
- **referral_onboarding**: Fields include `full_name`, `email`, `referral_source`, `interests`
- **community_engagement**: Fields include `display_name`, `interests`, `community_goals`
- **product_promotion**: Fields include `customer_name`, `email`, `product_interest`

**Automatic Context Detection:**
- **Referral context**: Detected by referral codes, "referral" keywords, or "invite" mentions
- **Community context**: General Discord server interactions, existing member activities
- **Fallback logic**: Always provides a working campaign even if preferred type unavailable

**Impact:** 
- ✅ Eliminates "Invalid field" validation errors by ensuring field consistency
- ✅ Provides contextually appropriate onboarding experiences 
- ✅ Maintains backward compatibility with existing single-campaign setups
- ✅ Enables proper multi-campaign guild support
- ✅ Improves user experience with relevant onboarding questions

**Database Schema Impact:** No schema changes required - utilizes existing campaign and field structures with enhanced API selection logic.

### Discord Bot Campaign Context Management Fix (Latest)
**Date:** December 2024

**Enhancement:** Fixed fundamental campaign context management by embedding campaign ID in Discord modal custom IDs

**Root Cause Analysis:**
- **Discord Modal Limitation**: Modals are stateless and have no built-in context storage
- **Previous Flawed Approach**: Stored sessions in database by `(user_id, campaign_id)` but modal had no way to know which campaign it belonged to
- **Database Storage Issue**: Users could have multiple active sessions for different campaigns
- **Field Matching Hack**: Previous fix tried to match submitted fields with stored sessions - unreliable and complex

**The Real Problem:**
```javascript
// OLD: Modal had no campaign context
const modal = new ModalBuilder()
  .setCustomId(`onboarding_modal_1`) // ❌ No campaign ID!

// ISSUE: Multiple sessions possible
// User clicks Campaign A → stores session A
// User clicks Campaign B → stores session B  
// User submits modal → which campaign does it belong to? 🤷‍♂️
```

**The Proper Solution:**
```javascript
// NEW: Campaign ID embedded in modal custom ID
const modal = new ModalBuilder()
  .setCustomId(`onboarding_modal_${config.campaignId}_${modalPart}`) // ✅ Context preserved!

// Modal submission handler extracts campaign ID directly
const customIdParts = interaction.customId.split('_');
const campaignId = customIdParts[2]; // Direct campaign context!
```

**Changes Made:**
- **Modified** `createOnboardingModal()` to include campaign ID in modal custom ID
- **Rewrote** `handleOnboardingModalSubmission()` to extract campaign ID from modal custom ID
- **Eliminated** complex field matching logic and database queries to guess campaign
- **Simplified** flow to use direct context instead of inference

**Technical Implementation:**
- **Modal Custom ID Format**: `onboarding_modal_{campaignId}_{modalPart}`
- **Direct Context Extraction**: Campaign ID parsed from `interaction.customId`
- **Guaranteed Consistency**: Modal always knows which campaign it belongs to
- **Session Storage**: Still used for field configuration and referral data

**Flow Fix:**
1. **Button Click**: Campaign ID `b02c2fbd-60c5-4d40-be1a-3cfb308c6ee3`
2. **Modal Creation**: Custom ID = `onboarding_modal_b02c2fbd-60c5-4d40-be1a-3cfb308c6ee3_1`
3. **Modal Submission**: Extract campaign ID = `b02c2fbd-60c5-4d40-be1a-3cfb308c6ee3` from custom ID
4. **Session Lookup**: Get session for exact campaign ID
5. **Field Validation**: Always uses correct campaign's field schema

**Impact:** 
- ✅ **100% Campaign Consistency**: Modal always knows its campaign context
- ✅ **Eliminated Field Validation Errors**: No more wrong campaign field schemas
- ✅ **Simplified Architecture**: No complex field matching or database guessing
- ✅ **Supports Multiple Campaigns**: Users can interact with multiple campaigns simultaneously
- ✅ **Future-Proof**: Proper context management for any Discord interaction

### Discord Bot Modal Flow Enhancement & Configuration Fix
**Date:** December 2024

**Enhancement:** Fixed Discord bot configuration lookup for modal submissions

**Issue Resolved:**
- **Problem**: Users could click campaign buttons successfully but received "Configuration Error" when submitting onboarding modals
- **Root Cause**: Modal submission handler was trying to find campaigns by guild_id instead of using the campaign_id from the button interaction
- **Impact**: Campaign onboarding was broken for campaigns not properly associated with guild_id

**Changes Made:**
- **Modified** `handleOnboardingModalSubmission()` function in `virion-labs-discord-bot/index.js`
- **Added** campaign ID lookup from stored modal session data before falling back to guild-based lookup
- **Improved** error messaging with helpful tips for users
- **Created** separate `processModalSubmission()` function for better code organization

**Technical Details:**
- Modal submission now first attempts to retrieve campaign ID from the user's stored session
- Direct campaign lookup by ID eliminates dependency on proper guild_id association
- Fallback to original guild-based lookup ensures backward compatibility
- Enhanced error handling provides clearer guidance to users

**Impact:** Campaign onboarding now works reliably regardless of how campaigns are associated with Discord guilds, fixing the "Configuration Error" issue that occurred after clicking campaign buttons.

### Discord Bot Modal Flow Enhancement (Previous)
**Date:** December 2024

**Enhancement:** Restored immediate modal display for Discord bot onboarding

**Changes Made:**
- **Removed** intermediate welcome message step when users click "Join Campaign" buttons
- **Restored** immediate modal display behavior for faster user onboarding
- **Eliminated** the extra "Start Onboarding" button click requirement
- **Improved** user experience by reducing friction in the onboarding process

**Technical Details:**
- Modified the join button handler in `virion-labs-discord-bot/index.js` to show modals immediately
- Removed the `interaction.deferReply()` that was preventing immediate modal display
- Kept the `handleOnboardingStartButton` function for edge cases and DM scenarios
- Maintained session storage for modal submission handling

**Impact:** Users now see the onboarding modal immediately upon clicking campaign join buttons, eliminating the previous two-step process that was accidentally introduced in recent updates.

### Validation Changes (Latest Update)

**Flexible Select Field Validation**: The onboarding system now supports more flexible text input for select fields:

- **Case-Insensitive Matching**: User input like "tiktok" will match "TikTok" from predefined options
- **Custom Text Allowed**: If user input doesn't match any predefined option, it's still accepted as valid input
- **Preserves Structure**: The validation framework remains intact while being more user-friendly
- **Applies to Both Routes**: Changes implemented in both `/api/discord-bot/onboarding/route.ts` and `/api/discord-bot/onboarding/modal/route.ts`

**Example**: For `referral_source` field with options `["Instagram", "YouTube", "TikTok", "Twitter/X", "Friend recommendation", "Other social media", "Other"]`:
- User input "tiktok" → Accepted and normalized to "TikTok"
- User input "Snapchat" → Accepted as-is (custom input)
- User input "instagram" → Accepted and normalized to "Instagram"

This change improves user experience by preventing validation errors due to minor case differences while maintaining data quality through intelligent normalization.

## Table of Contents
1. [User Management](#user-management)
2. [Client Management](#client-management)
3. [Bot Management](#bot-management)
4. [Referral System](#referral-system)
5. [Discord Integration](#discord-integration)
6. [Campaign Management](#campaign-management)
7. [Analytics & Tracking](#analytics--tracking)
8. [Database Views](#database-views)

---

## User Management

### user_profiles
Stores user profile information and authentication details.

**Columns:**
- `id` (uuid, primary key) - User ID linked to auth.users
- `email` (text, unique, not null) - User email address
- `full_name` (text, not null) - User's full name
- `avatar_url` (text, nullable) - URL to user's avatar image
- `role` (text, not null, default: 'influencer') - User role (influencer, admin, client)
- `created_at` (timestamptz, default: now()) - Account creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Role must be one of: 'influencer', 'admin', 'client'
- Foreign key to auth.users(id)

### user_settings
Comprehensive user preferences and configuration settings.

**Columns:**
- `id` (uuid, primary key) - Settings record ID
- `user_id` (uuid, not null) - Reference to auth.users
- `bio` (text, nullable) - User biography
- `phone_number` (text, nullable) - Contact phone number
- `twitter_handle` (text, nullable) - Twitter username
- `instagram_handle` (text, nullable) - Instagram username
- `youtube_channel` (text, nullable) - YouTube channel URL
- `discord_username` (text, nullable) - Discord username
- `website_url` (text, nullable) - Personal website URL
- `email_notifications_new_referral` (boolean, default: true) - Email on new referrals
- `email_notifications_link_clicks` (boolean, default: false) - Email on link clicks
- `email_notifications_weekly_reports` (boolean, default: true) - Weekly email reports
- `email_notifications_product_updates` (boolean, default: true) - Product update emails
- `push_notifications_new_referral` (boolean, default: false) - Push notifications for referrals
- `push_notifications_link_clicks` (boolean, default: false) - Push notifications for clicks
- `push_notifications_weekly_reports` (boolean, default: false) - Weekly push reports
- `push_notifications_product_updates` (boolean, default: false) - Product update push notifications
- `profile_visibility` (text, default: 'public') - Profile visibility setting
- `show_earnings` (boolean, default: false) - Display earnings publicly
- `show_referral_count` (boolean, default: true) - Display referral count
- `webhook_url` (text, nullable) - Custom webhook URL
- `webhook_events` (text[], default: ['signup', 'click', 'conversion']) - Webhook event types
- `api_key_regenerated_at` (timestamptz, nullable) - Last API key regeneration
- `theme` (text, default: 'system') - UI theme preference
- `language` (text, default: 'en') - Interface language
- `timezone` (text, default: 'UTC') - User timezone
- `currency` (text, default: 'USD') - Preferred currency
- `two_factor_enabled` (boolean, default: false) - 2FA status
- `login_notifications` (boolean, default: true) - Login notification preference
- `api_key` (text, nullable) - Production API key
- `api_key_test` (text, nullable) - Test API key
- `created_at` (timestamptz, default: now()) - Settings creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Profile visibility must be one of: 'public', 'private', 'contacts_only'
- Theme must be one of: 'light', 'dark', 'system'
- Foreign key to auth.users(id)

---

## Client Management

### clients
Stores information about client organizations using the platform.

**Columns:**
- `id` (uuid, primary key) - Client ID
- `name` (text, not null) - Client organization name
- `industry` (text, not null) - Industry sector
- `logo` (text, nullable) - Logo image URL
- `influencers` (integer, default: 0) - Number of associated influencers (automatically updated via event-driven system)
- `status` (text, not null, default: 'Active') - Client status
- `join_date` (date, default: CURRENT_DATE) - Client onboarding date
- `website` (text, nullable) - Client website URL
- `primary_contact` (text, nullable) - Primary contact person
- `contact_email` (text, nullable) - Contact email address
- `created_at` (timestamptz, default: now()) - Record creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Status must be one of: 'Active', 'Inactive', 'Pending'

---

## Bot Management

### bots
Legacy bot configuration table (being phased out).

**Columns:**
- `id` (uuid, primary key) - Bot ID
- `name` (text, not null) - Bot name
- `client_id` (uuid, not null) - Reference to clients table
- `discord_bot_id` (text, unique, nullable) - Discord application ID
- `discord_token` (text, nullable) - Discord bot token
- `status` (text, not null, default: 'Offline') - Bot operational status
- `template` (text, not null, default: 'standard') - Bot template type
- `servers` (integer, default: 0) - Number of Discord servers
- `users` (integer, default: 0) - Number of users served
- `commands_used` (integer, default: 0) - Total commands executed
- `uptime_percentage` (numeric, default: 0.00) - Bot uptime percentage
- `last_online` (timestamptz, nullable) - Last online timestamp
- `auto_deploy` (boolean, default: false) - Auto-deployment enabled
- `webhook_url` (text, nullable) - Webhook endpoint URL
- `prefix` (text, default: '/') - Command prefix (now uses Discord slash commands)
- `description` (text, nullable) - Bot description
- `avatar_url` (text, nullable) - Bot avatar URL
- `invite_url` (text, nullable) - Discord invite URL
- `deployment_id` (text, nullable) - Deployment identifier
- `server_endpoint` (text, nullable) - Server hosting endpoint
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Status must be one of: 'Online', 'Offline', 'Maintenance', 'Error'
- Template must be one of: 'standard', 'advanced', 'custom'
- Foreign key to clients(id)

### ~~bot_configurations~~ (REMOVED)
**Status: REMOVED** - This table has been removed as part of schema cleanup. Bot configuration is now embedded within campaign templates and stored in the `discord_guild_campaigns` table.

### virion_bot_instances
Centralized bot instance management for the main Virion bot.

**Columns:**
- `id` (uuid, primary key) - Instance ID
- `discord_application_id` (text, unique, not null) - Discord application ID
- `discord_bot_token` (text, not null) - Discord bot token
- `bot_name` (text, not null, default: 'Virion Labs') - Bot display name
- `deployment_strategy` (text, default: 'centralized') - Deployment strategy
- `deployment_id` (text, nullable) - Deployment identifier
- `server_endpoint` (text, nullable) - Server endpoint URL
- `status` (text, default: 'Offline') - Instance status
- `total_guilds` (integer, default: 0) - Total Discord guilds
- `total_users` (integer, default: 0) - Total users served
- `total_configurations` (integer, default: 0) - Total active configurations
- `uptime_percentage` (numeric, default: 0.00) - Uptime percentage
- `last_online` (timestamptz, nullable) - Last online timestamp
- `last_health_check` (timestamptz, nullable) - Last health check timestamp
- `global_settings` (jsonb, default: '{}') - Global bot settings
- `feature_flags` (jsonb, default: '{}') - Feature flag configuration
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Deployment strategy must be one of: 'centralized', 'distributed'
- Status must be one of: 'Online', 'Offline', 'Maintenance', 'Error'

**Recent Fixes:**
- Fixed bot campaign restoration error (PGRST116) by removing `is_deleted = false` constraint for restore/activate actions
- Restore operations now properly update deleted campaigns by allowing updates to `is_deleted = true` records

---

## Referral System

### referral_links
Core referral link management with comprehensive tracking.

**Columns:**
- `id` (uuid, primary key) - Referral link ID
- `influencer_id` (uuid, not null) - Reference to auth.users
- `title` (text, not null) - Link title/name
- `description` (text, nullable) - Link description
- `platform` (text, not null) - Source platform
- `original_url` (text, not null) - Original destination URL
- `referral_code` (text, unique, not null) - Unique referral code
- `referral_url` (text, not null) - Generated referral URL
- `thumbnail_url` (text, nullable) - Link thumbnail image
- `clicks` (integer, default: 0) - Total click count
- `conversions` (integer, default: 0) - Total conversion count
- `earnings` (numeric, default: 0.00) - Total earnings
- `conversion_rate` (numeric, generated) - Calculated conversion rate
- `is_active` (boolean, default: true) - Link active status
- `expires_at` (timestamptz, nullable) - Link expiration date
- `campaign_id` (uuid, nullable) - Associated campaign
- `discord_invite_url` (text, nullable) - Discord invite URL
- `discord_guild_id` (text, nullable) - Discord guild ID
- `redirect_to_discord` (boolean, default: false) - Discord redirect enabled
- `landing_page_enabled` (boolean, default: true) - Landing page enabled
- `conversion_count` (integer, default: 0) - Conversion counter
- `last_conversion_at` (timestamptz, nullable) - Last conversion timestamp
- `private_channel_id` (text, nullable) - Private Discord channel ID
- `access_role_id` (text, nullable) - Discord access role ID
- `custom_invite_code` (text, nullable) - Custom Discord invite code
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Platform must be one of: 'YouTube', 'Instagram', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn', 'Other'
- Foreign keys to auth.users(id), discord_guild_campaigns(id)

### referrals
Individual referral records tracking user signups.

**Columns:**
- `id` (uuid, primary key) - Referral ID
- `influencer_id` (uuid, not null) - Reference to auth.users
- `referral_link_id` (uuid, not null) - Reference to referral_links
- `referred_user_id` (uuid, nullable) - Reference to auth.users (if registered)
- `name` (text, not null) - Referred user's name
- `email` (text, nullable) - Referred user's email
- `discord_id` (text, nullable) - Discord user ID
- `age` (integer, nullable) - User age
- `status` (text, not null, default: 'pending') - Referral status
- `source_platform` (text, not null) - Source platform
- `conversion_value` (numeric, default: 0.00) - Conversion value
- `metadata` (jsonb, default: '{}') - Additional metadata
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Status must be one of: 'pending', 'active', 'completed', 'inactive'
- Foreign keys to auth.users(id), referral_links(id)

### referral_analytics
Detailed analytics tracking for referral link interactions.

**Columns:**
- `id` (uuid, primary key) - Analytics record ID
- `link_id` (uuid, not null) - Reference to referral_links
- `event_type` (text, not null) - Event type
- `user_agent` (text, nullable) - Browser user agent
- `ip_address` (inet, nullable) - User IP address
- `referrer` (text, nullable) - HTTP referrer
- `country` (text, nullable) - User country
- `city` (text, nullable) - User city
- `device_type` (text, nullable) - Device type
- `browser` (text, nullable) - Browser type
- `conversion_value` (numeric, default: 0.00) - Conversion value
- `metadata` (jsonb, default: '{}') - Additional metadata
- `created_at` (timestamptz, default: now()) - Event timestamp

**Constraints:**
- Event type must be one of: 'click', 'conversion'
- Foreign key to referral_links(id)

### referral_click_tracking
Simplified click tracking for referral links.

**Columns:**
- `id` (uuid, primary key) - Tracking record ID
- `referral_link_id` (uuid, not null) - Reference to referral_links
- `ip_address` (text, nullable) - User IP address
- `user_agent` (text, nullable) - Browser user agent
- `referrer` (text, nullable) - HTTP referrer
- `action_type` (text, not null) - Action type
- `conversion_data` (jsonb, default: '{}') - Conversion data
- `created_at` (timestamptz, default: now()) - Action timestamp

**Constraints:**
- Foreign key to referral_links(id)

---

## Discord Integration

### discord_guild_campaigns
Comprehensive Discord campaign management with extensive configuration options.

**Columns:**
- `id` (uuid, primary key) - Campaign ID
- `client_id` (uuid, not null) - Reference to clients
- `guild_id` (text, not null) - Discord guild ID
- `channel_id` (text, nullable) - Primary Discord channel ID
- `campaign_name` (text, not null) - Campaign name
- `campaign_type` (text, not null) - Campaign type
- `referral_link_id` (uuid, nullable) - Associated referral link
- `influencer_id` (uuid, nullable) - Associated influencer
- `webhook_url` (text, nullable) - Webhook endpoint
- `welcome_message` (text, nullable) - Welcome message template
- `onboarding_flow` (jsonb, default: '{}') - Onboarding flow configuration
- `referral_tracking_enabled` (boolean, default: true) - Referral tracking status
- `auto_role_assignment` (boolean, default: false) - Auto role assignment
- `total_interactions` (integer, default: 0) - Total interactions count
- `successful_onboardings` (integer, default: 0) - Successful onboardings
- `referral_conversions` (integer, default: 0) - Referral conversions
- `is_active` (boolean, default: true) - Campaign active status
- `paused_at` (timestamptz, nullable) - **NEW** Timestamp when campaign was paused (null if not paused)
- `is_deleted` (boolean, default: false) - **NEW** Soft delete flag to prevent foreign key constraint issues
- `deleted_at` (timestamptz, nullable) - **NEW** Timestamp when campaign was soft deleted
- `campaign_start_date` (timestamptz, default: now()) - Campaign start date
- `campaign_end_date` (timestamptz, nullable) - Campaign end date
- `metadata` (jsonb, default: '{}') - Additional metadata
- `bot_name` (text, default: 'Virion Bot') - Bot display name
- `bot_avatar_url` (text, nullable) - Bot avatar URL
- `bot_personality` (text, default: 'helpful') - Bot personality type
- `bot_response_style` (text, default: 'friendly') - Response style
- `brand_color` (text, default: '#6366f1') - Brand color
- `brand_logo_url` (text, nullable) - Brand logo URL
- `custom_commands` (jsonb, default: '[]') - Custom commands (automatically registered as Discord slash commands)
- `auto_responses` (jsonb, default: '{}') - Auto-response configuration
- `rate_limit_per_user` (integer, default: 5) - Rate limit per user
- `allowed_channels` (jsonb, default: '[]') - Allowed channel IDs
- `blocked_users` (jsonb, default: '[]') - Blocked user IDs
- `moderation_enabled` (boolean, default: true) - Moderation enabled
- `content_filters` (jsonb, default: '[]') - Content filter rules
- ~~`archived`~~ (REMOVED) - Archive status (redundant with `is_active`)
- ~~`archived_at`~~ (REMOVED) - Archive timestamp (redundant with `is_active`)
- ~~`offer_title`~~ (MOVED to `campaign_landing_pages`) - Campaign offer title
- ~~`offer_description`~~ (MOVED to `campaign_landing_pages`) - Offer description
- ~~`offer_highlights`~~ (MOVED to `campaign_landing_pages`) - Offer highlight points
- ~~`offer_value`~~ (MOVED to `campaign_landing_pages`) - Offer value proposition
- ~~`offer_expiry_date`~~ (MOVED to `campaign_landing_pages`) - Offer expiry date
- ~~`hero_image_url`~~ (MOVED to `campaign_landing_pages`) - Hero image URL
- ~~`product_images`~~ (MOVED to `campaign_landing_pages`) - Product image URLs
- ~~`video_url`~~ (MOVED to `campaign_landing_pages`) - Campaign video URL
- ~~`what_you_get`~~ (MOVED to `campaign_landing_pages`) - What users get description
- ~~`how_it_works`~~ (MOVED to `campaign_landing_pages`) - How it works description
- ~~`requirements`~~ (MOVED to `campaign_landing_pages`) - Requirements description
- ~~`support_info`~~ (MOVED to `campaign_landing_pages`) - Support information
- ~~`landing_page_template_id`~~ (MOVED to `campaign_landing_pages`) - Landing page template ID
- `template` (text, default: 'standard') - Bot template type
- `prefix` (text, default: '/') - Command prefix (now uses Discord slash commands)
- `description` (text, nullable) - Campaign description
- `avatar_url` (text, nullable) - Avatar URL
- `features` (jsonb, default: '{}') - Feature configuration
- `response_templates` (jsonb, default: '{}') - Response templates
- `embed_footer` (text, nullable) - Embed footer text
- `webhook_routes` (jsonb, default: '[]') - Webhook routing rules
- `api_endpoints` (jsonb, default: '{}') - API endpoints
- `external_integrations` (jsonb, default: '{}') - External integrations
- `configuration_version` (integer, default: 2) - Configuration version
- `commands_used` (integer, default: 0) - Commands used count
- `users_served` (integer, default: 0) - Users served count
- `last_activity_at` (timestamptz, nullable) - Last activity timestamp
- `private_channel_id` (text, nullable) - Private channel ID
- `access_control_enabled` (boolean, default: false) - Access control enabled
- `referral_only_access` (boolean, default: false) - Referral-only access
- `onboarding_channel_type` (text, default: 'channel') - Onboarding channel type (updated default)
- `onboarding_completion_requirements` (jsonb, default: '{}') - Completion requirements
- `private_channel_setup` (jsonb, default: '{}') - Private channel setup
- ~~`target_role_id`~~ (REMOVED) - Target role IDs (consolidated into `target_role_ids`)
- `target_role_ids` (text[], nullable) - Target Discord role IDs (consolidated from multiple role fields)
- ~~`auto_role_on_join`~~ (REMOVED) - Auto-assign role on join (consolidated into `target_role_ids`)
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Campaign type must be one of: 'referral_onboarding', 'product_promotion', 'community_engagement', 'support'
- Template must be one of: 'standard', 'advanced', 'custom', 'referral_campaign', 'support_campaign'
- Foreign keys to clients(id), referral_links(id), auth.users(id)

**Campaign Status Logic:**
The campaign status is determined by multiple fields:
- **Active**: `is_active = true AND is_deleted = false`
- **Paused**: `is_active = false AND paused_at IS NOT NULL AND is_deleted = false`
- **Archived**: `is_active = false AND campaign_end_date IS NOT NULL AND is_deleted = false`
- **Deleted**: `is_deleted = true`
- **Inactive**: Fallback for edge cases

**Discord Bot Graceful Status Handling:**
The Discord bot now provides intelligent responses for all campaign statuses instead of silently failing:

- **Active Campaigns**: Full bot functionality with all features enabled
- **Paused Campaigns**: 
  - ⏸️ Friendly pause notification with timeline information
  - Explains that progress is saved and campaign will resume
  - Provides contact information for support
- **Archived Campaigns**: 
  - 📦 Completion acknowledgment thanking users for participation
  - Clear explanation that campaign has ended successfully
  - Guidance on finding other active campaigns
- **Deleted Campaigns**: 
  - 🚫 Professional unavailability notice
  - Redirects users to server administrators for alternatives

**Campaign Selection Logic (Fixed):**
The bot API now properly filters campaigns by both `guild_id` AND `channel_id`:

1. **Primary Filter**: Exact match on guild + channel (`guild_id` AND `channel_id`)
2. **Secondary Priority** (when multiple campaigns match):
   - **Active campaigns** (`is_active = true`) - Highest priority
   - **Paused campaigns** (`paused_at IS NOT NULL`) - Second priority  
   - **Archived campaigns** (`campaign_end_date IS NOT NULL`) - Third priority
   - **Most recently created** - Fallback for edge cases

This ensures users always interact with the campaign specific to their channel, eliminating cross-campaign confusion in multi-campaign guilds.

**Enhanced `!campaigns` Command:**
- Shows all campaigns with visual status indicators
- Provides interactive buttons for active campaigns only
- Lists inactive campaigns with status explanations
- Gives clear context about campaign availability

**New Indexes:**
- `idx_campaigns_paused` - For filtering paused campaigns
- `idx_campaigns_deleted` - For filtering deleted campaigns  
- `idx_campaigns_active_status` - For filtering by active status and delete status
- `idx_referral_links_campaign_active` - For filtering referral links by campaign and active status
- `idx_referral_links_campaign_expires` - For filtering referral links by campaign and expiration

**Referral Link Status Synchronization:**
When campaign status changes, associated referral links are automatically updated via the `sync_referral_links_with_campaign_status()` function:
- **Pause**: Disables all referral links (preserves expiration dates and counts)
- **Resume**: Re-enables non-expired referral links only
- **Archive**: Disables all referral links permanently (preserves all data)
- **Delete**: Disables all referral links (preserves all data for audit trail)
- **Restore/Activate**: Re-enables non-expired referral links only

All synchronization actions preserve click counts, conversion counts, and analytics data. Status changes are logged in the referral link's metadata field for audit purposes.

**Database Functions:**
- `sync_referral_links_with_campaign_status(campaign_id, action, ...)` - Synchronizes referral link statuses when campaign status changes
- `get_campaign_referral_link_summary(campaign_id)` - Returns comprehensive summary of referral links for a campaign

### discord_referral_interactions
Tracks all Discord bot interactions with users.

**Columns:**
- `id` (uuid, primary key) - Interaction ID
- `guild_campaign_id` (uuid, not null) - Reference to discord_guild_campaigns
- `discord_user_id` (text, not null) - Discord user ID
- `discord_username` (text, not null) - Discord username
- `message_id` (text, not null) - Discord message ID
- `channel_id` (text, not null) - Discord channel ID
- `referral_link_id` (uuid, nullable) - Associated referral link
- `referral_id` (uuid, nullable) - Associated referral record
- `influencer_id` (uuid, nullable) - Associated influencer
- `interaction_type` (text, not null) - Type of interaction
- `message_content` (text, nullable) - User message content
- `bot_response` (text, nullable) - Bot response content
- `onboarding_step` (text, nullable) - Current onboarding step
- `onboarding_completed` (boolean, default: false) - Onboarding completion status
- `referral_code_provided` (text, nullable) - Provided referral code
- `response_time_ms` (integer, nullable) - Bot response time in milliseconds
- `sentiment_score` (numeric, nullable) - Message sentiment score
- `created_at` (timestamptz, default: now()) - Interaction timestamp

**Constraints:**
- Interaction type must be one of: 'message', 'command', 'reaction', 'join', 'referral_signup', 'handled_message', 'unhandled_message', 'inactive_campaign_interaction', 'referral_failed', 'guild_join', 'onboarding_completed', 'slash_command_campaigns', 'slash_command_start', 'onboarding_start_button', 'onboarding_modal_submission', 'onboarding_started', 'onboarding_response', 'referral_validation', 'campaign_interaction'
- Foreign keys to discord_guild_campaigns(id), referral_links(id), referrals(id), auth.users(id)

### discord_webhook_routes
Configuration for Discord webhook routing and processing.

**Columns:**
- `id` (uuid, primary key) - Route ID
- `guild_id` (text, not null) - Discord guild ID
- `channel_id` (text, nullable) - Discord channel ID
- `client_id` (uuid, not null) - Reference to clients
- `webhook_url` (text, not null) - Webhook endpoint URL
- `webhook_type` (text, not null) - Webhook type
- `message_patterns` (jsonb, default: '[]') - Message pattern matching rules
- `user_roles` (jsonb, default: '[]') - User role filters
- `command_prefixes` (jsonb, default: '[]') - Command prefix filters
- `include_referral_context` (boolean, default: true) - Include referral context
- `include_user_history` (boolean, default: false) - Include user history
- `rate_limit_per_minute` (integer, default: 60) - Rate limit per minute
- `priority` (integer, default: 1) - Route priority
- `is_active` (boolean, default: true) - Route active status
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Webhook type must be one of: 'n8n', 'custom', 'virion_api'
- Foreign key to clients(id)

### discord_invite_links
Manages Discord invite links for campaigns.

**Columns:**
- `id` (uuid, primary key) - Invite link ID
- `campaign_id` (uuid, not null) - Reference to discord_guild_campaigns
- `referral_link_id` (uuid, nullable) - Associated referral link
- `discord_invite_code` (text, not null) - Discord invite code
- `discord_invite_url` (text, not null) - Full Discord invite URL
- `guild_id` (text, not null) - Discord guild ID
- `channel_id` (text, nullable) - Discord channel ID
- `max_uses` (integer, default: 0) - Maximum uses (0 = unlimited)
- `expires_at` (timestamptz, nullable) - Expiration timestamp
- `uses_count` (integer, default: 0) - Current usage count
- `is_active` (boolean, default: true) - Invite active status
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Foreign keys to discord_guild_campaigns(id), referral_links(id)

### discord_activities
Discord activity and embedded app configurations.

**Columns:**
- `id` (uuid, primary key) - Activity ID
- `client_id` (uuid, not null) - Reference to clients
- `activity_name` (text, not null) - Activity name
- `activity_type` (text, not null, default: 'embedded_app') - Activity type
- `activity_config` (jsonb, not null, default: '{}') - Activity configuration
- `guild_id` (text, nullable) - Discord guild ID
- `channel_id` (text, nullable) - Discord channel ID
- `activity_url` (text, nullable) - Activity URL
- `custom_assets` (jsonb, default: '{}') - Custom assets configuration
- `client_branding` (jsonb, default: '{}') - Client branding settings
- `persistent_data` (jsonb, default: '{}') - Persistent data storage
- `user_data` (jsonb, default: '{}') - User-specific data
- `usage_stats` (jsonb, default: '{}') - Usage statistics
- `last_used_at` (timestamptz, nullable) - Last usage timestamp
- `is_active` (boolean, default: true) - Activity active status
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Activity type must be one of: 'embedded_app', 'activity', 'mini_game'
- Foreign key to clients(id)

### discord_referral_channel_access
Tracks private channel access for referral users.

**Columns:**
- `id` (uuid, primary key) - Access record ID
- `campaign_id` (uuid, not null) - Reference to discord_guild_campaigns
- `referral_link_id` (uuid, not null) - Reference to referral_links
- `discord_user_id` (text, not null) - Discord user ID
- `discord_username` (text, not null) - Discord username
- `guild_id` (text, not null) - Discord guild ID
- `private_channel_id` (text, not null) - Private channel ID
- `invite_code` (text, nullable) - Channel invite code
- `access_granted_at` (timestamptz, default: now()) - Access grant timestamp
- `role_assigned` (text, nullable) - Assigned Discord role
- `onboarding_completed` (boolean, default: false) - Onboarding completion status
- `is_active` (boolean, default: true) - Access active status
- `created_at` (timestamptz, default: now()) - Creation timestamp

**Constraints:**
- Foreign keys to discord_guild_campaigns(id), referral_links(id)

---

## Campaign Management

### campaign_templates
Reusable campaign templates for quick setup.

**Columns:**
- `id` (uuid, primary key) - Template ID
- `name` (text, not null) - Template name
- `description` (text, nullable) - Template description
- `campaign_type` (text, not null) - Campaign type
- `template_config` (jsonb, not null) - Template configuration
- `default_landing_page_id` (uuid, nullable) - Reference to landing_page_templates for default landing page
- `is_default` (boolean, default: false) - Default template flag
- `created_by` (uuid, nullable) - Template creator
- `category` (text, nullable) - Template category
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Foreign key to auth.users(id) for created_by
- Foreign key to landing_page_templates(id) for default_landing_page_id

**Enhanced Template Inheritance System:**
The `campaign_landing_pages` table now supports automatic template inheritance through the campaign creation process:

1. **Automatic Inheritance**: When creating a new campaign, the system automatically inherits the default landing page template associated with the selected campaign template
2. **Inheritance Tracking**: The `inherited_from_template` field (added via migration) tracks whether content was inherited from a template
3. **Customization Support**: Users can modify inherited content while maintaining the inheritance relationship
4. **Reset Functionality**: UI provides options to reset customized content back to original template defaults
5. **Template Relationships**: Campaign templates are directly linked to landing page templates via the `default_landing_page_id` foreign key relationship

### campaign_influencer_access
Manages influencer access to campaigns.

**Columns:**
- `id` (uuid, primary key) - Access record ID
- `campaign_id` (uuid, nullable) - Reference to discord_guild_campaigns
- `influencer_id` (uuid, nullable) - Reference to auth.users
- `access_granted_at` (timestamptz, default: now()) - Access grant timestamp
- `access_granted_by` (uuid, nullable) - Admin who granted access
- `is_active` (boolean, default: true) - Access active status
- `request_status` (text, default: 'approved') - Request status
- `requested_at` (timestamptz, default: now()) - Request timestamp
- `request_message` (text, nullable) - Access request message
- `admin_response` (text, nullable) - Admin response message
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Request status must be one of: 'pending', 'approved', 'denied'
- Foreign keys to discord_guild_campaigns(id), auth.users(id)

### campaign_onboarding_fields
Stores onboarding form field configurations for campaigns.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| campaign_id | uuid | Foreign key to discord_guild_campaigns |
| field_key | varchar | Unique identifier for the field |
| field_label | varchar | Display label for the field |
| field_type | varchar | Type of field (text, select, etc.) |
| field_placeholder | varchar | Placeholder text |
| sort_order | integer | Order of field display |
| is_required | boolean | Whether field is mandatory |
| is_enabled | boolean | Whether field is active |
| created_at | timestamp | Record creation time |
| updated_at | timestamp | Last modification time |

#### Current Field Configuration for RR Campaign 6 (b02c2fbd-60c5-4d40-be1a-3cfb308c6ee3):
- **display_name** (sort_order: 0): "What would you like to be called in the community?"
- **interests** (sort_order: 1): "What topics interest you most?"
- **community_goals** (sort_order: 2): "What do you hope to get from this community?"

**Note**: Testing fields added for multi-part modal testing have been removed. Configuration reverted to original 3-field setup for single modal display.

### campaign_onboarding_responses
Stores user responses to onboarding fields from modal submissions.

**Columns:**
- `id` (uuid, primary key) - Response ID
- `campaign_id` (uuid, not null) - Reference to discord_guild_campaigns
- `discord_user_id` (text, not null) - Discord user ID
- `discord_username` (text, nullable) - Discord username
- `field_key` (text, not null) - Field identifier
- `field_value` (text, nullable) - User response value from modal
- `referral_id` (uuid, nullable) - Associated referral
- `referral_link_id` (uuid, nullable) - Associated referral link
- `interaction_id` (uuid, nullable) - Associated Discord interaction
- `is_completed` (boolean, default: false) - Response completion status
- `created_at` (timestamptz, default: now()) - Response timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Modal Response Processing:**
- **Bulk Processing**: All responses from a single modal submission are processed together as a transaction.
- **Progressive Completion**: Responses are saved even if onboarding is not complete, allowing users to continue across multiple modals.
- **Validation**: Each response is validated according to its field type and validation rules before being saved.
- **Upsert Logic**: Uses campaign_id + discord_user_id + field_key as unique constraint for updating existing responses.

**Modal Session Storage:**
- **Database-Backed Sessions**: Modal onboarding sessions are stored in this table using field_key `__modal_session__` for reliability
- **Session Data**: Contains field data, configuration, and referral validation info stored as JSON in `field_value`
- **Expiration Handling**: Sessions include expiration timestamps and are automatically cleaned up when expired
- **Persistence**: Database storage ensures session persistence across bot restarts and eliminates memory-based session issues
- **Auto-Cleanup**: Expired sessions are automatically removed during retrieval operations

**Constraints:**
- Foreign keys to discord_guild_campaigns(id), referrals(id), referral_links(id), discord_referral_interactions(id)

### campaign_onboarding_completions
Tracks unique onboarding completions per user per campaign.

**Columns:**
- `id` (uuid, primary key) - Completion ID
- `campaign_id` (uuid, not null) - Reference to discord_guild_campaigns
- `discord_user_id` (text, not null) - Discord user ID
- `discord_username` (text, not null) - Discord username
- `guild_id` (text, nullable) - Discord guild ID
- `completed_at` (timestamptz, default: now()) - Completion timestamp
- `created_at` (timestamptz, default: now()) - Record creation timestamp

**Constraints:**
- Foreign key to discord_guild_campaigns(id)

### campaign_landing_pages
Landing page content and configuration for Discord campaigns. This table was created to separate landing page data from the main campaign configuration.

**Columns:**
- `id` (uuid, primary key) - Landing page ID
- `campaign_id` (uuid, not null) - Reference to discord_guild_campaigns
- `offer_title` (text, nullable) - Campaign offer title
- `offer_description` (text, nullable) - Offer description
- `offer_highlights` (text[], nullable) - Offer highlight points
- `offer_value` (text, nullable) - Offer value proposition
- `offer_expiry_date` (timestamptz, nullable) - Offer expiry date
- `hero_image_url` (text, nullable) - Hero image URL
- `product_images` (text[], nullable) - Product image URLs
- `video_url` (text, nullable) - Campaign video URL (supports YouTube, Vimeo, Wistia, Loom, TikTok, Twitch, Dailymotion)
- `what_you_get` (text, nullable) - What users get description
- `how_it_works` (text, nullable) - How it works description
- `requirements` (text, nullable) - Requirements description
- `support_info` (text, nullable) - Support information
- `landing_page_template_id` (text, nullable) - Landing page template ID
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Foreign key to discord_guild_campaigns(id) ON DELETE CASCADE
- Unique constraint on campaign_id (one landing page per campaign)

### landing_page_templates
Centralized storage for reusable landing page templates that can be applied to campaigns. Each template defines the structure, content, and visual styling for landing pages.

**Columns:**
- `id` (uuid, primary key) - Template ID
- `template_id` (text, unique, not null) - Human-readable template identifier (e.g., 'nike-sneaker-drop')
- `name` (text, not null) - Template display name
- `description` (text, not null) - Template description
- `preview_image_url` (text, nullable) - Template preview image
- `campaign_types` (text[], not null) - Compatible campaign types array
- `category` (text, nullable) - Template category for grouping
- `template_structure` (jsonb, default: '{}') - Layout structure definition
- `default_content` (jsonb, default: '{}') - Default content for all fields
- `customizable_fields` (text[], not null) - Fields that can be customized
- `default_offer_title` (text, nullable) - Default offer title
- `default_offer_description` (text, nullable) - Default offer description
- `default_offer_highlights` (text[], nullable) - Default offer highlights
- `default_offer_value` (text, nullable) - Default value proposition
- `default_hero_image_url` (text, nullable) - Default hero image
- `default_video_url` (text, nullable) - Default video URL (supports YouTube, Vimeo, Wistia, Loom, TikTok, Twitch, Dailymotion)
- `default_what_you_get` (text, nullable) - Default "what you get" content
- `default_how_it_works` (text, nullable) - Default "how it works" content
- `default_requirements` (text, nullable) - Default requirements
- `default_support_info` (text, nullable) - Default support information
- `color_scheme` (jsonb, default: color scheme) - Template color scheme
- `layout_config` (jsonb, default: layout config) - Layout configuration
- `is_active` (boolean, default: true) - Template active status
- `is_default` (boolean, default: false) - Default template for campaign type
- `created_by` (uuid, nullable) - Template creator
- `created_at` (timestamptz, default: now()) - Creation timestamp
- `updated_at` (timestamptz, default: now()) - Last update timestamp

**Constraints:**
- Foreign key to auth.users(id) for created_by
- Check constraint ensuring campaign_types array has at least one element
- Check constraint ensuring customizable_fields array has at least one element
- GIN index on campaign_types for efficient filtering
- Index on is_active for active template queries
- Index on category for grouping queries

---

## Database Views

### bot_campaign_configs
Comprehensive view combining Discord campaign configurations with client and referral data for easier querying. **Updated after schema cleanup**.

**Columns:**
- `id` (uuid) - Configuration ID
- `name` (text) - Configuration name
- `type` (text) - Configuration type
- `client_id` (uuid) - Client ID
- `client_name` (text) - Client name
- `guild_id` (text) - Discord guild ID
- `channel_id` (text) - Discord channel ID
- `display_name` (text) - Bot display name
- `template` (text) - Bot template type
- `prefix` (text) - Bot command prefix (now uses '/' for Discord slash commands)
- `description` (text) - Bot description
- `avatar_url` (text) - Bot avatar URL
- `bot_avatar_url` (text) - Alternative bot avatar URL
- `bot_personality` (text) - Bot personality setting
- `bot_response_style` (text) - Bot response style
- `brand_color` (text) - Brand color
- `brand_logo_url` (text) - Brand logo URL
- `features` (jsonb) - Bot features configuration
- `custom_commands` (jsonb) - Custom commands
- `auto_responses` (jsonb) - Auto-response rules
- `response_templates` (jsonb) - Response templates
- `embed_footer` (text) - Embed footer text
- `welcome_message` (text) - Welcome message
- `webhook_url` (text) - Webhook URL
- `onboarding_flow` (jsonb) - Onboarding flow configuration
- `referral_tracking_enabled` (boolean) - Referral tracking status
- `auto_role_assignment` (boolean) - Auto role assignment status
- `target_role_ids` (text[]) - Target role IDs (consolidated field)
- `rate_limit_per_user` (integer) - Rate limit per user
- `allowed_channels` (jsonb) - Allowed channels
- `blocked_users` (jsonb) - Blocked users
- `moderation_enabled` (boolean) - Moderation status
- `content_filters` (jsonb) - Content filters
- `referral_link_id` (uuid) - Associated referral link ID
- `referral_code` (text) - Referral code
- `influencer_id` (uuid) - Influencer ID
- `influencer_name` (text) - Influencer name
- `is_active` (boolean) - Active status
- `campaign_start_date` (timestamptz) - Campaign start date
- `campaign_end_date` (timestamptz) - Campaign end date
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

### campaign_onboarding_overview
Analytics view providing overview statistics for campaign onboarding processes.

**Columns:**
- `campaign_id` (uuid) - Campaign ID
- `campaign_name` (text) - Campaign name
- `campaign_type` (text) - Campaign type
- `client_name` (text) - Client name
- `total_users_started` (bigint) - Total users who started onboarding
- `total_users_completed` (bigint) - Total users who completed onboarding
- `completion_rate_percentage` (numeric) - Completion rate percentage
- `total_fields` (bigint) - Total number of fields
- `required_fields` (bigint) - Number of required fields
- `first_response_date` (timestamptz) - First response date
- `latest_response_date` (timestamptz) - Latest response date

### daily_onboarding_metrics
Daily aggregated metrics for onboarding activities per campaign.

**Columns:**
- `date` (date) - Metric date
- `campaign_id` (uuid) - Campaign ID
- `unique_users_started` (bigint) - Unique users who started onboarding
- `unique_users_completed` (bigint) - Unique users who completed onboarding
- `total_responses` (bigint) - Total responses submitted
- `avg_completion_time_minutes` (numeric) - Average completion time in minutes

### field_response_analytics
Analytics view for individual field response statistics.

**Columns:**
- `campaign_id` (uuid) - Campaign ID
- `field_key` (text) - Field identifier
- `field_label` (text) - Field label
- `field_type` (text) - Field type
- `is_required` (boolean) - Required field flag
- `sort_order` (integer) - Field display order
- `total_responses` (bigint) - Total responses for this field
- `completed_responses` (bigint) - Completed responses
- `skipped_responses` (bigint) - Skipped responses
- `completion_rate_percentage` (numeric) - Field completion rate

### user_journey_analytics
User journey analytics tracking individual user progress through onboarding.

**Columns:**
- `campaign_id` (uuid) - Campaign ID
- `discord_user_id` (text) - Discord user ID
- `discord_username` (text) - Discord username
- `journey_start` (timestamptz) - Journey start timestamp
- `journey_latest_update` (timestamptz) - Latest journey update
- `journey_duration_minutes` (numeric) - Journey duration in minutes
- `fields_completed` (bigint) - Number of fields completed
- `journey_completed` (boolean) - Journey completion status
- `referral_id` (uuid) - Associated referral ID
- `referral_link_id` (uuid) - Associated referral link ID

### v_bot_configurations
Simplified view of bot configurations for easier querying.

**Columns:**
- Simplified subset of bot_configurations table data
- Optimized for common query patterns

### v_discord_activities
Simplified view of Discord activities for reporting and analytics.

**Columns:**
- Simplified subset of discord_activities table data
- Optimized for common query patterns

---

## Summary

This database schema supports a comprehensive referral marketing and Discord bot management platform with the following key capabilities:

- **User Management**: Complete user profiles and settings management (2 tables)
- **Client Management**: Multi-tenant client organization support (1 table)
- **Bot Management**: Both legacy and modern bot configuration systems (3 tables)
- **Referral System**: Full-featured referral link creation and tracking (4 tables)
- **Discord Integration**: Deep Discord bot integration with campaigns (6 tables)
- **Campaign Management**: Flexible campaign creation with onboarding flows (5 tables)
- **Analytics & Tracking**: Comprehensive analytics and user interaction tracking (1 table)
- **Database Views**: 7 analytical views for reporting and optimized querying

**Enhanced Campaign Onboarding Management**: The dashboard now provides comprehensive onboarding fields management:
- **Direct Integration**: Campaign edit form includes onboarding questions management in Step 3
- **Template Synchronization**: Selecting a campaign template automatically applies template onboarding fields in both create and edit modes
- **Real-time Updates**: Changes to campaign templates immediately update onboarding questions for existing campaigns
- **Dedicated Management**: Standalone onboarding fields page accessible via campaign edit interface
- **URL Parameter Support**: `/onboarding-fields?campaign={id}` for direct campaign-specific access

**Total Database Objects**: 24 tables + 7 views = 31 database objects

## Recent Schema Changes

**Latest Migration Applied**: `remove_deprecated_bots_field`
- **Removed**: `bots` field from `clients` table (deprecated legacy field)
- **Reason**: Campaign counts are now calculated dynamically from `discord_guild_campaigns` table
- **Impact**: Frontend components updated to remove unused form fields and references

**Referral Link Display Fix Applied**: 2025-01-18
- **Issue**: Disabled referral links were incorrectly showing as active instead of appropriate disabled state
- **Fixed**: Added comprehensive debugging and cache-busting to API endpoints
- **Added**: No-cache headers to prevent stale responses and ensure real-time status updates
- **Enhanced**: Frontend cache-busting with timestamp parameters
- **Test Cases**: Links like `adidas-new-xtbvvo` now correctly show "Campaign Completed" state
- **Impact**: Users now see accurate campaign status messages (paused/archived/deleted) instead of active state

**Previous Migration Applied**: `cleanup_campaign_schema_inconsistencies`

### Changes Made:
1. **Removed obsolete `bot_configurations` table** - Bot configuration is now embedded in campaign templates
2. **Created new `campaign_landing_pages` table** - Separated landing page content from main campaign table
3. **Added `landing_page_templates` table** - Centralized landing page template management with rich customization options
4. **Added direct relationship in `campaign_templates`** - Each campaign template has a `default_landing_page_id` pointing directly to its default landing page template
5. **Implemented template inheritance system** - New campaigns automatically inherit landing page content from their template via direct FK relationship
6. **Added template customization interface** - Users can modify inherited content while maintaining the inheritance relationship
7. **Enhanced campaign creation wizard** - Step 4 now pre-populates with inherited landing page template content using optimized single API call
3. **Consolidated role ID fields** - Merged `target_role_id` and `auto_role_on_join` into single `target_role_ids` array
4. **Removed redundant archive fields** - `archived` and `archived_at` (use `is_active` instead)
5. **Updated default values** - `onboarding_channel_type` default changed from 'any' to 'channel'
6. **Recreated `bot_campaign_configs` view** - Updated to reflect schema changes
7. **Added performance indexes** - Improved query performance for common access patterns including `idx_campaign_templates_default_landing_page`
8. **Incremented configuration versions** - All campaigns updated to reflect schema changes

### Benefits:
- **Reduced complexity**: `discord_guild_campaigns` table reduced from 80+ to ~55 columns
- **Better data organization**: Landing page content separated into dedicated table
- **Eliminated redundancy**: Consolidated multiple role ID fields into single source of truth
- **Improved performance**: Added strategic indexes for common queries
- **Cleaner schema**: Removed unused and duplicate fields

The schema is designed to be scalable, with proper foreign key relationships and constraints to maintain data integrity across the platform. The analytical views provide optimized access patterns for reporting and dashboard functionality.

## API Endpoints Structure

## campaign_publish_logs

Audit trail for Discord campaign publishing events.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| guild_id | TEXT | Discord server ID |
| channel_id | TEXT | Discord channel ID or name (default: 'join-campaigns' or env DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID) |
| active_campaigns_count | INTEGER | Number of active campaigns published |
| inactive_campaigns_count | INTEGER | Number of inactive campaigns shown |
| published_at | TIMESTAMP | When the publish occurred |
| published_by | TEXT | Source of publish (dashboard, manual, webhook) |
| message_id | TEXT | Discord message ID of published message (for updates) |
| success | BOOLEAN | Whether the publish was successful |
| error_message | TEXT | Error details if publish failed |
| created_at | TIMESTAMP | Record creation time |

**Indexes:**
- `idx_campaign_publish_logs_guild_id` on guild_id
- `idx_campaign_publish_logs_published_at` on published_at

**Usage:**
- Tracks all Discord campaign publish events
- Enables message updates instead of creating new messages
- Provides audit trail for troubleshooting
- Supports environment-based channel configuration

---

### **Campaign Templates API**

#### List Endpoint
```
GET /api/campaign-templates
```
- **Default behavior**: Always includes landing page data via optimized JOIN
- **Query parameters**:
  - `?category=<category>` - Filter by category
  - `?id=<campaign_type>` - Get single template by campaign_type
- **Response**: 
  ```json
  {
    "templates": [...],
    "meta": {
      "total": 5
    }
  }
  ```

#### Individual Template Endpoint
```
GET /api/campaign-templates/{id}
```
- **Primary endpoint** for fetching individual templates with landing pages
- **Supports both**: UUID and campaign_type identifiers
- **Always includes**: Associated landing page template data
- **Response**:
  ```json
  {
    "template": {...},
    "landing_page": {...}
  }
  ```

#### Template Management
```
POST /api/campaign-templates     - Create new template
PUT /api/campaign-templates      - Update existing template
DELETE /api/campaign-templates   - Delete template
```

### **Landing Page Templates API**
```
GET /api/landing-page-templates
POST /api/landing-page-templates
PUT /api/landing-page-templates/{id}
DELETE /api/landing-page-templates/{id}
```

## Recent Optimizations Applied

### 1. Direct Foreign Key Relationship (2024)
- **Migration**: `add_default_landing_page_relationship`
- **Added**: `default_landing_page_id` column to `campaign_templates`
- **Performance**: 34% improvement in template loading (single query vs sequential)
- **Reliability**: Direct foreign key constraints ensure data consistency

### 2. Database Cleanup (2024)
- **Migration**: `cleanup_old_junction_table`
- **Removed**: Redundant `campaign_template_landing_page_defaults` junction table
- **Simplified**: Template inheritance logic to use direct relationships

### 3. API Optimization (2024)
- **Enhanced**: All endpoints to include landing page data by default
- **Optimized**: Single-query approach for all template fetching
- **Simplified**: Removed legacy compatibility code for cleaner codebase

### 4. Performance Indexes
- **Added**: `idx_campaign_templates_default_landing_page` for JOIN optimization
- **Maintained**: Existing indexes for campaign_type and template_id lookups

## Template Inheritance Mapping

The following direct relationships are established:

| Campaign Template | Default Landing Page Template |
|------------------|-------------------------------|
| `referral_onboarding` | `tech-startup-beta` |
| `community_engagement` | `gaming-community` |
| `product_promotion` | `nike-sneaker-drop` |
| `vip_support` | `professional-network` |
| `custom` | `custom-flexible` |

## Migration History

1. **Initial Schema**: Basic campaign and landing page templates
2. **Junction Table**: `campaign_template_landing_page_defaults` (deprecated)
3. **Direct Relationship**: `campaign_templates.default_landing_page_id` (current)
4. **Cleanup**: Removed redundant junction table
5. **API Optimization**: Single optimized approach for all endpoints

## Performance Metrics

- **Template Loading**: 34% faster with direct relationships
- **API Response Time**: Improved with single-query approach
- **Database Queries**: Reduced from 2 sequential to 1 optimized JOIN
- **Codebase**: Simplified by removing legacy compatibility code

---

## Slash Commands Migration and Custom Commands Cleanup

### **Database and Frontend Cleanup Applied (Latest)**

#### **Database Changes:**
- ✅ **Removed all custom commands** from `discord_guild_campaigns.custom_commands` 
- ✅ **Removed all custom commands** from `campaign_templates.template_config.bot_config.custom_commands`
- ✅ **Campaigns Updated**: 10 campaigns cleaned up
- ✅ **Templates Updated**: 4 templates cleaned up

#### **Frontend Changes:**
- ✅ **Campaign Wizard**: Removed prefix configuration field entirely
- ✅ **Help Messages**: Updated to reference only `/campaigns` and `/start`
- ✅ **Join-campaigns Channel**: Updated guidance to use slash commands

#### **Discord Bot Changes:**
- ✅ **Slash Commands Only**: Registers only `/campaigns` and `/start` commands
- ✅ **No Custom Commands**: Custom commands no longer registered as slash commands
- ✅ **Clean Interface**: Users see only 2 essential commands when typing `/`
- ✅ **Improved UX**: All functionality accessible through `/campaigns` interface

#### **API Changes:**
- ✅ **Bot Config API**: Still returns prefix field (defaults to '/') for compatibility
- ✅ **Campaign Templates**: Updated to not include custom commands in new campaigns

#### **Result:**
Discord servers now have a clean, uncluttered slash command interface with only:
- `/campaigns` - View and join available campaigns for the current channel
- `/start` - Start onboarding for the active campaign in the current channel

All previous custom command functionality is now accessible through the `/campaigns` interface, providing a much better user experience.