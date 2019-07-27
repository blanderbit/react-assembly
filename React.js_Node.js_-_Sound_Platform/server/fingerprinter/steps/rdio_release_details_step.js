var Promise = require('bluebird');
var extend = require('util')._extend;
var moment = require('moment');

var genericStep = require('./generic_step');


module.exports.buildWith = function (rdioClient) {

  var step = {
    name: 'Fetch release cover from Rdio',
    runWhen: 'musicbrainzReleaseDates',
    updateTo: 'rdioReleaseDetails',
    run: function (trackInfo, trackRecord) {
      return Promise.resolve(trackRecord);
      // return fetchReleaseDetails(rdioClient, trackRecord).then(applyReleaseDetails.bind(null, trackRecord)).then(returnRecord.bind(null, trackRecord));
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function fetchReleaseDetails(rdioClient, trackDBRecord) {
  var rdioReleases = trackDBRecord.providers.releases.rdio || [];
  return rdioClient.releasesDetails(rdioReleases)
}


function applyReleaseDetails(trackRecord, rdioData) {
  trackRecord.providers.images = trackRecord.providers.images || [];
  Object.keys(rdioData).forEach(function (k) {
    if (rdioData[k].icon) {
      trackRecord.providers.images.push(rdioData[k].icon);
    }
    if (rdioData[k].releaseDate) {
      applyReleaseDate(trackRecord, rdioData[k].releaseDate);
    }
  });
}


function applyReleaseDate(record, date) {
  var d = moment(date, 'YYYY-MM-DD', true);
  if(d.isValid()) {
    record.providers.releaseYears.push(d.toDate().getFullYear());
  }
}

function returnRecord(trackRecord) {
  return trackRecord;
}
