/**
 * purchase-history controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::purchase-history.purchase-history', ({ strapi }) => ({
    async getPurchaseHistoryById(ctx) {
        const { id } = ctx.params;
    
        const purchaseHistory = await strapi.entityService.findOne('api::purchase-history.purchase-history', id, {
        populate: [ 'order'],
        });
    
        if (!purchaseHistory) {
        return ctx.notFound('Purchase history not found');
        }
    
        return ctx.send({
        message: 'Purchase history retrieved successfully',
        data: purchaseHistory,
        });
    },
    async deletePurchaseHistory(ctx) {
        const { id } = ctx.params;

        const purchaseHistory = await strapi.entityService.findOne('api::purchase-history.purchase-history', id);

        if (!purchaseHistory) {
            return ctx.notFound('Purchase history not found');
        }

        await strapi.entityService.delete('api::purchase-history.purchase-history', id);

        return ctx.send({
            message: 'Purchase history deleted successfully',
        });
    }
}));