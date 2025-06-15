import { verifyToken } from '../../../utils/dto/verify-token';

export default {
  async getProduct(ctx) {
    try {
      const decoded = verifyToken(ctx);
      const { id } = ctx.params;

      const product = await strapi.db.query('api::product.product').findOne({
        where: {
          id,
          retailer: decoded.id, // ensures only the owner can access it
        },
        populate: ['images', 'order_items'], // optionally populate relations
      });

      if (!product) {
        return ctx.notFound('Product not found or not owned by you');
      }

      return ctx.send(product);
    } catch (err) {
      strapi.log.error('Error in getProduct:', err);
      return ctx.badRequest('Something went wrong');
    }
  },

async getOrderItemsForProduct(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const { productId } = ctx.params;

    const product = await strapi.db.query('api::product.product').findOne({
      where: { id: productId, retailer: decoded.id },
    });

    if (!product) return ctx.unauthorized('You do not own this product.');

    const orderItems = await strapi.db.query('api::order-item.order-item').findMany({
      where: { product: productId },
    });

    return ctx.send(orderItems);
  } catch (err) {
    return ctx.badRequest(err.message);
  }
},
  async getProducts(ctx) {
    try {
      const decoded = verifyToken(ctx);
      const products = await strapi.entityService.findMany('api::product.product',{
        filters: { retailer: decoded.id },
      });
      return ctx.send(products);
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async addProduct(ctx) {
    try {
      const decoded = verifyToken(ctx);
      const data = ctx.request.body;
      data.retailer = decoded.id;

      const created = await strapi.entityService.create('api::product.product', { data });
      return ctx.send(created);
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async addManyProducts(ctx) {
    try {
      const decoded = verifyToken(ctx);
      const products = ctx.request.body;

      const createdProducts = await Promise.all(
        products.map(product =>
          strapi.entityService.create('api::product.product', {
            data: { ...product, retailer: decoded.id },
          })
        )
      );

      return ctx.send(createdProducts);
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },
async updateProduct(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const { id } = ctx.params;
    const body = ctx.request.body;

    const existing = await strapi.entityService.findOne('api::product.product', id, {
      populate: { retailer: true }
    }) as any;  // Temporary type workaround

    if (!existing || existing.retailer.id !== decoded.id)
      return ctx.unauthorized('Not allowed');

    const updated = await strapi.entityService.update('api::product.product', id, {
      data: body,
    });

    return ctx.send(updated);
  } catch (err) {
    return ctx.badRequest(err.message);
  }
},

async deleteOneProduct(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const { id } = ctx.params;

    const product = await strapi.entityService.findOne('api::product.product', id, {
      populate: { retailer: true }
    }) as any;  // Temporary type workaround

    if (!product || product.retailer.id !== decoded.id)
      return ctx.unauthorized('Not allowed');

    await strapi.entityService.delete('api::product.product', id);
    return ctx.send({ message: 'Deleted successfully' });
  } catch (err) {
    return ctx.badRequest(err.message);
  }
},

async deleteManyProducts(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const { ids } = ctx.request.body;

    const deletionResults = await Promise.all(
      ids.map(async (id) => {
        const product = await strapi.entityService.findOne('api::product.product', id, {
          populate: { retailer: true }
        }) as any;  // Temporary type workaround

        if (product?.retailer?.id === decoded.id) {
          await strapi.entityService.delete('api::product.product', id);
          return true; // Mark successful deletion
        }
        return false;
      })
    );

    const deletedCount = deletionResults.filter(result => result === true).length;
    return ctx.send({ 
      message: 'Products deleted', 
      count: deletedCount 
    });
  } catch (err) {
    return ctx.badRequest(err.message);
  }
},
  async deleteWholeProductsOfRetailer(ctx) {
    try {
      const decoded = verifyToken(ctx);

      const products = await strapi.db.query('api::product.product').findMany({
        where: { retailer: decoded.id },
        select: ['id'],
      });

      const ids = products.map(p => p.id);

      await Promise.all(
        ids.map(id => strapi.entityService.delete('api::product.product', id))
      );

      return ctx.send({ message: 'All products deleted' });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async filter(ctx) {
    try {
      verifyToken(ctx);
      const { minPrice, maxPrice } = ctx.query;

      const products = await strapi.db.query('api::product.product').findMany({
        where: {
          price: {
            $gte: Number(minPrice) || 0,
            $lte: Number(maxPrice) || 99999,
          },
        },
      });

      return ctx.send(products);
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  async statForRetailer(ctx) {
    try {
      const decoded = verifyToken(ctx);

      const products = await strapi.db.query('api::product.product').findMany({
        where: { retailer: decoded.id },
        populate: ['order_items'],
      });

      const stats = products.map(p => ({
        id: p.id,
        name: p.name,
        totalSold: p.order_items.length,
      }));

      const totalRevenue = products.reduce((sum, p) => {
        return sum + p.order_items.reduce((acc, item) => acc + Number(item.price), 0);
      }, 0);

      return ctx.send({
        totalProducts: products.length,
        totalRevenue,
        products: stats,
      });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },
};
