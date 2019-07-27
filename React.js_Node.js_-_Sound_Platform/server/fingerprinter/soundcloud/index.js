const Promise = require('bluebird');
const logger = require('winston');

require('../logging').configure();
const models = require('../../models');

models.connect(process.env.MONGOLAB_URI);

const prepareTracks = require('./prepare_tracks');

const prepareTasks = [
  prepareTracks.getBasicTracksInfo,
  prepareTracks.removeNonExisting,
  prepareTracks.rejectCompleted
];

const tasks = [
  require('./steps/detect_bpm').buildWith(),
  require('./steps/calculate_ultimate_track_details').buildWith()
];

module.exports = () => {
  prepareTasks.reduce((prevPromise, fn) => prevPromise.then(fn), Promise.resolve())
    .then(processBatch)
    .then(function() {
      logger.info('All done');
    })
    .catch(function(err) {
      logger.error(err.stack);
    })
    .finally(function() {
      models.disconnect();
    });
};

function processBatch(tracks) {
  logger.info('Left to process:', tracks.length);
  const currentBatch = take(tracks, 5); // take 5 songs to process per batch
  if (currentBatch.length === 0) {
    return Promise.resolve();
  }

  const currentBatchPromises = currentBatch.map(function(t) {
    return tasks.reduce(function(prev, current) {
      return prev.reflect().then(current.runStep.bind(current, t));
    }, Promise.resolve(t));
  });

  return Promise.all(currentBatchPromises).then(function() {
    logger.info('batch finished');
    return processBatch(tracks);
  });
}

function take(arr, count) {
  const res = [];
  for (let i = 0; i < count; i++) {
    if (arr.length) res.push(arr.shift());
  }
  return res;
}
