# 🎯 Comprehensive Campaign & Referral Process Testing Guide

**Version:** 2.0 | **Last Updated:** January 2025 | **Duration:** 2-3 hours  
**Priority:** CRITICAL - This tests the core business value proposition

## 🎯 Overview

This guide tests the **complete end-to-end campaign and referral flow** that represents the core value of the Virion Labs platform. It covers the full user journey from admin campaign setup → influencer referral link creation → user discovery → Discord bot interaction → conversion tracking.

## 📚 Reference Documentation

- **Complete User Journey**: `KB/dashboard/feature-summaries/COMPLETE_USER_JOURNEY.md`
- **Technical Implementation**: `KB/dashboard/feature-summaries/CAMPAIGN_REFERRAL_INTEGRATION_TECHNICAL_GUIDE.md`
- **Analytics Tracking**: `ANALYTICS_TRACKING_REPORT.md`

---

## 🏗️ Pre-Test Setup Requirements

### 1. Environment Setup
```bash
# Terminal 1: Dashboard
cd virion-labs-dashboard
npm run dev
# ✅ Expected: Local: http://localhost:3000

# Terminal 2: Discord Bot
cd virion-labs-discord-bot
npm start
# ✅ Expected: Discord bot logged in as [BotName]
# ✅ Expected: HTTP server running on port 3001
```

### 2. Discord Server Configuration
```bash
# Required Discord IDs (check .env files)
DISCORD_GUILD_ID=your_test_server_id_here
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=your_campaigns_channel_id_here
DISCORD_VERIFIED_ROLE_ID=your_test_role_id_here
```

### 3. Test Data Preparation
```sql
-- Verify test client exists
SELECT id, name FROM clients WHERE name LIKE '%Test%' OR name LIKE '%Fashion%';

-- Check existing campaigns to avoid duplicates
SELECT id, campaign_name FROM discord_guild_campaigns WHERE campaign_name LIKE '%Test%';
```

---

## 🧪 Phase 1: Admin Campaign Creation & Configuration (45 mins)

### Step 1.1: Create Test Client (if needed)

**Admin Login:**
```
Email: vercilliusjrmila+johnadmin@gmail.com
Password: johnadmin
```

1. **Navigate to Clients Page**
   - [ ] Dashboard loads correctly with admin navigation
   - [ ] "Clients" link accessible in sidebar

2. **Create Test Client (if not exists):**
   ```
   Name: "Fashion Forward Brand [Date]"
   Industry: Fashion
   Website: https://fashionforward.example.com
   Contact: test-campaign@example.com
   Description: Test client for campaign referral testing
   ```
   - [ ] Form validation works
   - [ ] Client creation succeeds
   - [ ] Success notification appears
   - [ ] **DB Verify:** `SELECT * FROM clients WHERE name LIKE 'Fashion Forward Brand%';`

### Step 1.2: Campaign Creation with Campaign-First Approach

1. **Navigate to Bot Campaigns:**
   - [ ] "Bot Campaigns" page loads correctly
   - [ ] "Create Campaign" button visible

2. **Create Campaign Using Product Promotion Template:**
   ```
   Template: Product Promotion
   Client: Fashion Forward Brand [Date]
   Campaign Name: "Summer Fashion Launch [Date-Time]"
   Campaign Type: product_promotion
   Discord Server ID: [Your DISCORD_GUILD_ID]
   Description: "Promote our new summer collection with exclusive Discord perks"
   
   Advanced Configuration:
   ✅ Auto Role Assignment: Enabled
   Target Role IDs: [Your DISCORD_VERIFIED_ROLE_ID]
   Welcome Message: "Welcome to our Summer Launch! 🌞 Share your referral code for exclusive perks!"
   Brand Color: #ff6b6b
   Campaign Start Date: Today
   Campaign End Date: +30 days
   ```

3. **Campaign Publishing:**
   - [ ] Campaign appears in list as "Active"
   - [ ] "Publish to Discord" button works
   - [ ] Discord channel receives campaign publish message
   - [ ] **DB Verify:**
   ```sql
   SELECT id, campaign_name, campaign_type, guild_id, is_active, target_role_ids, metadata
   FROM discord_guild_campaigns 
   WHERE campaign_name LIKE 'Summer Fashion Launch%';
   ```

### Step 1.3: Campaign Configuration Verification

1. **Verify Campaign Settings:**
   - [ ] Auto role assignment configured correctly
   - [ ] Target role IDs match Discord server roles
   - [ ] Welcome message contains campaign context
   - [ ] Brand color and styling applied

