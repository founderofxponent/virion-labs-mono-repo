# Virion Labs Client Discord Bot

A dedicated bot for client servers to sync guilds, channels, and roles with the Virion Labs dashboard. This bot supports multiple clients via `/sync client:<documentId>`.

## Command
- `/sync client:<documentId>`: Collects the current guild channels and roles and posts them to the Business Logic API. Requires the invoker to have Manage Server permissions.

## Responsibilities
- Offer a `/sync` command with a required `client` argument (Strapi client `documentId`).
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

## Notes
- Minimal permissions; only needs read access to channels/roles and register slash commands.
- Provide the `client` documentId argument to associate the sync with the correct client.
