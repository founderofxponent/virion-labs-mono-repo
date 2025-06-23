# Publish to Discord Button - Complete Functionality Guide

## Overview

The "Publish to Discord" button in the Bot Campaigns page publishes active campaigns to your Discord server's `join-campaigns` channel as an interactive message with clickable buttons that trigger onboarding modals.

**✨ Simplified Configuration**: Now uses fixed environment variables for guild and channel IDs, eliminating the need to specify them in each request.

## Current Flow When You Press "Publish to Discord"

**✨ NEW: Automatic Publishing!** The system now automatically publishes campaigns to your Discord channel using the configured channel ID - no trigger words or manual commands required!

### 1. **Dashboard Button Handler** (`bot-campaigns-page.tsx`)
- Uses environment variables for guild and channel configuration
- Calls `/api/discord/publish-campaigns` with no parameters
- Shows success/error feedback via toast notifications
- Button is disabled if no campaigns exist

### 2. **API Processing** (`/api/discord/publish-campaigns/route.ts`)
- Uses `DISCORD_GUILD_ID` and `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID` from environment
- Fetches all campaigns for the configured guild (both active and inactive)
- Separates campaigns by status
- Creates webhook payload with campaign data
- **Sends HTTP request directly to Discord bot's webhook server**
- Logs event to `campaign_publish_logs` table for audit trail

### 3. **Discord Bot HTTP Server** (`virion-labs-discord-bot/index.js`)
- **NEW: HTTP server on port 3001** receives webhook requests
- `/api/publish-campaigns` endpoint automatically triggers publishing
- **Immediately publishes to the configured channel using Channel ID**
- No trigger words or manual commands required
- Returns success/failure response to dashboard

### 4. **Discord Bot Execution** (`publishCampaignsToChannel()` function)
- **Finds target channel by ID first, then by name**
- Creates/updates an embed message with campaign buttons
- **Updates existing message instead of creating new ones** (no spam)
- Stores message ID for future updates
- Uses the exact Channel ID from `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID`

### 5. **User Experience**
- **Instant publishing**: Campaigns appear in Discord immediately when you click the button
- Users see active campaigns as blue buttons with 🚀 emoji
- Inactive campaigns listed with status emojis (⏸️ paused, 📦 archived, 🚫 inactive)
- Clicking buttons triggers onboarding modal
- Successful onboarding assigns configured roles
- **Read-only channel friendly**: No need for users to type trigger words

## Configuration Options

### Option 1: Environment Variables (Recommended for Your Setup)

Based on your specific guild and channel IDs, set these environment variables:

```env
# Discord Server Configuration (Fixed IDs)
DISCORD_GUILD_ID=905448362944393218
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=1385186047079616513
```

**Advantages:**
- ✅ Most precise targeting (uses exact channel ID)
- ✅ No dependency on channel naming
- ✅ Perfect for single-tenant/fixed server setup
- ✅ Configuration is centralized and secure

### Option 2: Database Configuration (For Multi-Tenant)

For multiple Discord servers with different configurations, store channel IDs in the database per campaign.

**Advantages:**
- ✅ Different channels per campaign
- ✅ User-configurable via dashboard
- ✅ Supports multiple Discord servers

## Message Format

When published, users see:

```
🎯 Join Active Campaigns

Active Campaigns (2):
Select a campaign to join:

[🚀 Gaming Community] [🚀 Tech Beta Program]

Inactive Campaigns (1):
⏸️ Marketing Campaign (paused)
```

## Technical Implementation Details

### Enhanced Channel Targeting

The bot now supports both channel ID and channel name:

```javascript
// Finds channel by ID first (more precise)
if (/^\d+$/.test(channelIdentifier)) {
  channel = guild.channels.cache.get(channelIdentifier);
} else {
  // Falls back to channel name
  channel = guild.channels.cache.find(ch => 
    ch.name === channelIdentifier && ch.type === 0
  );
}
```

### Smart Message Management

- **Updates existing messages** instead of creating new ones
- **Stores message IDs** in bot memory for future updates
- **Handles Discord API limits** (max 25 buttons, 5 per row)
- **Graceful error handling** with fallback mechanisms

### Environment Variable Priority

The system uses this priority order:
1. **Explicit channel_id in request** (highest priority)
2. **Environment variable** `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID`
3. **Default fallback** `'join-campaigns'` (channel name)

## Setup Instructions for Your Server

### 1. Set Environment Variables

Add to your `.env` file:

```env
# Your specific Discord server configuration
DISCORD_GUILD_ID=905448362944393218
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=1385186047079616513
```

### 2. Configure Channel Permissions

Make your join-campaigns channel read-only for users:

**@everyone role permissions:**
- ✅ View Channel: Allow
- ✅ Read Message History: Allow  
- ❌ Send Messages: Deny
- ❌ Add Reactions: Deny

**Bot permissions:**
- ✅ View Channel: Allow
- ✅ Send Messages: Allow
- ✅ Embed Links: Allow
- ✅ Manage Messages: Allow (for updates)

### 3. Test the Functionality

1. Create some active campaigns in the dashboard
2. Click "Publish to Discord" button
3. Check your Discord channel for the campaign message
4. Test clicking campaign buttons to trigger onboarding

## Manual Publishing (Discord Commands)

Admins can manually trigger publishes directly in Discord:

```
!publish    - Updates campaign list (requires Manage Channels permission)
!update     - Same as !publish
```

## Audit Trail

All publish events are logged in the `campaign_publish_logs` table:

```sql
SELECT 
  guild_id,
  channel_id,
  active_campaigns_count,
  published_at,
  success,
  error_message
FROM campaign_publish_logs 
ORDER BY published_at DESC;
```

## Troubleshooting

### Common Issues

**"Bot can't send messages"**
- ✅ Check bot has `Send Messages` permission
- ✅ Verify bot role is above @everyone in hierarchy

**"Channel not found"**
- ✅ Verify `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID` is correct
- ✅ Ensure bot is in the Discord server
- ✅ Check channel exists and bot has access

**"No campaigns to publish"**
- ✅ Ensure you have active campaigns in the dashboard
- ✅ Verify campaigns have the correct `guild_id`

**"Buttons don't appear"**
- ✅ Check bot has `Embed Links` permission
- ✅ Verify campaigns are marked as "Active"
- ✅ Ensure bot is online and connected

### Debug Mode

Enable debug logging in the Discord bot:

```env
DEBUG=true
NODE_ENV=development
```

## API Endpoints

### Main Publish Endpoint
```
POST /api/discord/publish-campaigns
```

**Request:**
```json
{}
```
*Uses environment variables `DISCORD_GUILD_ID` and `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID`*

**Response:**
```json
{
  "success": true,
  "campaigns_published": {
    "active": 2,
    "inactive": 1
  },
  "webhook_used": true
}
```

### Webhook Bridge
```
POST /api/discord/webhook/publish
```

Handles communication between dashboard and Discord bot.

## Recommendation for Your Setup

Given your specific guild and channel IDs (905448362944393218 and 1385186047079616513), I recommend:

1. **Use environment variables** - Most straightforward for your fixed setup
2. **Set channel permissions** to read-only for users
3. **Test with a few campaigns** first to verify everything works
4. **Monitor the audit logs** to track publish events

This setup gives you:
- ✅ Precise channel targeting using channel ID
- ✅ Message updates instead of spam
- ✅ Professional campaign presentation
- ✅ Seamless onboarding flow
- ✅ Complete audit trail 