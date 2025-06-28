export default {
    routes: [
        {
            method: 'GET',
            path: '/constants',
            handler: 'constant.getConstants',
            config: {
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/constants',
            handler: 'constant.updateConstants',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/constants',
            handler: 'constant.createConstants',
            config: {
                auth: false,
            },
        },
    ],
}
