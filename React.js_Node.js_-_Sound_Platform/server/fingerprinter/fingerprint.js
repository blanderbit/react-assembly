const Promise = require('bluebird');

require('./logging').configure();
const logger = require('winston');

const models = require('../models');

const s3TracksList = require('./s3_tracks_list');
const prepareTracks = require('./prepare_tracks');

const MusicbrainzClient = require('./clients/musicbrainz_client');

const musicbrainzClient = new MusicbrainzClient();

const RdioClient = require('./clients/rdio_client');

const rdioClient = new RdioClient(process.env.RDIO_KEY, process.env.RDIO_SECRET);

const SpotifyClient = require('./clients/spotify_client');

const spotifyClient = new SpotifyClient();

const steps = [
  require('./steps/build_initial_track_info_step').buildWith(),
  require('./steps/read_id3_tags_step').buildWith(),
  require('./steps/detect_bpm').buildWith(),
  require('./steps/normalize_genres_step').buildWith(),
  require('./steps/musicbrainz_release_covers_step').buildWith(musicbrainzClient),
  require('./steps/musicbrainz_release_dates_step').buildWith(musicbrainzClient),
  require('./steps/rdio_release_details_step').buildWith(rdioClient),
  require('./steps/spotify_release_details_step').buildWith(spotifyClient),
  require('./steps/extract_filename_data_step').buildWith(),
  require('./steps/set_release_date_step').buildWith(),
  require('./steps/set_release_cover_image_step').buildWith(),
  // run as last step for all tracks for which processing is about to finish (complete, error)
  require('./steps/calculate_ultimate_track_details').buildWith()
];

function runFingerprinting() {
  logger.info('Running fingerprinting round...');
  Promise.resolve(s3TracksList())
    .then(prepareTracks.removeNonExisting)
    .then(prepareTracks.markAsNewOrExisting)
    .then(prepareTracks.rejectCompletedOrFailed)
    .then(prepareTracks.rejectUnrecognized)
    .then(processBatch)
    .catch((err) => {
      logger.info('Error while fingerprinting', err.stack);
    })
    .finally(scheduleNextRunIfNecessary);
}


function scheduleNextRunIfNecessary() {
  models.Song.countEligibleForProcessing((err, count) => {
    if (err) {
      logger.error('Could not determine records left for processing. Exiting...');
      models.disconnect();
      process.exit(1);
    }
    if (count) {
      logger.info('%d records left to process. Running next round...', count);
      return process.nextTick(runFingerprinting);
    }
    logger.info('No more records to process. Exiting...');
    models.disconnect();
    process.exit(0);
  });
}


function processBatch(tracks) {
  logger.info('Left to process:', tracks.length);
  const currentBatch = take(tracks, 5); // take 5 songs to process per batch
  if (currentBatch.length === 0) {
    return Promise.resolve();
  }

  const currentBatchPromises = currentBatch.map((t) => (
    steps
      .reduce(
        (prev, current) =>
          prev
            .reflect()
            .then(current.runStep.bind(current, t)),
        Promise.resolve()
      )
  ));

  return Promise.all(currentBatchPromises)
    .finally(() => processBatch(tracks));
}

function take(arr, count) {
  const res = [];
  for (let i = 0; i < count; i++) {
    if (arr.length) res.push(arr.shift());
  }
  return res;
}

module.exports = () => {
  models.connect(process.env.MONGOLAB_URI);
  runFingerprinting();
};
