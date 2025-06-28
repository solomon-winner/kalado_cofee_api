export default {
  routes: [
    {
      method: 'POST',
      path: '/subscribers/subscribe',
      handler: 'subscriber.subscribe',
      auth: false,
    },
    {
      method: 'POST',
      path: '/subscribers/unsubscribe',
      handler: 'subscriber.unsubscribe',
      auth: false,
    },
    {
      method: 'GET',
      path: '/subscribers',
      handler: 'subscriber.getSubscribers',
      auth: false,
    },
  ],
};