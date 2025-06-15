export default {
    routes: [
        { 
            method: 'GET', 
            path: '/products/:id', 
            handler: 'product.getProduct',
            config: {
                auth: false,
            } 
        },
        { 
            method: 'GET', 
            path: '/products', 
            handler: 'product.getProducts',
            config: {
                auth: false,
            } 
        },
        { 
            method: 'POST', 
            path: '/products', 
            handler: 'product.addProduct',
            config: {
                auth: false,
            }
        },
        { 
            method: 'POST', 
            path: '/products/bulk', 
            handler: 'product.addManyProducts',
            config: {
                auth: false,
            }
        },
        { 
            method: 'PUT', 
            path: '/products/:id', 
            handler: 'product.updateProduct',
            config: {
                auth: false,
            }
        },
        { 
            method: 'DELETE', 
            path: '/products/:id', 
            handler: 'product.deleteOneProduct',
            config: {
                auth: false,
            }
        },
        { 
            method: 'DELETE', 
            path: '/products/bulk/delete', 
            handler: 'product.deleteManyProducts',
            config: {
                auth: false,
            }
        },
        { 
            method: 'DELETE', 
            path: '/products/retailer/all', 
            handler: 'product.deleteWholeProductsOfRetailer',
            config: {
                auth: false,
            }
        },
        { 
            method: 'GET', 
            path: '/products/filter', 
            handler: 'product.filter',
            config: {
                auth: false,
            }
        },
        { 
            method: 'GET', 
            path: '/products/stats', 
            handler: 'product.statForRetailer',
            config: {
                auth: false,
            }
        },
    ]
};
