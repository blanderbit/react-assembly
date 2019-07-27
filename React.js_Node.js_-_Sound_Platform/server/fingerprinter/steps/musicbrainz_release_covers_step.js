var Promise = require('bluebird');
var extend = require('util')._extend;

var genericStep = require('./generic_step');


module.exports.buildWith = function(musicbrainzClient) {

  var step = {
    name: 'Fetch release cover from Musicbrainz',
    runWhen: 'normalizeGenres',
    updateTo: 'musicbrainzReleaseCovers',
    run: function (trackInfo, trackRecord) {
      return fetchReleaseCover(musicbrainzClient, trackRecord).then(applyCoversData.bind(null, trackRecord)).then(returnRecord.bind(null, trackRecord));
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function fetchReleaseCover(musicbrainzClient, trackDBRecord) {
  var musicbrainzReleases = trackDBRecord.providers.releases.musicbrainz || [];
  return musicbrainzClient.coverImages(musicbrainzReleases)
}


function applyCoversData(trackRecord, releaseCoversData) {
  trackRecord.providers.images = trackRecord.providers.images || [];
  releaseCoversData.forEach(function (data) {
    if(data.image) {
      return trackRecord.providers.images.push(data.image);
    }
  });
}


function returnRecord(trackRecord) {
  return trackRecord;
}
