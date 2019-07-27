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

let collectionFactory = (collection) => {
  return function(cb) {
    models[collection].find({coverImage: /^(http|https):/})
      .exec(function(err, tracks) {
        if (err) throw err;

        console.log(`Found ${tracks.length} tracks in ${collection}`);
        async.eachLimit(tracks, 10,

          function(track, cb) {
            track.coverImage = track.coverImage.replace(/^(http|https):/, '');
            console.log(track.coverImage);

            track.save(function(err) {
              if (err) console.error(err.stack);
              cb(null);
            });
          },

          function(err) {
            if (err) console.log(err.stack);
            else console.log('Finished');
            cb(null);
          });
      });
  };
};

async.series([
  collectionFactory('SoundcloudSong'),
  collectionFactory('Song')
], () => {
  mongoose.disconnect();
});
