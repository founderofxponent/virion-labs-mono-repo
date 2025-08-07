export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  {
    name: 'strapi::session',
    config: {
      cookie: {
        secure: process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true',
        sameSite: 'lax',
      },
    },
  },
  'strapi::favicon',
  'strapi::public',
];
