# Migration Plan: `user-profile` to `user-permissions.user`

This document outlines the steps to migrate data from the `user-profile` content type to the built-in `user-permissions.user` content type in your Strapi application.

## 1. Create the Migration Script

Create a new file named `migrate-users.js` in the `packages/virion-labs-strapi-cms/scripts` directory. This script will perform the following actions:

-   Fetch all entries from the `user-profile` content type.
-   For each `user-profile`, find the corresponding user in `user-permissions.user` by matching the `email`.
-   Update the `user` entry with the data from the `user-profile`, including `full_name`, `avatar_url`, and all relationships.

Here is the code for the migration script:

```javascript
// packages/virion-labs-strapi-cms/scripts/migrate-users.js

'use strict';

const { Strapi } = require('@strapi/strapi');

async function run() {
  // Initialize Strapi
  const strapi = await Strapi.compile().then(app => app.load());

  try {
    // 1. Fetch all user profiles
    const userProfiles = await strapi.entityService.findMany('api::user-profile.user-profile', {
      populate: '*',
    });

    console.log(`Found ${userProfiles.length} user profiles to migrate.`);

    // 2. Iterate over each profile and migrate the data
    for (const profile of userProfiles) {
      // Find the corresponding user by email
      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: profile.email },
      });

      if (user) {
        console.log(`Migrating data for ${profile.email}...`);

        // Update the user with the profile data
        await strapi.entityService.update('plugin::users-permissions.user', user.id, {
          data: {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            referral_links: profile.referral_links,
            user_setting: profile.user_setting,
            campaign_influencer_accesses: profile.campaign_influencer_accesses,
          },
        });

        console.log(`Successfully migrated ${profile.email}.`);
      } else {
        console.warn(`Could not find a user with the email ${profile.email}.`);
      }
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('An error occurred during the migration:', error);
  } finally {
    // Destroy the Strapi instance
    strapi.destroy();
  }
}

run();
```

## 2. Run the Migration Script

To run the migration script, you will need to execute it from the command line within your Strapi project.

1.  Navigate to the `packages/virion-labs-strapi-cms` directory in your terminal.
2.  Run the following command:

    ```bash
    node scripts/migrate-users.js
    ```

This will execute the script and migrate all of your user data.

## 3. Verify the Migration

After the script has finished, you should verify that the data has been migrated correctly.

1.  Go to the Strapi admin dashboard.
2.  Navigate to the "Users" collection under the "Users & Permissions Plugin".
3.  Check that the users now have the data that was previously in the `user-profile` content type.

Once you have verified that the migration was successful, you can proceed with updating the `business-logic-api` and the `virion-labs-dashboard` to use the new user model.