# Discord Channel Setup Guide

This guide explains how to set up your Discord server for the Virion Labs campaign system, including making the `join-campaigns` channel read-only for regular users.

## Table of Contents
1. [Channel Setup](#channel-setup)
2. [Permission Configuration](#permission-configuration)
3. [Bot Permissions](#bot-permissions)
4. [Publishing Campaigns](#publishing-campaigns)
5. [Troubleshooting](#troubleshooting)

---

## Channel Setup

### 1. Create the Join Campaigns Channel

1. **Create a new text channel** in your Discord server
2. **Name it exactly**: `join-campaigns` (lowercase, with hyphen)
3. **Position it** where users can easily find it (preferably near the top of your server)

### 2. Channel Description
Set a clear channel description:
```
🎯 Join active campaigns below! Click the buttons to get started with onboarding and unlock exclusive access to private channels.
```

---

## Permission Configuration

### 3. Make Channel Read-Only for Users

To prevent users from sending messages in the channel:

#### For @everyone role:
1. Go to **Channel Settings** → **Permissions**
2. Find the **@everyone** role
3. Set these permissions:
   - ✅ **View Channel**: ✓ (Allow)
   - ✅ **Read Message History**: ✓ (Allow)
   - ❌ **Send Messages**: ✗ (Deny)
   - ❌ **Add Reactions**: ✗ (Deny)
   - ❌ **Use Slash Commands**: ✗ (Deny)
   - ❌ **Create Public Threads**: ✗ (Deny)
   - ❌ **Create Private Threads**: ✗ (Deny)

#### For moderator/admin roles:
1. Create permission overrides for your **moderator** and **admin** roles
2. Set these permissions:
   - ✅ **Send Messages**: ✓ (Allow) - for bot commands like `!publish`
   - ✅ **Manage Messages**: ✓ (Allow) - to clean up if needed
   - ✅ **Use Slash Commands**: ✓ (Allow)

### 4. Visual Example
```
Permissions for #join-campaigns:

@everyone               Moderator           Admin               Virion Bot
---------               ---------           -----               ----------
View Channel: ✓         View Channel: ✓     View Channel: ✓     View Channel: ✓
Send Messages: ✗        Send Messages: ✓    Send Messages: ✓    Send Messages: ✓
Add Reactions: ✗        Add Reactions: ✓    Add Reactions: ✓    Add Reactions: ✓
Read History: ✓         Read History: ✓     Read History: ✓     Read History: ✓
                        Manage Messages: ✓   Manage Messages: ✓  Manage Messages: ✓
```

---

## Bot Permissions

### 5. Required Bot Permissions

Ensure your Virion Labs bot has these permissions in the `join-campaigns` channel:

#### Essential Permissions:
- ✅ **View Channel**
- ✅ **Send Messages**
- ✅ **Embed Links**
- ✅ **Attach Files** 
- ✅ **Read Message History**
- ✅ **Use External Emojis**
- ✅ **Add Reactions**
- ✅ **Manage Messages** (to update/delete old campaign messages)

#### Optional but Recommended:
- ✅ **Use Slash Commands**
- ✅ **Create Public Threads** (for Q&A if needed)

### 6. Bot Role Setup
1. Make sure the bot's role is **above** the @everyone role in the role hierarchy
2. The bot role should have **Administrator** permission OR the specific permissions listed above

---

## Publishing Campaigns

### 7. Dashboard Publishing

**From the Dashboard:**
1. Go to **Bot Campaigns** page
2. Click the **"Publish to Discord"** button
3. The system will automatically update all Discord servers with active campaigns

**What happens:**
- ✅ Active campaigns appear as buttons users can click
- ✅ Inactive campaigns are listed with their status (paused/archived)
- ✅ Old campaign messages are automatically updated or replaced
- ✅ Users can immediately click buttons to start onboarding

### 8. Manual Publishing (Discord Commands)

**For moderators/admins in the channel:**
```
!publish        - Updates the campaign list
!update         - Same as !publish
```

These commands only work for users with `Manage Channels` or `Administrator` permissions.

### 9. What Users See

After publishing, users will see:
```
🎯 Join Active Campaigns

Active Campaigns (2):
Select a campaign to join:

[🚀 Gaming Community] [🚀 Tech Beta Program]

Inactive Campaigns (1):
⏸️ Marketing Campaign (paused)
```

Users click the blue buttons to start the onboarding flow.

---

## Troubleshooting

### 10. Common Issues

#### "Bot can't send messages"
- ✅ Check bot has **Send Messages** permission
- ✅ Verify bot role is above @everyone in hierarchy
- ✅ Make sure channel isn't in "slow mode"

#### "Publish button doesn't work"
- ✅ Check you have active campaigns in the dashboard
- ✅ Verify bot is online and connected to Discord
- ✅ Ensure Discord server ID matches the campaign configuration

#### "Users can still send messages"
- ✅ Double-check @everyone permissions are set to **Deny** for Send Messages
- ✅ Look for other role overrides that might allow message sending
- ✅ Make sure no users have admin/mod roles that override the restrictions

#### "Campaign buttons don't appear"
- ✅ Verify campaigns are marked as "Active" in the dashboard
- ✅ Check that `guild_id` in campaigns matches your Discord server ID
- ✅ Ensure bot has **Embed Links** permission

### 11. Getting Discord Server ID

To find your Discord server ID:
1. Enable **Developer Mode** in Discord settings
2. Right-click your server name
3. Click **"Copy Server ID"**
4. Use this ID when creating campaigns in the dashboard

### 12. Testing the Setup

**Test checklist:**
1. ✅ Regular users can see the channel but cannot type
2. ✅ Campaign buttons appear when published from dashboard  
3. ✅ Clicking buttons starts the onboarding modal
4. ✅ Successful onboarding assigns the configured roles
5. ✅ Users get access to private channels after completion

---

## Advanced Configuration

### 13. Multiple Campaign Channels

You can set up multiple channels for different campaign types:
- `join-campaigns` - Main campaigns
- `beta-programs` - Beta/testing campaigns  
- `vip-campaigns` - Exclusive campaigns

Each channel should follow the same permission setup.

### 14. Role-Based Access

For advanced setups, you can create different join channels for different user levels:
- **New users**: Basic campaigns in `join-campaigns`
- **Verified users**: Advanced campaigns in `verified-campaigns`
- **VIP users**: Exclusive campaigns in `vip-campaigns`

### 15. Custom Channel Names

If you want to use a different channel name than `join-campaigns`:
1. Update the channel name in your campaign configuration
2. The bot will automatically detect the correct channel
3. Make sure to use the same permission setup

---

## Support

If you need help with the setup:
1. Check the [troubleshooting section](#troubleshooting) above
2. Contact your Virion Labs administrator
3. Join our support Discord server for live assistance

**Remember**: The key is making the channel read-only for regular users while allowing the bot and admins to manage campaign messages! 