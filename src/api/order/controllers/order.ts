/**
 * order controller
 */

import { factories } from '@strapi/strapi'
import { verifyToken } from '../../../utils/dto/verify-token';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
async addToCart(ctx) {
  try {
    const decoded = verifyToken(ctx); 
    const userId = decoded.id;

    const { productId, quantity } = ctx.request.body;
    if (!productId || !quantity) {
      return ctx.badRequest("Product ID and quantity are required");
    }

    // 1. Check product existence and stock
    const product = await strapi.entityService.findOne("api::product.product", productId);
    if (!product) return ctx.notFound("Product not found");

    if (product.quantity < quantity) {
      return ctx.badRequest({
        message: "Not enough stock available for this product",
        productName: product?.name,
      });
    }

    const unitPrice = product.price;
    const totalPrice = unitPrice * quantity;

    // 2. Check for existing pending order
    let [pendingOrder] = await strapi.entityService.findMany("api::order.order", {
      filters: {
        customer: userId,
        status: 'pending',
      },
      populate: {
        order_items: { populate: ['product'] } // important for checking duplicates
      }
    }) as any[]; // Type assertion to handle the case where no orders are found

    // 3. If no pending order, create one
    if (!pendingOrder) {
      pendingOrder = await strapi.entityService.create("api::order.order", {
        data: {
          customer: userId,
          total_amount: totalPrice,
          orderedAt: new Date().toISOString(),
          status: "pending",
        }
      });
    } else {
      // 4. Check if product already exists in order_items
      const existingOrderItem = pendingOrder.order_items.find(
        (item) => item.product.id === productId
      );

      if (existingOrderItem) {
        return ctx.badRequest("This product is already in your cart.");
      }

      // 5. Update total amount
      await strapi.entityService.update("api::order.order", pendingOrder.id, {
        data: {
          total_amount: Number(pendingOrder.total_amount) + totalPrice,
        }
      });
    }

    // 6. Create the order item
    const orderItem = await strapi.entityService.create("api::order-item.order-item", {
      data: {
        product: productId,
        order: pendingOrder.id,
        unitPrice,
        quantity,
        totalPrice,
      }
    });

    return ctx.send({
      message: 'Item added to cart (not confirmed until payment)',
      orderId: pendingOrder.id,
      orderItem,
    });

  } catch (err) {
    console.error(err);
    return ctx.badRequest(err.message || 'Something went wrong');
  }
},
async getMyOrders(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const { status } = ctx.query;

    const filters: any = {
      customer: userId,
    };

    if (status) {
      filters.status = status;
    }

    const orders = await strapi.entityService.findMany("api::order.order", {
      filters,
      populate: {
        order_items: {
          populate: ['product'],
        },
        shippment_address: true,
      },
      sort: { orderedAt: 'desc' },
    });

    return ctx.send({
      message: 'Orders retrieved successfully',
      orders,
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch orders");
  }
}



//   async getMyOrders(ctx) {
//     try {
//       const decoded = verifyToken(ctx);
//       const orders = await strapi.entityService.findMany('api::order.order', {
//         filters: { customer: decoded.id },
//         populate: ['order_items', 'order_items.product', 'shippment_address'],
//       });

//       return ctx.send(orders);
//     } catch (err) {
//       return ctx.badRequest(err.message);
//     }
//   },

//   async getRetailerOrders(ctx) {
//     try {
//       const decoded = verifyToken(ctx);
//       if (decoded.type !== 'retailer') return ctx.unauthorized('Only retailers allowed');

//       // Get all orders that include items with this retailer's products
//       const orderItems = await strapi.entityService.findMany('api::order-item.order-item', {
//         filters: {
//           product: {
//             retailer: decoded.id
//           }
//         },
//         populate: ['product', 'order', 'order.shippment_address', 'order.customer']
//       });

//       return ctx.send(orderItems);
//     } catch (err) {
//       return ctx.badRequest(err.message);
//     }
//   },

//   async getOrderById(ctx) {
//     try {
//       const decoded = verifyToken(ctx);
//       const { id } = ctx.params;

//       const order = await strapi.entityService.findOne('api::order.order', id, {
//         populate: ['customer', 'order_items', 'order_items.product', 'shippment_address']
//       });

//       if (!order) return ctx.notFound('Order not found');

//       // Allow access only if customer is owner or retailer owns a product in it
//       const isCustomer = order.customer?.id === decoded.id;
//       const isRetailer = order.order_items.some(item => item.product?.retailer === decoded.id);

//       if (!(isCustomer || isRetailer)) return ctx.unauthorized('Access denied');

//       return ctx.send(order);
//     } catch (err) {
//       return ctx.badRequest(err.message);
//     }
//   },

//   async updateOrderStatus(ctx) {
//   try {
//     const decoded = verifyToken(ctx); // Ensure token contains user `id` and `type`
//     const { id } = ctx.params; // Order ID
//     const { status: newStatus } = ctx.request.body;

//     const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
//     if (!allowedStatuses.includes(newStatus)) {
//       return ctx.badRequest('Invalid status');
//     }

//     const order = await strapi.entityService.findOne('api::order.order', id, {
//       populate: {
//         order_items: {
//           populate: ['product']
//         },
//         customer: true
//       }
//     });

//     if (!order) {
//       return ctx.notFound('Order not found');
//     }

//     const currentStatus = order.status;

//     // Optional: only allow retailer/admin to confirm or ship
//     if (['confirmed', 'shipped'].includes(newStatus) && decoded.type !== 'retailer' && decoded.type !== 'admin') {
//       return ctx.unauthorized('You are not authorized to change this status');
//     }

//     // Handle inventory decrease on confirmation
//     if (newStatus === 'confirmed' && currentStatus === 'pending') {
//       for (const item of order.order_items) {
//         const product = item.product;

//         if (product.quantity < item.quantity) {
//           return ctx.badRequest(`Insufficient stock for product ID ${product.id}`);
//         }

//         await strapi.db.query('api::product.product').update({
//           where: { id: product.id },
//           data: {
//             quantity: { $decrement: item.quantity }
//           }
//         });
//       }
//     }

//     // Handle inventory restore on cancelled (if previously confirmed)
//     if (newStatus === 'cancelled' && currentStatus === 'confirmed') {
//       for (const item of order.order_items) {
//         const product = item.product;

//         await strapi.db.query('api::product.product').update({
//           where: { id: product.id },
//           data: {
//             quantity: { $increment: item.quantity }
//           }
//         });
//       }
//     }

//     // Update order status
//     const updatedOrder = await strapi.entityService.update('api::order.order', id, {
//       data: { status: newStatus }
//     });

//     return ctx.send({ message: 'Order status updated', status: updatedOrder.status });

//   } catch (err) {
//     console.error(err);
//     return ctx.badRequest(err.message);
//   }
// }

}));
