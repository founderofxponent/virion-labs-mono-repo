# Virion Labs Client Discord Bot

A dedicated bot for client servers to sync guilds, channels, and roles with the Virion Labs dashboard. The bot auto-detects the associated client for a guild based on the OAuth mapping created from the dashboard install flow.

## Command
- `/sync`: Collects the current guild channels and roles and posts them to the Business Logic API. Requires the invoker to have Manage Server permissions.

## Responsibilities
- Offer a `/sync` command that auto-detects the client via `GET /api/v1/integrations/discord/client/find-by-guild/{guild_id}`.
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
      "roles": [{"id":"..","name":"..","color":12345, "memberCount": 42}]
    }
    ```

## Env
- `BUSINESS_LOGIC_API_URL`
- `BUSINESS_LOGIC_API_KEY`
- `DISCORD_CLIENT_BOT_TOKEN`

## Notes
- Minimal permissions; only needs read access to channels/roles and register slash commands.
- The bot must be installed via the dashboard "Install Bot" flow so the server → client mapping exists.
- To populate `memberCount` for each role, enable the "Server Members Intent" (Privileged Gateway Intent) in the Discord Developer Portal for this bot. If not enabled, counts will be null and the dashboard will show `?`.
