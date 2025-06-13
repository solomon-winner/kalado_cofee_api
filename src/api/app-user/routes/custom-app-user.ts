export default {
  routes: [
    {
      method: 'POST',
      path: '/app-users/login',
      handler: 'app-user.login',
      config: {
        auth: false, 
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
    {
      method: 'GET',
      path: '/app-users/get-user',
      handler: 'app-user.getUser',
      config: {
        auth: false, 
      },
    },
    {
      method: 'PUT',
      path: '/app-users/updateme',
      handler: 'app-user.updateme',
      config: {
        auth: false, 
      },
    },
  ],
};
