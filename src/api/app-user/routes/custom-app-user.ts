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
    {
      method: 'DELETE',
      path: '/app-users/deleteme',
      handler: 'app-user.deleteme',
      config: {
        auth: false, 
      },
    },
    ,
    {
      method: 'POST',
      path: '/app-users/change-password',
      handler: 'app-user.changePassword',
      config: {
        auth: false, 
      },
    },
    {
      method: 'POST',
      path: '/app-users/forgot-password',
      handler: 'app-user.forgotPassword',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/app-users/reset-password',
      handler: 'app-user.resetPassword',
      config: {
        auth: false,
      },
    },
  ],
};
