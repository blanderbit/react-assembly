
// appends normalized genres data to existing songs that have 'complete' state and genres assigned

require('node-env-file')('.env');
var models = require('../server/models');
var systemGenres = require('./system_genres.json');
var Promise = require('bluebird');
var _ = require('lodash');
var mongoose = require('mongoose');

// add umbrella genre to list of subgenres to match against one set
systemGenres.forEach(function(sg) {
  sg.list.push(sg.main);
});

var eligibleSongsPromise = Promise.ninvoke(models.Song, 'find', { state: 'complete', 'genre': { $not: { $size: 0 } } });

eligibleSongsPromise.then(function(songs) {
  return songs.map(function(s) {
    s.genre_normalized = normalizeGenres(s);
    return Promise.ninvoke(s, 'save');
  });
}).allSettled(function() {
  console.log('All done, exiting');
  mongoose.disconnect();
}).done();

function normalizeGenres(s) {
  return systemGenres.filter(function (sg) {
    var common = _.intersection(s.genre, sg.list);
    return common.length > 0;
  }).map(function (sg) {
    return sg.main;
  });
}
