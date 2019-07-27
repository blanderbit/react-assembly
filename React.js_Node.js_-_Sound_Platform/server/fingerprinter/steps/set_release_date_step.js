var Promise = require('bluebird');
var extend = require('util')._extend;
var _ = require('lodash');

var genericStep = require('./generic_step');

module.exports.buildWith = function() {

  var step = {
    name: 'Choose earliest release date',
    runWhen: 'fetchDataFromFilename',
    updateTo: 'setReleaseDate',
    run: function (trackInfo, trackRecord) {
      setReleaseDate(trackRecord);
      return trackRecord;
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function setReleaseDate(trackRecord) {
  trackRecord.providers.releaseYears = _.uniq(trackRecord.providers.releaseYears);
  var sortedYears = trackRecord.providers.releaseYears.sort(function (a, b) {
    return a - b;
  });
  if(sortedYears.length) {
    trackRecord.releaseYear = sortedYears[0];
  }
}
