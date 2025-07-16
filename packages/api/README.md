# Virion Labs Unified API

This is the centralized FastAPI server that provides a unified interface for all Virion Labs services. It implements the refactoring plan to decouple client applications from the database by channeling all data access and business logic through this single, authoritative API server.

## Architecture

The API follows a three-layer architecture:

1. **Presentation Layer (Clients):** Dashboard, Discord bot, and MCP server
2. **Business Logic Layer (This API):** Single source of truth for all business rules
3. **Data Layer:** Supabase database

## Features

### Authentication & User Management
- User registration and login with JWT tokens
- Email confirmation system
- User profile management
- Secure password hashing with bcrypt

### Client Management
- CRUD operations for client data
- Contact information and company details
- Notes and additional metadata

### Campaign Management
- Bot campaign creation and management
- Campaign configuration (onboarding, landing pages)
- Campaign statistics tracking
- Access control and permissions

### Referral System
- Referral code validation
- Campaign information retrieval
- Signup processing
- Conversion tracking

### Discord Integration
- Onboarding flow management
- Access request processing
- Role assignment and management
- Guild configuration

### Admin Functions
- Access request approval/denial
- User management
- System administration

## API Endpoints

### Core
- `GET /status/health` - Health check endpoint

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/send-confirmation` - Resend confirmation email
- `POST /api/auth/confirm` - Confirm user email
- `GET /api/auth/user` - Get current user profile
- `DELETE /api/auth/user/delete` - Delete user account

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/access-requests` - List pending access requests
- `POST /api/admin/access-requests` - Approve or deny access requests

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `GET /api/clients/{id}` - Get client details
- `PATCH /api/clients/{id}` - Update client details
- `DELETE /api/clients/{id}` - Delete client

### Campaigns
- `GET /api/campaigns/available` - List available campaigns
- `POST /api/campaigns/{id}/request-access` - Request campaign access
- `POST /api/campaigns/{id}/referral-links` - Create referral link
- `GET /api/campaigns/{id}/referral-links` - List referral links

### Bot Campaigns
- `GET /api/bot-campaigns` - List bot campaigns
- `POST /api/bot-campaigns` - Create bot campaign
- `GET /api/bot-campaigns/{id}` - Get bot campaign
- `PATCH /api/bot-campaigns/{id}` - Update bot campaign
- `DELETE /api/bot-campaigns/{id}` - Delete bot campaign
- `PATCH /api/bot-campaigns/{id}/stats` - Update campaign stats

### Referrals
- `GET /api/referral/{code}/validate` - Validate referral code
- `GET /api/referral/{code}/campaign` - Get campaign info for referral
- `POST /api/referral/signup` - Process referral signup
- `POST /api/referral/complete` - Mark referral as converted

### Discord Bot
- `POST /api/discord-bot/onboarding/start` - Start onboarding
- `POST /api/discord-bot/onboarding/modal` - Submit onboarding modal
- `GET /api/discord-bot/onboarding/session` - Get onboarding session
- `POST /api/discord-bot/onboarding/complete` - Complete onboarding
- `GET /api/discord-bot/config` - Get Discord config
- `GET /api/discord/invite/{code}/context` - Get invite context
- `POST /api/discord/guilds/{guildId}/members/{memberId}/roles` - Assign role
- `GET /api/discord/guilds/{guildId}/members/{memberId}/roles` - Get member roles

### Access Requests
- `POST /api/access-requests` - Submit access request

## Setup

### Prerequisites
- Python 3.11+
- Supabase account and project
- Environment variables configured

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
# Required
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
API_KEY=your_api_key_for_service_authentication

# Optional
JWT_SECRET=your_jwt_secret_key
```

3. Run the API server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Database Setup

The API expects the following Supabase tables to exist:

- `users` - User accounts and profiles
- `clients` - Client information
- `campaigns` - General campaigns
- `bot_campaigns` - Bot-specific campaigns
- `access_requests` - Discord access requests
- `referral_links` - Campaign referral links
- `referral_tracking` - Referral conversion tracking
- `onboarding_sessions` - Discord onboarding sessions
- `discord_configs` - Guild-specific bot configurations
- `discord_invites` - Managed Discord invites
- `discord_role_assignments` - Role assignment tracking
- `email_confirmations` - Email confirmation tokens
- `campaign_access_requests` - Campaign access requests

## Authentication

The API uses JWT tokens for authentication. Most endpoints require a valid Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

For service-to-service communication (like MCP server), use the API key:

```
Authorization: Bearer <api_key>
```

## Testing

Run the test script to verify API functionality:

```bash
python test_api.py
```

## MCP Server Integration

The MCP server has been refactored to use this API instead of direct database access. Key changes:

1. **Removed Supabase dependency** - No more direct database access
2. **Added HTTP client** - Uses httpx for API communication
3. **Async functions** - All functions are now async for better performance
4. **API-based operations** - All database operations now go through the API

### MCP Server Configuration

Set these environment variables for the MCP server:

```bash
API_BASE_URL=http://localhost:8000
API_KEY=your_api_key
```

## Development

### Adding New Endpoints

1. Create schemas in `schemas/`
2. Create service functions in `services/`
3. Create router endpoints in `routers/`
4. Add router to `main.py`

### Error Handling

The API uses consistent error handling:
- 400: Bad request (validation errors)
- 401: Unauthorized (authentication required)
- 404: Not found (resource doesn't exist)
- 500: Internal server error

### Logging

The API uses structured logging for debugging and monitoring. Check logs for:
- Request/response details
- Database operation results
- Authentication events
- Error traces

## Security Considerations

- All passwords are hashed with bcrypt
- JWT tokens have expiration times
- API keys should be rotated regularly
- Input validation on all endpoints
- CORS configuration for web clients
- Rate limiting (to be implemented)

## Monitoring

The API provides health check endpoints for monitoring:
- `GET /status/health` - Basic health check
- Database connectivity monitoring
- Service dependency checks

## Future Enhancements

- Rate limiting
- Caching layer
- Webhook notifications
- Analytics endpoints
- Bulk operations
- File upload support
- Real-time updates (WebSocket)