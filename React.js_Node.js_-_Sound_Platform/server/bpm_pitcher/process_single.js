'use strict';

const pitcher = require('../lib/pitcher');
const normalizer = require('../lib/normalizer');
const uploadStream = require('./s3_processor').uploadStream;
const checkExistence = require('./s3_processor').checkExistence;
const models = require('../models');
const _ = require('lodash');
const Promise = require('bluebird');

const logger = require('./logger');

module.exports = function processTrack(track, targetBpm) {
  const key = `${track.id}_${targetBpm}.mp3`;
  logger.info('Processing track ', track.id, track.displayName);

  const updateDbRecords = () => {
    const pitchedTrack = new models.PitchedTrack(
      Object.assign(
        {},
        _.omit(track.toObject(), '_id', 'id', 'type'),
        {
          original_type: track.type,
          bpm: targetBpm,
          original: track,
          file: key,
          duration: track.duration ? _.round(track.duration * track.bpm / targetBpm) : null
        }
      )
    );

    track.pitched.push({
      bpm: targetBpm,
      track: pitchedTrack
    });

    return Promise.all([pitchedTrack.save(), track.save()]);
  };

  const performProcessing = () => (
    track.downloadToTmp()
      .then((path) => {
        logger.info('Pitching...');
        return pitcher(path, _.round(targetBpm / track.bpm, 3));
      })
      .then((path) => {
        logger.info('Normalizing...');
        return normalizer(path);
      })
      .then((pitchedPath) => {
        logger.info('Uploading...');
        return uploadStream(pitchedPath, key);
      })
  );

  return checkExistence(key)
    .then(() => {
      logger.info(`Key ${key} already exists, skip analyzing`);
    })
    .catch(performProcessing)
    .then(updateDbRecords)
    .then(() => {
      logger.info('Finished processing', track.id, track.displayName);
    });
};
