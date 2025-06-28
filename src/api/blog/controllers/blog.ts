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
},
async createBlog(ctx) {
  try {
    const { title, content, writer, image } = ctx.request.body;

    if (!title || !content || !writer) {
      return ctx.badRequest("Title, content and writer are required");
    }

    const newBlog = await strapi.entityService.create("api::blog.blog", {
      data: {
        title,
        content,
        writer,
        image,
      },
    });

    return ctx.created({ message: "Blog created", blog: newBlog });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to create blog");
  }
},
async updateBlog(ctx) {
  try {
    const { id } = ctx.params;
    const { title, content, writer, image } = ctx.request.body;

    if (!title || !content || !writer) {
      return ctx.badRequest("Title, content and writer are required");
    }

    const updatedBlog = await strapi.entityService.update("api::blog.blog", id, {
      data: {
        title,
        content,
        writer,
        image,
      },
    });

    return ctx.send({ message: "Blog updated", blog: updatedBlog });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to update blog");
  }
}, 
async deleteBlog(ctx) {
  try {
    const { id } = ctx.params;

    const blog = await strapi.entityService.findOne("api::blog.blog", id);
    if (!blog) return ctx.notFound("Blog not found");

    await strapi.entityService.delete("api::blog.blog", id);

    return ctx.send({ message: "Blog deleted" });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to delete blog");
  }
}
}));
