var Promise = require('bluebird');

var genericStep = require('./generic_step');
var models = require('../../models');
var Song = models.Song;


module.exports.buildWith = function() {

  var step = {
    name: 'Build initial track data',
    runWhen: null,
    updateTo: 'initialized',
    run: function (trackInfo) {
      return new models.Song({
        file: trackInfo.file
      });
    }
  };

  genericStep.mixin.call(step);
  return step;
};
