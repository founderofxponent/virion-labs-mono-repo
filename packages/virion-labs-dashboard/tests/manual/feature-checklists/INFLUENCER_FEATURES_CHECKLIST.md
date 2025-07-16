# 👥 Influencer Features Testing Checklist

> **🎯 IMPORTANT**: For complete **Campaign & Referral Flow Testing**, use the dedicated guide: `../CAMPAIGN_REFERRAL_FLOW_TESTING.md` (2-3 hours). This checklist covers individual feature testing only.

## 🔐 Authentication & Access
- [ ] Login with influencer credentials works
- [ ] Correct dashboard loads (influencer-specific navigation)
- [ ] User profile displays correctly (name, avatar, role)
- [ ] Session persistence works across page refreshes

## 📊 Dashboard Overview
- [ ] Welcome message displays user's full name
- [ ] Quick action cards are functional:
  - [ ] "Create Link" card navigates to link creation
  - [ ] "View Referrals" card navigates to referrals page
  - [ ] "Browse Campaigns" card navigates to campaigns
- [ ] Recent activity section displays relevant data
- [ ] My Links preview shows correct link count and latest links

## 🔗 Referral Link Management

### Link Creation
- [ ] "Create New Link" button opens modal
- [ ] Form validation works for required fields:
  - [ ] Title (required)
  - [ ] Original URL (required)
- [ ] Platform selection works (YouTube, Instagram, TikTok, etc.)
- [ ] Campaign selection shows available options
- [ ] Optional fields work (Description, Thumbnail URL, Expiration Date)
- [ ] Active toggle defaults to enabled
- [ ] Form submission creates link successfully
- [ ] Success modal displays with sharing options
- [ ] Unique referral code is generated
- [ ] Database entry is created correctly

### Link Management
- [ ] Links list displays all user's links
- [ ] Analytics cards show correct metrics:
  - [ ] Total Links count
  - [ ] Total Clicks count
  - [ ] Total Conversions count
  - [ ] Average Conversion Rate
- [ ] Individual link cards show:
  - [ ] Title and platform
  - [ ] Creation date
  - [ ] Status (Active/Inactive)
  - [ ] Click count
  - [ ] Conversion count
  - [ ] Conversion rate
- [ ] Link actions work:
  - [ ] Copy link button copies URL
  - [ ] "View Original" opens original URL
  - [ ] Edit functionality (if available)

### Analytics & Tracking
- [ ] Visiting referral link redirects to original URL
- [ ] Click is tracked in database
- [ ] Frontend updates click count in real-time
- [ ] Analytics events are logged correctly
- [ ] Conversion tracking works (when applicable)

## 🎯 Available Campaigns
- [ ] Page loads correctly
- [ ] Shows appropriate message when no campaigns available
- [ ] Database count matches frontend display
- [ ] Campaign cards display correctly (when campaigns exist)
- [ ] Join campaign functionality works (when applicable)

## 📈 Referrals Tracking
- [ ] Page loads with analytics overview
- [ ] Metrics display correctly:
  - [ ] Total Referrals count
  - [ ] Conversion Rate percentage
  - [ ] Top Source platform
  - [ ] Pending Referrals count
- [ ] Filtering options work:
  - [ ] Search by name/email
  - [ ] Filter by source platform
  - [ ] Filter by status
  - [ ] Sort options (Newest, Oldest, etc.)
- [ ] Referrals list displays correctly (when data exists)
- [ ] Database data matches frontend display

## ⚙️ Settings & Profile

### Profile Tab
- [ ] Current profile information pre-fills correctly
- [ ] Bio field accepts text input
- [ ] Phone number field works
- [ ] Website URL field works
- [ ] Social media handle fields work:
  - [ ] Twitter handle
  - [ ] Instagram handle
  - [ ] YouTube channel
  - [ ] Discord username
- [ ] "Save Profile" button works
- [ ] Success notification appears
- [ ] Changes persist in database
- [ ] Changes reflect immediately in UI

### Notifications Tab
- [ ] Email notification toggles work:
  - [ ] New referral notifications
  - [ ] Weekly summary emails
  - [ ] Campaign updates
  - [ ] Account security alerts
- [ ] Settings save correctly
- [ ] Database updates reflect changes

### Privacy Tab
- [ ] Profile visibility options work (Public/Private)
- [ ] Show earnings toggle works
- [ ] Show referral count toggle works
- [ ] Webhook URL field accepts input
- [ ] Event selection checkboxes work:
  - [ ] User Signup events
  - [ ] Link Click events
  - [ ] Conversion events
- [ ] Test webhook button works (if implemented)
- [ ] Privacy settings save correctly

### Account Tab
- [ ] Theme selection works (System/Light/Dark)
- [ ] Language selection works
- [ ] Timezone selection works
- [ ] Currency selection works
- [ ] Login notification preferences work
- [ ] Change password functionality works (if implemented)
- [ ] Account deletion option available (with appropriate warnings)

## 📱 Navigation & UI

### Navigation Menu
- [ ] All navigation links work:
  - [ ] Dashboard
  - [ ] Available Campaigns  
  - [ ] My Links
  - [ ] Referrals
  - [ ] Settings
- [ ] Active page is highlighted correctly
- [ ] Responsive design works on different screen sizes

### User Menu
- [ ] User avatar/dropdown works
- [ ] User information displays correctly
- [ ] Settings link works
- [ ] Logout functionality works
- [ ] Logout redirects to login page

## 🔄 Data Persistence & Refresh
- [ ] Page refresh maintains user session
- [ ] Navigation between pages preserves data
- [ ] Real-time updates work (when applicable)
- [ ] No data loss during normal usage
- [ ] Logout/login cycle preserves user data

## ⚠️ Error Handling
- [ ] Invalid URLs in link creation show appropriate errors
- [ ] Network errors are handled gracefully
- [ ] Form validation errors are clear and helpful
- [ ] Loading states display appropriately
- [ ] 404 pages work for invalid routes

## 🗄️ Database Verification

For each major action, verify database consistency:

```sql
-- User profile data
SELECT * FROM user_profiles WHERE id = '[user_id]';
SELECT * FROM user_settings WHERE user_id = '[user_id]';

-- Referral links
SELECT * FROM referral_links WHERE influencer_id = '[user_id]';

-- Analytics data
SELECT * FROM referral_analytics WHERE link_id IN 
(SELECT id FROM referral_links WHERE influencer_id = '[user_id]');

-- Referrals
SELECT * FROM referrals WHERE influencer_id = '[user_id]';
``` 