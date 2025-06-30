# 🤖 Discord Bot Testing Guide - Critical Use Cases

**Version:** 1.0 | **Test Duration:** 90-120 minutes | **Priority:** CRITICAL

> **🎯 IMPORTANT**: For complete **End-to-End Campaign & Referral Flow Testing**, use the dedicated guide: `CAMPAIGN_REFERRAL_FLOW_TESTING.md` (2-3 hours). This guide covers Discord bot functionality in isolation.

## 🎯 Overview

This guide covers testing Discord bot functionality in isolation - campaigns, referrals, onboarding modals, and analytics tracking. For complete user journey testing including dashboard integration, use the comprehensive campaign flow guide.

---

## 📋 Pre-Test Setup Requirements

### 1. Discord Server Configuration

**Required Discord IDs (Multiple ways to get these):**

#### Option A: Check Environment Variables
```bash
# Check existing configuration
cd virion-labs-discord-bot
cat .env | grep DISCORD_

# Should show:
DISCORD_GUILD_ID=your_test_server_id_here
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=your_campaigns_channel_id_here
DISCORD_VERIFIED_ROLE_ID=your_test_role_id_here
DISCORD_REQUEST_ACCESS_CHANNEL_ID=your_request_channel_id_here
```

#### Option B: Get from Discord App Manually
```bash
# How to get Discord IDs manually:
1. Enable Developer Mode: Discord Settings → Advanced → Developer Mode ✅
2. Right-click server name → "Copy Server ID" (for GUILD_ID)
3. Right-click #join-campaigns channel → "Copy Channel ID" (for CHANNEL_ID)
4. Server Settings → Roles → Right-click role → "Copy Role ID" (for ROLE_ID)
```

#### Option C: Use Existing Test Values (if configured)
```bash
# Common test server setup
DISCORD_GUILD_ID=123456789012345678
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=987654321098765432
DISCORD_VERIFIED_ROLE_ID=555666777888999000
```

### 2. Environment Verification

**Check Bot Environment:**
```bash
cd virion-labs-discord-bot
echo "DISCORD_GUILD_ID=$DISCORD_GUILD_ID"
echo "DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=$DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID"
echo "DISCORD_VERIFIED_ROLE_ID=$DISCORD_VERIFIED_ROLE_ID"
```

**Check Dashboard Environment:**
```bash
cd virion-labs-dashboard
echo "DISCORD_GUILD_ID=$DISCORD_GUILD_ID"
echo "DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=$DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID"
```

### 3. Start Services

```bash
# Terminal 1: Start Dashboard
cd virion-labs-dashboard
npm run dev
# ✅ Should show: Local: http://localhost:3000

# Terminal 2: Start Discord Bot
cd virion-labs-discord-bot
npm start
# ✅ Should show: Discord bot logged in as [BotName]
# ✅ Should show: HTTP server running on port 3001

# Terminal 3: Monitor Logs (Optional)
cd virion-labs-discord-bot
tail -f logs/bot.log
```

---

## 🧪 Phase 1: Campaign Setup & Publishing (20 mins)

### Step 1.1: Create Test Campaign in Dashboard

1. **Login as Admin:**
   ```
   Email: vercilliusjrmila+johnadmin@gmail.com
   Password: johnadmin
   ```

2. **Navigate & Create:**
   - Go to **Bot Campaigns** page
   - Click **"Create Campaign"**
   - **Template**: Select "Referral Onboarding"
   - **Client**: Select existing or create "Discord Test Client"

3. **Campaign Configuration:**
   ```
   Campaign Name: "Discord Bot Test Campaign [Today's Date]"
   Discord Server ID: [Use your DISCORD_GUILD_ID from env]
   Private Channel ID: [Leave blank for public campaign]
   Description: "Testing Discord bot integration and analytics"
   ```

4. **Advanced Settings:**
   - ✅ **Auto Role Assignment**: Enable
   - **Target Role IDs**: `[Your DISCORD_VERIFIED_ROLE_ID from env]`
   - **Welcome Message**: "Welcome to our test campaign! 🎉"

5. **Verification Steps:**
   - [ ] Campaign appears in Bot Campaigns list
   - [ ] Status shows "Active"
   - [ ] Target role IDs display correctly
   - [ ] **DB Verify:** 
     ```sql
     SELECT id, campaign_name, guild_id, target_role_ids, is_active 
     FROM discord_guild_campaigns 
     WHERE campaign_name LIKE '%Discord Bot Test%';
     ```

