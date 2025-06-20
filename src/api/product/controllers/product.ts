import { verifyToken } from '../../../utils/dto/verify-token';
const { ProductDTO, ProductListDTO } = require('../../../utils/dto/product/productDto');
const { OrderItemListDTO } = require('../../../utils/dto/order/orderItem');
const { getPagination } = require('../../../utils/pagination/getPagination');
export default {
  // the two controllers below are the same but for different users
  async getProductForRetailer(ctx) {
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

      return ctx.send(new ProductDTO(product));
    } catch (err) {
      strapi.log.error('Error in getProduct:', err);
      return ctx.badRequest('Something went wrong');
    }
  },
  async getProductDetail(ctx) {
    try {
      const decoded = verifyToken(ctx);
      const { id } = ctx.params;

      const product = await strapi.db.query('api::product.product').findOne({
        where: {
          id
        },
        populate: ['images'], // optionally populate relations
      });

      if (!product) {
        return ctx.notFound('Product not found or not owned by you');
      }

      return ctx.send( new ProductDTO(product));
    } catch (err) {
      strapi.log.error('Error in getProduct:', err);
      return ctx.badRequest('Something went wrong');
    }
  },
  // this controller is for the retailer to get all order items for a specific product
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

    return ctx.send(OrderItemListDTO(orderItems));
  } catch (err) {
    return ctx.badRequest(err.message);
  }
},
async getProducts(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const user = await strapi.db.query('api::app-user.app-user').findOne({
      where: { id: decoded.id, deletedAt: null },
    });

    const filters = user?.type === 'customer'
      ? { deletedAt: null }
      : { retailer: decoded.id };

    // Step 1: Count total
    const total = await strapi.entityService.count('api::product.product', {
      filters,
    });

    // Step 2: Use your helper to get meta and pagination
    const { pagination, page, pageSize } = getPagination(ctx, total);

    // Step 3: Fetch paginated data
    const products = await strapi.entityService.findMany('api::product.product', {
      filters,
      sort: { createdAt: 'desc' },
      pagination: { page: pagination.page, pageSize: pagination.pageSize },
      populate: {
        images: true,
        retailer: {
          fields: ['id', 'name'],
        },
      },
      fields: ['id', 'name', 'price', 'quantity', 'discount', 'isPopular'],
    });

    return ctx.send({
      data: products,
      meta: { pagination }
    });

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
      return ctx.send(new ProductDTO(created));
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },
  async addProductWithImages(ctx) {},
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

      return ctx.send(ProductListDTO(createdProducts));
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

    return ctx.send(new ProductDTO(updated));
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
      let userId = null;
      let userRole = null;

      // Check for token and decode it
      try {
        const decoded = verifyToken(ctx);
        userId = decoded.id;
        userRole = decoded.type; 
        // assuming role is in the token
      } catch (e) {
        // No valid token: treat as public
      }
      const { minPrice, maxPrice, category, isPopular } = ctx.query;
      
      const filters: any = {
        price: {
          $gte: Number(minPrice) || 0,
          $lte: Number(maxPrice) || 99999,
        },
        deletedAt: null, // exclude soft-deleted
      };

      // If user is a retailer, filter only their products
      if (userId && userRole === 'retailer') {
        filters.retailer = userId;
      }

      if (category) filters.category = category;
      if (typeof isPopular !== 'undefined') {
        filters.isPopular = isPopular === 'true';
      }

      const products = await strapi.db.query('api::product.product').findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        populate: ['images', 'retailer'], // populate images and retailer
      });
      return ctx.send(ProductListDTO(products));
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  //this for the customer to filter products by retailer
  async getProductsByRetailer(ctx) {
    try {
      const decoded = verifyToken(ctx);
      const { retailerId } = ctx.params;


      const products = await strapi.db.query('api::product.product').findMany({
        where: { retailer: retailerId },
        populate: ['images', 'order_items'],
      });

      return ctx.send(ProductListDTO(products));
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

async statForRetailer(ctx) {
  try {
    const decoded = verifyToken(ctx);

    // Step 1: Fetch products owned by this retailer with populated order_items
    const products = await strapi.db.query('api::product.product').findMany({
      where: { retailer: decoded.id },
      populate: ['order_items'],
    });

    // Step 2: Filter products that have at least one non-deleted order_item
    const filteredProducts = products.filter(product =>
      product.order_items && product.order_items.some(item => !item.deletedAt)
    );

    // Step 3: Calculate stats
    const stats = filteredProducts.map(p => ({
      id: p.id,
      name: p.name,
      totalSold: p.order_items.filter(item => !item.deletedAt).length,
    }));

    const totalRevenue = filteredProducts.reduce((sum, p) => {
      return sum + p.order_items
        .filter(item => !item.deletedAt)
        .reduce((acc, item) => acc + Number(item.price), 0);
    }, 0);

    return ctx.send({
      totalProducts: filteredProducts.length,
      totalRevenue,
      products: stats,
    });

  } catch (err) {
    return ctx.badRequest(err.message);
  }
}

};
