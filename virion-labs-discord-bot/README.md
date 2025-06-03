# Virion Labs Discord Bot

A Discord bot that forwards messages to n8n webhooks for AI processing and sends responses back to Discord.

## 🚀 Features

- **Message Forwarding**: Captures all Discord messages and forwards them to n8n webhook
- **AI Integration**: Processes messages through n8n workflow with AI capabilities
- **Rich Message Data**: Includes attachments, embeds, mentions, and reply chains
- **Error Handling**: Robust error handling with user-friendly messages
- **Debug Mode**: Detailed logging for development and troubleshooting
- **Production Ready**: Docker support, PM2 integration, and health checks

## 📋 Prerequisites

- Node.js 16.0.0 or higher
- Discord bot token with Message Content Intent enabled
- n8n workflow with webhook endpoint

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
N8N_WEBHOOK_URL=https://n8n.xponent.ph/webhook/7a630bf4-234c-44fc-bd69-f1db2f6062ac
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
   - Use Slash Commands

### 4. Test n8n Webhook

```bash
npm test
```

### 5. Start the Bot

```bash
npm start
```

## 🔧 n8n Workflow Setup

Your n8n workflow should:

1. **Webhook Trigger**
   - Method: POST
   - Response Mode: "Respond to Webhook"

2. **AI Processing Node**
   - Input: `{{ $json.content }}`
   - Process message with your AI service

3. **Response Node**
   ```json
   {
     "response": "{{ $json.ai_response }}"
   }
   ```

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

## 📊 Message Data Format

The bot sends comprehensive message data to your n8n webhook:

```json
{
  "messageId": "1234567890",
  "channelId": "9876543210",
  "guildId": "1111222233",
  "guildName": "My Server",
  "channelName": "general",
  "authorId": "5555666677",
  "authorTag": "user#1234",
  "authorDisplayName": "User Display Name",
  "content": "Hello, how are you?",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "attachments": [
    {
      "id": "attachment_id",
      "name": "image.png",
      "url": "https://cdn.discord.com/...",
      "size": 1024,
      "contentType": "image/png"
    }
  ],
  "embeds": [...],
  "mentions": {
    "users": [...],
    "roles": [...],
    "channels": [...]
  },
  "referencedMessage": {
    "messageId": "replied_message_id",
    "channelId": "channel_id",
    "guildId": "guild_id"
  }
}
```

## 🐛 Troubleshooting

### Bot not responding
- Check Discord bot token
- Verify "Message Content Intent" is enabled
- Check bot permissions in Discord server

### Webhook errors (404)
- Ensure n8n workflow is **ACTIVE**
- Verify webhook URL is correct
- Test webhook independently: `npm test`

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
| `npm test` | Test n8n webhook |
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
🔗 Forwarding messages to: https://...
✅ Bot is now listening for messages...

📨 Message from user#1234 in My Server: Hello!
🔄 Forwarding to n8n webhook...
✅ Received response from n8n
💬 AI response sent: Hello! How can I help?
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