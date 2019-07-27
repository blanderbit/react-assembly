'use strict';

let mongoose = require('mongoose');

let UserPlayEvent = new mongoose.Schema({
  date: {type: Date, default: Date.now, required: true},
  user: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true},
  trackName: {type: String, required: true},
  trackId: {type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true},
  trackType: {type: String, enum: ['Song', 'SoundcloudSong', 'PitchedTrack'], required: true},
  client: {type: String, enum: ['web', 'stream', 'sonos'], required: true}
});

module.exports = mongoose.model('UserPlayEvent', UserPlayEvent);
