'use strict';

const Track = require('./Track');

const mongoose = require('mongoose');

const SoundcloudSongSchema = new mongoose.Schema({
  soundcloud_id: { type: Number, index: true, required: true },
  soundcloud_title: { type: String, required: true },
  soundcloud_user: { type: String, required: true },

  backup_url: String,

  download_url: String,

  normalized: Boolean,

  pitched: [{
    bpm: { type: Number, required: true },
    track: { type: mongoose.Schema.Types.ObjectId, ref: 'PitchedTrack', required: true }
  }]
}, { discriminatorKey: 'type' });

const AWS = require('aws-sdk');

// pre-configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3({ params: { Bucket: process.env.AWS_MP3_BUCKET } });

SoundcloudSongSchema.methods.getUrl = function(useBackup) {
  if (this.backup_url && (process.env.USE_SC_BACKUP || useBackup)) {
    return s3.getSignedUrl('getObject', {
      Key: this.backup_url,
      Expires: 24 * 3600,
      Bucket: 'mp3scbackup'
    });
  }

  return [this.file, '?client_id=', process.env.SOUNDCLOUD_CLIENT_ID].join('');
};

SoundcloudSongSchema.methods.getDownloadUrl = function() {
  return [this.download_url, '?client_id=', process.env.SOUNDCLOUD_CLIENT_ID].join('');
};

module.exports = Track.discriminator('SoundcloudSong', SoundcloudSongSchema);
