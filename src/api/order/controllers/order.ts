// /**
//  * order controller
//  */

// import { factories } from '@strapi/strapi'
// import { verifyToken } from '../../../utils/dto/verify-token';

// export default factories.createCoreController('api::order.order', ({ strapi }) => ({
//   async placeOrder(ctx) {
//     try {
//       const decoded = verifyToken(ctx);
//       const { orderItems, total_amount, shippment_address } = ctx.request.body;

//       // Create order
//       const order = await strapi.entityService.create('api::order.order', {
//         data: {
//           customer: decoded.id,
//           total_amount,
//           orderedAt: new Date(),
//           shippment_address,
//         },
//       });

//       // Create order items
//       const createdItems = await Promise.all(
//         orderItems.map(item => {
//           return strapi.entityService.create('api::order-item.order-item', {
//             data: {
//               product: item.product,
//               unitPrice: item.unitPrice,
//               totalPrice: item.totalPrice,
//               order: order.id,
//             },
//           });
//         })
//       );

//       return ctx.send({ order, orderItems: createdItems });
//     } catch (err) {
//       return ctx.badRequest(err.message);
//     }
//   },

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

// }));
