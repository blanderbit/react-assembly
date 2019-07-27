
// appends track profile (author, audio basics) to songs that have 'complete' state

require('node-env-file')('.env');
var models = require('../server/models');
var trackProfile = require('../server/fingerprinter/providers/echonest/track_profile');
var RateLimiter = require('limiter').RateLimiter;
var extend = require('util')._extend;
var Promise = require('bluebird');
var mongoose = require('mongoose');

var limiter = new RateLimiter(20, 'minute');
var track = trackProfile(process.env.ECHONEST_KEY, limiter);

var eligibleSongsPromise = Promise.ninvoke(models.Song, 'find', { state: 'complete' });

var trackProfilePromises = eligibleSongsPromise.then(function(songs) {
  return songs.map(processTrackProfile);
});

Promise.allSettled(trackProfilePromises).finally(function done() {
  console.log('All done, exiting');
  mongoose.disconnect();
}).done();

function processTrackProfile(s) {
  var trackId = s.tracks.echo[0];
  return track(trackId).then(updateRecord).then(ok, error);

  function updateRecord(trackInfo) {
    extendWithTrackProfile(s, trackInfo);
    extendWithAudioData(s, trackInfo);
    return Promise.npost(s, 'save');
  }

  function ok() {
    console.log('Track profile saved')
  }

  function error(err) {
    console.error('Could not save updated record', err);
    return Promise.reject(err);
  }

}

function extendWithTrackProfile(record, trackInfo) {
  extend(record, {
    title: trackInfo.title,
    releaseName: trackInfo.release,
    bitrate: trackInfo.bitrate,
    samplerate: trackInfo.samplerate,
    song_id: trackInfo.song_id,
    artist: {
      name: trackInfo.artist,
      id: trackInfo.artist_id
    },
    tracks:{
      echo:[ trackInfo.id ]
    }
  });
}

function extendWithAudioData(record, trackInfo) {
  if(trackInfo.audio_summary) {
    extend(record, {
      audio: {
        tempo: trackInfo.audio_summary.tempo
      }
    });
  }
}
