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
          return cb(err);
        })
        .pipe(fileWriteStream);

      fileWriteStream
        .on('finish', () => {
          cb(null, path);
        })
        .on('error', (err) => {
          return cb(err);
        });
    });
  };

  const normalize = (cb, results) => {
    normalizer(results.downloadTrack)
      .then(() => { cb(null); })
      .catch((err) => { cb(err); });
  };

  const uploadBackupStream = (cb, results) => {
    const path = results.downloadTrack;

    fs.readFile(path, (err, data) => {
      if (err) return cb(err);

      s3.putObject(
        {
          Bucket: 'mp3normalized',
          Key: trackRecord.file,
          Body: data,
          ContentType: 'audio/mpeg'
        },
        (err) => {
          if (err) return cb(err);
          trackRecord.has_normalized = true;
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
      trackRecord.save(cb);
    }]
  }, cb);
};

const fetchTracks = (cb) => {
  models.Song.find({ has_normalized: { $ne: true } })
    .limit(20)
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
      async.map(tracks, createBackupStream, cb);
    });
  },
  (err, n) => {
    if (err) console.error(err.stack);
    models.disconnect();
  }
);
