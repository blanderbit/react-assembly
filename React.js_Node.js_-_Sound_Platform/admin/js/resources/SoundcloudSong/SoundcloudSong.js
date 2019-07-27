export default function SoundcloudSongFactory($resource) {
  'ngInject';

  return $resource(
    '/admin/api/tracks/SoundcloudSong/:trackId',
    {
      trackId: '@_id',
      limit: null,
      skip: null,
      sortKey: null,
      sortDirection: null
    },
    {
      count: {
        url: '/admin/api/tracks/SoundcloudSong/count'
      },
      fingerprint: {
        url: '/admin/api/tracks/SoundcloudSong/:trackId/fingerprint',
        method: 'POST'
      }
    }
  );
}
