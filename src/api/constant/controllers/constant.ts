/**
 * constant controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::constant.constant', ({ strapi }) => ({
    async getConstants(ctx) {
        try {
            const constants = await strapi.entityService.findMany('api::constant.constant', {
                fields: ['standard_shippment_cost', 'express_shippment_cost', 'next_day_shippment_cost', 'tax', 'discount'],
                limit: 1,
            });

            if (!constants || constants.length === 0) {
                return ctx.notFound('Constants not found');
            }

            return ctx.send({
                message: 'Constants retrieved successfully',
                data: constants[0],
            });
        } catch (error) {
            strapi.log.error('Error retrieving constants:', error);
            return ctx.internalServerError('Error retrieving constants');
        }
    },
    async updateConstants(ctx) {
        try {
            const { standard_shippment_cost, express_shippment_cost, next_day_shippment_cost, tax, discount } = ctx.request.body;

            if (standard_shippment_cost === undefined || express_shippment_cost === undefined || next_day_shippment_cost === undefined || tax === undefined || discount === undefined) {
                return ctx.badRequest('All fields are required');
            }

            const updatedConstants = await strapi.entityService.update('api::constant.constant', 1, {
                data: {
                    standard_shippment_cost,
                    express_shippment_cost,
                    next_day_shippment_cost,
                    tax,
                    discount,
                },
            });

            return ctx.send({
                message: 'Constants updated successfully',
                data: updatedConstants,
            });
        } catch (error) {
            strapi.log.error('Error updating constants:', error);
            return ctx.internalServerError('Error updating constants');
        }
    },
    async createConstants(ctx) {
        try {
            const { standard_shippment_cost, express_shippment_cost, next_day_shippment_cost, tax, discount } = ctx.request.body;

            if (standard_shippment_cost === undefined || express_shippment_cost === undefined || next_day_shippment_cost === undefined || tax === undefined || discount === undefined) {
                return ctx.badRequest('All fields are required');
            }

            const newConstants = await strapi.entityService.create('api::constant.constant', {
                data: {
                    standard_shippment_cost,
                    express_shippment_cost,
                    next_day_shippment_cost,
                    tax,
                    discount,
                },
            });

            return ctx.send({
                message: 'Constants created successfully',
                data: newConstants,
            });
        } catch (error) {
            strapi.log.error('Error creating constants:', error);
            return ctx.internalServerError('Error creating constants');
        }
    }
}));
