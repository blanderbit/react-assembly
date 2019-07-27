// Updates similar genres list in DB

var models = require('../../server/models/index'),
    RateLimiter = require('limiter').RateLimiter,
    limiter = new RateLimiter(10, 'minute'),
    Promise = require('bluebird'),
    echo = require('echojs')({ key: process.env.ECHONEST_KEY }),
    echonestGenresFetcher = require('./../server/analysis/echonest-genres/fetch-genres')(echo);



module.exports = function run(genresList) {

  limiter.removeTokens(1, function() {
    updateSimilarGenresRegistry(genresList);
  });

};


function updateSimilarGenresRegistry(genresList) {
  var promises = genresList.map(function toAPIPromise(g) {
    return echonestGenresFetcher.fetchSimilarGenres(g);
  });
  return Promise.allSettled(promises).then(resolvedPromisesToGenresData).then(saveGenres).done();
}

function resolvedPromisesToGenresData(fulfilledPromises) {
  return fulfilledPromises
    .filter(function resolved(p) { return p.state === 'fulfilled'; })
    .map(function toGenre(p) { return p.value; })
}

function saveGenres(genres) {
  return genres.map(saveGenre);
}

function saveGenre(g) {
  var deferred = Promise.defer();
  models.Genre.findOne( { name: g.name }, function(err, found) {
    if(err) return deferred.reject(err);
    found = updateGenreParams(found, g);
    found.save(function (err) {
      if(err) return deferred.reject(err);
      return deferred.resolve(found);
    });
  });
  return deferred.promise;
}

function updateGenreParams(existing, newData) {
  if(existing) {
    existing.subGenres = newData.subGenres;
    console.log('Genre already in DB, updating:', newData.name);
  } else {
    existing = new models.Genre(newData);
    console.log('Genre not found in DB, creating:', newData.name);
  }
  return existing;
}
