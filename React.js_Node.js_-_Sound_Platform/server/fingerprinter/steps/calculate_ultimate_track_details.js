var Promise = require('bluebird');
var extend = require('util')._extend;

var genericStep = require('./generic_step');
var models = require('../../models');
var Song = models.Song;


module.exports.buildWith = function() {

  var step = {
    name: 'Calculate ultimate track details',
    runWhen: ['complete', 'error'],
    updateTo: function(trackRecord) {
      if(trackRecord.state === 'error' && trackRecord.id3.available) {
        return 'complete';
      }

      if (!trackRecord.title) {
        return 'error';
      }
    },
    run: function (trackInfo, trackRecord) {
      var id3 = trackRecord.id3;
      trackRecord.bpm = id3.bpm || trackRecord.detectedBpm;
      trackRecord.artistName = id3.artist || trackRecord.providers.artist.name;
      trackRecord.title = id3.title || trackRecord.providers.title;
      if (id3.year) {
        trackRecord.releaseYear = id3.year;
      }
      return trackRecord;
    }
  };

  genericStep.mixin.call(step);
  return step;
};
