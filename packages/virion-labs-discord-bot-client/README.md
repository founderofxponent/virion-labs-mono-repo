# Virion Labs Client Discord Bot

A dedicated bot for client servers to sync guilds, channels, and roles with the Virion Labs dashboard. This bot is separate from the public-facing campaign bot.

## Responsibilities
- Offer a `/sync` command that collects current guild channels and roles
- POST the payload to the Business Logic API webhook:
  - `POST /api/v1/integrations/discord/client/bot-sync`
  - Headers: `x-api-key: ${BUSINESS_LOGIC_API_KEY}`
  - Body:
    ```json
    {
      "client_document_id": "<documentId-from-dashboard>",
      "guild_id": "<guild_id>",
      "guild_name": "<guild_name>",
      "channels": [{"id":"..","name":"..","type":0}],
      "roles": [{"id":"..","name":"..","color":12345}]
    }
    ```

## Env
- `BUSINESS_LOGIC_API_URL`
- `BUSINESS_LOGIC_API_KEY`
- `DISCORD_CLIENT_BOT_TOKEN`
- `CLIENT_DOCUMENT_ID` (passed from deployment/runtime)

## Notes
- Keep permissions minimal: Read channels, read roles. No moderation.
- This package is scaffolded; implement bot logic as needed.
