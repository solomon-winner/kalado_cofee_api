export default {
    routes: [
        {
            method: 'POST',
            path: '/shippment-address',
            handler: 'shippment-address.createAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'GET',
            path: '/shippment-address',
            handler: 'shippment-address.getAddresses',
            config: {
               auth: false,
            },
        },
                {
            method: 'GET',
            path: '/shippment-address/default',
            handler: 'shippment-address.getDefaultAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'GET',
            path: '/shippment-address/:id',
            handler: 'shippment-address.findOne',
            config: {
               auth: false,
            }, 
        },

        {
            method: 'PUT',
            path: '/shippment-address/:id',
            handler: 'shippment-address.updateAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/shippment-address/:id',
            handler: 'shippment-address.deleteAddress',
            config: {
               auth: false,
            },
        },
        {
            method: 'POST',
            path: '/shippment-address/set-default/:id',
            handler: 'shippment-address.setDefaultAddress',
            config: {
               auth: false,
            },
        },
    ],

}