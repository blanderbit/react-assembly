'use strict';

const Track = require('./Track');

const mongoose = require('mongoose');
const AWS = require('aws-sdk');

// pre-configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3({ params: { Bucket: process.env.AWS_MP3_BUCKET } });

const SongSchema = new mongoose.Schema({
  has_normalized: Boolean,

  pitched: [{
    bpm: { type: Number, required: true },
    track: { type: mongoose.Schema.Types.ObjectId, ref: 'PitchedTrack', required: true }
  }]
}, { discriminatorKey: 'type' });

SongSchema.methods.getUrl = function() {
  return s3.getSignedUrl('getObject', {
    Key: this.file,
    Expires: 24 * 3600,
    Bucket: this.has_normalized ? 'mp3normalized' : process.env.AWS_MP3_BUCKET
  });
};

const SongModel = Track.discriminator('Song', SongSchema);

SongModel.findByFilename = function (fileName, cb) {
  return SongModel.find({ file: fileName }, function (err, found) {
    if (err) return cb(err);
    if (!found || !found.length) return cb(null, null);
    return cb(null, found[0]);
  });
};

SongModel.countEligibleForProcessing = function (cb) {
  var conditions = {
    state: {
      $nin: ['complete', 'error', 'deleted']
    }
  };
  return SongModel.count(conditions, cb);
};

module.exports = SongModel;
