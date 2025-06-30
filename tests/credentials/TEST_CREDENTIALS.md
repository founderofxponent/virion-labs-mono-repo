# 🔐 Test Account Credentials

**⚠️ WARNING: These are test credentials only. Never use in production!**

## 👨‍💼 Admin Test Account

```
Email: vercilliusjrmila+johnadmin@gmail.com
Password: johnadmin
Role: admin
User ID: fcbfeea0-2df9-4ce0-a753-46cdb941c7a4
Full Name: John Admin
Created: 2025-05-28 12:32:52.936255+00
```

**Admin Features Access:**
- ✅ Client Management (Create, Edit, View)
- ✅ Campaign Management (Create campaigns with 4-step wizard)
- ✅ Analytics Dashboard (Platform-wide metrics)
- ✅ Access Requests (User approval system)
- ✅ Admin Settings

## 👥 Influencer Test Account

```
Email: test.manual.2025@example.com
Password: TestPassword123!
Role: influencer
User ID: 919438af-363a-4e97-8ea2-38e7522f7482
Full Name: Test User - Manual Test
Created: 2025-06-30 07:35:38.07974+00
```

**Influencer Features Access:**
- ✅ Referral Link Creation & Management
- ✅ Analytics & Click Tracking
- ✅ Campaign Browsing (Available Campaigns)
- ✅ Referrals Tracking
- ✅ Profile Settings & Social Media Integration

## 🔗 Test Data Created

### Referral Links
```
Title: Manual Test Link - YouTube Channel
Referral Code: manual-test-link-youtube-channel-zrt5uv
URL: http://localhost:3000/api/referral/manual-test-link-youtube-channel-zrt5uv
Original URL: https://www.youtube.com/channel/test-manual-test
Platform: YouTube
Status: Active
Clicks: 1 (verified working)
Conversions: 0
```

### Clients Created
```
Client Name: Manual Test Company
Industry: Technology
Website: https://manual-test-company.com
Primary Contact: John Admin (Manual Test)
Contact Email: admin@manual-test-company.com
Status: Active
ID: 1495f405-29d7-466e-a952-b3b5d7c82f6d
```

## 🗄️ Database Connection

**Supabase Project Details:**
```
Production Project ID: mcynacktfmtzkkohctps
Development Project ID: jirrgkvnnyfmgqmxoevl
```

**Key Tables Verified:**
- `user_profiles` - User account information
- `user_settings` - User profile settings & social media
- `referral_links` - Influencer referral links
- `referral_analytics` - Click and conversion tracking
- `clients` - Admin-managed client companies
- `discord_guild_campaigns` - Campaign management
- `access_requests` - User access approval system

## 🧪 Testing Notes

**Last Tested:** June 30, 2025, 3:30 AM EDT

**Test Status:**
- ✅ Both accounts functional
- ✅ Cross-user switching working
- ✅ Data persistence verified
- ✅ Analytics tracking operational
- ⚠️ Analytics dashboard data filtering needs review

**Known Test Data:**
- 1 active referral link with 1 recorded click
- 4 total clients in database (3 existing + 1 test)
- User profile settings successfully saved
- No pending access requests (1 processed request exists)

## 🔄 Reset Instructions

To reset test data for fresh testing:

1. **Clear test user's referral links:**
   ```sql
   DELETE FROM referral_links WHERE influencer_id = '919438af-363a-4e97-8ea2-38e7522f7482';
   ```

2. **Clear test client:**
   ```sql
   DELETE FROM clients WHERE name = 'Manual Test Company';
   ```

3. **Reset user settings:**
   ```sql
   UPDATE user_settings SET bio = NULL, twitter_handle = NULL, youtube_channel = NULL 
   WHERE user_id = '919438af-363a-4e97-8ea2-38e7522f7482';
   ```

4. **Clear analytics data:**
   ```sql
   DELETE FROM referral_analytics WHERE link_id IN 
   (SELECT id FROM referral_links WHERE influencer_id = '919438af-363a-4e97-8ea2-38e7522f7482');
   ``` 