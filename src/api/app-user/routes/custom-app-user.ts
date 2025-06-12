export default {
  routes: [
  {
    method: 'POST',
    path: '/app-users/login',
    handler: 'app-user.login', // controller method
    config: {
      auth: false, // public route
    },
  },
    {
    method: 'GET',
    path: '/app-users/get-user',
    handler: 'app-user.getUser', // controller method
    config: {
      auth: false, // public route
    },
  },
  {
    method: 'POST',
    path: '/app-users/register',
    handler: 'app-user.register',
    config: {
      auth: false,
    },
  },
]
};