const Promise = require('bluebird');

require('./logging').configure();
const logger = require('winston');
const path = require('path');

require('node-env-file')(path.join(__dirname, '..', '..', '.env'));

const models = require('../models');

const s3TracksList = require('./s3_tracks_list');
const prepareTracks = require('./prepare_tracks');

const releaseCoverStep = require('./steps/set_release_cover_image_step').buildWith();

models.connect(process.env.MONGOLAB_URI);
logger.info('Forcing step run');
Promise.resolve(s3TracksList())
  .then(prepareTracks.removeNonExisting)
  .then(prepareTracks.markAsNewOrExisting)
  .then(prepareTracks.rejectUnrecognized)
  .then(processBatch.bind(null, releaseCoverStep))
  .catch((err) => {
    logger.info('Error while fingerprinting', err.stack);
  })
  .finally(() => {
    models.disconnect();
  });


function processBatch(step, tracks) {
  logger.info('Left to process:', tracks.length);
  const currentBatch = take(tracks, 5); // take 5 songs to process per batch
  if (currentBatch.length === 0) {
    return Promise.resolve();
  }

  const currentBatchPromises = currentBatch
    .map((t) => Promise.resolve(step.forceRunStep(t)).reflect());

  return Promise.all(currentBatchPromises)
    .finally(() => processBatch(step, tracks));
}

function take(arr, count) {
  const res = [];
  for (let i = 0; i < count; i++) {
    if (arr.length) res.push(arr.shift());
  }
  return res;
}
