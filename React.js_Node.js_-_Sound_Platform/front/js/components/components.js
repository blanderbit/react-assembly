import subscribeOverlay from './subscribeOverlay/subscribeOverlay';
import selectize from './selectize/selectize';
import header from './header/header';
import musicId from './musicId/musicId';
import playerMain from './playerMain/playerMain';
import moodControls from './moodControls/moodControls';
import playlist from './playlist/playlist';
import daysLeftTo from './daysLeftTo/module';
import countdown from './countdown/countdown.module.js';

const componentsModule = angular.module('app.components', [
  subscribeOverlay.name,
  selectize.name,
  header.name,
  musicId.name,
  playerMain.name,
  moodControls.name,
  playlist.name,
  daysLeftTo.name,
  countdown.name
]);

export default componentsModule;
