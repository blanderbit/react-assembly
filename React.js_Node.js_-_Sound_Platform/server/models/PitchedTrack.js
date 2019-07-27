'use strict';

const Track = require('./Track');

const mongoose = require('mongoose');

const PitchedTrackSchema = new mongoose.Schema({
  original: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
  original_type: String
}, { discriminatorKey: 'type' });

const AWS = require('aws-sdk');

// pre-configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3({ params: { Bucket: 'mp3pitched' } });

PitchedTrackSchema.methods.getUrl = function() {
  return s3.getSignedUrl('getObject', {
    Key: this.file,
    Expires: 24 * 3600
  });
};

module.exports = Track.discriminator('PitchedTrack', PitchedTrackSchema);
