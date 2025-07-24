'use strict';

/**
 * user-setting service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::user-setting.user-setting');
