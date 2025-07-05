/**
 * purchase-history controller
 */

import { factories } from '@strapi/strapi'
import { verifyToken } from '../../../utils/dto/verify-token';

export default factories.createCoreController('api::purchase-history.purchase-history', ({ strapi }) => ({
    async getPurchaseHistoryById(ctx) {
        const decoded = verifyToken(ctx);
        if (!decoded) {
            return ctx.unauthorized('Invalid token');
        }

        const { id } = decoded.type === 'user' ? decoded.id : { id: ctx.params.id };

        const purchaseHistory = await strapi.entityService.findMany('api::purchase-history.purchase-history', {
            filters: { customer: id },
            populate: ['order'],
            fields: ['id', 'createdAt', 'updatedAt', 'totalPrice', 'tax', 'shippment_cost', 'discount_amount','payment_method','paidAt'],
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