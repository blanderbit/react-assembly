export default function SongFactory($resource) {
  'ngInject';

  return $resource(
    '/admin/api/tracks/Song/:trackId',
    {
      trackId: '@_id',
      limit: null,
      skip: null,
      sortKey: null,
      sortDirection: null
    },
    {
      count: {
        url: '/admin/api/tracks/Song/count'
      }
    }
  );
}
