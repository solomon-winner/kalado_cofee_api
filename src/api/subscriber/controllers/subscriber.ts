/**
 * subscriber controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::subscriber.subscriber', ({ strapi }) => ({
  async subscribe(ctx) {
    try {
      const { email } = ctx.request.body;

      if (!email) {
        return ctx.badRequest("Email is required");
      }

      // Check if the email is already subscribed
      const existingSubscribers = await strapi.entityService.findMany("api::subscriber.subscriber", {
        filters: { email },
      });
      const existingSubscriber = existingSubscribers[0];

      if (existingSubscriber) {
        return ctx.badRequest("Email is already subscribed");
      }

      const newSubscriber = await strapi.entityService.create("api::subscriber.subscriber", {
        data: { email },
      });

      return ctx.created({ message: "Subscribed successfully", subscriber: newSubscriber });
    } catch (err) {
      console.error(err);
      return ctx.internalServerError("Failed to subscribe");
    }
  },
    async unsubscribe(ctx) {
        try {
        const { email } = ctx.request.body;
    
        if (!email) {
            return ctx.badRequest("Email is required");
        }
    
        // Find the subscriber by email
        const subscribers = await strapi.entityService.findMany("api::subscriber.subscriber", {
            filters: { email },
        });
        const subscriber = subscribers[0];
    
        if (!subscriber) {
            return ctx.notFound("Subscriber not found");
        }
    
        // Delete the subscriber
        await strapi.entityService.delete("api::subscriber.subscriber", subscriber.id);
    
        return ctx.send({ message: "Unsubscribed successfully" });
        } catch (err) {
        console.error(err);
        return ctx.internalServerError("Failed to unsubscribe");
        }
    },
    async getSubscribers(ctx) {
        try {
            const subscribers = await strapi.entityService.findMany("api::subscriber.subscriber", {
                fields: ['email'],
                sort: { createdAt: 'desc' },
            });

            return ctx.send({ message: "Subscribers retrieved successfully", subscribers });
        } catch (err) {
            console.error(err);
            return ctx.internalServerError("Failed to retrieve subscribers");
        }
    }
}));