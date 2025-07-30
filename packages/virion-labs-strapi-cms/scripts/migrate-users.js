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