### Step 1.2: Publish Campaign to Discord

1. **Publish Process:**
   - Click **"Publish to Discord"** button in Bot Campaigns page
   - Wait for success toast notification
   - **Expected**: "Successfully published 1 campaign(s)"

2. **Discord Channel Verification:**
   - Go to your Discord server
   - Navigate to the `#join-campaigns` channel (or your configured channel)
   - **Expected**: Bot message appears with:
     ```
     🎯 Join Our Campaigns!
     Welcome to [Server Name]! 🚀
     
     We have 1 active campaign you can join:
     1. Discord Bot Test Campaign [Date]
     
     🚀 Ready to get started? Click the button below...
     [Get Started] button
     ```

3. **Log Verification:**
   ```bash
   # Check bot logs for successful publishing
   📡 Received webhook request to publish campaigns
   🎯 Auto-publishing campaigns to guild: [GUILD_ID]
   ✅ Campaigns published successfully via webhook
   ```

---

## 🧪 Phase 2: Discord Slash Commands (15 mins)

### Step 2.1: Test `/join` Command

1. **Basic Command Test:**
   - In Discord, type `/join` in any channel
   - **Expected Results:**
     - Command autocompletes properly
     - Bot responds with campaign selection embed
     - Campaign buttons appear with correct names
     - "🚀" emoji on buttons for join-campaigns channel

2. **Channel Context Testing:**
   - Run `/join` in different channels
   - **Expected**: Same campaigns appear (since test campaign is public)
   - **Future**: Create private campaign to test channel filtering

3. **Command Response Verification:**
   ```
   Expected Embed:
   Title: "🎯 Available Campaigns"
   Description: Shows campaign count and list
   Buttons: One button per active campaign (max 25)
   Footer: Shows total campaigns and active count
   ```

### Step 2.2: Campaign Button Interaction

1. **Click Campaign Button:**
   - Click the "Discord Bot Test Campaign" button
   - **Critical**: Modal should appear within 3 seconds
   - **Expected**: Onboarding modal with form fields

2. **Button Validation:**
   - [ ] Button label matches campaign name
   - [ ] Button style is correct (Primary for join-campaigns)
   - [ ] Button custom ID format: `start_onboarding_{campaignId}_{userId}`

---

## 🧪 Phase 3: Onboarding Modal Testing (25 mins)

### Step 3.1: Modal Display & Validation

1. **Modal Appearance Check:**
   ```
   Expected Modal:
   Title: "Join Discord Bot Test Campaign [Date]"
   Fields: 3 fields (based on current campaign template)
   - Display Name (required, short text)
   - Interests (required, short text) 
   - Community Goals (required, paragraph text)
   ```

2. **Field Validation Testing:**
   - **Empty Required Fields**: Leave "Display Name" blank → Submit
     - **Expected**: Discord validation error
   - **Character Limits**: Enter 2000+ characters in paragraph field
     - **Expected**: Discord truncation or validation
   - **Valid Input**: Fill all fields properly

### Step 3.2: Successful Modal Submission

1. **Complete Form with Valid Data:**
   ```
   Display Name: "Test User Bot Test [Time]"
   Interests: "Gaming, Technology, Discord Bots, Community Building"
   Community Goals: "I want to learn about Discord bot development and connect with other developers. Looking forward to participating in campaigns and helping test new features!"
   ```

2. **Submit and Verify Response:**
   - Click "Submit"
   - **Expected Immediate Response**:
     ```
     🎉 Onboarding Complete!
     Welcome to [Client Name]!
     
     Thank you for completing the onboarding process!
     
     ✨ What's next?
     • Explore our community channels
     • Connect with other members  
     • Get exclusive campaign benefits
     ```

3. **Role Assignment Verification:**
   - Check if user received the configured role
   - **Look for**: Role assignment message or role appears in member list
   - **Note**: Requires bot to have role management permissions

### Step 3.3: Database Verification - Critical

