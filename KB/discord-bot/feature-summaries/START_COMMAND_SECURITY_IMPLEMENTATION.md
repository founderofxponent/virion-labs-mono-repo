# Discord Bot `/start` Command Security Implementation

## Overview

The `/start` command has been enhanced with two critical security measures to ensure only verified users can access campaigns and that the command is used in the designated channel.

## Security Features

### 1. Role-Based Access Control

- **Requirement**: Users must have the "Verified" role to use the `/start` command
- **Configuration**: Set via `DISCORD_VERIFIED_ROLE_ID` environment variable
- **Behavior**: 
  - Users without the verified role receive a message directing them to use `/request-access`
  - The bot checks role membership dynamically for each command usage

### 2. Channel Restriction

- **Requirement**: `/start` command can only be used in a specific designated channel
- **Configuration**: Set via `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID` environment variable
- **Behavior**:
  - Users attempting to use `/start` in other channels receive an error message
  - The error message includes a mention of the correct channel

## Environment Variables

### Required Variables

```bash
# Role ID for users who can access /start command
DISCORD_VERIFIED_ROLE_ID=123456789012345678

# Channel ID where /start command is allowed
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=987654321098765432
```

### Development/Testing Mode

If either environment variable is not set:
- `DISCORD_VERIFIED_ROLE_ID`: Allows all users (logs warning)
- `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID`: Allows command in all channels (logs warning)

## User Experience

### Successful Access

When a verified user uses `/start` in the correct channel:
1. Role verification passes silently
2. Channel verification passes silently
3. Campaign selection interface is displayed

### Access Denied - Missing Role

```
❌ You need the **Verified** role to use this command. Please request access first using `/request-access`.
```

### Access Denied - Wrong Channel

```
❌ The `/start` command can only be used in #campaigns-channel.

Please use the command in the correct channel to join campaigns.
```

## Implementation Details

### Code Structure

1. **StartCommand.js**: Enhanced with role and channel validation
2. **InteractionUtils.js**: Added utility methods for role and channel checking
3. **Environment Configuration**: Updated with better documentation

### Key Methods

- `checkVerifiedRole(interaction)`: Validates user has required role
- `checkCorrectChannel(interaction)`: Validates command is used in correct channel
- `InteractionUtils.hasRole(interaction, roleId)`: Utility for role checking
- `InteractionUtils.isInChannel(interaction, channelId)`: Utility for channel checking

### Error Handling

- Graceful fallback when role/channel checks fail
- Proper logging for debugging
- User-friendly error messages with guidance
- Development mode warnings for missing configuration

## Setup Instructions

### 1. Get Role ID

1. In Discord, go to Server Settings → Roles
2. Find your "Verified" role
3. Right-click and select "Copy ID"
4. Set `DISCORD_VERIFIED_ROLE_ID=<role_id>`

### 2. Get Channel ID

1. In Discord, right-click on your campaigns channel
2. Select "Copy ID"
3. Set `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=<channel_id>`

### 3. Restart Bot

After setting environment variables, restart the Discord bot for changes to take effect.

## Testing

### Test Cases

1. **Verified user in correct channel**: Should work normally
2. **Unverified user in correct channel**: Should show role error
3. **Verified user in wrong channel**: Should show channel error
4. **Unverified user in wrong channel**: Should show role error first

### Verification Steps

1. Test with a user who has the verified role in the correct channel
2. Test with a user who doesn't have the verified role
3. Test in a different channel with a verified user
4. Check logs for proper warning messages in development mode

## Logging

The bot logs the following for debugging:

- Role verification attempts and results
- Channel validation attempts and results
- Configuration warnings when environment variables are missing
- Error details when verification fails

## Troubleshooting

### Common Issues

1. **Command works for everyone**: Check `DISCORD_VERIFIED_ROLE_ID` is set correctly
2. **Command works in all channels**: Check `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID` is set correctly
3. **Role check fails**: Ensure role ID is correct and bot has permission to view roles
4. **Channel mention doesn't work**: Verify channel ID is correct

### Debug Mode

Set `DEBUG=true` in environment variables for detailed logging of all verification attempts. 