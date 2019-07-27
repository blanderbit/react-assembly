var Promise = require('bluebird');
var extend = require('util')._extend;

var musicFlavor = require('../../dicts/music_flavor');
var genericStep = require('./generic_step');

module.exports.buildWith = function() {

  var step = {
    name: 'Fetch data from filename',
    runWhen: 'spotifyReleaseDetails',
    updateTo: 'fetchDataFromFilename',
    run: function (trackInfo, trackRecord) {
      applyDirectoryTag(trackRecord);
      applyFileNameBPM(trackRecord);
      return trackRecord;
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function applyDirectoryTag(trackRecord) {
  var dir = trackRecord.file.split('/')[0];
  var targetTag = musicFlavor.TAG_MAPPING[dir];
  trackRecord.tags = targetTag ? [targetTag] : musicFlavor.DEFAULT_FLAVORS;
  trackRecord.tags.push(musicFlavor.S3_TAG);
}

function applyFileNameBPM(trackRecord) {
  var bpm = extractBPMFromFilename(trackRecord.file);
  if(typeof bpm === 'number') {
    trackRecord.id3.bpm = bpm;
  }
}

function extractBPMFromFilename(filename) {
  var tokens = extractTokens(filename);
  var last = tokens.pop();
  var asNumber = parseFloat(last);
  if(!Number.isNaN(asNumber)) {
    return asNumber;
  }
}

function extractTokens(str) {
  var results = [];
  var reg = /{([^}]+)}/g, text;
  while(text = reg.exec(str)) {
    results.push(text[1]);
  }
  return results;
}
