export default function User($resource) {
  'ngInject';

  return $resource('/admin/api/users/:userId',
    {
      userId: '@_id',
      limit: null,
      skip: null,
      sortKey: null,
      sortDirection: null,
      showAnonymous: null
    },

    {
      stats: { method: 'GET', url: '/admin/api/users/stats' },
      getChargebeeSubscriptions: { method: 'GET', url: '/admin/api/users/:userId/chargebee_subscriptions', isArray: true },
      resetPendingInvoice: { method: 'POST', url: '/admin/api/users/:userId/reset_pending_invoice' },
      createPaidPeriod: { method: 'POST', url: '/admin/api/users/:userId/paid_periods' },
      createChargebee: { method: 'POST', url: '/admin/api/users/:userId/chargebee_subscriptions', isArray: true },
      deletePaidPeriod: { method: 'DELETE', url: '/admin/api/users/:userId/paid_periods/:paidPeriodId' },
      changeType: { method: 'POST', url: '/admin/api/users/:userId/type' }
    });
}
