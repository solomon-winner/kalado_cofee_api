export default [
  {
    method: 'POST',
    path: '/app-users/login',
    handler: 'app-user.login', // controller method
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
];
