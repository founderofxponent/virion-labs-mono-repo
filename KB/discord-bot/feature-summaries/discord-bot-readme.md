# Virion Labs Discord Bot

A modular Discord bot for server management, campaign handling, and member onboarding with a clean, extensible architecture.

## 🎯 Overview

This Discord bot provides a comprehensive solution for managing campaigns, onboarding new members, and handling referral systems. Built with a modular architecture, it's designed for easy maintenance and future extensibility.

## 🏗️ Architecture

The bot is organized into a clean, modular structure:

```
src/
├── index.js                    # Main entry point
├── core/                       # Core bot components
│   ├── BotClient.js           # Discord client orchestrator
│   ├── SlashCommandManager.js # Command management
│   ├── InteractionHandler.js  # Interaction routing
│   ├── EventHandler.js        # Discord event handling
│   └── WebhookServer.js       # Express server for webhooks
├── commands/                   # Slash command implementations
│   ├── CampaignsCommand.js    # /campaigns command
│   └── StartCommand.js        # /start command
├── handlers/                   # Specialized interaction handlers
│   ├── OnboardingHandler.js   # Onboarding management
│   └── ReferralHandler.js     # Referral system
├── services/                   # Business logic services
│   ├── CampaignService.js     # Campaign operations
│   ├── AnalyticsService.js    # Analytics and tracking
│   └── CampaignPublisher.js   # Campaign publishing
├── utils/                      # Utility functions
│   ├── Logger.js              # Consistent logging
│   └── InteractionUtils.js    # Safe interaction handling
└── database/                   # Database operations
    └── SupabaseClient.js      # Supabase wrapper
```

## ✨ Features

### 🎮 Slash Commands
- `/campaigns` - View available campaigns in the server
- `/start` - Start onboarding for active campaigns

### 📋 Onboarding System
- Modal-based forms for user information collection
- Progress tracking and session management
- Automatic role assignment upon completion
- Customizable fields per campaign

### 🤝 Referral System
- Referral code validation and tracking
- Automatic processing of invite-based referrals
- Analytics and conversion tracking
- Direct message support for referral codes

### 📢 Campaign Management
- Automatic campaign publishing to Discord channels
- Webhook support for real-time updates
- Campaign status management (active, paused, archived)
- Channel targeting by ID or name

### 📊 Analytics & Tracking
- User interaction tracking
- Onboarding completion statistics
- Referral conversion analytics
- Bot usage metrics and performance monitoring

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Discord bot token with required intents
- Supabase database (for data persistence)
- Virion Labs Dashboard API (for campaign management)

## 🛠️ Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd virion-labs-discord-bot
npm install
```

### 2. Environment Configuration

```bash
cp env.example .env
```

Edit `.env` file:
```bash
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
DISCORD_JOIN_CAMPAIGNS_CHANNEL_ID=your_channel_id_here

# API Configuration
DASHBOARD_API_URL=http://localhost:3000/api
WEBHOOK_PORT=3001

# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Debug
DEBUG=true
```

### 3. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application → Bot section
3. **Enable required intents:**
   - Message Content Intent
   - Server Members Intent
4. Copy bot token to `.env` file
5. Generate invite URL with permissions:
   - Send Messages
   - Use Slash Commands
   - Manage Roles
   - Read Message History

### 4. Start the Bot

```bash
npm start
```

## 🎯 Bot Functionality

### Core Features
1. **Slash Commands**: Modern Discord interaction system
2. **Campaign Management**: Integration with dashboard for campaign configuration
3. **Member Onboarding**: Automated welcome and onboarding flows
4. **Referral Processing**: Handles referral codes and tracking
5. **Analytics**: Comprehensive interaction and conversion tracking

### Webhook Support
The bot includes an Express server for webhook endpoints:
- `/api/publish-campaigns` - Automatically publish campaigns to Discord
- `/health` - Health check endpoint

## 🚀 Deployment Options

### Option 1: PM2 (Production)

```bash
npm run pm2:start
npm run pm2:logs     # View logs
npm run pm2:restart  # Restart bot
npm run pm2:stop     # Stop bot
```

### Option 2: Docker

```bash
npm run docker:build
npm run docker:run
```

### Option 3: Development

```bash
npm run dev
```

## 🎮 Campaign Types

The bot supports various campaign configurations:

- **Referral Campaigns**: Code-based referral tracking
- **Community Engagement**: Member onboarding and role assignment
- **Gaming Communities**: Gaming-focused features and perks
- **Custom Campaigns**: Fully configurable through dashboard

## 🔧 Extending the Bot

The modular architecture makes it easy to add new features:

### Adding a New Command
1. Create command class in `src/commands/`
2. Add to `SlashCommandManager`
3. Register in `InteractionHandler`

### Adding a New Service
1. Create service in `src/services/`
2. Import and use in relevant components

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for detailed examples.

## 🐛 Troubleshooting

### Bot not responding to slash commands
- Check Discord bot token and permissions
- Verify slash commands are registered (check bot logs)
- Ensure bot has "Use Slash Commands" permission

### Database connection issues
- Verify Supabase credentials
- Check network connectivity
- Review database permissions

### Webhook not working
- Check webhook port configuration
- Verify API endpoint accessibility
- Review webhook server logs

### Debug Mode
Set `DEBUG=true` in `.env` for detailed logging:
```bash
DEBUG=true npm start
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start the bot |
| `npm run dev` | Start in development mode |
| `npm run pm2:start` | Start with PM2 |
| `npm run pm2:logs` | View PM2 logs |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run Docker container |

## 🔒 Security

- Never commit `.env` file to git
- Use environment variables for all secrets
- Regularly rotate Discord bot tokens and database keys
- Monitor bot activity and logs
- Use non-root user in Docker containers
- Validate all user inputs

## 📈 Monitoring

The bot provides structured logging with different levels:

```
[INFO] 2024-01-01T00:00:00.000Z - 🚀 Starting Virion Labs Discord Bot...
[INFO] 2024-01-01T00:00:00.000Z - 🤖 Bot logged in as YourBot#1234
[INFO] 2024-01-01T00:00:00.000Z - 📊 Serving 5 servers
[INFO] 2024-01-01T00:00:00.000Z - ✅ Registered 2 slash commands: /campaigns, /start
[INFO] 2024-01-01T00:00:00.000Z - 🌐 Webhook server started on port 3001
[INFO] 2024-01-01T00:00:00.000Z - ✅ Bot and webhook server started successfully
```

## 📊 Performance

The new architecture provides:
- **Memory Efficiency**: Modular loading and cleanup
- **Error Resilience**: Graceful error handling and recovery
- **Scalability**: Easy to add new features and components
- **Maintainability**: Clear separation of concerns

## 🔄 Migration

If you're upgrading from the previous version, see [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for:
- Architecture changes
- New features
- Breaking changes (none!)
- Migration steps

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow the existing architecture patterns
4. Add tests for new functionality
5. Update documentation
6. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check [troubleshooting section](#-troubleshooting)
- Review [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- Check console logs for detailed error messages
- Verify all environment variables are set correctly

---

**Built by Virion Labs** | **Version 2.0.0** | **Node.js 16+** | **Modular Architecture** 