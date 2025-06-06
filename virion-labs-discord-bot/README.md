# Virion Labs Discord Bot

A Discord bot for server management, campaign handling, and member onboarding. The AI service functionality has been removed.

## 🚀 Features

- **Campaign Management**: Supports different campaign types (referral, community engagement, gaming)
- **Member Onboarding**: Automated welcome messages and onboarding flows
- **Referral System**: Handles referral codes and campaign tracking
- **Dashboard Integration**: Connects with Virion Labs dashboard for configuration
- **Basic Interaction**: Responds to direct mentions and help commands
- **Production Ready**: Docker support, PM2 integration, and error handling

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Discord bot token with Message Content Intent enabled
- Virion Labs Dashboard API (optional, for campaign features)

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
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DASHBOARD_API_URL=http://localhost:3000/api
DEBUG=true
```

### 3. Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application → Bot section
3. **Enable "Message Content Intent"** (crucial!)
4. Copy bot token to `.env` file
5. Generate invite URL with permissions:
   - Send Messages
   - Read Message History
   - Manage Messages
   - Read Message History

### 4. Start the Bot

```bash
npm start
```

## 🎯 Bot Functionality

The bot will:

1. **Basic Responses**: Only responds to direct mentions (@bot) or !help commands
2. **Campaign Support**: If connected to Virion Labs Dashboard, provides campaign-specific features
3. **Member Onboarding**: Sends welcome messages to new members (if campaign configured)
4. **Referral Handling**: Processes referral codes when campaigns are active
5. **Message Tracking**: Logs interactions for dashboard analytics

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

Or manually:
```bash
docker build -t virion-discord-bot .
docker run -d --name virion-bot --env-file .env virion-discord-bot
```

### Option 3: Cloud Deployment

**Railway:**
1. Connect GitHub repo
2. Add environment variables
3. Deploy automatically

**Render:**
1. Create "Background Worker"
2. Connect repo
3. Set start command: `npm start`

## 🎮 Campaign Types

The bot supports different campaign configurations:

- **Referral Onboarding**: Welcome messages with referral code handling
- **Community Engagement**: Help commands and community interaction
- **Gaming Community**: Gaming-focused welcome messages and perks
- **Custom Campaigns**: Configurable through Virion Labs Dashboard

## 🐛 Troubleshooting

### Bot not responding
- Check Discord bot token
- Verify "Message Content Intent" is enabled
- Check bot permissions in Discord server
- Try mentioning the bot directly (@BotName) or use !help

### Dashboard connection issues
- Verify DASHBOARD_API_URL is correct
- Check if dashboard API is running
- Bot will continue with basic functionality if dashboard is unavailable

### Permission errors
- Re-invite bot with correct permissions
- Check channel-specific permission overrides
- Verify bot role hierarchy

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
- Regularly rotate Discord bot tokens
- Monitor bot activity and logs
- Use non-root user in Docker containers

## 📈 Monitoring

The bot provides detailed console logging:

```
🤖 Virion Labs Discord Bot is ready!
📡 Logged in as YourBot#1234
🔗 Dashboard API: http://localhost:3000/api
✅ Bot is now listening for messages...

📨 Message from user#1234 in My Server: @BotName help
📝 Processing message from user#1234: @BotName help
💬 Basic response sent
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Check [troubleshooting section](#-troubleshooting)
- Review console logs for errors
- Test webhook independently
- Verify Discord bot configuration

---

**Built by Virion Labs** | **Version 1.0.0** | **Node.js 16+** 