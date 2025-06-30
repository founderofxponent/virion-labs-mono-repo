# 🧪 Virion Labs Manual Testing Guide

**Version:** 1.0 | **Last Updated:** June 30, 2025 | **Duration:** 45-60 minutes

## 🎯 Quick Start

1. **Start dev server:** `cd virion-labs-dashboard && npm run dev`
2. **Get credentials:** See `../credentials/TEST_CREDENTIALS.md`
3. **Open Playwright:** Navigate to `http://localhost:3000`
4. **Follow test phases** sequentially below

---

## 📋 Test Phases

> **🎯 IMPORTANT**: For complete **Campaign & Referral Flow Testing**, use the dedicated guide: `CAMPAIGN_REFERRAL_FLOW_TESTING.md` (2-3 hours). This guide covers basic feature testing only.

### 🔐 Phase 1: Authentication (10 mins)

#### 1.1 Influencer Login
```bash
# Use these credentials:
Email: test.manual.2025@example.com
Password: TestPassword123!
```
- [ ] Navigate to login page
- [ ] Enter credentials and verify successful login
- [ ] Confirm influencer dashboard loads
- [ ] **DB Verify:** `SELECT * FROM user_profiles WHERE email = 'test.manual.2025@example.com';`
- [ ] **Screenshot:** Influencer dashboard

#### 1.2 Registration Flow (Optional)
- [ ] Test signup with new user
- [ ] Verify auto-role assignment to 'influencer'
- [ ] **DB Verify:** Check new user in `user_profiles`

---

### 👥 Phase 2: Influencer Features (20 mins)

#### 2.1 Referral Link Testing
- [ ] Navigate to **My Links** page
- [ ] Click **"Create New Link"**
- [ ] Fill form:
  - Title: "Manual Test - [Current Time]"
  - Platform: YouTube
  - URL: "https://youtube.com/test-[timestamp]"
- [ ] Submit and verify success
- [ ] **DB Verify:** `SELECT * FROM referral_links WHERE influencer_id = '919438af-363a-4e97-8ea2-38e7522f7482';`

#### 2.2 Click Tracking
- [ ] Copy generated referral URL
- [ ] Open new tab and visit the link
- [ ] Verify redirection works
- [ ] Return to My Links and refresh
- [ ] Confirm click count increased
- [ ] **DB Verify:** `SELECT * FROM referral_analytics WHERE link_id = '[link_id]';`

#### 2.3 Settings & Profile
- [ ] Navigate to **Settings**
- [ ] Update Profile tab (bio, social handles)
- [ ] Save changes
- [ ] **DB Verify:** `SELECT * FROM user_settings WHERE user_id = '919438af-363a-4e97-8ea2-38e7522f7482';`

#### 2.4 Other Pages
- [ ] Check **Available Campaigns** (should show "No campaigns")
- [ ] Check **Referrals** page (analytics display)

---

### 👨‍💼 Phase 3: Admin Features (15 mins)

#### 3.1 Admin Login
```bash
# Admin credentials:
Email: vercilliusjrmila+johnadmin@gmail.com
Password: johnadmin
```
- [ ] Logout influencer, login admin
- [ ] Verify admin dashboard with different navigation
- [ ] **Screenshot:** Admin dashboard

#### 3.2 Client Management
- [ ] Navigate to **Clients** page
- [ ] Click **"Add Client"**
- [ ] Create test client:
  - Name: "Test Client [Date]"
  - Industry: Technology
  - Website: "https://test-client.com"
- [ ] Verify success
- [ ] **DB Verify:** `SELECT * FROM clients WHERE name LIKE 'Test Client%';`

#### 3.3 Campaign Creation
- [ ] Navigate to **Campaigns** page
- [ ] Click **"Create Campaign"**
- [ ] Test wizard Step 1:
  - Select template: "Referral Onboarding"
  - Select client: Use created test client
  - Campaign name: "Test Campaign [Date]"
  - Discord Server ID: "123456789012345678"
- [ ] Verify form validation (Next button enables)

#### 3.4 Analytics & Access
- [ ] Check **Analytics** page (note any data discrepancies)
- [ ] Check **Access Requests** (should show "All Caught Up")
- [ ] **DB Verify:** `SELECT COUNT(*) FROM access_requests WHERE role_assigned_at IS NULL;`

---

### 🔄 Phase 4: Cross-User Testing (10 mins)

#### 4.1 User Switching
- [ ] Logout admin, login influencer again
- [ ] Verify influencer dashboard loads correctly
- [ ] Check My Links page - confirm data persisted
- [ ] Verify click counts maintained
- [ ] Check Settings - confirm profile data saved

---

## 📊 Critical Database Queries

Run these throughout testing to verify database alignment:

```sql
-- User verification
SELECT id, email, full_name, role FROM user_profiles 
WHERE email IN ('test.manual.2025@example.com', 'vercilliusjrmila+johnadmin@gmail.com');

-- Referral links
SELECT id, title, referral_code, clicks, conversions 
FROM referral_links WHERE influencer_id = '919438af-363a-4e97-8ea2-38e7522f7482';

-- Clients
SELECT id, name, industry, status FROM clients ORDER BY created_at DESC LIMIT 3;

-- Analytics events
SELECT event_type, created_at FROM referral_analytics 
WHERE link_id IN (SELECT id FROM referral_links WHERE influencer_id = '919438af-363a-4e97-8ea2-38e7522f7482');
```

---

## ✅ Success Checklist

- [ ] **Authentication:** Both admin & influencer login working
- [ ] **Link Creation:** Referral links generate with unique codes
- [ ] **Click Tracking:** Analytics update when links are visited
- [ ] **Profile Management:** Settings save to database correctly
- [ ] **Admin Functions:** Client creation and campaign wizard working
- [ ] **Cross-User:** Data persists between user sessions
- [ ] **Database Alignment:** Frontend data matches database queries

---

## 🐛 Issue Reporting

Found a bug? Document in `../reports/bug-reports/` with:
- **Steps to reproduce**
- **Expected vs actual result**
- **Database query results**
- **Screenshot reference**
- **Severity level**

---

## 🔄 Quick Reset (Optional)

To clean test data for fresh testing:
```sql
-- Remove test data
DELETE FROM referral_links WHERE influencer_id = '919438af-363a-4e97-8ea2-38e7522f7482';
DELETE FROM clients WHERE name LIKE 'Test Client%';
UPDATE user_settings SET bio = NULL, twitter_handle = NULL WHERE user_id = '919438af-363a-4e97-8ea2-38e7522f7482';
```

**Expected Results:** All features functional, data persistent, no critical errors. 