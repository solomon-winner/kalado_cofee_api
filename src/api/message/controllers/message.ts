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
},
async getAllMessages(ctx) {
  try {
    const messages = await strapi.entityService.findMany("api::message.message", {
      sort: { createdAt: 'desc' },
    });

    return ctx.send({
      message: "Messages fetched",
      data: messages,
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch messages");
  }
},
async getMessageById(ctx) {
  try {
    const { id } = ctx.params;

    const message = await strapi.entityService.findOne("api::message.message", id);

    if (!message) return ctx.notFound("Message not found");

    return ctx.send({ message: "Message retrieved", data: message });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch message");
  }
},
async deleteMessage(ctx) {
  try {
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne("api::message.message", id);
    if (!existing) return ctx.notFound("Message not found");

    await strapi.entityService.delete("api::message.message", id);

    return ctx.send({ message: "Message deleted successfully" });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to delete message");
  }
}



}));
