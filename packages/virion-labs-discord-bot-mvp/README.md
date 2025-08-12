# Virion Labs Discord Bot MVP

A minimal viable product for the Virion Labs Discord Bot, designed for standalone deployment.

## Features

- Slash command support
- Guild member onboarding
- Request access functionality
- Health monitoring endpoints
- Graceful shutdown handling

## Environment Variables

Required environment variables:

```
DISCORD_BOT_TOKEN=your_discord_bot_token
BUSINESS_LOGIC_API_URL=https://your-api-url.com
API_KEY=your_api_key
```

Optional environment variables:

```
PORT=8080
DEBUG=false
NODE_ENV=production
```

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with required environment variables

3. Start development server:
```bash
npm run dev
```

## Deployment

### Render.com

This project includes a `render.yaml` for easy deployment to Render:

1. Push this directory to a Git repository
2. Connect the repository to Render
3. Set the required environment variables in the Render dashboard
4. Deploy

### Docker

Build and run with Docker:

```bash
# Build the image
docker build -t discord-bot-mvp .

# Run the container
docker run -d \
  -p 8080:8080 \
  -e DISCORD_BOT_TOKEN=your_token \
  -e BUSINESS_LOGIC_API_URL=your_api_url \
  -e API_KEY=your_api_key \
  discord-bot-mvp
```

## Health Endpoints

- `GET /health` - Health check endpoint
- `GET /status` - Detailed status information
- `GET /ping` - Simple ping endpoint

## Project Structure

```
src/
├── commands/          # Slash commands
├── config.js          # Configuration
├── core/              # Core bot functionality
├── handlers/          # Event handlers
├── health-server.js   # Health monitoring server
├── index.js           # Application entry point
├── services/          # External services
└── utils/             # Utility functions
```