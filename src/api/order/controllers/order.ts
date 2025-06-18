/**
 * order controller
 */

import { factories } from '@strapi/strapi'
import { verifyToken } from '../../../utils/dto/verify-token';
import { PopulatedOrderItem } from '../type/order_schems_type'; // Adjust the import path as necessary
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths, subYears } from 'date-fns';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  //this is the controller for the order API intended for managing orders and cart items for customers
async addToCart(ctx) {
  try {
    const decoded = verifyToken(ctx); 
    const userId = decoded.id;

    const { productId, quantity } = ctx.request.body; 
    // receive the retailer id from the client and check if it exists in the database and that product belongs to the retailer
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
//this is for the customer
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
          populate: ['product'], // add retailers here
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
},
async getCartItems(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const [pendingOrder] = await strapi.entityService.findMany("api::order.order", {
      filters: {
        customer: userId,
        status: 'pending',
      },
      populate: {
        order_items: {
          populate: ['product'],
        }
      }
    }) as any[]; // Type assertion to handle the case where no orders are found

    if (!pendingOrder) return ctx.send({ message: "No items in cart", cart: [] });

    return ctx.send({
      message: "Your cart",
      cart: pendingOrder.order_items,
      totalAmount: pendingOrder.total_amount,
    });

  } catch (err) {
    return ctx.badRequest("Failed to fetch cart");
  }
},
async updateItemInCart(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const { orderItemId } = ctx.params;
    const { quantity } = ctx.request.body;

    if (!quantity || quantity < 1) return ctx.badRequest("Quantity must be >= 1");

    const orderItem = await strapi.entityService.findOne("api::order-item.order-item", orderItemId, {
      populate: ['order', 'order.customer', 'product'],
    }) as unknown as PopulatedOrderItem;

    if (!orderItem?.order?.customer?.id || !orderItem?.product?.id) {
      return ctx.badRequest("Invalid data from database");
    }

    if (orderItem.order.customer.id !== userId || orderItem.order.status !== 'pending') {
      return ctx.badRequest("Invalid update");
    }

    if (!orderItem.product.quantity || orderItem.product.quantity < quantity) {
      return ctx.badRequest("Not enough stock available");
    }

    const newTotalPrice = quantity * orderItem.unitPrice;
    const totalDiff = newTotalPrice - orderItem.totalPrice;

    await strapi.entityService.update("api::order.order", orderItem.order.id, {
      data: {
        total_amount: Number(orderItem.order.total_amount) + totalDiff,
      }
    });

    await strapi.entityService.update("api::order-item.order-item", orderItemId, {
      data: {
        quantity,
        totalPrice: newTotalPrice,
      }
    });

    return ctx.send({ message: "Quantity updated" });

  } catch (err) {
    console.error(err); // helpful in dev
    return ctx.badRequest("Update failed");
  }
},
async removeItemFromCart(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const { orderItemId } = ctx.params;

    // Fetch the order item with its order, product, and customer
    const orderItem = await strapi.entityService.findOne("api::order-item.order-item", orderItemId, {
      populate: ['order', 'order.customer', 'product'],
    }) as unknown as PopulatedOrderItem;

    if (!orderItem?.order?.customer?.id || orderItem.order.customer.id !== userId) {
      return ctx.badRequest("Invalid or unauthorized operation");
    }

    if (orderItem.order.status !== 'pending') {
      return ctx.badRequest("Only pending orders can be modified");
    }

    // Step 1: Delete the item
    await strapi.entityService.delete("api::order-item.order-item", orderItemId);

    // Step 2: Re-fetch the order's current items (fresh from DB)
    const orderItems = await strapi.entityService.findMany("api::order-item.order-item", {
      filters: { order: { id: orderItem.order.id } },
    });

    if (orderItems.length === 0) {
      // Step 3A: No more items in the order — delete the order too
      await strapi.entityService.delete("api::order.order", orderItem.order.id);
      return ctx.send({ message: "Item removed and empty order deleted" });
    } else {
      // Step 3B: Update the order's total
      const updatedTotal = orderItems.reduce((sum, item) => sum + Number(item.totalPrice), 0);

      await strapi.entityService.update("api::order.order", orderItem.order.id, {
        data: {
          total_amount: updatedTotal,
        }
      });

      return ctx.send({ message: "Item removed from cart and total updated" });
    }

  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to remove item from cart");
  }
},
async checkoutOrder(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const { orderId } = ctx.params;

    // 1. Fetch the order and order_items
    const order = await strapi.entityService.findOne("api::order.order", orderId, {
      populate: ['order_items', 'customer', 'shippment_address'],
    }) as any;

    if (!order || order.customer.id !== userId || order.status !== 'pending') {
      return ctx.badRequest("Invalid order");
    }

    // 2. Calculate base total from items
    const baseTotal = order.order_items.reduce((sum, item) => sum + Number(item.totalPrice), 0);

    // 3. Calculate tax, shipping, and discount dynamically
    const shippingCost = 50; // You can also calculate based on address
    const tax = baseTotal * 0.05; // 5% VAT
    const discount = 0; // Add logic based on coupons or promo

    const finalTotal = baseTotal + tax + shippingCost - discount;

    // 4. Update order
    const updatedOrder = await strapi.entityService.update("api::order.order", orderId, {
      data: {
        total_amount: baseTotal,
        tax,
        shippingCost,
        discount,
        finalTotal,
      }
    });

    // 5. Return full summary to frontend
    return ctx.send({
      message: "Checkout summary",
      summary: {
        baseTotal,
        shippingCost,
        tax,
        discount,
        finalTotal,
      },
      orderId: order.id
    });

  } catch (err) {
    console.error(err);
    return ctx.badRequest("Checkout failed");
  }
},

