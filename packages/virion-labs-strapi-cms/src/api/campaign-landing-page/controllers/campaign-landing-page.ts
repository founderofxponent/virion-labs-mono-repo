/**
 * campaign-landing-page controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::campaign-landing-page.campaign-landing-page', ({ strapi }) => ({
    async update(ctx) {
        try {
            console.log("request body", ctx.request.body);
            console.log("ctx params", ctx.params);
            if (ctx.request.body.data.campaign) {
                const campaignId = typeof ctx.request.body.data.campaign === 'object'
                    ? ctx.request.body.data.campaign.id
                    : ctx.request.body.data.campaign;
                ctx.request.body.data.campaign = { set: [{ id: parseInt(campaignId, 10) }] };
            }
            console.log("transformed request body", ctx.request.body);
            const response = await super.update(ctx);
            return response;
        } catch (err) {
            console.log("error", err);
            console.log("error details", err.details);
            ctx.body = err;
        }
    }
}));
