export default {
    routes: [
        {
            method: 'GET',
            path: '/purchase-history',
            handler: 'purchase-history.getPurchaseHistoryById',
            config: {
               auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/purchase-history/:id',
            handler: 'purchase-history.deletePurchaseHistory',
            config: {
               auth: false,
            },
        }
    ],

}