```sql
-- 1. Check onboarding responses were saved
SELECT 
    cor.field_key, 
    cor.field_value, 
    cor.discord_username,
    cor.created_at
FROM campaign_onboarding_responses cor
JOIN discord_guild_campaigns dgc ON cor.campaign_id = dgc.id
WHERE dgc.campaign_name LIKE '%Discord Bot Test%'
ORDER BY cor.created_at DESC;

-- 2. Verify completion tracking
SELECT 
    coc.discord_username,
    coc.completed_at,
    dgc.campaign_name
FROM campaign_onboarding_completions coc
JOIN discord_guild_campaigns dgc ON coc.campaign_id = dgc.id
WHERE dgc.campaign_name LIKE '%Discord Bot Test%'
ORDER BY coc.completed_at DESC;

-- 3. Check start tracking for completion rate calculation
SELECT 
    cos.discord_username,
    cos.started_at,
    dgc.campaign_name
FROM campaign_onboarding_starts cos
JOIN discord_guild_campaigns dgc ON cos.campaign_id = dgc.id
WHERE dgc.campaign_name LIKE '%Discord Bot Test%'
ORDER BY cos.started_at DESC;

-- 4. Verify campaign stats updated
SELECT 
    campaign_name,
    total_interactions,
    successful_onboardings,
    CASE 
        WHEN total_interactions > 0 
        THEN ROUND((successful_onboardings::decimal / total_interactions) * 100, 2)
        ELSE 0 
    END as completion_rate
FROM discord_guild_campaigns 
WHERE campaign_name LIKE '%Discord Bot Test%';
```

### Step 3.4: Error Scenarios & Edge Cases

1. **Duplicate Submission Test:**
   - Same user clicks campaign button again
   - **Expected**: "✅ Already Completed" message
   - **Verify**: No duplicate records in database

2. **Modal Timeout Test:**
   - Open modal, wait 5+ minutes, then submit
   - **Expected**: Session handling or timeout message

3. **Invalid User Test:**
   - User tries to submit modal for different user (edge case)
   - **Expected**: "This form is not for you" error

---

## 🧪 Phase 4: Referral Integration Testing (30 mins)

### Step 4.1: Create Discord Referral Link

1. **Switch to Influencer Account:**
   ```
   Email: test.manual.2025@example.com
   Password: TestPassword123!
   ```

2. **Create Referral Link:**
   - Navigate to **My Links** → **Create New Link**
   - **Configuration:**
     ```
     Title: "Discord Bot Referral Test [Time]"
     Platform: Discord
     Original URL: https://discord.gg/[your-server-invite]
     Campaign: Select "Discord Bot Test Campaign"
     Description: "Testing referral integration with Discord bot"
     ```

3. **Capture Referral Details:**
   - Copy generated referral URL
   - **Format**: `http://localhost:3000/api/referral/[unique-code]`
   - Note the referral code for tracking

### Step 4.2: Referral Click Simulation

1. **Test Referral Redirect:**
   - Open referral URL in new browser/incognito window
   - **Expected**: Automatic redirect to Discord invite
   - **Verify**: Click count increments in dashboard

2. **Database Click Tracking:**
   ```sql
   -- Verify click was tracked
   SELECT * FROM referral_analytics 
   WHERE link_id IN (
     SELECT id FROM referral_links 
     WHERE title LIKE '%Discord Bot Referral Test%'
   )
   ORDER BY created_at DESC;
   ```

### Step 4.3: Referral-Based Onboarding

1. **Join via Referral (Simulation):**
   - Use test Discord account to join server via referral invite
   - **Expected**: Bot detects managed invite
   - **Expected**: Automatic onboarding prompt with referral context

2. **Complete Referral Onboarding:**
   - Fill modal with different data than previous test
   - **Expected**: Referral code tracked in submission
   - **Expected**: Conversion counted for referral link

3. **Referral Analytics Verification:**
   ```sql
   -- Check referral conversions
   SELECT 
       rl.title,
       rl.clicks,
       rl.conversions,
       rl.created_at
   FROM referral_links rl
   WHERE rl.title LIKE '%Discord Bot Referral Test%';

   -- Check Discord interactions with referral context
   SELECT 
       dri.discord_username,
       dri.interaction_type,
       dri.referral_code_provided,
       dri.created_at
   FROM discord_referral_interactions dri
   JOIN discord_guild_campaigns dgc ON dri.guild_campaign_id = dgc.id
   WHERE dgc.campaign_name LIKE '%Discord Bot Test%'
     AND dri.referral_code_provided IS NOT NULL;
   ```

---

## 🧪 Phase 5: Analytics & Tracking Verification (15 mins)

### Step 5.1: Discord Interaction Analytics

