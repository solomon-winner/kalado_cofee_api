/**
 * shippment-address controller
 */

import { factories } from '@strapi/strapi'
import { verifyToken } from '../../../utils/dto/verify-token';

export default factories.createCoreController('api::shippment-address.shippment-address', ({ strapi }) => ({
async createAddress(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const body = ctx.request.body;

    const customerProfile = await strapi.entityService.findMany("api::customer-profile.customer-profile", {
      filters: { app_user: userId },
      populate: ['shippment_addresses']
    });

    if (!customerProfile.length) return ctx.badRequest("Customer profile not found");

    const created = await strapi.entityService.create("api::shippment-address.shippment-address", {
      data: {
        ...body,
        customer: customerProfile[0].id
      }
    });

    return ctx.send({ message: "Shipping address created", data: created });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Could not create address");
  }
},
async getAddresses(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const customerProfile = await strapi.entityService.findMany("api::customer-profile.customer-profile", {
      filters: { app_user: userId },
      populate: ['shippment_addresses']
    }) as any[];

    if (!customerProfile.length) return ctx.badRequest("Customer profile not found");

    return ctx.send({
      message: "Addresses fetched",
      addresses: customerProfile[0]?.shippment_addresses || []
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Could not fetch addresses");
  }
},

async getDefaultAddress(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const addresses = await strapi.entityService.findMany("api::shippment-address.shippment-address", {
      filters: {
        customer: { app_user: userId },
        isDefault: true
      }
    });

    return ctx.send({
      message: "Default address fetched",
      data: addresses.length ? addresses[0] : null
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Could not get default address");
  }
},
async updateAddress(ctx) {
  try {
    const { id } = ctx.params;
    const body = ctx.request.body;
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const existing = await strapi.entityService.findOne("api::shippment-address.shippment-address", id, {
      populate: { customer: { populate: ['app_user'] } }
    }) as any;

    if (!existing || existing.customer?.app_user?.id !== userId) {
      return ctx.unauthorized("Unauthorized or address not found");
    }

    const updated = await strapi.entityService.update("api::shippment-address.shippment-address", id, {
      data: body
    });

    return ctx.send({ message: "Address updated", data: updated });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to update address");
  }
},

async deleteAddress(ctx) {
  try {
    const { id } = ctx.params;
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const existing = await strapi.entityService.findOne("api::shippment-address.shippment-address", id, {
      populate: { customer: { populate: ['app_user'] } }
    }) as any;

    if (!existing || existing.customer?.app_user?.id !== userId) {
      return ctx.unauthorized("Unauthorized or address not found");
    }

    await strapi.entityService.delete("api::shippment-address.shippment-address", id);

    return ctx.send({ message: "Address deleted" });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to delete address");
  }
},

async setDefaultAddress(ctx) {
  try {
    const { id } = ctx.params;
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const address = await strapi.entityService.findOne("api::shippment-address.shippment-address", id, {
      populate: { customer: { populate: ['app_user'] } }
    }) as any;

    if (!address || address.customer?.app_user?.id !== userId) {
      return ctx.unauthorized("Unauthorized or address not found");
    }

    // Unset previous defaults
    await strapi.db.query("api::shippment-address.shippment-address").updateMany({
      where: { customer: address.customer.id },
      data: { isDefault: false }
    });

    // Set this one
    const updated = await strapi.entityService.update("api::shippment-address.shippment-address", id, {
      data: { isDefault: true }
    });

    return ctx.send({ message: "Default address updated", data: updated });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to set default address");
  }
}

}));