2. **Discord Bot Integration Check:**
   - [ ] `/join` command shows new campaign
   - [ ] Campaign button appears in Discord
   - [ ] Button click opens onboarding modal

---

## 🧪 Phase 2: Influencer Campaign Discovery & Referral Link Creation (30 mins)

### Step 2.1: Switch to Influencer Account

**Influencer Login:**
```
Email: test.manual.2025@example.com
Password: TestPassword123!
```

### Step 2.2: Campaign Discovery Flow

1. **Navigate to Available Campaigns:**
   - [ ] "Available Campaigns" page exists in navigation
   - [ ] Page loads with campaign browsing interface
   - [ ] **Expected**: Campaign created in Phase 1 appears in list

2. **Campaign Information Display:**
   ```
   Expected Campaign Card:
   - Campaign Name: "Summer Fashion Launch [Date-Time]"
   - Client: "Fashion Forward Brand [Date]" 
   - Campaign Type: Product Promotion
   - Discord Server: [Your server name]
   - Description: Campaign description visible
   - Status: Available to join
   ```
   - [ ] Campaign details display correctly
   - [ ] "Create Referral Link" button available
   - [ ] Access permissions working correctly

### Step 2.3: Campaign-Specific Referral Link Creation

1. **Create Referral Link for Campaign:**
   - [ ] Click "Create Referral Link" for Summer Fashion campaign
   - [ ] Campaign context pre-populated in form
   
   **Form Configuration:**
   ```
   Title: "Summer Fashion Haul 2024 [Time]"
   Description: "My favorite pieces from the new summer collection - join the Discord for exclusive perks!"
   Platform: TikTok
   Campaign: "Summer Fashion Launch [Date-Time]" (pre-selected)
   Landing Page Enabled: ✅
   Redirect to Discord: ✅
   ```

2. **Verify Campaign Association:**
   - [ ] Campaign field is pre-selected and locked
   - [ ] Form shows campaign-specific context
   - [ ] Success modal includes campaign information
   - [ ] Generated link includes campaign context

3. **Database Verification:**
   ```sql
   SELECT 
       rl.id, rl.title, rl.referral_code, rl.campaign_id,
       dgc.campaign_name, dgc.campaign_type
   FROM referral_links rl
   JOIN discord_guild_campaigns dgc ON rl.campaign_id = dgc.id
   WHERE rl.title LIKE 'Summer Fashion Haul%'
   AND dgc.campaign_name LIKE 'Summer Fashion Launch%';
   ```
   - [ ] Referral link correctly linked to campaign
   - [ ] Campaign association stored properly

---

## 🧪 Phase 3: End-to-End User Discovery & Conversion Flow (45 mins)

### Step 3.1: Referral Link Click Simulation

1. **Copy Generated Referral Link:**
   - [ ] Copy link from success modal or My Links page
   - [ ] Format: `http://localhost:3000/r/[referral-code]`

2. **Simulate User Click (New Browser/Incognito):**
   - [ ] Open referral link in new incognito window
   - [ ] **Expected**: Campaign-specific landing page loads
   - [ ] Landing page shows:
     ```
     - Campaign name: "Summer Fashion Launch"
     - Client branding: Fashion Forward Brand
     - Influencer information
     - Campaign description
     - "Join Discord" CTA button
     ```

3. **Verify Click Tracking:**
   - [ ] Return to influencer dashboard
   - [ ] Click count incremented on referral link
   - [ ] **DB Verify:**
   ```sql
   SELECT event_type, created_at, user_agent 
   FROM referral_analytics 
   WHERE link_id = '[referral_link_id]'
   ORDER BY created_at DESC;
   ```

### Step 3.2: Discord Server Join & Bot Interaction

1. **Discord Join Flow:**
   - [ ] Click "Join Discord" from landing page
   - [ ] Discord invite link works
   - [ ] User joins Discord server successfully

2. **Campaign-Specific Bot Detection:**
   - [ ] Discord bot detects new member
   - [ ] Bot identifies referral context
   - [ ] **Expected Welcome Message:**
   ```
   🌞 Welcome to Fashion Forward Community!
   
   I see you discovered us through [Influencer Name]'s summer fashion content!
   
   To unlock exclusive perks from our Summer Fashion Launch:
   1. Share your referral code: [referral-code]
   2. Get the "Summer VIP" role
   3. Access exclusive previews and discounts!
   ```

