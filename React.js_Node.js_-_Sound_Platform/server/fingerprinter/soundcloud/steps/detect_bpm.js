const genericStep = require('./generic_step');
const detector = require('../../../lib/bpm_detector');
const normalizer = require('../../../lib/normalizer');
const FingerprintError = require('../../fingerprint_error');
const Promise = require('bluebird');
const request = require('request');
const tmp = require('tmp');
const async = require('async');
const fs = require('fs');
const _ = require('lodash');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();

const detectBpm = (trackRecord) => {
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

  const detect = (cb, results) => {
    detector(results.downloadTrack, (err, bpm) => {
      if (err) return cb(err);
      trackRecord.detectedBpm = bpm;
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
          trackRecord.normalized = true;
          trackRecord.backup_url = key;
          return cb(null);
        }
      );
    });
  };

  async.auto({
    downloadTrack,
    detect: ['downloadTrack', detect],
    normalize: ['detect', normalize],
    uploadBackupStream: ['normalize', uploadBackupStream]
  }, (err) => {
    if (err) {
      const er = new FingerprintError(trackRecord.id, err.message);
      return dfd.reject(er);
    }
    return dfd.resolve(trackRecord);
  });

  return dfd.promise;
};

const buildWith = () => {
  const step = {
    name: 'Detect BPM',
    runWhen: ['id3TagsScanned'],
    updateTo: 'bpm-detected',
    run: detectBpm
  };

  genericStep.mixin.call(step);
  return step;
};

module.exports = {
  detectBpm,
  buildWith
};
