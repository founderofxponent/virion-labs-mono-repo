# Discord Bot Integration Testing Guide

## New Features Implemented

### 1. Automatic Client Linking
- Bot installation URL now includes client state parameter
- OAuth callback handler automatically links Discord guilds to clients
- No more manual client ID requirement in `/sync` command

### 2. Enhanced `/sync` Command
- Client parameter is now optional
- Auto-detects client based on guild-to-client mapping
- Falls back to manual client ID if auto-detection fails

### 3. Improved UI/UX
- Better installation instructions on integrations page
- Simplified sync command instructions
- Clear status indicators for connected servers

## Testing Steps

### 1. Test Bot Installation URL Generation
```bash
# Test the install URL endpoint (requires auth token)
curl -X GET "http://localhost:8000/api/v1/integrations/discord/client/install-url" \
  -H "Authorization: Bearer YOUR_CLIENT_TOKEN"

# Should return a URL with state parameter like:
# https://discord.com/api/oauth2/authorize?client_id=...&state=...&redirect_uri=...
```

### 2. Test OAuth Callback Handler
```bash
# Simulate Discord OAuth callback (requires API key)
curl -X GET "http://localhost:8000/api/v1/integrations/discord/client/oauth-callback?code=test_code&state=test_state&guild_id=123456789" \
  -H "x-api-key: YOUR_API_KEY"
```

### 3. Test Guild-to-Client Lookup
```bash
# Test finding client by guild ID (requires API key)
curl -X GET "http://localhost:8000/api/v1/integrations/discord/client/find-by-guild/123456789" \
  -H "x-api-key: YOUR_API_KEY"
```

### 4. Test Discord Bot Sync (Enhanced)
The Discord bot now:
1. Tries to auto-detect client from guild ID
2. Falls back to manual client parameter if needed
3. Provides clear error messages

## Database Changes

### New Strapi Collection: `discord-bot-installs`
- Tracks OAuth states and bot installations
- Links clients to Discord guilds during installation
- Has expiration for security

### Updated Collection: `clients`
- Added inverse relation to `discord-bot-installs`

## Environment Variables Required

Add to your `.env` files:
```bash
# Discord client bot OAuth2 client ID
DISCORD_CLIENT_BOT_CLIENT_ID=your_bot_client_id
```

## Error Handling

The system now handles:
- Expired OAuth states (15-minute expiration)
- Missing client-guild mappings
- Failed auto-detection with fallback options
- Clear user error messages

## User Journey

1. **Client visits integrations page**
2. **Clicks "Install Bot"** → Redirected to Discord OAuth with state parameter
3. **Authorizes bot on Discord** → Discord redirects to OAuth callback
4. **OAuth callback processes** → Creates guild-client mapping
5. **Client runs `/sync` in Discord** → Bot auto-detects client, syncs data
6. **Server appears on integrations page** → Complete!

## Benefits

- **No more manual client IDs** - Users don't need to copy/paste document IDs
- **Automatic linking** - Guild-client relationship established during installation
- **Better UX** - Clear instructions and error messages
- **More secure** - State parameter prevents CSRF attacks
- **Fallback support** - Manual client ID still works if needed