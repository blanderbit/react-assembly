export default function($resource) {
  'ngInject';

  return $resource('/admin/api/users/:userId/events/:eventId',
    {
      userId: '@user',
      skip: null,
      sortKey: 'date',
      sortDirection: 1
    }
  );
}
