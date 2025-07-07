# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing the Virion Labs influencer referral platform, consisting of:
- **Dashboard** (`virion-labs-dashboard/`) - Next.js frontend application
- **Discord Bot** (`virion-labs-discord-bot/`) - Node.js Discord bot for campaign management
- **Knowledge Base** (`KB/`) - Comprehensive technical documentation (56 files)

## Common Commands

### Monorepo Management
```bash
# Install dependencies for all projects
npm run install:all

# Environment switching (development/production)
npm run env:dev        # Switch all to development
npm run env:prod       # Switch all to production
npm run env:status     # Check current environment status

# Start all services
npm run start:all      # Dashboard + Discord Bot
```

### Dashboard (virion-labs-dashboard/)
```bash
# Development
npm run dev            # Start development server on localhost:3000
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint

# Database operations
npm run migration:create     # Create new database migration
npm run migration:apply      # Apply pending migrations
npm run compare-schemas      # Compare dev vs prod schemas

# Environment management
npm run env:dev        # Switch to development environment
npm run env:prod       # Switch to production environment
npm run env:status     # Check current environment
npm run env:init       # Initialize environment configuration

# Admin tools
npm run script:add-admin     # Add admin user
```

### Discord Bot (virion-labs-discord-bot/)
```bash
# Development
npm start              # Start the bot
npm run dev            # Start in development mode (same as start)

# PM2 process management
npm run pm2:start      # Start with PM2
npm run pm2:stop       # Stop PM2 process
npm run pm2:restart    # Restart PM2 process
npm run pm2:logs       # View PM2 logs

# Docker deployment
npm run docker:build   # Build Docker image
npm run docker:run     # Run Docker container
npm run docker:stop    # Stop and remove Docker container

# Environment management
npm run env:dev        # Switch to development
npm run env:prod       # Switch to production
npm run env:status     # Check current environment
```

## Architecture Overview

### Database (Supabase)
- **Core Tables**: clients, bots, discord_guild_campaigns, referral_links, referrals, user_profiles, user_settings
- **Analytics**: referral_analytics, campaign_landing_pages  
- **Environment Management**: Unified system for dev/prod database switching
- **Schema Management**: Migration system with compare-schemas tool

### Dashboard Architecture
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + custom hooks (use-clients, use-campaigns, etc.)
- **API**: REST API routes in `app/api/`
- **Authentication**: Supabase Auth with role-based access (influencer, admin, client)
- **Key Features**: Campaign wizard, referral management, analytics, client onboarding

### Discord Bot Architecture
- **Framework**: Discord.js v14
- **Core Components**: 
  - `BotClient` - Main bot instance
  - `WebhookServer` - Express server for dashboard integration
  - `SlashCommandManager` - Command handling
  - `OnboardingHandler` - User onboarding flow
- **Services**: CampaignService, AnalyticsService, CampaignPublisher
- **Commands**: `/join` (campaign access), `/request-access` (manual approval)

### Integration Points
- **Dashboard ↔ Discord Bot**: Webhook communication via Express server
- **Shared Database**: Both services use the same Supabase instance
- **Campaign Flow**: Dashboard creates campaigns → Bot publishes to Discord → Users onboard via modals
- **Analytics**: Real-time tracking of referral clicks, conversions, and onboarding completion

## Key Patterns

### Environment Management
- Use environment switching scripts: `npm run env:dev/prod`
- Database schemas are synchronized between environments
- Configuration is managed through environment-specific files

### Campaign Management
- Campaign-centric approach: campaigns are the primary organizational unit
- Campaigns have associated landing pages, referral links, and onboarding flows
- Status tracking: active, paused, completed campaigns

### Error Handling
- Comprehensive error logging in both dashboard and bot
- Graceful degradation when services are unavailable
- User-friendly error messages in dashboard UI

### Testing
- Manual testing guides in `tests/manual/`
- Test scenarios for campaign flows in `tests/manual/test-scenarios/`
- Automated testing setup in `tests/automated/`

## Development Notes

### Database Schema Updates
- Use `npm run migration:create` to create new migrations
- Test migrations on development before applying to production
- Use `npm run compare-schemas` to verify schema consistency

### Discord Bot Development
- Bot requires specific Discord permissions and role IDs
- Test bot commands in development Discord server first
- Use PM2 for production deployment with process management

### Dashboard Development
- Follow existing component patterns in `components/`
- Use TypeScript with strict type checking
- API routes follow RESTful conventions
- UI components use shadcn/ui design system

### Security
- API keys and tokens are environment-specific
- Database RLS policies enforce access control
- Client-side validation + server-side validation for all forms

## Troubleshooting

### Common Issues
- **Environment Mismatches**: Use `npm run env:status` to check current environment
- **Database Connection**: Verify Supabase credentials and network connectivity
- **Discord Bot Offline**: Check PM2 status and bot token validity
- **Build Errors**: TypeScript/ESLint errors are currently ignored in build (see next.config.mjs)

### Performance Optimization
- Database queries are optimized for Supabase free tier
- Real-time subscriptions are limited to 2 events/second
- Image optimization is disabled (unoptimized: true in Next.js config)

## Documentation
Comprehensive technical documentation is available in the `KB/` directory, organized by:
- **Dashboard**: 28 files covering features, implementation, troubleshooting
- **Discord Bot**: 10 files covering features and deployment
- **Shared**: 16 files covering database, analytics, and cross-platform features

Refer to `KB/README.md` for detailed navigation of all documentation.