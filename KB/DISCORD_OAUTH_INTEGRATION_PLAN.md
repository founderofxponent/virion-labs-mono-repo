# Discord OAuth Integration Plan

## Objective

Unify user authentication for the Virion Labs Dashboard and the Discord MVP by integrating Strapi with Discord OAuth. This will create a single user profile in Strapi that can be associated with either a Discord account, a Google account, or both.

---

## User Flow Summary

**1. For Dashboard Users:**
*   A user visits the dashboard sign-in page.
*   They see two options: "Sign in with Google" and "Sign in with Discord".
*   Clicking "Sign in with Discord" takes them through the Discord authorization flow.
*   Upon success, they are redirected back to the dashboard, logged in. A user profile is created or updated in Strapi.

**2. For Discord MVP Users:**
*   A user in Discord runs the `/request-access` command.
*   The bot replies with an ephemeral message containing a unique link and a "Verify with Discord" button.
*   Clicking the link opens a web page that initiates the Discord authorization flow.
*   Upon success, the user's profile is created in Strapi, they are granted the "Verified" role in Discord, and the web page shows a success message.

---

## Implementation Plan

This plan is broken down into four key areas: Strapi Configuration, Backend API Changes, Dashboard Frontend Changes, and Discord Bot Changes.

### Phase 1: Strapi Configuration (The Foundation)

1.  **Install Discord Auth Provider:**
    *   In your `virion-labs-strapi-cms` package, install the official Strapi Discord authentication provider:
        ```bash
        # In packages/virion-labs-strapi-cms
        npm install @strapi/provider-auth-discord
        # or
        yarn add @strapi/provider-auth-discord
        ```

2.  **Create a Discord Application:**
    *   Go to the [Discord Developer Portal](https://discord.com/developers/applications).
    *   Create a new application.
    *   Navigate to the "OAuth2" tab.
    *   Note your **Client ID** and **Client Secret**.
    *   Add a **Redirect URI**: This will be your Strapi backend's callback URL. It follows the format: `https://<your-strapi-api-url>/api/auth/discord/callback`.

3.  **Configure Strapi Environment:**
    *   In `virion-labs-strapi-cms/config/plugins.js` (create it if it doesn't exist), enable and configure the provider.
    *   Add the Discord Client ID, Client Secret, and Redirect URI to your `.env` files.

    ```javascript
    // config/plugins.js
    module.exports = ({ env }) => ({
      // ... other plugin configs
      'users-permissions': {
        config: {
          providers: [
            {
              name: 'discord',
              enabled: true,
              keys: {
                clientId: env('DISCORD_CLIENT_ID'),
                clientSecret: env('DISCORD_CLIENT_SECRET'),
              },
              callback: `${env('STRAPI_API_URL', 'http://localhost:1337')}/api/auth/discord/callback`,
              scope: ['identify', 'email'], // Request email and basic identity
            },
          ],
        },
      },
    });
    ```

4.  **Configure User Roles:**
    *   In the Strapi Admin Panel, go to `Settings -> Users & Permissions Plugin -> Roles`.
    *   For the **Authenticated** role, navigate to `Users-Permissions -> Auth` and enable the `connect` action. This allows users to link their accounts.
    *   Ensure the `callback` action for Discord is enabled for the **Public** role.

### Phase 2: Backend API (`virion-labs-business-logic-api`)

The current flow of creating a user directly will be replaced. We need a new mechanism to grant the Discord role *after* Strapi confirms the user's identity.

1.  **Create a Strapi Webhook:**
    *   In the Strapi Admin Panel, go to `Settings -> Webhooks`.
    *   Create a new webhook that triggers on the `entry.create` and `entry.update` events for the `User` content type.
    *   The webhook URL should point to a new endpoint in your `virion-labs-business-logic-api`, for example: `https://<your-business-api-url>/api/v1/webhooks/strapi/user-updated`.

2.  **Create the Webhook Handler Endpoint:**
    *   In `virion-labs-business-logic-api/routers/integrations.py`, add a new endpoint to receive this webhook.
    *   **Logic:** When this endpoint is called, it will check if the user has a `provider: 'discord'` and a `discord_user_id`. If so, it will use a Discord bot token (stored securely in your config) to grant the "Verified" role to that user in your Discord server. This decouples the role assignment from the auth flow itself, making it more reliable.

3.  **Deprecate Old Endpoint:**
    *   The existing `request_discord_access` function in `integration_service.py` and its corresponding route in `integrations.py` can now be removed, as Strapi will handle user creation.

### Phase 3: Virion Labs Dashboard (Frontend Changes)

1.  **Update Sign-In Page:**
    *   In the `virion-labs-dashboard` app, locate the sign-in page component.
    *   Add a new "Sign in with Discord" button next to the existing Google button.
    *   The link for this button will point directly to the Strapi connect URL: `https://<your-strapi-api-url>/api/connect/discord`.

2.  **Handle the Authentication Callback:**
    *   After a user successfully authenticates with Discord, Strapi will redirect them back to a frontend URL, appending a JWT (JSON Web Token) in the URL hash. The default is `/#jwt=<token>`.
    *   You need a dedicated page or logic in your app's root to handle this. A common pattern is a `/auth/callback` page.
    *   This page will:
        *   Check the URL for the JWT.
        *   Save the JWT to local storage or a cookie, just as you do for the Google sign-in.
        *   Redirect the user to the main dashboard page (e.g., `/`).

### Phase 4: Discord MVP Bot (`virion-labs-discord-bot-mvp`)

This requires the most significant change, replacing the old modal flow with a link to the web-based OAuth flow.

1.  **Update `RequestAccessCommand.js`:**
    *   The `execute` method will no longer create a modal.
    *   It should now construct a unique URL that points to your dashboard's sign-in page (or a dedicated landing page for this flow).
    *   The URL should be `https://<your-dashboard-url>/login?provider=discord`.
    *   The command will reply with an ephemeral message containing this link, perhaps with a clean button.

    ```javascript
    // In RequestAccessCommand.js
    async execute(interaction) {
      // ... (keep the hasRole check)

      const authUrl = 'https://<your-dashboard-url>/login?provider=discord'; // Or a more specific page

      const embed = new EmbedBuilder()
        .setTitle('🔑 Verify Your Account')
        .setDescription('To gain access, please verify your identity through our secure web portal. Click the button below to continue.')
        .setColor('#5865F2'); // Discord's Blurple

      const components = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('Verify with Discord')
          .setStyle(ButtonStyle.Link)
          .setURL(authUrl)
      );

      await interaction.reply({ embeds: [embed], components: [components], ephemeral: true });
    }
    ```

2.  **Deprecate Old Handlers and Services:**
    *   The `RequestAccessHandler.js` file is no longer needed and can be deleted.
    *   The `submitAccessRequest` method in `ApiService.js` is also obsolete and can be removed.
