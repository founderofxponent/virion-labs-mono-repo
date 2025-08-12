export default ({ env }) => [
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
        secure: false,
        sameSite: 'lax',
      },
      // Force the underlying koa-session to not use secure cookies
      secure: false,
    },
  },
  'strapi::favicon',
  'strapi::public',
];
