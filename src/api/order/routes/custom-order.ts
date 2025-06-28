export default {
    routes: [
        {
            method: 'POST',
            path: '/order',
            handler: 'order.addToCart',
            config: {
                auth: false, // No authentication required for adding to cart
            }
        },
        {
            method: 'GET',
            path: '/order',
            handler: 'order.getMyOrders',
            config: {
                auth: false,
            }
        },
        {
            method: 'GET',
            path: '/order/cart',
            handler: 'order.getCartItems',
            config: {
                auth: false,
            }
        },
        {
            method: 'PUT',
            path: '/order/cart/item/:orderItemId',
            handler: 'order.updateItemInCart',
            config: {
                auth: false,
            }
        },
        {
            method: 'DELETE',
            path: '/order/cart/item/:orderItemId',
            handler: 'order.removeItemFromCart',
            config: {
                auth: false,
            }
        },
        // {
        //     method: 'POST',
        //     path: '/order/cart/checkout',
        //     handler: 'order.checkoutOrder',
        //     config: {
        //         auth: false,
        //     }
        // },
        // Custom route to get for retailers
        {
            method: 'PUT',
            path: '/order/:id',
            handler: 'order.updateRetailerOrderStatus',
            config: {
                auth: false,
            }
        },
        {
            method: 'GET',
            path: '/order/recent-purchases',
            handler: 'order.recentPurchases',
            config: {
                auth: false,
            }
        },
                {
            method: 'GET',
            path: '/order/order-stat',
            handler: 'order.getOrderStatistics',
            config: {
                auth: false,
            }
        },
        
        {
           method: 'GET',
           path: '/order/report',
           handler: 'order.getSalesReport',
           config: {
               auth: false,
           }
        },
        {
      method: 'GET',
      path: '/order/retailer-orders',
      handler: 'order.getRetailerOrders',
      config: {
        auth: false,
      },
    },
    {
           method: 'GET',
           path: '/order/:id',
           handler: 'order.getOrderById',
           config: {
               auth: false,
           }
        },
        {
            method: 'GET',
            path: '/order/top-retailers',
            handler: 'order.getTopRetailers',
            config: {
                auth: false,
            }
        }
    ]
}