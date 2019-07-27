import mood from './mood/mood';
import map from './map/map';

export default angular.module('app.filters', [
  mood.name,
  map.name
]);
