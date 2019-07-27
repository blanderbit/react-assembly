var Promise = require('bluebird');
var extend = require('util')._extend;

var genericStep = require('./generic_step');
var Genre = require('../../models/index').Genre;


module.exports.buildWith = function() {

  var step = {
    name: 'Normalize genres',
    runWhen: 'bpm-detected',
    updateTo: 'normalizeGenres',
    run: function (trackInfo, trackRecord) {
      return Promise.resolve(findSystemWideGenres()).then(applyNormalizedGenres.bind(null, trackRecord)).then(returnRecord.bind(null, trackRecord));
    }
  };

  genericStep.mixin.call(step);
  return step;
};


function findSystemWideGenres(){
  var dfd = Promise.defer();
  Genre.find({}, function(err, genres) {
    if(err) return dfd.reject(err);
    return dfd.resolve(genres);
  });
  return dfd.promise;
}

function applyNormalizedGenres(trackRecord, systemGenresRecords) {
  var normalizedGenres = systemGenresRecords.filter(function match(g) {
    return g.matches(trackRecord.genre);
  }).map(function name(g) {
    return g.name;
  });
  extend(trackRecord, {
    genres: normalizedGenres
  });
}

function returnRecord(trackRecord) {
  return trackRecord;
}
