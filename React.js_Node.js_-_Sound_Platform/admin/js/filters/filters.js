import customerAgeFilter from './customerAge/filter';
import musicStyleFilter from './musicStyle/filter';
import playedAtFilter from './playedAt/filter';
import trackTypeFilter from './trackType/filter';
import workoutTypeFilter from './workoutType/filter';
import changingVoiceFilter from './changingVoice/filter';

export default angular.module('filters', [])
  .filter('customerAge', customerAgeFilter)
  .filter('musicStyle', musicStyleFilter)
  .filter('played_at', playedAtFilter)
  .filter('trackType', trackTypeFilter)
  .filter('workoutType', workoutTypeFilter)
  .filter('changingVoice', changingVoiceFilter);
