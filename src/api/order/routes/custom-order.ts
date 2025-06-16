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
        }
    ]
}