export default function TrackFactory($resource) {
  'ngInject';

  return $resource(
    '/admin/api/tracks/Track/:trackId',
    {
      trackId: '@_id',
      limit: null,
      skip: null,
      sortKey: null,
      sortDirection: null
    },
    {
      count: {
        url: '/admin/api/tracks/Track/count'
      }
    }
  );
}
