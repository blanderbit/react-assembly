var mongoose = require('mongoose'),
    _ = require('lodash');

var Genre = new mongoose.Schema({
	name: String,
  subGenres: [String]
});

/**
 * Check whether song genres provided as array contain any genre from current Genre instance
 * @param songGenres
 * @returns {boolean}
 */
Genre.methods.matches = function(songGenres) {
  var thisGenres = _.clone(this.subGenres);
  thisGenres.push(this.name);
  return _.intersection(songGenres, thisGenres).length > 0;
};

module.exports = mongoose.model('Genre', Genre);