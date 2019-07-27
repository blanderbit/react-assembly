var echojs = require('echojs');
var Promise = require('bluebird');

function fetchSimilarGenres(echo, genreName) {
  var deferred = Promise.defer();
  echo('genre/similar').get({ name: genreName }, function (err, res) {
    if (err) {
      console.error('Error while fetching similar genres for', genreName, err);
      console.error(res.response);
      return deferred.reject(err);
    }
    deferred.resolve(extractSimilarGenres(genreName, res));
  });
  return deferred.promise;
}

function similarGenres(echonestApiKey, rateLimiter) {
  var echo = echojs({ key: echonestApiKey });
  return function(genreName) {
    var dfd = Promise.defer();
    rateLimiter.removeTokens(1, function() {
      dfd.resolve(fetchSimilarGenres(echo, genreName));
    });
    return dfd.promise;
  }
}

function extractSimilarGenres(genreName, res) {
  return {
    name: genreName,
    subGenres: res.response.genres.map(function genreName(g) {
      return g.name;
    })
  };
}

// fetch genres similar to given genre from echonest API
module.exports = similarGenres;
