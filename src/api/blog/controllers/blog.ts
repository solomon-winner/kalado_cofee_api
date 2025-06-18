/**
 * blog controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::blog.blog', ({ strapi }) => ({
async getAllBlogs(ctx) {
  try {
    const blogs = await strapi.entityService.findMany("api::blog.blog", {
      populate: ['writer', 'image'],
      sort: { createdAt: 'desc' }
    });

    return ctx.send({ message: "All blogs fetched", blogs });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch blogs");
  }
},
async getBlogById(ctx) {
  try {
    const { id } = ctx.params;

    const blog = await strapi.entityService.findOne("api::blog.blog", id, {
      populate: ['writer', 'image'],
    });

    if (!blog) return ctx.notFound("Blog not found");

    return ctx.send({ message: "Blog fetched", blog });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch blog");
  }
}
}));
