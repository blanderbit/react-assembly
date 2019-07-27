var Promise = require('bluebird');
var extend = require('util')._extend;
var moment = require('moment');

var genericStep = require('./generic_step');


module.exports.buildWith = function (spotifyClient) {

  var step = {
    name: 'Fetch release info from Spotify',
    runWhen: 'rdioReleaseDetails',
    updateTo: 'spotifyReleaseDetails',
    run: function (trackInfo, trackRecord) {
      return fetchReleaseDetails(spotifyClient, trackRecord).then(applyReleaseDetails.bind(null, trackRecord)).then(returnRecord.bind(null, trackRecord));
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function fetchReleaseDetails(spotifyClient, trackDBRecord) {
  var spotifyReleases = trackDBRecord.providers.releases.spotify || [];
  return spotifyClient.albumsDetails(spotifyReleases)
}


function applyReleaseDetails(trackRecord, spotifyData) {
  trackRecord.providers.images = trackRecord.providers.images || [];
  trackRecord.providers.releaseYears = trackRecord.providers.releaseYears || [];
  spotifyData.covers.forEach(function (c) {
    trackRecord.providers.images.push(c);
  });
  spotifyData.releaseDates.forEach(function (d) {
    trackRecord.providers.releaseYears.push(d.getFullYear());
  });
}


function returnRecord(trackRecord) {
  return trackRecord;
}
