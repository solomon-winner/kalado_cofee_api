import { verifyToken } from '../../../utils/dto/verify-token';
const { ProductDTO, ProductListDTO } = require('../../../utils/dto/product/productDto');
const { OrderItemListDTO } = require('../../../utils/dto/order/orderItem');
import  { getPagination } from '../../../utils/pagination/getPagination';
const qs = require('qs');

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
    const total = await strapi.entityService.count('api::order-item.order-item', {
      filters: { product: productId },
    });

    // Step 2: Use your helper to get meta and pagination
    const pagination  = getPagination(ctx, total);

    return ctx.send({ data: OrderItemListDTO(orderItems), meta: { pagination } });
  } catch (err) {
    return ctx.badRequest(err.message);
  }
},

async getProductsForRetailer(ctx) {
  try {
    const decoded = verifyToken(ctx);

    const filters = { retailer: decoded.id, deletedAt: null };

    // Step 1: Count total
    const total = await strapi.entityService.count('api::product.product', {
      filters,
    });

    // Step 2: Use your helper to get meta and pagination
    const pagination  = getPagination(ctx, total);
    const start = (pagination.page - 1) * pagination.pageSize;
    const limit = pagination.pageSize;

    // Step 3: Fetch paginated data
    const products = await strapi.entityService.findMany('api::product.product', {
      filters,
      sort: { createdAt: 'desc' },
      start,
      limit,
      populate: {
        images: true,
        retailer: {
          fields: ['id', 'name'],
        },
      },
      fields: ['id', 'name', 'price', 'quantity', 'discount', 'isPopular'],
    });

    return ctx.send({
      data: ProductListDTO(products),
      meta: { pagination }
    });

  } catch (err) {
    return ctx.badRequest(err.message);
  }
},

async getProductsForUser(ctx) {
  try {
    const filters = { deletedAt: null }
 
    // Step 1: Count total
    const total = await strapi.entityService.count('api::product.product', {
      filters,
    });

    // Step 2: Use your helper to get meta and pagination
    const pagination  = getPagination(ctx, total);
    const start = (pagination.page - 1) * pagination.pageSize;
    const limit = pagination.pageSize;

    // Step 3: Fetch paginated data
    const products = await strapi.entityService.findMany('api::product.product', {
      filters,
      sort: { createdAt: 'desc' },
      start,
      limit,
      populate: {
        images: true,
        retailer: {
          fields: ['id', 'name'],
        },
      },
      fields: ['id', 'name', 'price', 'quantity', 'discount', 'isPopular'],
    });
    
    return ctx.send({
      data: ProductListDTO(products),
      meta: { pagination }
    });

  } catch (err) {
    return ctx.badRequest(err.message);
  }
},

async addProduct(ctx) {
  try {
    const decoded = verifyToken(ctx);
    if (decoded.type !== 'admin') {
      return ctx.unauthorized('Only admins can add products');
    }

    const { name, price, quantity, description, discount = 0, retailer } = ctx.request.body;

    if (!name || !price || !quantity || !description || !retailer) {
      return ctx.badRequest('Missing required fields');
    }

    const retailerExists = await strapi.entityService.findOne('api::app-user.app-user', retailer);
    if (!retailerExists) {
      return ctx.badRequest('Retailer not found');
    }

    const final_price = price < discount ? price : price - discount;

    const data = {
      name,
      price,
      quantity,
      description,
      discount,
      final_price,
      retailer
    };

    const created = await strapi.entityService.create('api::product.product', { data });

    return ctx.send(new ProductDTO(created));
  } catch (err) {
    console.error('Error in addProduct:', err);
    return ctx.badRequest(err.message || 'Failed to create product');
  }
},
async addImagesToProduct(ctx) {
  const { id } = ctx.params;
  const { files } = ctx.request;

  try {
    if (!files || !files.images) {
      return ctx.badRequest('No images provided');
    }

    const uploadService = strapi.plugin('upload').service('upload');

    const imageFiles = Array.isArray(files.images) ? files.images : [files.images];

    const uploaded = await uploadService.uploadMany(imageFiles, {});

    const imageIds = uploaded.map(file => file.id);

    const updatedProduct = await strapi.entityService.update('api::product.product', id, {
      data: {
        images: imageIds,
      },
      populate: ['images'],
    });

    return ctx.send(updatedProduct);
  } catch (err) {
    console.error('Failed to add images to product:', err);
    ctx.throw(500, 'Internal Server Error');
  }
},
  async addManyProducts(ctx) {
    try {
      const decoded = verifyToken(ctx);
      const products = ctx.request.body;

      const createdProducts = await Promise.all(
        products.map(product =>
          strapi.entityService.create('api::product.product', {
            data: { ...product, retailer: decoded.id, final_price: product.price < product.discount ? product.price : product.price - product.discount },
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
    if (body.price < body.discount) {
      body.final_price = body.price;
    } else {
      body.final_price = body.price - body.discount;
    }
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

      const total = await strapi.entityService.count('api::product.product', {
      filters,
    });

    // Step 2: Use your helper to get meta and pagination
    const pagination  = getPagination(ctx, total);

      const products = await strapi.db.query('api::product.product').findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        populate: ['images', 'retailer'], // populate images and retailer
      });
      return ctx.send({ data: ProductListDTO(products), meta: { pagination } });
    } catch (err) {
      return ctx.badRequest(err.message);
    }
  },

  //this for the customer to filter products by retailer
  async getProductsByRetailer(ctx) {
    try {
      const { retailerId } = ctx.params;


      const products = await strapi.db.query('api::product.product').findMany({
        where: { retailer: retailerId },
        populate: ['images', 'order_items'],
      });
    const total = await strapi.entityService.count('api::product.product', {
      filters: { retailer: retailerId }
    });

    // Step 2: Use your helper to get meta and pagination
    const pagination  = getPagination(ctx, total);

      return ctx.send({ data: ProductListDTO(products), meta: { pagination } });
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
