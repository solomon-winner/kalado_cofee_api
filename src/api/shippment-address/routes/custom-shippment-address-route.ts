export default {
    routes: [
        {
            method: 'POST',
            path: '/shippment-address',
            handler: 'custom-shippment-address.createAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'GET',
            path: '/shippment-address',
            handler: 'custom-shippment-address.getAddresses',
            config: {
               auth: false,
            },
        },
        {
            method: 'GET',
            path: '/shippment-address/:id',
            handler: 'custom-shippment-address.findOne',
            config: {
               auth: false,
            }, 
        },
        {
            method: 'GET',
            path: '/shippment-address',
            handler: 'custom-shippment-address.getDefaultAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/shippment-address/:id',
            handler: 'custom-shippment-address.updateAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/shippment-address/:id',
            handler: 'custom-shippment-address.deleteAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'POST',
            path: '/shippment-address/set-default',
            handler: 'custom-shippment-address.setDefaultAddress',
            config: {
               auth: false,
            },
        },
    ],

}