// this is the controller for the order API intended for managing orders and cart items for retailers

// async getRetailerOrderDetails(ctx) {},
async updateRetailerOrderStatus(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const { orderId } = ctx.params;
    const { status } = ctx.request.body;

    // Validate status
    if (!['confirmed', 'shipped', 'delivered'].includes(status)) {
      return ctx.badRequest("Invalid status");
    }

    // Fetch the order
    const order = await strapi.entityService.findOne("api::order.order", orderId, {
      populate: ['retailer'],
    }) as any;

    if (!order || order.retailer.id !== userId) {
      return ctx.unauthorized("You are not authorized to update this order");
    }

    // Update the order status
    const updatedOrder = await strapi.entityService.update("api::order.order", orderId, {
      data: { status },
    });

    return ctx.send({
      message: "Order status updated successfully",
      order: updatedOrder,
    });

  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to update order status");
  }
},
// async getconfirmedOrder(ctx) {},
async recentPurchases(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    const limit = parseInt(typeof ctx.query.limit === 'string' ? ctx.query.limit : '') || 5; // Default to 5 recent orders
    const orders = await strapi.entityService.findMany("api::order.order", {
      filters: {
        customer: userId,
      },
      sort: [{ orderedAt: 'desc' }],
      limit,
      populate: {
        order_items: {
          populate: ['product'],
        },
      },
    });

    return ctx.send({
      message: 'Recent purchases retrieved successfully',
      orders,
    });

  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch recent purchases");
  }
},
async getOrderById(ctx) {
  try {
    const { id } = ctx.params;

    const order = await strapi.entityService.findOne("api::order.order", id, {
      populate: {
        order_items: {
          populate: ['product'],
        },
      },
    });

    if (!order) {
      return ctx.notFound("Order not found");
    }

    return ctx.send({
      message: 'Order retrieved successfully',
      order,
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch order");
  }
},


async getOrderStatistics(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;

    // Dates for this month
    const now = new Date();
    const thisMonthStart = startOfMonth(now).toISOString();
    const thisMonthEnd = endOfMonth(now).toISOString();

    // Dates for last month
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = startOfMonth(lastMonth).toISOString();
    const lastMonthEnd = endOfMonth(lastMonth).toISOString();

    // Helper function to compute stats
    const computeStats = (orders) => ({
      totalOrders: orders.length,
      activeOrders: orders.filter(o => ['pending', 'shipped'].includes(o.status)).length,
      completedOrders: orders.filter(o => o.status === 'delivered').length,
      totalSoldAmount: orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + Number(o.total_amount), 0)
    });

    // Fetch orders for this month
    const thisMonthOrders = await strapi.entityService.findMany("api::order.order", {
      filters: {
        retailer: userId,
        orderedAt: { $gte: thisMonthStart, $lte: thisMonthEnd }
      },
      fields: ['status', 'total_amount']
    });

    // Fetch orders for last month
    const lastMonthOrders = await strapi.entityService.findMany("api::order.order", {
      filters: {
        retailer: userId,
        orderedAt: { $gte: lastMonthStart, $lte: lastMonthEnd }
      },
      fields: ['status', 'total_amount']
    });

    const stats = {
      thisMonth: computeStats(thisMonthOrders),
      lastMonth: computeStats(lastMonthOrders),
    };

    return ctx.send({
      message: 'Statistics retrieved successfully',
      stats
    });

  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to retrieve order statistics");
  }
},

