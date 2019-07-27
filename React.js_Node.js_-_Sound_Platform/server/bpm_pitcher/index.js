'use strict';

const Promise = require('bluebird');

const logger = require('./logger');
const models = require('../models');
const processTrack = require('./process_single');

const mongoose = require('mongoose');

mongoose.Promise = Promise;

models.connect(process.env.MONGOLAB_URI);

const BATCH_NUM = 10;

const processBatch = (tracks, targetBpm) => {
  logger.info('Processing batch...');
  return Promise.map(tracks, (track) => processTrack(track, targetBpm), { concurrency: 3 });
};

const PITCH_MAPS = [
  {
    query: {
      bpm: { $gte: 88, $lte: 144 },
      tags: { $in: ['oldies', 'fitness_max'] }
    },
    pitchTo: 130
  },

  {
    query: {
      bpm: { $gte: 100, $lte: 128 },
      tags: { $in: ['oldies', 'fitness_mid', 'miami'] }
    },
    pitchTo: 120
  },

  {
    query: {
      bpm: { $gte: 80, $lte: 110 },
      tags: { $in: ['oldies', 'miami'] }
    },
    pitchTo: 100
  }
];

const pitchAccordingToMap = (map) => {
  logger.info(`Starting ${map.pitchTo} map...`);
  const query = Object.assign({}, {
    'pitched.bpm': { $ne: map.pitchTo },
    state: 'complete'
  }, map.query);

  return models.Track.find(query)
  .or([
    { type: 'Song' },
    { type: 'SoundcloudSong' }
  ])
  .exec()
  .then((tracks) => {
    const recurse = () => {
      logger.info(`Left ${tracks.length} to process`);
      if (tracks.length > 0) {
        return processBatch(tracks.splice(0, BATCH_NUM), map.pitchTo)
          .then(() => recurse());
      }
      return null;
    };

    return recurse();
  })
  .then(() => {
    logger.info(`Finished ${map.pitchTo} map`);
  });
};

const run = () => {
  Promise.each(PITCH_MAPS, (map) => pitchAccordingToMap(map))
    .catch((err) => {
      logger.error(err);
    })
    .finally(() => {
      logger.info('All maps completed');
      models.disconnect();
    });
};

module.exports = run;
