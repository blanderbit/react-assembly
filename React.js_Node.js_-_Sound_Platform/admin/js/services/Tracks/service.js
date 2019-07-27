const tags = [
  { id: 'nyc', caption: 'NYC' },
  { id: 'berlin', caption: 'Berlin' },
  { id: 'classic_mix', caption: 'Classic Mix' },
  { id: 'paris', caption: 'Paris' },
  { id: 'stockholm', caption: 'Stockholm' },
  { id: 'miami', caption: 'Miami' },
  { id: 'oldies', caption: 'Oldies' },
  { id: 'new_orleans', caption: 'New Orleans' },
  { id: 'christmas', caption: 'Christmas' },
  { id: 'st_barths', caption: 'StBarths' },
  { id: 'fitness_max', caption: 'FitnessMax' },
  { id: 'fitness_mid', caption: 'FitnessMid' },
  { id: 'indie', caption: 'Indie' },
  { id: 'mainstream', caption: 'Mainstream' }
];

const styleTags = ['mainstream', 'indie'];
const flavorTags = [
  'nyc',
  'berlin',
  'classic_mix',
  'paris',
  'stockholm',
  'miami',
  'oldies',
  'new_orleans',
  'christmas',
  'st_barths',
  'fitness_max',
  'fitness_mid'
];

class TracksService {
  constructor($http) {
    'ngInject';

    Object.assign(this, {
      $http
    });

    this.tagsSet = tags;
  }

  getTracksStats() {
    const { $http } = this;

    return $http.get('/admin/api/tracks/count')
      .then(function(resp) {
        return resp.data.count;
      });
  }

  getReadableTags(track) {
    return (track.tags || [])
      .filter(function(t) {
        return flavorTags.indexOf(t) !== -1;
      })
      .map(function(t) {
        return _.get(_.find(tags, {id: t}), 'caption', 'Unknown tag');
      })
      .join(', ');
  }

  getStyleTags(track) {
    return (track.tags || [])
      .filter(function(t) {
        return styleTags.indexOf(t) !== -1;
      })
      .map(function(t) {
        return _.get(_.find(tags, {id: t}), 'caption', 'Unknown tag');
      })
      .join(', ');
  }
}

export default TracksService;
