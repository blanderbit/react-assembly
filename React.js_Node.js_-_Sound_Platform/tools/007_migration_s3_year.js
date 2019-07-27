/**
 * Populates missed releaseYear
 */

'use strict';
var fs = require('fs')
var Promise = require('bluebird');
var path = require('path');
var p = path.join(__dirname, '../', '.env');
var async = require('async');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

var models = require('../server/models');
var mongoose = require('mongoose');
models.connect(process.env.MONGOLAB_URI);

models.Song.find({releaseYear: {$exists: false}})
  .exec(function(err, tracks) {
    if (err) throw err;

    console.log('Found %d tracks', tracks.length);
    async.eachLimit(tracks, 10,

      function(track, cb) {
        if (!track.id3.year) {
          console.log('Skipping');
          return cb(null);
        }

        track.releaseYear = track.id3.year;
        console.log('set %s', track.releaseYear);
        track.save(function() {
          if (err) console.log('failed to save track');
          return cb(null);
        });
      },

      function(err) {
        if (err) console.log(err.stack);
        else console.log('Finished');
        mongoose.disconnect();
      });
  });
