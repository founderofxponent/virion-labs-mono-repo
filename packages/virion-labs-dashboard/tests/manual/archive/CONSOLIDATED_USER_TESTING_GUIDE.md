# 🎯 Consolidated User Testing Manual: Virion Labs Referral System

**Version:** 1.0 | **Last Updated:** January 2025 | **Duration:** 1-2 hours  
**Priority:** HIGH - This manual helps end users test the core referral system functionality.

## 🎯 Overview

This consolidated guide provides step-by-step instructions for testing the Virion Labs referral system as an end user. It covers the full journey: 
- **Admin**: Creating campaigns in the dashboard.
- **Influencer**: Creating referral links for campaigns.
- **Referred User**: Joining via referral, onboarding in Discord, and completing the process.
- **Verification**: Checking analytics in the dashboard.

The system uses a campaign-first approach, where campaigns are tied to Discord servers and drive bot behavior. All steps assume you're using the production dashboard or a local development server (running at http://localhost:3000). If testing locally, ensure the Discord bot is running (via `yarn start` in virion-labs-discord-bot).

**Important Notes:**
- Use test accounts (e.g., from tests/credentials/TEST_CREDENTIALS.md).
- This guide excludes outdated static bot configs; everything is campaign-driven.
- Verify each step's success before proceeding.
- If issues arise, check logs via MCP tools or consult KB/troubleshooting/.

## 🏗️ Pre-Test Setup

### 1. Accounts and Access
- **Admin Account**: Email: vercilliusjrmila+johnadmin@gmail.com | Password: johnadmin (or your admin credentials).
- **Influencer Account**: Create or use an existing influencer account in the dashboard.
- **Referred User**: A Discord account not yet in the target server (use a secondary account).
- **Discord Server**: Ensure you have a test Discord server with the bot added. Note the Guild ID, Channel IDs, and Role IDs from .env or dashboard configs.

### 2. Local Environment (If Testing Locally)
- Dashboard: In virion-labs-dashboard, run `yarn dev` (server at http://localhost:3000).
- Discord Bot: In virion-labs-discord-bot, run `yarn start` (bot logs in and server runs on port 3001).
- Database: Ensure Supabase is connected (check .env for URLs/keys).

### 3. Clean Test Data
- Log in as admin and delete any test campaigns/referral links from previous tests.
- In Discord, remove test users from the server if needed.

---

## 🧪 Phase 1: Admin - Create a Campaign (15 mins)

As an admin, you'll set up a campaign in the dashboard, which will be available for influencers and drive Discord bot behavior.

1. Open your browser and go to http://localhost:3000 (or production URL).
2. Click \"Login\" in the top right.
3. Enter admin credentials and sign in.
4. In the sidebar, navigate to \"Bot Campaigns\".
5. Click \"Create Campaign\".
6. Fill in the form:
   - **Campaign Name**: Enter \"Test Referral Campaign\".
   - **Campaign Type**: Select \"Referral Onboarding\" (for referral-focused behavior).
   - **Discord Server**: Select or enter your test Discord Guild ID.
   - **Target Channel**: Select or enter a channel ID for onboarding (e.g., welcome channel).
   - **Auto Role Assignment**: Enable and select a test role (e.g., \"Test Member\") to assign on completion.
   - **Other Settings**: Set start/end dates if desired; enable referral tracking.
7. Click \"Save\" or \"Create\".
8. Verify: Refresh the page and see the new campaign listed. Note the Campaign ID for later.

**Expected Outcome**: Campaign is created and visible. In the database (if checking), a new record appears in `discord_guild_campaigns`.

---

## 🧪 Phase 2: Influencer - Create Referral Link (10 mins)

As an influencer, you'll browse available campaigns and create a referral link.

1. If not already, log out of the admin account and log in as an influencer (or sign up if needed).
2. In the sidebar, navigate to \"Available Campaigns\".
3. Browse the list and find \"Test Referral Campaign\" (from Phase 1).
4. Click on it to view details.
5. Click \"Create Referral Link\".
6. Fill in the form:
   - **Title**: \"Test Link for Referral Campaign\".
   - **Description**: \"Join our test community!\".
   - **Platform**: Select \"Discord\" or \"TikTok\".
   - **Enable Landing Page**: Check if you want a custom page.
7. Click \"Generate Link\".
8. Copy the generated referral URL (e.g., https://ref.virionlabs.com/test-code) and referral code.

**Expected Outcome**: Link is created and listed in \"My Links\". Clicks and conversions start at 0.

---

## 🧪 Phase 3: Referred User - Join and Onboard via Discord (20 mins)

Simulate a user discovering the referral link and joining Discord.

1. Using a secondary browser or incognito mode, paste the referral URL from Phase 2.
2. On the landing page:
   - Verify campaign details display (e.g., name, description).
   - Click \"Join Discord\" or similar button.
3. This redirects to a unique Discord invite (generated on-the-fly).
4. Accept the invite with your test Discord account – join the server.
5. In Discord:
   - The bot should detect the join (via managed invite) and send a welcome message (e.g., in DM or welcome channel) with a \"Start Onboarding\" button.
   - Click the button (or respond if prompted).
   - Complete the onboarding modal/forms (e.g., provide name, email if required by campaign).
   - Submit the final step.
6. Verify: The bot assigns the role (e.g., \"Test Member\") and sends a completion message. Check your roles in the server.

**Expected Outcome**: Successful onboarding with role assignment. If referral code was used, it's attributed correctly.

---

## 🧪 Phase 4: Verify Analytics in Dashboard (10 mins)

Check how the referral reflects in analytics for both admin and influencer.

### As Influencer:
1. Log back into the dashboard as the influencer.
2. Go to \"My Links\".
3. Find your test link – verify:
   - Clicks: At least 1 (from Phase 3).
   - Conversions: 1 (from onboarding completion).
4. Go to \"Analytics\" – check charts for the campaign (e.g., completion rate >0%).

### As Admin:
1. Log in as admin.
2. Go to \"Analytics\".
3. Verify platform-wide metrics:
   - Total Clicks: Incremented.
   - Total Conversions: 1 new.
   - Completion Rate: Calculated (e.g., if 1 start and 1 completion, 100%).
   - Campaign-specific: Drill down to \"Test Referral Campaign\" for user starts/completions.
4. Optional: Export data via \"Export\" button and check CSV for the test referral.

**Expected Outcome**: All metrics update in real-time or after refresh. If not, wait 1-2 minutes for eventual consistency.

---

## 🔍 Edge Cases to Test (Optional, 20 mins)

- **Invalid Referral**: Use a fake code – bot should handle gracefully (e.g., general welcome without special roles).
- **Duplicate Join**: Re-join with the same user – verify no duplicate conversions.
- **Expired Link**: As admin, deactivate the link and test click (should show error).
- **Analytics Sync**: Create multiple links/users and verify aggregated dashboard stats.

## 🛠️ Troubleshooting

- **No Bot Response**: Check bot logs (terminal) for errors; ensure campaign is active.
- **Analytics Not Updating**: Refresh page or check database via Supabase dashboard.
- **Invite Issues**: Verify Discord permissions for the bot.
- For more, see KB/troubleshooting/ files.

If you encounter bugs, note them in tests/reports/bug-reports/ and re-run tests after fixes.

**End of Manual**. Test complete! If successful, the referral system works end-to-end. 