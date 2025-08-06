# Virion Labs Discord Bot

A Discord bot for server management, campaign handling, and user onboarding for the Virion Labs community.

## Features

- **Campaign Management**: Automated campaign publishing and management
- **User Onboarding**: Interactive onboarding flow for new members
- **Access Control**: Role-based access management
- **Webhook Integration**: Integration with dashboard API for real-time updates
- **Health Monitoring**: Built-in health check endpoints

## Quick Start

### Local Development
```bash
# Install dependencies
yarn install

# Copy environment template
cp env.example .env

# Configure your environment variables in .env
# Then start the bot
yarn start
```

### Production Deployment

For production deployment to Google Cloud Run:

- **Quick Deploy**: See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for one-command deployment
- **Full Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for comprehensive deployment documentation

#### One-Command Deploy
```bash
gcloud builds submit --config cloudbuild.yaml
```

## Architecture

- **Runtime**: Node.js 18+ with Discord.js
- **Package Manager**: Yarn
- **Container**: Docker with Alpine Linux
- **Deployment**: Google Cloud Run with automated CI/CD
- **Secrets**: Google Cloud Secret Manager
- **Monitoring**: Google Cloud Logging and Monitoring

## Environment Variables

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#environment-variables) for the complete list of required environment variables.

Key variables:
- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_GUILD_ID`: Primary Discord server ID
- `DASHBOARD_API_URL`: Dashboard API endpoint
- `NODE_ENV`: Environment (development/production)

## Project Structure

```
src/
├── commands/           # Discord slash commands
├── core/              # Core bot functionality
│   ├── BotClient.js   # Main bot client
│   └── WebhookServer.js # Express webhook server
├── handlers/          # Event and interaction handlers
├── services/          # Business logic services
└── utils/            # Utility functions
```

## Development

### Prerequisites
- Node.js 18+
- Yarn package manager
- Discord Application with bot token

### Local Setup
1. Clone the repository
2. Install dependencies: `yarn install`
3. Copy `env.example` to `.env`
4. Configure environment variables
5. Start development: `yarn dev`

### Environment Management
Use the built-in environment switcher:
```bash
# Switch to development
yarn run env:dev

# Switch to production
yarn run env:prod

# Check current environment
yarn run env:status
```

## Deployment

### Google Cloud Run (Recommended)
Automated deployment with Google Cloud Build:

1. **Setup**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for initial setup
2. **Deploy**: Run `gcloud builds submit --config cloudbuild.yaml`
3. **Monitor**: Use Google Cloud Console for monitoring

### Manual Deployment Options
- Docker with `Dockerfile.gcp`
- PM2 with `yarn run pm2:start`
- Direct Node.js with `yarn start`

## Monitoring

### Health Check
```bash
curl https://your-service-url.run.app/health
```

### Logs
```bash
# View Cloud Run logs
gcloud run services logs tail virion-discord-bot --region=us-central1

# View local logs
yarn run pm2:logs
```

## Security

- Environment variables stored in Google Secret Manager
- Non-root user in Docker container
- HTTPS-only communication
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

- **Deployment Issues**: Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting)
- **Bot Issues**: Check the logs and Discord Developer Portal
- **API Issues**: Verify dashboard connectivity and API keys

## License

MIT License - see LICENSE file for details.

---

## Quick Commands

```bash
# Deploy to production
gcloud builds submit --config cloudbuild.yaml

# View logs
gcloud run services logs tail virion-discord-bot --region=us-central1

# Check service status
gcloud run services describe virion-discord-bot --region=us-central1
```

For more deployment commands, see [QUICK_DEPLOY.md](./QUICK_DEPLOY.md). 