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
const s3 = new AWS.S3({ params: { Bucket: 'mp3pitched' } });

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

let i = 0;

const bulkSize = 100;
let done = false;

async.whilst(
  () => !done,

  (cb) => {
    i++;
    console.log('bulk ', i);

    models.PitchedTrack.find({ state: 'complete' })
      .sort({ _id: -1 })
      .skip(i * bulkSize)
      .limit(bulkSize)
      .exec()
      .then((tracks) => {
        async.eachLimit(tracks, 10, (track, cb) => {
          s3.headObject({
            Key: track.file
          }, (err) => {
            if (err) { 
              console.log(track.id, track.file);
            }
            cb(null);
          });
        }, cb);
      })
      .catch(cb)
  },
  (err, n) => {
    if (err) console.error(err.stack);
    models.disconnect();
  }
);
