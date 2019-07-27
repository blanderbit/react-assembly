'use strict';

const genericStep = require('./generic_step');
const bpmDetector = require('../../lib/bpm_detector');
const normalizer = require('../../lib/normalizer');
const durationDetector = require('../../lib/duration_detector');
const Promise = require('bluebird');
const request = require('request');
const tmp = require('tmp');
const async = require('async');
const fs = require('fs');
const _ = require('lodash');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const detectDurationAndBpm = (trackInfo, trackRecord) => {
  const dfd = Promise.defer();

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

  const detectBpm = (cb, results) => {
    bpmDetector(results.downloadTrack, (err, bpm) => {
      if (err) return cb(err);
      trackRecord.detectedBpm = bpm;
      return cb(null);
    });
  };

  const detectDuration = (cb, results) => {
    durationDetector(results.downloadTrack, (err, duration) => {
      if (err) return cb(err);
      trackRecord.duration = duration;
      return cb(null);
    });
  };

  const normalize = (cb, results) => {
    normalizer(results.downloadTrack)
      .then(() => { cb(null); })
      .catch((err) => { cb(err); });
  };

  const uploadBackupStream = (cb, results) => {
    if (process.env.NODE_ENV !== 'production') {
      cb(null);
      return;
    }

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
    downloadTrack: downloadTrack,
    detectBpm: ['normalize', detectBpm],
    normalize: ['downloadTrack', normalize],
    detectDuration: ['normalize', detectDuration],
    uploadBackupStream: ['normalize', uploadBackupStream]
  }, (err) => {
    if (err) return dfd.reject(err);
    return dfd.resolve(trackRecord);
  });

  return dfd.promise;
};

const buildWith = () => {
  const step = {
    name: 'Detect BPM',
    runWhen: ['id3TagsScanned'],
    updateTo: 'bpm-detected',
    run: detectDurationAndBpm
  };

  genericStep.mixin.call(step);
  return step;
};

module.exports = {
  detectDurationAndBpm,
  buildWith
};
