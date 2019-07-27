/**
 * Populates 500px images instead of 100px into SoundcloudSong collecton
 */

'use strict';
var path = require('path');
var fs = require('fs');
var p = path.join(__dirname, '../', '.env');
var async = require('async');
var sizeOf = require('image-size');
var url = require('url');
var https = require('https');
var http = require('http');
var Promise = require('bluebird');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

var models = require('../server/models');
var mongoose = require('mongoose');
models.connect(process.env.MONGOLAB_URI);

models.SoundcloudSong.find()
  .exec(function(err, tracks) {
    if (err) throw err;

    console.log('Found %d SoundcloudSongs', tracks.length);
    async.eachLimit(tracks, 10,

      function(track, cb) {
        if (track.coverImage) {
          track.coverImage = track.coverImage.replace(/-\w*?\.jpg/, '-t500x500.jpg');
          if (track.isModified('coverImage')) {
            getRemoteImageDimensions(track.coverImage)
              .then(function(dims) {
                if (dims.width === 500 && dims.height === 500) {
                  track.save(function(err) {
                    if (err) return cb(err);
                    console.log('INF: successfully updated image for %s (%s)', track.id, track.title);
                    cb(null);
                  });
                } else {
                  console.log('WARN: unable to set 500px image for %s (%s)', track.id, track.title);
                  cb(null);
                }
              })
              .catch(function(err) {
                cb(err);
              });
          } else {
            cb(null);
          }
        } else {
          console.log('WARN: %s (%s) doesn\'t have image', track.id, track.title);
          cb(null);
        }
      },

      function(err) {
        if (err) console.log(err.stack);
        else console.log('Finished');
        mongoose.disconnect();
      });
  });

var getRemoteImageDimensions = function(imageUrl) {
  var dfd = Promise.defer();

  var parsedUrl = url.parse(imageUrl);
  (parsedUrl.protocol === 'https:' ? https : http).get(parsedUrl, function(res) {
    var chunks = [];
    res
      .on('data', function(chunk) {
        chunks.push(chunk);
      })
      .on('end', function() {
        var buffer = Buffer.concat(chunks);
        dfd.resolve(sizeOf(buffer));
      })
      .on('error', function(err) {
        dfd.reject(err);
      });
  });
  return dfd.promise;
};
