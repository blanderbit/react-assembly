export default function($resource) {
  'ngInject';

  return $resource('/admin/api/play_events',
    {
      sortKey: 'num',
      sortDirection: -1
    }
  );
}
