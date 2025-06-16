export default {
    routes: [
        {
            method: 'POST',
            path: '/order',
            handler: 'order.addToCart',
            auth: true,
        },
        {
            method: 'GET',
            path: '/order',
            handler: 'order.getMyOrders',
            auth: true,
        }
    ]
}