async getRetailerOrders(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const status = ctx.query.status || ''; // Default to empty string

    const filters = {
      retailer: userId,
      ...(status && { status }), // Only filter by status if it's provided
    };

    const orders = await strapi.entityService.findMany("api::order.order", {
      filters,
      populate: {
        order_items: {
          populate: ['product'],
        },
      },
    });

    return ctx.send({
      message: 'Retailer orders retrieved successfully',
      orders,
    });
  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch retailer orders");
  }
},

async getSalesReport(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const { type } = ctx.request.query; // 'weekly', 'monthly', 'yearly'

    const now = new Date();
    let startDate: string;
    let endDate: string;

    // const filters = {
    //   retailer: userId,
    //   status: 'delivered'
    // };

    if (type === 'weekly') {
      startDate = startOfWeek(now, { weekStartsOn: 1 }).toISOString(); // Monday
      endDate = endOfWeek(now, { weekStartsOn: 1 }).toISOString();     // Sunday
    } else if (type === 'monthly') {
      startDate = startOfYear(now).toISOString();
      endDate = endOfYear(now).toISOString();
    } else if (type === 'yearly') {
      const sixYearsAgo = subYears(now, 6);
      startDate = startOfYear(sixYearsAgo).toISOString();
      endDate = endOfYear(now).toISOString();
    } else {
      return ctx.badRequest("Invalid report type. Use ?type=weekly|monthly|yearly");
    }

    const deliveredOrders = await strapi.entityService.findMany("api::order.order", {
      filters: {
         retailer: userId,
         status: 'delivered',
        orderedAt: { $gte: startDate, $lte: endDate }
      },
      fields: ['total_amount', 'orderedAt'],
      sort: [{ orderedAt: 'asc' }]
    });

    // Grouping Logic
    const groupedSales: Record<string, number> = {};

    for (const order of deliveredOrders) {
      const date = new Date(order.orderedAt);
      let key: string;

      if (type === 'weekly') {
        key = format(date, 'EEEE'); // Monday, Tuesday, etc.
      } else if (type === 'monthly') {
        key = format(date, 'MMMM'); // January, February, etc.
      } else if (type === 'yearly') {
        key = format(date, 'yyyy'); // 2020, 2021, etc.
      }

      if (!groupedSales[key]) groupedSales[key] = 0;
      groupedSales[key] += Number(order.total_amount);
    }

    return ctx.send({
      message: `Sales report (${type})`,
      report: groupedSales
    });

  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to generate sales report");
  }
}

}));

