export default function PitchedTrackFactory($resource) {
  'ngInject';

  return $resource(
    '/admin/api/tracks/PitchedTrack/:trackId',
    {
      trackId: '@_id',
      limit: null,
      skip: null,
      sortKey: null,
      sortDirection: null
    },
    {
      count: {
        url: '/admin/api/tracks/PitchedTrack/count'
      }
    }
  );
}
