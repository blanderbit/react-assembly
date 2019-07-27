'use strict';

const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../', '.env');
const async = require('async');
const _ = require('lodash');
const tmp = require('tmp');
const Promise = require('bluebird');
const request = require('request');
const normalizer = require('../server/lib/normalizer');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

const createBackupStream = (trackRecord, cb) => {
  const downloadTrack = (_cb) => {
    const cb = _.once(_cb);

    
    tmp.file({ prefix: `${trackRecord.id}_`, postfix: '.mp3' }, (err, path) => {
      if (err) return cb(err);
      
      const fileWriteStream = fs.createWriteStream(path);

      request({
        url: trackRecord.getUrl(),
        headers: {
          'user-agent': 'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405'
        }
      })
        .on('error', (err) => {
          console.error('request error', err);
          return cb(err);
        })
        .pipe(fileWriteStream);

      fileWriteStream
        .on('finish', () => {
          console.log(`${trackRecord.id}: download finished`);
          cb(null, path);
        })
        .on('error', (err) => {
          console.log(`${trackRecord.id}: download error`);
          return cb(err);
        });
    });
  };

  const normalize = (cb, results) => {
    console.log(`${trackRecord.id}: normalizing`);
    normalizer(results.downloadTrack)
      .then(() => { cb(null); })
      .catch((err) => { cb(err); });
  };

  const uploadBackupStream = (cb, results) => {
    const path = results.downloadTrack;
    console.log(`${trackRecord.id}: uploading back`);

    fs.readFile(path, (err, data) => {
      if (err) return cb(err);

      const key = `${trackRecord._id.toString()}.mp3`;

      s3.putObject(
        {
          Bucket: 'mp3scbackup',
          Key: key,
          Body: data,
          ContentType: 'audio/mpeg'
        },
        (err) => {
          if (err) return cb(err);
          return cb(null);
        }
      );
    });
  };

  async.auto({
    downloadTrack,
    normalize: ['downloadTrack', normalize],
    uploadBackupStream: ['normalize', uploadBackupStream],
    save: ['uploadBackupStream', (cb) => {
      trackRecord.normalized = true;
      console.log(`${trackRecord.id}: saving`);
      trackRecord.save(cb);
    }]
  }, (err) => {
    if (err) {
      console.error(`track ${trackRecord.id} failed`, err.stack);
    }
    cb(null);
  });
};

const fetchTracks = (cb) => {
  models.SoundcloudSong.find({ normalized: { $ne: true } })
    .limit(30)
    .exec(cb);
};

let i = 0;

async.whilst(
  () => i < 50,

  (cb) => {
    i++;
    console.log('bulk ', i);
    fetchTracks((err, tracks) => {
      if (err) return cb(err);
      async.mapLimit(tracks, 10, createBackupStream, cb);
    });
  },
  (err, n) => {
    if (err) console.error(err.stack);
    models.disconnect();
  }
);