3. **Referral Code Processing:**
   - [ ] User shares referral code in Discord chat
   - [ ] Bot validates code against campaign
   - [ ] **Expected Response:**
   ```
   ✅ Valid Referral Code!
   Great! Your referral code is valid.
   
   Influencer: [Influencer Name]
   Campaign: Summer Fashion Launch [Date-Time]
   
   🚀 Use /join in [Server Name] to begin your onboarding!
   ```

### Step 3.3: Campaign-Specific Onboarding Flow

1. **Discord Onboarding Modal:**
   - [ ] User runs `/join` command
   - [ ] Campaign appears in available campaigns
   - [ ] User clicks "Summer Fashion Launch" button
   - [ ] **Expected**: Campaign-specific onboarding modal opens

2. **Complete Onboarding with Referral Context:**
   - [ ] Modal includes campaign branding
   - [ ] Form fields relevant to fashion campaign
   - [ ] Submit onboarding successfully
   - [ ] **Expected**: Role assignment occurs automatically
   - [ ] **Expected**: Welcome message references campaign and influencer

3. **Verify Role Assignment:**
   - [ ] User receives configured Discord role
   - [ ] Role matches campaign configuration
   - [ ] Role permissions working correctly

---

## 🧪 Phase 4: Conversion Tracking & Analytics Verification (30 mins)

### Step 4.1: Referral Conversion Recording

1. **Automatic Conversion Detection:**
   - [ ] Discord bot detects completed onboarding
   - [ ] Bot calls referral completion API
   - [ ] **DB Verify - Referral Record Created:**
   ```sql
   SELECT 
       r.id, r.referral_link_id, r.discord_id, r.discord_username,
       rl.title, rl.referral_code,
       dgc.campaign_name
   FROM referrals r
   JOIN referral_links rl ON r.referral_link_id = rl.id
   JOIN discord_guild_campaigns dgc ON rl.campaign_id = dgc.id
   WHERE rl.title LIKE 'Summer Fashion Haul%'
   ORDER BY r.created_at DESC;
   ```

2. **Conversion Statistics Update:**
   - [ ] Referral link conversion count increments
   - [ ] Campaign conversion statistics update
   - [ ] **DB Verify:**
   ```sql
   SELECT clicks, conversions, conversion_rate
   FROM referral_links 
   WHERE title LIKE 'Summer Fashion Haul%';
   ```

### Step 4.2: Analytics Dashboard Verification

1. **Influencer Dashboard Analytics:**
   - [ ] Switch back to influencer account
   - [ ] Navigate to "My Links" page
   - [ ] Verify updated metrics:
     - [ ] Click count increased
     - [ ] Conversion count increased
     - [ ] Conversion rate calculated correctly
   - [ ] Navigate to "Referrals" page
   - [ ] Verify new referral appears in list with campaign context

2. **Admin Dashboard Analytics:**
   - [ ] Switch to admin account
   - [ ] Navigate to Analytics page
   - [ ] Verify platform-wide metrics updated:
     - [ ] Total conversions increased
     - [ ] Campaign metrics reflect new conversion
     - [ ] User completion tracking updated

### Step 4.3: Campaign Performance Tracking

1. **Campaign-Specific Analytics:**
   - [ ] Navigate to Bot Campaigns page
   - [ ] Campaign shows updated interaction counts
   - [ ] **DB Verify - Campaign Statistics:**
   ```sql
   SELECT 
       campaign_name,
       total_interactions,
       successful_onboardings,
       referral_conversions,
       CASE 
           WHEN total_interactions > 0 
           THEN ROUND((successful_onboardings::decimal / total_interactions) * 100, 2)
           ELSE 0 
       END as completion_rate
   FROM discord_guild_campaigns 
   WHERE campaign_name LIKE 'Summer Fashion Launch%';
   ```

2. **End-to-End Attribution Verification:**
   - [ ] Confirm complete attribution chain:
     - Campaign → Referral Link → Click → Discord Join → Onboarding → Conversion
   - [ ] Verify all tracking points logged correctly
   - [ ] Confirm no data loss in the funnel

---

## 🧪 Phase 5: Advanced Campaign Features Testing (30 mins)

### Step 5.1: Multiple Campaign Scenario

1. **Create Second Campaign (Different Type):**
   ```
   Template: Community Engagement
   Campaign Name: "VIP Support Community [Date-Time]"
   Campaign Type: customer_support
   Same Discord Server
   Different Role: Create new role for testing
   ```

