export default {
    routes:[
        {
            method: 'GET',
            path: '/blogs',
            handler: 'blog.getAllBlogs',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/blogs/:id',
            handler: 'blog.getBlogById',
            config: {
                auth: false,
            },
        }
    ]
}