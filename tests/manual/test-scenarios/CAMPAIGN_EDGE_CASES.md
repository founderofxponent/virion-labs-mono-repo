# 🧪 Campaign & Referral Edge Cases Testing Scenarios

**Purpose:** Test edge cases and error conditions in the campaign and referral system  
**Duration:** 30-45 minutes  
**Prerequisites:** Complete basic campaign setup from `CAMPAIGN_REFERRAL_FLOW_TESTING.md`

---

## 🚨 Error Scenarios

### 1. Invalid Referral Code Testing

**Scenario:** User enters non-existent referral code in Discord

**Test Steps:**
1. Join Discord server as test user
2. Type fake referral code: `INVALID123`
3. Verify bot response

**Expected Result:**
```
❌ Invalid Referral Code
The referral code "INVALID123" is not valid for this server. Please check your code and try again.
```

**Database Check:**
```sql
-- Verify no conversion was recorded
SELECT * FROM referrals WHERE referral_link_id IN (
    SELECT id FROM referral_links WHERE referral_code = 'INVALID123'
);
-- Should return 0 rows
```

---

### 2. Expired Campaign Testing

**Scenario:** User tries to use referral link for expired campaign

**Setup:**
```sql
-- Temporarily expire a test campaign
UPDATE discord_guild_campaigns 
SET campaign_end_date = '2024-01-01'
WHERE campaign_name LIKE 'Summer Fashion Launch%';
```

**Test Steps:**
1. Click referral link for expired campaign
2. Attempt Discord onboarding

**Expected Result:**
- Landing page shows "Campaign Expired" message
- No onboarding modal appears in Discord
- No conversion tracking occurs

**Cleanup:**
```sql
-- Restore campaign end date
UPDATE discord_guild_campaigns 
SET campaign_end_date = now() + interval '30 days'
WHERE campaign_name LIKE 'Summer Fashion Launch%';
```

---

### 3. Wrong Discord Server Testing

**Scenario:** User tries referral code in wrong Discord server

**Test Steps:**
1. Create referral link for Campaign A (Server 1)
2. Join different Discord server (Server 2)
3. Try to use referral code from Campaign A

**Expected Result:**
```
❌ Invalid Context
This referral code is not valid for this Discord server.
```

**Database Check:**
```sql
-- Verify guild_id mismatch detection
SELECT guild_id FROM discord_guild_campaigns WHERE id = '[campaign_id]';
-- Should not match current Discord server ID
```

---

### 4. Duplicate Conversion Attempt

**Scenario:** Same user tries to convert multiple times

**Test Steps:**
1. Complete full conversion flow once
2. Try to complete onboarding again with same Discord account
3. Verify duplicate handling

**Expected Result:**
- Bot recognizes user already completed onboarding
- Shows "Already Completed" message
- No duplicate referral record created

**Database Check:**
```sql
-- Verify only one referral record exists
SELECT COUNT(*) FROM referrals 
WHERE discord_id = '[test_discord_user_id]'
AND referral_link_id = '[test_referral_link_id]';
-- Should return 1
```

---

### 5. Campaign Pause/Resume Impact

**Scenario:** Admin pauses campaign while user is in conversion flow

**Test Steps:**
1. User clicks referral link (campaign active)
2. Admin pauses campaign
3. User completes Discord onboarding

**Expected Result:**
- Referral links automatically deactivated
- User sees "Campaign Temporarily Unavailable" message
- No conversion recorded while paused

**Database Check:**
```sql
-- Verify referral links deactivated
SELECT is_active, metadata FROM referral_links 
WHERE campaign_id = '[paused_campaign_id]';
-- is_active should be false, metadata should contain pause info
```

---

### 6. Rate Limiting & Spam Prevention

**Scenario:** Rapid multiple clicks on same referral link

**Test Steps:**
1. Click referral link 10 times rapidly from same IP
2. Verify click counting accuracy
3. Check for spam prevention

**Expected Result:**
- Each legitimate click counted once
- Rapid duplicate clicks from same session filtered
- No artificial inflation of click counts

**Database Check:**
```sql
-- Check click analytics for suspicious patterns
SELECT COUNT(*), ip_address, user_agent 
FROM referral_analytics 
WHERE link_id = '[test_link_id]'
AND created_at > now() - interval '1 minute'
GROUP BY ip_address, user_agent;
```

---

### 7. Database Connection Failures

**Scenario:** Temporary database unavailability during conversion

**Test Steps:**
1. Simulate database connection issue (if possible)
2. Attempt referral conversion
3. Verify graceful degradation

**Expected Result:**
- User sees appropriate error message
- Discord bot continues functioning
- Conversion retried when database restored
- No data corruption

---

### 8. Malformed Data Testing

**Scenario:** Invalid campaign configuration

**Setup:**
```sql
-- Create campaign with invalid configuration
INSERT INTO discord_guild_campaigns (
    campaign_name, guild_id, target_role_ids, is_active
) VALUES (
    'Invalid Test Campaign',
    'invalid_guild_id',
    '["invalid_role"]',
    true
);
```

**Test Steps:**
1. Try to create referral link for invalid campaign
2. Attempt Discord operations

**Expected Result:**
- Graceful error handling
- Clear error messages to users
- No system crashes

**Cleanup:**
```sql
DELETE FROM discord_guild_campaigns WHERE campaign_name = 'Invalid Test Campaign';
```

---

### 9. Permission Edge Cases

**Scenario:** User loses Discord permissions mid-process

**Test Steps:**
1. Start onboarding process
2. Remove user's Discord permissions
3. Complete onboarding submission

**Expected Result:**
- Bot detects permission changes
- Appropriate error handling
- User guided to contact admin

---

### 10. High Load Simulation

**Scenario:** Multiple simultaneous conversions

**Test Steps:**
1. Simulate 5+ users completing onboarding simultaneously
2. Monitor system performance
3. Verify data accuracy

**Expected Result:**
- All conversions processed correctly
- No race conditions in database
- Accurate analytics tracking
- Acceptable response times (< 5 seconds)

**Database Check:**
```sql
-- Verify all conversions recorded accurately
SELECT 
    COUNT(*) as total_conversions,
    COUNT(DISTINCT discord_id) as unique_users,
    MIN(created_at) as first_conversion,
    MAX(created_at) as last_conversion
FROM referrals 
WHERE created_at > now() - interval '5 minutes';
```

---

## 🔍 Performance Edge Cases

### 11. Large Campaign Lists

**Scenario:** Admin with 50+ campaigns

**Test Steps:**
1. Create many test campaigns
2. Test influencer "Available Campaigns" page load time
3. Test Discord `/join` command performance

**Expected Result:**
- Page loads in < 3 seconds
- Discord command responds in < 2 seconds
- Pagination/filtering works correctly

---

### 12. Long Referral Code Scenarios

**Scenario:** Very long campaign/referral names

**Test Steps:**
1. Create campaign with 200+ character name
2. Generate referral links
3. Test all functionality

**Expected Result:**
- Graceful text truncation
- UI remains functional
- Database constraints respected

---

## 📊 Success Criteria

**All Edge Cases Should:**
- [ ] Provide clear, user-friendly error messages
- [ ] Maintain data integrity
- [ ] Not cause system crashes or hangs
- [ ] Log appropriate error information
- [ ] Allow graceful recovery when possible
- [ ] Maintain security boundaries
- [ ] Preserve user experience quality

**Performance Criteria:**
- [ ] Error responses < 2 seconds
- [ ] No memory leaks during error conditions
- [ ] Database consistency maintained
- [ ] Audit trails for all error scenarios 