1. **Complete Interaction Analysis:**
   ```sql
   -- All Discord interactions for test campaign
   SELECT 
       dri.interaction_type,
       COUNT(*) as interaction_count,
       dri.discord_username,
       MAX(dri.created_at) as latest_interaction
   FROM discord_referral_interactions dri
   JOIN discord_guild_campaigns dgc ON dri.guild_campaign_id = dgc.id
   WHERE dgc.campaign_name LIKE '%Discord Bot Test%'
   GROUP BY dri.interaction_type, dri.discord_username
   ORDER BY latest_interaction DESC;
   ```

2. **Expected Interaction Types:**
   - `slash_command_join` - /join command usage
   - `onboarding_start_button` - Campaign button clicks  
   - `onboarding_modal_submission` - Modal submissions
   - `onboarding_completed` - Successful completions
   - `referral_validation` - Referral code processing

### Step 5.2: Dashboard Analytics Verification

1. **Admin Analytics Check:**
   - Login as admin → Navigate to **Analytics** page
   - **Expected Updates:**
     - Users Started count increased
     - Completion Rate reflects new completions
     - Campaign-specific metrics updated

2. **Real-time Verification:**
   - Perform new Discord interaction
   - Refresh analytics page within 30 seconds
   - **Expected**: Numbers update immediately

### Step 5.3: Campaign Performance Metrics

```sql
-- Campaign performance overview
SELECT 
    dgc.campaign_name,
    dgc.total_interactions,
    dgc.successful_onboardings,
    dgc.referral_conversions,
    CASE 
        WHEN dgc.total_interactions > 0 
        THEN ROUND((dgc.successful_onboardings::decimal / dgc.total_interactions) * 100, 2)
        ELSE 0 
    END as completion_rate_percent,
    dgc.created_at,
    dgc.is_active
FROM discord_guild_campaigns dgc
WHERE dgc.campaign_name LIKE '%Test%'
ORDER BY dgc.created_at DESC;
```

---

## 🧪 Phase 6: Advanced & Edge Case Testing (15 mins)

### Step 6.1: Private Channel Campaign Testing

1. **Create Private Campaign:**
   - New campaign with specific **Private Channel ID**
   - Use a private Discord channel ID
   - **Test**: `/join` in private channel shows this campaign
   - **Test**: `/join` in public channel doesn't show private campaign

2. **Channel Filtering Verification:**
   ```sql
   -- Verify campaign channel filtering
   SELECT 
       campaign_name,
       guild_id,
       channel_id,
       CASE 
           WHEN channel_id IS NULL THEN 'Public Campaign'
           ELSE 'Private Campaign'
       END as campaign_type
   FROM discord_guild_campaigns
   WHERE is_active = true;
   ```

### Step 6.2: Multiple Campaign Testing

1. **Create Second Campaign:**
   - Different template, different role assignments
   - **Test**: Both campaigns appear in `/join`
   - **Test**: User can complete both campaigns independently

2. **Campaign Isolation Test:**
   - Verify data doesn't cross between campaigns
   - Check role assignments are campaign-specific

### Step 6.3: Error Scenario Testing

1. **Bot Offline Test:**
   - Stop Discord bot: `Ctrl+C` in bot terminal
   - Try "Publish to Discord" from dashboard
   - **Expected**: Graceful error message

2. **Invalid Environment Test:**
   - Temporarily change `DISCORD_GUILD_ID` to invalid value
   - Restart bot
   - **Expected**: Clear error messages in logs

3. **Database Connectivity Test:**
   - Briefly disconnect database (if possible)
   - **Expected**: Bot handles gracefully, retries connections

---

## 📊 Critical Success Metrics

### ✅ Core Functionality Tests
- [ ] **Campaign Publishing**: Dashboard → Discord publishing works ≤10 seconds
- [ ] **Slash Commands**: `/join` responds ≤3 seconds in all channels  
- [ ] **Modal Display**: Onboarding modals appear ≤3 seconds after button click
- [ ] **Form Validation**: Required fields validated, character limits enforced
- [ ] **Role Assignment**: Auto-assignment works within 5 seconds of completion
- [ ] **Duplicate Prevention**: Users cannot complete same campaign twice

### ✅ Analytics & Data Integrity
- [ ] **Interaction Tracking**: All Discord interactions logged in database
- [ ] **Completion Tracking**: Start and completion events properly recorded
- [ ] **Referral Integration**: Click tracking and conversion tracking functional
- [ ] **Real-time Updates**: Dashboard analytics update within 30 seconds
- [ ] **Data Consistency**: Frontend metrics match database queries
- [ ] **Audit Trail**: All user actions traceable in database

