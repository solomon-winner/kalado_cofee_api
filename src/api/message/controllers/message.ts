/**
 * message controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::message.message', ({ strapi }) => ({
    async createMessage(ctx) {
  try {
    const { name, email, message } = ctx.request.body;

    if (!name || !email || !message) {
      return ctx.badRequest("Name, email, and message are required");
    }

    const newMessage = await strapi.entityService.create("api::message.message", {
      data: { name, email, message },
    });

    return ctx.send({
      message: "Message received successfully",
      data: newMessage,
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to send message");
  }
}

}));
