'use strict';

const fs = require('fs');
const Promise = require('bluebird');
const AWS = require('aws-sdk');

const logger = require('./logger');

const s3 = new AWS.S3();

exports.checkExistence = function checkExistence(key) {
  return new Promise((resolve, reject) => {
    s3.headObject({
      Bucket: 'mp3pitched',
      Key: key
    }, (err) => {
      if (err) {
        reject();
      } else {
        resolve();
      }
    });
  });
};

exports.uploadStream = function uploadStream(filePath, key) {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV !== 'production') {
      return reject('Uploading to s3 in non-production env is not allowed');
    }

    return fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);

      logger.info(`Uploading ${key}`);

      s3.putObject(
        {
          Bucket: 'mp3pitched',
          Key: key,
          Body: data,
          ContentType: 'audio/mpeg'
        },
        (err) => {
          if (err) return reject(err);
          resolve(filePath);
        }
      );
    });
  });
};
