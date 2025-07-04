/**
 * order controller
 */

import { factories } from '@strapi/strapi'
import { verifyToken } from '../../../utils/dto/verify-token';
import { PopulatedOrderItem } from '../type/order_schems_type'; // Adjust the import path as necessary
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format, subMonths, subYears } from 'date-fns';
import { getPagination } from '../../../utils/pagination/getPagination';
const {OrderDTO, OrderListDTO} = require('../../../utils/dto/order/orderDto');
const { OrderItemDTO, OrderItemListDTO } = require('../../../utils/dto/order/orderItem');
const { CartItemDto, CartItemListDTO } = require('../../../utils/dto/cart/cartItem');
import { paypalClient } from "../../../utils/paymentConfiguration/paypal"; 
import paypal from "@paypal/checkout-server-sdk";
import { CalculatePrice } from '../../../utils/calculation/price';
const { getShippingDetails } = require('../../../utils/calculation/shippment_cost');

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  //this is the controller for the order API intended for managing orders and cart items for customers
async addToCart(ctx) {
  try {
    const decoded = verifyToken(ctx); 
    const userId = decoded.id;

    const { productId, quantity, method } = ctx.request.body;

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
        order_items: { populate: ['product'] }
      }
    }) as any[];

    // 3. If no pending order, create one
    if (!pendingOrder) {
      pendingOrder = await strapi.entityService.create("api::order.order", {
        data: {
          customer: userId,
          total_amount: totalPrice,
          orderedAt: new Date().toISOString(),
          status: "pending",
          currency: "USD",
          paymentStatus: "unpaid",
          paymentMethod: "unpaid",
          shippment_method: method || "standard",
        }
      });
    } else {
      // 4. Check for duplicate product
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

    // 6. Create order item
    const orderItem = await strapi.entityService.create("api::order-item.order-item", {
      data: {
        product: productId,
        order: pendingOrder.id,
        unitPrice,
        quantity,
        totalPrice,
      }
    });

    // 7. Fetch constants using util
    let shippingCost, tax, discount;
    try {
      ({ shippingCost, tax, discount } = await getShippingDetails(method || 'standard'));
    } catch (err) {
      return ctx.badRequest(err.message);
    }

    // 8. Override discount if product has one
    const appliedDiscount = product.discount ?? discount;

    // 9. Calculate final amount
    const calculated = CalculatePrice(
      [{ price: orderItem.unitPrice, quantity: orderItem.quantity }],
      tax,
      appliedDiscount
    );
    const finalAmount = calculated.finalPrice;

    return ctx.send({
      message: 'Item added to cart (not confirmed until payment)',
      orderId: pendingOrder.id,
      orderItem: new OrderItemDTO(orderItem),
      constants: {
        shippingCost,
        tax,
        discount: appliedDiscount,
        finalAmount,
      }
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
      deletedAt: null, // Ensure we only get non-deleted orders
    };

    if (status) {
      filters.status = status;
    }
      const total = await strapi.entityService.count('api::order.order', {
          filters,
        });
    
        // Step 2: Use your helper to get meta and pagination
        const pagination  = getPagination(ctx, total);
    
           const start = (pagination.page - 1) * pagination.pageSize;
    const limit = pagination.pageSize;

    const orders = await strapi.entityService.findMany("api::order.order", {
      filters,
      start,
      limit,
      populate: {
        order_items: {
          populate: ['product'],
        },
        shippment_address: true,
      },
      sort: { orderedAt: 'desc' },
    });
    // orders.forEach(order => {
    //   (order as { order_items?: any[] }).order_items = (order as any).order_items?.length || 0;
    // });

    return ctx.send({
      message: 'Orders retrieved successfully',
      orders: OrderListDTO(orders),
      meta: { pagination }
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
    }) as any[];

    if (!pendingOrder) {
      return ctx.send({ message: "No items in cart", cart: [] });
    }

    const method = pendingOrder.shippment_method || 'standard';

    let shippingCost, tax, discount;

    try {
      ({ shippingCost, tax, discount } = await getShippingDetails(method));
    } catch (err) {
      return ctx.badRequest(err.message); // Handles missing constants or invalid method
    }

    // Calculate final amount
    const calculated = CalculatePrice(
      pendingOrder.order_items.map(item => ({
        price: item.final_price,
        quantity: item.quantity
      })),
      tax,
      discount
    );

    const finalAmount = calculated.finalPrice;

    return ctx.send({
      message: "Your cart",
      cart: CartItemListDTO(pendingOrder.order_items),
      totalAmount: finalAmount,
      shippingCost,
      tax,
      discount,
      method,
    });

  } catch (err) {
    console.error(err);
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

// async checkoutOrder(ctx) {
//   try {
//     const decoded = verifyToken(ctx);
//     const userId = decoded.id;
//     const { orderId } = ctx.params;

//     // 1. Fetch order and relationships
//     const order = await strapi.entityService.findOne("api::order.order", orderId, {
//       populate: ['order_items', 'customer', 'shippment_address'],
//     }) as any;
//     const [constants] = await strapi.entityService.findMany("api::constant.constant");
//     if (!order || order.customer.id !== userId || order.status !== 'pending') {
//       return ctx.badRequest("Invalid order");
//     }

//     // 2. Prepare data for calculation
//     const itemsForCalc = order.order_items.map((item) => ({
//       price: Number(item.unitPrice),
//       quantity: Number(item.quantity),
//     }));

//     const shippingCost = constants?.shippment_cost || 50;
//     const taxRate = constants?.tax || 0.05;
//     const discountRate = constants?.discount || 0; // e.g., 0.10 for 10% discount

//     // 3. Calculate pricing using utility
//     const { totalPrice: baseTotal, tax, finalPrice: subtotalPlusTax } = CalculatePrice(
//       itemsForCalc,
//       taxRate,
//       discountRate
//     );

//     const finalTotal = subtotalPlusTax + shippingCost;

//     // 4. Update the order in DB
//     await strapi.entityService.update("api::order.order", orderId, {
//       data: {
//         total_amount: baseTotal,
//         tax_amount: tax,
//         shippment_cost: shippingCost,
//         discount_amount: baseTotal * discountRate,
//         final_amount: finalTotal,
//       }
//     });

//     // 5. Create PayPal order
//     const request = new paypal.orders.OrdersCreateRequest();
//     request.prefer("return=representation");
//     request.requestBody({
//       intent: "CAPTURE",
//       purchase_units: [{
//         reference_id: `ORDER-${order.id}`,
//         amount: {
//           currency_code: "USD",
//           value: finalTotal.toFixed(2),
//           breakdown: {
//             item_total: {
//               currency_code: "USD",
//               value: baseTotal.toFixed(2),
//             },
//             shipping: {
//               currency_code: "USD",
//               value: shippingCost.toFixed(2),
//             },
//             tax_total: {
//               currency_code: "USD",
//               value: tax.toFixed(2),
//             },
//             discount: {
//               currency_code: "USD",
//               value: (baseTotal * discountRate).toFixed(2),
//             }
//           }
//         }
//       }],
//       application_context: {
//         brand_name: "Kalado Coffee",
//         landing_page: "LOGIN",
//         user_action: "PAY_NOW",
//         return_url: "https://kalado-coffee.vercel.app/paypal-success",
//         cancel_url: "https://kalado-coffee.vercel.app/paypal-cancel"
//       }
//     });

//     const paypalRes = await paypalClient().execute(request);

//     // 6. Send response
//     const approvalUrl = paypalRes.result.links.find(link => link.rel === "approve")?.href;

//     return ctx.send({
//       message: "PayPal order created",
//       orderId: order.id,
//       summary: {
//         baseTotal: Number(baseTotal.toFixed(2)),
//         shippingCost,
//         tax: Number(tax.toFixed(2)),
//         discount: Number((baseTotal * discountRate).toFixed(2)),
//         finalTotal: Number(finalTotal.toFixed(2)),
//       },
//       paypalOrderId: paypalRes.result.id,
//       approvalUrl
//     });

//   } catch (err) {
//     console.error("Checkout error:", err);
//     return ctx.badRequest("Checkout failed");
//   }
// },

// async capturePayPalOrder(ctx) {
//   try {
//     const decoded = verifyToken(ctx);
//     const userId = decoded.id;
//     const { paypalOrderId } = ctx.params;

//     // 1. Capture PayPal order
//     const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
//     request.requestBody({});
//     const capture = await paypalClient().execute(request);

//     const status = capture.result.status;
//     const paypalCaptureId = capture.result.id;
//     const capturedOrder = capture.result.purchase_units[0];
//     const referenceId = capturedOrder.reference_id;
//     const strapiOrderId = referenceId?.split("ORDER-")[1];

//     if (!strapiOrderId) {
//       return ctx.badRequest("Invalid reference ID");
//     }

//     // 2. Update order
//     const updatedOrder = await strapi.entityService.update("api::order.order", strapiOrderId, {
//       data: {
//         status: status === "COMPLETED" ? "confirmed" : "pending",
//         paymentStatus: status === "COMPLETED" ? "paid" : "unpaid",
//         paidAt: status === "COMPLETED" ? new Date().toISOString() : null,
//         paymentMethod: "paypal",
//       }
//     });

//     if (!updatedOrder) {
//       return ctx.badRequest("Failed to update order");
//     }

//     // 3. Create purchase history record
//     const purchaseHistory = await strapi.entityService.create("api::purchase-history.purchase-history", {
//       data: {
//         order: updatedOrder.id,
//         customer: userId,
//         totalPrice: updatedOrder.final_amount || 0,
//         tax: updatedOrder.tax_amount || 0,
//         shippment_cost: updatedOrder.shippment_cost || 0,
//         discount_amount: updatedOrder.discount_amount || 0,
//         payment_method: "paypal",
//         paypalCaptureId,
//         paidAt: new Date().toISOString()
//       }
//     });

//     return ctx.send({
//       message: "Payment captured and history saved",
//       paypalStatus: status,
//       order: updatedOrder,
//       purchaseHistory,
//     });

//   } catch (err) {
//     console.error("PayPal capture error:", err);
//     return ctx.badRequest("Payment capture failed");
//   }
// }
// ,
// this is the controller for the order API intended for managing orders and cart items for retailers

// async getRetailerOrderDetails(ctx) {},
async updateRetailerOrderStatus(ctx) {
  try {
    const decoded = verifyToken(ctx);
    const userId = decoded.id;
    const { id } = ctx.params;
    const { status } = ctx.request.body;

    // Validate status
    if (!['confirmed', 'shipped', 'delivered'].includes(status)) {
      return ctx.badRequest("Invalid status");
    }

    // Fetch the order
    const order = await strapi.entityService.findOne("api::order.order", id, {
      populate: ['retailer'],
    }) as any;

    if (!order || order.retailer.id !== userId) {
      return ctx.unauthorized("You are not authorized to update this order");
    }

    // Update the order status
    const updatedOrder = await strapi.entityService.update("api::order.order", id, {
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
        retailer: userId,
        deletedAt: null, // Ensure we only get non-deleted orders
      },
      sort: [{ orderedAt: 'desc' }],
      limit,
      // populate: {
      //   order_items: {
      //     populate: ['product'],
      //   },
      //},
    });

    return ctx.send({
      message: 'Recent purchases retrieved successfully',
      orders: OrderListDTO(orders),
    });

  } catch (err) {
    console.error(err);
    return ctx.badRequest("Failed to fetch recent purchases");
  }
},
async getOrderById(ctx) {
  try {
    const { id } = ctx.params;
    const decoded = verifyToken(ctx);
    console.log("Decoded user ID:", id);
    const order = await strapi.entityService.findOne("api::order.order", id, {
      filters: {
        retailer: decoded.id, // Ensure the retailer owns this order
        deletedAt: null, // Ensure we only get non-deleted orders
      },
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
      order: new OrderDTO(order),
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
      const total = await strapi.entityService.count('api::order.order', {
          filters,
        });
    
        // Step 2: Use your helper to get meta and pagination
        const pagination  = getPagination(ctx, total);
    const start = (pagination.page - 1) * pagination.pageSize;
    const limit = pagination.pageSize;

    const orders = await strapi.entityService.findMany("api::order.order", {
      filters,
      start,
      limit,
      sort: [{ orderedAt: 'desc' }],
      populate: {
        order_items: {
          populate: ['product'],
        },
      },
    });

    return ctx.send({
      message: 'Retailer orders retrieved successfully',
      meta: { pagination },
      orders: OrderListDTO(orders),
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
},

async getTopRetailers(ctx) {
  try {
    // Step 1: Get all paid, not-deleted orders
    console.log("Fetching paid orders...");
    const paidOrders = await strapi.db.query('api::order.order').findMany({
      where: {
        paymentStatus: 'paid',
        deletedAt: null,
      },
      populate: {
        retailer: true,
      }
    });
      console.log("Paid Orders:", paidOrders.length);
    // Step 2: Aggregate revenue per retailer
    const revenueMap = new Map();

    for (const order of paidOrders) {
      const retailerId = order.retailer?.id;
      const retailerName = order.retailer?.name;
      if (!retailerId) continue;

      const prev = revenueMap.get(retailerId) || { id: retailerId, name: retailerName, totalRevenue: 0, orderCount: 0 };
      prev.totalRevenue += Number(order.total_amount);
      prev.orderCount += 1;

      revenueMap.set(retailerId, prev);
    }

    // Step 3: Convert to array, sort by revenue, and get top 5
    const topRetailers = [...revenueMap.values()]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    return ctx.send({ topRetailers });

  } catch (err) {
    return ctx.badRequest(err.message);
  }
}

}));

