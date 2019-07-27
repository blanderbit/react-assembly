import Event from './Event/Event';
import PlayEvent from './PlayEvent/PlayEvent';
import Song from './Song/Song';
import SoundcloudSong from './SoundcloudSong/SoundcloudSong';
import Track from './Track/Track';
import User from './User/User';
import PitchedTrack from './PitchedTrack/PitchedTrack';

export default angular.module('resources', [])
  .factory('Event', Event)
  .factory('PlayEvent', PlayEvent)
  .factory('Song', Song)
  .factory('SoundcloudSong', SoundcloudSong)
  .factory('Track', Track)
  .factory('User', User)
  .factory('PitchedTrack', PitchedTrack);
