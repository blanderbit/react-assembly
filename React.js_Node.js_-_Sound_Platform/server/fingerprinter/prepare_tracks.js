const Promise = require('bluebird');
const _ = require('lodash');
const logger = require('./logging').logger;
const { Song, UnrecognizedSong } = require('../models');
const TrackToProcess = require('./track_to_process');

function removeNonExisting(existingTracksFileNames) {
  const dfd = Promise.defer();
  const query = { 'file': { '$nin': existingTracksFileNames } };
  Song.remove(query, function(err, writeOpResult) {
    let nRemoved = _.get(writeOpResult, 'result.n', 'n/a');
    if(err) return dfd.reject(err);
    logger.info('Removed %d track records that no longer exist on S3', nRemoved);
    dfd.resolve(existingTracksFileNames);
  });
  return dfd.promise;
}

function markAsNewOrExisting(incomingFileNames) {
  return Promise.resolve(loadExistingTracksInfo()).then(function(existingTracksInfo) {
    logger.info('Incoming files to process: %d, existing tracks in DB: %d', incomingFileNames.length, existingTracksInfo.length);
    return incomingFileNames.map(function(f) {
      const trackInfo = { file: f, isNew: true };
      const existing = _.find(existingTracksInfo, function(t) {
        return t.file === f;
      });
      if(existing) {
        trackInfo.isNew = false;
        trackInfo.state = existing.state;
      }
      return new TrackToProcess(trackInfo);
    });
  });
}

function rejectCompletedOrFailed(tracksToProcess) {
  const processableTracks = tracksToProcess.filter((t) => t.isProcessable());

  logger.info('Got %d processable tracks', processableTracks.length);

  return processableTracks;
}

function rejectUnrecognized(tracksToProcess) {
  logger.info('Rejecting unrecognized tracks from being processed again');
  return Promise.resolve(loadUnrecognizedTracks()).then(function(unrecognizedTracks) {
    return tracksToProcess.filter(function(ttp) {
      const shouldBeRejected = _.includes(unrecognizedTracks, ttp.file);
      if (shouldBeRejected) {
        logger.warn('Rejecting %s as unrecognized', ttp.file);
      }
      return !shouldBeRejected;
    });
  })
}

function loadExistingTracksInfo() {
  const dfd = Promise.defer();
  Song
    .find()
    .select('file state')
    .lean()
    .exec(function(err, found) {
      if(err) return dfd.reject(err);
      dfd.resolve(found);
    });

  return dfd.promise;
}

function loadUnrecognizedTracks() {
  const dfd = Promise.defer();
  UnrecognizedSong.find({}, 'file', function(err, found) {
    if(err) return dfd.reject(err);
    const files = found.map(function(f) { return f.file; });
    dfd.resolve(files);
  });
  return dfd.promise;
}

module.exports = {
  removeNonExisting,
  markAsNewOrExisting,
  rejectCompletedOrFailed,
  rejectUnrecognized
};
