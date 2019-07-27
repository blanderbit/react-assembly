// fetches similar genres 2 levels down and stores results in json file

require('node-env-file')('.env');

var fs = require('fs');
var RateLimiter = require('limiter').RateLimiter;
var similarGenres = require('../server/fingerprinter/providers/echonest/similar_genres');
var Promise = require('bluebird');
var _ = require('lodash');
var push = Array.prototype.push;
var limiter = new RateLimiter(10, 'minute');
var similar = similarGenres(process.env.ECHONEST_KEY, limiter);

var mainGenres = ["rock", "pop", "jazz", "electro", "world", "soul"];

function forGenre(genreName, acc) {
  return similar(genreName).then(function(genres) {
    var proms = genres.subGenres.map(function(g) {
      acc.push(g);
      return similar(g);
    });
    return Promise.all(proms).then(function(gList) {
      gList.forEach(function(g) {
        push.apply(acc, g.subGenres);
      });
      return acc;
    });
  });
}

var proms = mainGenres.map(function(g) {
  return forGenre(g, []).then(function(list) {
    return {
      main: g,
      list: _.uniq(list)
    }
  });
});

Promise.all(proms).then(function(list) {
  console.log(list);
  fs.writeFileSync('./genres.json', JSON.stringify(list) , 'utf-8');
}).done();
