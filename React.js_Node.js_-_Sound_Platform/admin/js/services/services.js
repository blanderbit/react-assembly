import BpmService from './Bpm/service';
import TracksService from './Tracks/service';
import SaPresetService from './SaPreset/service';

export default angular.module('services', [])
  .service('BpmService', BpmService)
  .service('TracksService', TracksService)
  .service('SaPresetService', SaPresetService);
