var Promise = require('bluebird');
var extend = require('util')._extend;

var genericStep = require('./generic_step');


module.exports.buildWith = function(musicbrainzClient) {

  var step = {
    name: 'Fetch release dates from Musicbrainz',
    runWhen: 'musicbrainzReleaseCovers',
    updateTo: 'musicbrainzReleaseDates',
    run: function (trackInfo, trackRecord) {
      return fetchReleaseDates(musicbrainzClient, trackRecord).then(applyReleaseDates.bind(null, trackRecord)).then(returnRecord.bind(null, trackRecord));
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function fetchReleaseDates(musicbrainzClient, trackDBRecord) {
  var musicbrainzReleases = trackDBRecord.providers.releases.musicbrainz || [];
  return musicbrainzClient.releasesDates(musicbrainzReleases)
}


function applyReleaseDates(trackRecord, releasesDates) {
  trackRecord.providers.releaseYears = trackRecord.providers.releaseYears || [];
  releasesDates.forEach(function (date) {
    return trackRecord.providers.releaseYears.push(date.getFullYear());
  });
}


function returnRecord(trackRecord) {
  return trackRecord;
}
