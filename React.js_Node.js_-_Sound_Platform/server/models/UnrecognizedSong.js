var mongoose = require('mongoose');

var UnrecognizedSong = new mongoose.Schema({
  file: String,
  date: {'type': Date, 'default': Date.now},
  info: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('UnrecognizedSong', UnrecognizedSong);