'use strict';

const Promise = require('bluebird');
const SC = require('node-soundcloud');
const _ = require('lodash');
const async = require('async');

const models = require('../../models');
const logger = require('../logging').logger;

const soundCloudDict = require('../../dicts/soundcloud');

const artistAndTitleExtractor = require('./extract_title_and_artist');

const getTrackInstances = (playlist) => (
  playlist.tracks
    .filter((track) => {
      if (!(track.stream_url && track.streamable)) {
        logger.warn('Track %s from %s is not streamable',
          track.title, playlist.title);
        return false;
      }
      return true;
    })
    .map((track) => {
      const userName = _.get(track, 'user.username', '');
      const extractedData = artistAndTitleExtractor(track.title || '', userName);

      const hash = {
        soundcloud_id: track.id,
        soundcloud_title: track.title,
        soundcloud_user: userName,
        file: track.stream_url,
        title: extractedData.title,
        artistName: extractedData.artistName,
        releaseYear: track.release_year || (new Date(track.created_at)).getFullYear(),
        tags: soundCloudDict.getTags(playlist),
        bpm: track.bpm,
        providers: {
          title: track.title
        }
      };

      if (track.download_url) {
        hash.download_url = track.download_url;
      }

      if (track.duration) {
        hash.duration = Math.round(track.duration / 1000);
      }

      if (track.artwork_url) {
        hash.coverImage = track.artwork_url
          .replace(/-\w*?\.jpg/, '-t500x500.jpg')
          .replace(/^(http|https):/, '');
      }

      return new models.SoundcloudSong(hash);
    })
);

const getPlaylist = (playlistId) => {
  const dfd = Promise.defer();

  SC.init({
    id: process.env.SOUNDCLOUD_CLIENT_ID,
    secret: process.env.SOUNDCLOUD_CLIENT_SECRET
  });

  SC.get(`/playlists/${playlistId}`, (err, results) => {
    if (err) return dfd.reject(err);
    dfd.resolve(results);
  });

  return dfd.promise;
};

const getBasicTracksInfo = () => (
  Promise.all(soundCloudDict.PLAYLIST_IDS.map(getPlaylist))
    .then((playlists) => (
      playlists.map(getTrackInstances)
        .reduce((a, b) => a.concat(b), [])
    ))
    .then((allTracks) => {
      logger.info('Total %d tracks in the playlists', allTracks.length);
      const groupedTracks = _.groupBy(allTracks, 'soundcloud_id');

      const result = [];
      Object.keys(groupedTracks)
        .forEach((soundCloudId) => {
          const bulk = groupedTracks[soundCloudId];
          const ref = _.first(bulk);
          ref.tags = _(bulk)
            .map('tags')
            .flattenDeep()
            .uniq()
            .value();
          result.push(ref);
        });

      logger.info(`Got ${result.length} after grouping by soundcloud_id`);
      return result;
    })
);

const rejectCompleted = (tracks) => {
  const dfd = Promise.defer();

  logger.info('Looking for matching tracks in the DB and rejecting already completed');
  async.map(tracks,
    (track, cb) => {
      models.SoundcloudSong.findOne({
        soundcloud_id: track.soundcloud_id
      })
      .exec((err, matchingRecord) => {
        if (err) return cb(err);
        if (matchingRecord) {
          if (track.duration > matchingRecord.duration) {
            matchingRecord.duration = track.duration;
            matchingRecord.state = '';
            logger.info('Re-fingerprinting %s', matchingRecord.id);
            return matchingRecord.save(cb);
          }
          return cb(null, matchingRecord);
        }
        cb(null, track);
      });
    },

    (err, tracksWithMatch) => {
      if (err) return dfd.reject(err);

      dfd.resolve(
        tracksWithMatch
          .filter((track) => {
            if (track.duration > 120) return true;
            if (!track.isNew) {
              logger.info('Removing track %s as too short', track.id);
              track.remove(_.noop);
            }
            return false;
          })
          .filter((track) => (
            !(track.state === 'complete' || track.state === 'deleted' || track.state === 'error')
          ))
      );
    });

  return dfd.promise;
};

const removeNonExisting = (tracks) => {
  const dfd = Promise.defer();

  if (tracks.length < 1000) {
    logger.info('Got less than 1000 tracks, not removing anything');
    return Promise.resolve(tracks);
  }

  models.SoundcloudSong.update(
    { soundcloud_id: { $nin: _.map(tracks, 'soundcloud_id') }, state: 'complete' },
    { state: 'deleted' },
    { multi: true }
  )
  .exec((err, writeOpResult) => {
    const nRemoved = _.get(writeOpResult, 'nModified', 'n/a');
    if (err) return dfd.reject(err);
    logger.info('Removed %s that exist in the DB but missing in playlists', nRemoved);
    dfd.resolve(tracks);
  });
  return dfd.promise;
};

module.exports = {
  getBasicTracksInfo,
  rejectCompleted,
  removeNonExisting
};