2. **Test Campaign Filtering:**
   - [ ] Influencer sees both campaigns in Available Campaigns
   - [ ] Can create referral links for both
   - [ ] Discord `/join` shows both campaigns
   - [ ] Bot correctly differentiates between campaigns

### Step 5.2: Campaign Status Management

1. **Test Campaign Pause/Resume:**
   - [ ] Admin pauses "Summer Fashion Launch" campaign
   - [ ] Verify referral links deactivated automatically
   - [ ] Test referral link click (should show expired/inactive)
   - [ ] Resume campaign
   - [ ] Verify referral links reactivated
   - [ ] **DB Verify:**
   ```sql
   SELECT is_active, metadata FROM referral_links 
   WHERE campaign_id IN (
       SELECT id FROM discord_guild_campaigns 
       WHERE campaign_name LIKE 'Summer Fashion Launch%'
   );
   ```

### Step 5.3: Error Handling & Edge Cases

1. **Invalid Referral Code Test:**
   - [ ] User shares invalid/fake referral code in Discord
   - [ ] Bot responds with appropriate error message
   - [ ] No conversion recorded for invalid codes

2. **Expired Campaign Test:**
   - [ ] Set campaign end date to past
   - [ ] Test referral link behavior
   - [ ] Verify appropriate messaging to users

3. **Guild Mismatch Test:**
   - [ ] Test referral code in wrong Discord server
   - [ ] Verify bot rejects invalid guild contexts

---

## 📊 Success Criteria & Database Validation

### Critical Success Metrics

**Complete User Journey:**
- [ ] Admin creates campaign successfully
- [ ] Campaign appears in influencer dashboard
- [ ] Influencer creates campaign-specific referral link
- [ ] User clicks link and sees campaign landing page
- [ ] User joins Discord and completes campaign onboarding
- [ ] Conversion properly attributed to influencer and campaign

**Data Integrity:**
```sql
-- Verify complete attribution chain
SELECT 
    dgc.campaign_name,
    rl.title as referral_title,
    r.discord_username,
    ra.event_type,
    ra.created_at
FROM discord_guild_campaigns dgc
JOIN referral_links rl ON dgc.id = rl.campaign_id
JOIN referrals r ON rl.id = r.referral_link_id
JOIN referral_analytics ra ON rl.id = ra.link_id
WHERE dgc.campaign_name LIKE 'Summer Fashion Launch%'
ORDER BY ra.created_at;
```

**Analytics Accuracy:**
- [ ] Click counts match between frontend and database
- [ ] Conversion counts accurate across all dashboards
- [ ] Campaign metrics reflect true activity
- [ ] No data loss in tracking pipeline

### Performance Validation
- [ ] Referral link redirects work quickly (< 2 seconds)
- [ ] Discord bot responds to commands promptly
- [ ] Dashboard updates reflect changes in real-time
- [ ] Database queries perform efficiently

---

## 🐛 Issue Documentation

**Found Issues Should Include:**
1. **Reproduction Steps** - Exact sequence that caused the issue
2. **Expected vs Actual** - What should happen vs what happened
3. **Campaign Context** - Which campaign/referral link was involved
4. **Database State** - Relevant database query results
5. **Screenshots** - Visual evidence of the issue
6. **Impact Level** - Critical/High/Medium/Low based on user journey impact

**Example Issue Template:**
```
Title: Referral conversion not recorded for campaign X
Steps: 1. Created campaign, 2. Created referral link, 3. User clicked link...
Expected: Conversion recorded in referrals table
Actual: No conversion record created
Database Query: SELECT * FROM referrals WHERE referral_link_id = 'xxx'
Impact: Critical - breaks core business value
```

---

## 🔄 Post-Test Cleanup

```sql
-- Remove test campaigns
DELETE FROM discord_guild_campaigns WHERE campaign_name LIKE '%Test%' OR campaign_name LIKE 'Summer Fashion Launch%';

-- Remove test referral links
DELETE FROM referral_links WHERE title LIKE '%Summer Fashion Haul%';

-- Remove test conversions
DELETE FROM referrals WHERE referral_link_id IN (
    SELECT id FROM referral_links WHERE title LIKE '%Test%'
);

-- Remove test clients (optional)
DELETE FROM clients WHERE name LIKE 'Fashion Forward Brand%';
```

**Expected Result:** Complete campaign and referral flow working end-to-end with proper attribution and analytics tracking across all user roles. 