### ✅ Error Handling & Resilience
- [ ] **Graceful Degradation**: Bot offline scenarios handled properly
- [ ] **Clear Error Messages**: Users get helpful error messages
- [ ] **Session Management**: Modal timeouts handled appropriately  
- [ ] **Validation Feedback**: Form errors clearly communicated
- [ ] **Service Recovery**: Bot recovers from temporary outages

### ✅ Performance Benchmarks
- [ ] **Modal Response Time**: < 3 seconds from button click
- [ ] **Campaign Publishing**: < 10 seconds end-to-end
- [ ] **Database Queries**: < 1 second for analytics queries
- [ ] **Memory Usage**: Bot memory usage stable over time
- [ ] **Concurrent Users**: Multiple users can onboard simultaneously

---

## 🐛 Troubleshooting Common Issues

### Discord Modal Not Appearing
```bash
# Diagnosis steps:
1. Check bot permissions in Discord channel
2. Verify DISCORD_GUILD_ID matches actual server ID
3. Confirm bot token is valid and not expired
4. Check if modal timeout (3-second limit) was exceeded
5. Review bot logs for interaction errors

# Quick fixes:
- Restart Discord bot
- Re-invite bot with proper permissions
- Verify environment variables match Discord server
```

### Role Assignment Failing
```bash
# Common causes:
1. Bot lacks "Manage Roles" permission
2. Bot role is below target role in hierarchy
3. DISCORD_VERIFIED_ROLE_ID is incorrect
4. Target role was deleted or renamed

# Solutions:
- Move bot role above target role in Discord server settings
- Grant bot "Manage Roles" permission
- Verify role ID in environment variables
```

### Analytics Not Tracking
```bash
# Check these:
1. DASHBOARD_API_URL accessible from bot
2. Network connectivity between services
3. Database connection healthy
4. API endpoints responding (test with curl)

# Debug commands:
curl http://localhost:3000/api/health
curl http://localhost:3001/health
```

### Campaign Publishing Failed
```bash
# Verify configuration:
1. DISCORD_BOT_WEBHOOK_URL points to bot server
2. Bot HTTP server running on correct port (3001)
3. Environment variables match between services
4. Guild ID configuration consistent

# Test webhook manually:
curl -X POST http://localhost:3001/api/publish-campaigns \
  -H "Content-Type: application/json" \
  -d '{"guild_id":"your_guild_id","action":"publish_campaigns"}'
```

---

## 📋 Final Test Completion Checklist

### Essential Functionality ✅
- [ ] **Campaign Creation**: Dashboard campaign creation works
- [ ] **Publishing Flow**: Campaigns publish to Discord successfully  
- [ ] **Slash Commands**: `/join` command functional across channels
- [ ] **Modal Interaction**: Onboarding modals display and submit properly
- [ ] **Data Persistence**: Form submissions save to database correctly
- [ ] **Role Assignment**: Auto-assignment works after completion
- [ ] **Duplicate Prevention**: Same user cannot complete campaign twice

### Referral Integration ✅  
- [ ] **Referral Links**: Creation and click tracking functional
- [ ] **Discord Integration**: Referral codes tracked through onboarding
- [ ] **Conversion Tracking**: Successful onboardings count as conversions
- [ ] **Analytics**: Referral performance metrics accurate

### Analytics & Monitoring ✅
- [ ] **Interaction Tracking**: All Discord bot interactions logged
- [ ] **Real-time Updates**: Dashboard reflects Discord activity immediately  
- [ ] **Performance Metrics**: Completion rates calculated correctly
- [ ] **Database Integrity**: All relationships and constraints maintained

### Error Handling ✅
- [ ] **Graceful Failures**: System handles errors without crashes
- [ ] **User Feedback**: Clear error messages for users
- [ ] **Recovery**: Services recover from temporary failures
- [ ] **Edge Cases**: Timeout and validation scenarios handled

---

**🎯 Success Criteria**: All checkboxes completed with no critical issues blocking user workflows.

**🚨 Blockers**: Any failures in modal display, role assignment, analytics tracking, or data persistence should prevent production deployment.

**📊 Performance Standards**: 
- Modal response < 3 seconds
- Campaign publishing < 10 seconds  
- Analytics updates < 30 seconds
- Database queries < 1 second

---

**✅ Expected Result**: All Discord bot functionality works seamlessly with proper analytics tracking and user experience.

**🚨 Critical Issues**: Any failures in modal display, role assignment, or analytics tracking should be treated as blocking issues for production deployment. 