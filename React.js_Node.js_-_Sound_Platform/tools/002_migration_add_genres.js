
// appends genres data to existing songs that have 'complete' state and valid 'artist.id'

require('node-env-file')('.env');
var models = require('../server/models');
var artistGenres = require('../server/fingerprinter/providers/echonest/artist_genres');
var RateLimiter = require('limiter').RateLimiter;
var extend = require('util')._extend;
var Promise = require('bluebird');
var mongoose = require('mongoose');

var limiter = new RateLimiter(20, 'minute');
var genres = artistGenres(process.env.ECHONEST_KEY, limiter);


var systemGenresPromise = Promise.ninvoke(models.Genre, 'find', {});
var eligibleSongsPromise = Promise.ninvoke(models.Song, 'find', { state: 'complete', 'artist.id': { $exists: true } });

var processingGenresPromises = Promise.all([systemGenresPromise, eligibleSongsPromise]).spread(function(systemGenres, songs) {
  return songs.map(processGenres.bind(null, systemGenres));
});

Promise.allSettled(processingGenresPromises).finally(function done() {
  console.log('All done, exiting');
  mongoose.disconnect();
}).done();


function processGenres(systemGenres, s) {
  var artistId = s.artist.id;
  return genres(artistId).then(updateRecord).then(ok, error);

  function updateRecord(artistGenres) {
    extendWithGenres(s, systemGenres, artistGenres);
    return Promise.npost(s, 'save');
  }

  function ok() {
    console.log('Genres saved')
  }

  function error(err) {
    console.error('Could not save updated record', err);
    return Promise.reject(err);
  }

}

function extendWithGenres(record, systemGenres, artistGenres) {
  extend(record, {
    genre: artistGenres,
    genre_normalized: toNormalizedGenres(artistGenres, systemGenres)
  });
}

function toNormalizedGenres(artistGenres, systemGenres) {
  return systemGenres.filter(function match(g) {
    return g.matches(artistGenres);
  }).map(function name(g) {
    return g.name;
  });
}
