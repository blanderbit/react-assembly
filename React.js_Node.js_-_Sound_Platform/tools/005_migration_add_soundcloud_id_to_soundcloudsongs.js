/**
 * Populates soundcloud_id to SoundcloudSong
 */

'use strict';
var path = require('path');
var fs = require('fs');
var p = path.join(__dirname, '../', '.env');
var async = require('async');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

var models = require('../server/models');
var mongoose = require('mongoose');
models.connect(process.env.MONGOLAB_URI)

models.SoundcloudSong.find()
  .exec(function(err, tracks) {
    if (err) throw err;

    console.log('Found %d SoundcloudSongs', tracks.length);
    async.eachSeries(tracks,

      function(track, cb) {
        track.soundcloud_id = track.file.match(/tracks\/(\d+)\/stream/)[1];
        track.save(function(err) {
          if (err) return cb(err);
          cb(null);
        });
      },

      function(err) {
        if (err) console.log(err.stack);
        else console.log('Finished');
        mongoose.disconnect();
      });
  });
