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
        },
        {
            method: 'POST',
            path: '/blogs',
            handler: 'blog.createBlog',
            config: {
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/blogs/:id',
            handler: 'blog.updateBlog',
            config: {
                auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/blogs/:id',
            handler: 'blog.deleteBlog',
            config: {
                auth: false,
            },
        },
    ]
}