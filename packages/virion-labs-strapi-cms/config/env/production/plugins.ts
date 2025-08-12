export default ({ env }) => ({
  email: {
    config: {
      provider: 'strapi-provider-email-resend',
      providerOptions: {
        apiKey: env('RESEND_API_KEY'), // Required
      },
      settings: {
        defaultFrom: 'joshua@updates.virionlabs.io',
        defaultReplyTo: 'joshua@updates.virionlabs.io',
      },
    }
  },
});