var Promise = require('bluebird');
var extend = require('util')._extend;
var _ = require('lodash');

var genericStep = require('./generic_step');

module.exports.buildWith = function() {

  var step = {
    name: 'Set release cover image step',
    runWhen: 'setReleaseDate',
    updateTo: 'complete',
    run: function (trackInfo, trackRecord) {
      setCoverImage(trackRecord);
      return trackRecord;
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function setCoverImage(trackRecord) {
  if(trackRecord.id3.coverImage) {
    trackRecord.coverImage = trackRecord.id3.coverImage;
  } else {
    trackRecord.providers.images = _.uniq(trackRecord.providers.images);
    if (trackRecord.providers.images.length) {
      trackRecord.coverImage = trackRecord.providers.images[0];
    }
  }

  if (trackRecord.coverImage) {
    trackRecord.coverImage.replace(/^(http|https):/, '');
  }
}
