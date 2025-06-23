# Discord Bot Migration Guide

## Overview

The Discord bot has been reorganized into a modular, component-based architecture while maintaining all existing functionality. This guide explains the changes and how to work with the new structure.

## New Structure

```
src/
├── index.js                    # Main entry point
├── core/                       # Core bot components
│   ├── BotClient.js           # Main Discord client orchestrator
│   ├── SlashCommandManager.js # Command registration and management
│   ├── InteractionHandler.js  # Routes all Discord interactions
│   ├── EventHandler.js        # Handles Discord events
│   └── WebhookServer.js       # Express server for webhooks
├── commands/                   # Slash command implementations
│   ├── CampaignsCommand.js    # /campaigns command
│   └── StartCommand.js        # /start command
├── handlers/                   # Specialized interaction handlers
│   ├── OnboardingHandler.js   # Onboarding process management
│   └── ReferralHandler.js     # Referral system management
├── services/                   # Business logic services
│   ├── CampaignService.js     # Campaign-related operations
│   ├── AnalyticsService.js    # Analytics and tracking
│   └── CampaignPublisher.js   # Campaign publishing to Discord
├── utils/                      # Utility functions
│   ├── Logger.js              # Consistent logging
│   └── InteractionUtils.js    # Safe interaction handling
└── database/                   # Database operations
    └── SupabaseClient.js      # Supabase client wrapper
```

## Key Changes

### 1. Entry Point
- **Old:** `index.js` (2600+ lines)
- **New:** `src/index.js` (clean, focused entry point)

### 2. Modular Architecture
- **Commands:** Each slash command has its own class
- **Handlers:** Specialized handlers for different interaction types
- **Services:** Business logic separated into focused services
- **Utils:** Reusable utilities for common operations

### 3. Improved Error Handling
- Consistent error handling across all components
- Safe interaction replies that handle Discord's interaction states
- Graceful shutdown handling

### 4. Better Logging
- Structured logging with different levels (info, error, warn, debug)
- Consistent log format across all components
- Debug mode support

## Running the New Version

### Development
```bash
npm run dev
# or
node src/index.js
```

### Production
```bash
npm start
# or with PM2
npm run pm2:start
```

### Environment Variables
No changes to environment variables - all existing variables work the same:
- `DISCORD_BOT_TOKEN`
- `DASHBOARD_API_URL`
- `DISCORD_GUILD_ID`
- `DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DEBUG`

## Functionality Preserved

All existing functionality has been preserved:

### ✅ Slash Commands
- `/campaigns` - View available campaigns
- `/start` - Start campaign onboarding

### ✅ Onboarding System
- Modal-based onboarding forms
- Session management
- Progress tracking
- Role assignment after completion

### ✅ Referral System
- Referral code validation
- Invite context handling
- Referral tracking and analytics

### ✅ Campaign Publishing
- Webhook endpoint for automatic publishing
- Campaign message updates
- Channel targeting (by ID or name)

### ✅ Analytics & Tracking
- Interaction tracking
- Bot statistics
- Onboarding completion tracking
- Referral conversion tracking

### ✅ Member Management
- New member welcome messages
- Auto-onboarding triggers
- Role assignment

## Adding New Features

The new architecture makes it easy to extend functionality:

### Adding a New Slash Command

1. Create command class in `src/commands/`:
```javascript
// src/commands/NewCommand.js
class NewCommand {
  constructor(config, logger, database) {
    // Initialize
  }
  
  async execute(interaction) {
    // Handle command
  }
}
```

2. Add to SlashCommandManager:
```javascript
// In src/core/SlashCommandManager.js
ADMIN: [
  {
    name: 'new-command',
    description: 'Description of new command',
    handler: 'handleNewCommand'
  }
]
```

3. Add to InteractionHandler:
```javascript
// In src/core/InteractionHandler.js
case 'new-command':
  await this.newCommand.execute(interaction);
  break;
```

### Adding a New Service

1. Create service in `src/services/`:
```javascript
// src/services/NewService.js
class NewService {
  constructor(config, logger, database) {
    // Initialize
  }
  
  async doSomething() {
    // Business logic
  }
}
```

2. Import and use in other components as needed.

### Adding a New Handler

1. Create handler in `src/handlers/`:
```javascript
// src/handlers/NewHandler.js
class NewHandler {
  constructor(config, logger, database) {
    // Initialize
  }
  
  async handleSomething(interaction) {
    // Handle specific interaction type
  }
}
```

2. Add to InteractionHandler or EventHandler as appropriate.

## Benefits of New Architecture

### 🎯 **Maintainability**
- Single responsibility principle
- Clear separation of concerns
- Easier to debug and test

### 🚀 **Extensibility**
- Easy to add new commands
- Modular services can be reused
- Clear patterns for new features

### 🛡️ **Reliability**
- Better error handling
- Graceful shutdown
- Consistent logging

### 📈 **Performance**
- Lazy loading of components
- Efficient memory usage
- Better resource management

### 👥 **Developer Experience**
- Clear code organization
- Type hints with JSDoc
- Consistent patterns

## Migration Checklist

- [x] All existing functionality preserved
- [x] Environment variables unchanged
- [x] API endpoints unchanged
- [x] Database schema unchanged
- [x] Webhook endpoints unchanged
- [x] Command behavior unchanged
- [x] Error handling improved
- [x] Logging enhanced
- [x] Code organization improved
- [x] Documentation updated

## Troubleshooting

### Common Issues

1. **Module not found errors**
   - Ensure you're running from the correct directory
   - Check that all files are in the `src/` folder

2. **Environment variables not loading**
   - Make sure `.env` file is in the root directory (not in `src/`)
   - Verify all required environment variables are set

3. **Database connection issues**
   - Check Supabase credentials
   - Verify network connectivity

### Getting Help

If you encounter any issues with the migration:

1. Check the logs for detailed error messages
2. Ensure all environment variables are properly set
3. Verify that the database is accessible
4. Check that Discord bot permissions are correct

The new architecture provides better error messages and logging to help diagnose issues quickly. 