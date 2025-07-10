# Virion Labs Platform: Comprehensive Feature Checklist

This document outlines the core features of the Virion Labs platform, covering both the web dashboard and the Discord bot. It can be used as a checklist for comprehensive manual testing.

---

### I. Dashboard: Admin Features

#### 1. User & Access Management
- [ ] Admin Login/Authentication
- [ ] Manage User Roles (Admin, Influencer)
- [ ] View and Approve/Deny Influencer Access Requests

#### 2. Client Management
- [ ] Create, View, Update, and Delete Clients

#### 3. Campaign Management (`Bot Campaigns`)
- [ ] Create Campaigns from Templates or from scratch
- [ ] Configure Campaign Details (Name, Type, Dates)
- [ ] Link Campaigns to Discord Servers and Channels
- [ ] Configure Bot Behavior (Onboarding flow, Role assignment, Landing pages)
- [ ] Activate, Pause, and Archive Campaigns

#### 4. Template Management
- [ ] Manage Campaign Onboarding Field Templates
- [ ] Manage Campaign Landing Page Templates

#### 5. Platform-Wide Analytics
- [ ] View Aggregated Dashboard (Total Users, Clicks, Conversions, Completion Rate)
- [ ] View Real-time Analytics and Performance Charts
- [ ] Export Platform-Wide Data (e.g., in CSV format)

#### 6. System & Debugging
- [ ] View System Health/Status
- [ ] Access Debugging Tools (e.g., Email Validation, Campaign Stats)

---

### II. Dashboard: Influencer Features

#### 1. User & Profile Management
- [ ] Influencer Signup & Onboarding
- [ ] Influencer Login/Authentication
- [ ] Manage User Settings/Profile

#### 2. Campaign Discovery & Interaction
- [ ] Browse and View Available Campaigns published by Admins
- [ ] Request Access to Private Campaigns

#### 3. Referral Link Management (`My Links`)
- [ ] Create Referral Links for specific Campaigns
- [ ] Configure Link Details (Title, Platform, Landing Page)
- [ ] View, Copy, and Manage existing Referral Links

#### 4. Influencer-Specific Analytics
- [ ] View Personal Dashboard with Link Performance (Clicks, Conversions)
- [ ] Track Earnings and Performance per Campaign

---

### III. Dashboard: Public/User-Facing Features

#### 1. Referral Landing Pages (`/r/[code]`)
- [ ] Dynamic Landing Page rendering based on the campaign.
- [ ] Click tracking for analytics.
- [ ] Generation of a unique Discord invite upon user interaction.

#### 2. Authentication
- [ ] Login, Signup, and Password Reset flows.
- [ ] Email Confirmation process.

---

### IV. Discord Bot Features

#### 1. Core Onboarding Flow
- [ ] Automatic Onboarding triggered by a user joining via a managed referral invite.
- [ ] Manual Onboarding triggered by a user command (e.g., `/join`).
- [ ] Interactive Onboarding Modals/Forms presented to the user.

#### 2. Referral & Campaign Handling
- [ ] Detection and Validation of Referral Codes.
- [ ] Attribution of new members to the correct Influencer and Campaign.
- [ ] Application of Campaign-specific behavior (e.g., custom welcome messages).

#### 3. Role Management
- [ ] Automatic Role Assignment upon successful completion of onboarding.
- [ ] Role removal or updates based on user status.

#### 4. User Interaction & Commands
- [ ] Handling of user commands (e.g., `/request-access`).
- [ ] Responding to user interactions within the onboarding flow.

#### 5. Integration & Analytics
- [ ] Communication with the Dashboard API to track events (Onboarding Started, Completed, Conversion).
- [ ] Caching of Discord server data (e.g., invites) for accurate attribution. 