export default ({ env }) => ({
  'users-permissions': {
    config: {
      provider: {
        google: {
          enabled: true,
          clientId: env('GOOGLE_CLIENT_ID'),
          clientSecret: env('GOOGLE_CLIENT_SECRET'),
          callback: env('STRAPI_ADMIN_BACKEND_URL', '/api/connect/google/callback'),
          grant: {
            google: {
              access_token: 'access_token',
              refresh_token: 'refresh_token',
            },
          },
        },
      },
    },
  },
});
