'use strict';

const request = require('request');
const Throttle = require('throttle');
const _ = require('lodash');
const async = require('async');
const express = require('express');

const router = new express.Router();

const models = require('../models');

const loadMatchingUserSongs = require('../music_selection');

const requestOpts = {};

if (process.env.STATIONS_PROXY) {
  requestOpts.proxy = process.env.STATIONS_PROXY;
}

const requestInstance = request.defaults(requestOpts);
const logger = require('../logger').main;

const getStationStream = (req, res) => {
  const stationId = req.params.stationId;

  if (!stationId) {
    res.status(400).json({ message: 'stationId is missing' });
    return;
  }

  let requestHasBeenClosed = false;

  const cancelPlaying = () => { requestHasBeenClosed = true; };
  const hasActiveClient = () => !requestHasBeenClosed;

  req
    .on('close', cancelPlaying)
    .on('end', cancelPlaying);

  let user;

  res.append('Content-Type', 'audio/mpeg');

  const playContinuously = (cb) => {
    const playTrack = (track, _cb) => {
      const cb = _.once(_cb);
      let bitrate;

      if (track.constructor.modelName === 'SoundcloudSong') {
        bitrate = 128 * 1000;
        // console.log('Bitrate is %s (Soundcloud)', bitrate);
      } else if (track.providers.bitrate) {
        bitrate = track.providers.bitrate * 1000;
        // console.log('Bitrate is %s (providers.bitrate)', bitrate);
      } else {
        bitrate = 320 * 1000;
        // console.log('Bitrate is %s (default)', bitrate);
      }

      const throttle = new Throttle(bitrate / 10 *
        (parseFloat(process.env.BITRATE_MULTIPLIER) || 1.4));

      const readStream = requestInstance(track.getUrl());

      // calculated track duration in ms
      let duration;
      let firstChunkServed;

      readStream
        .on('response', (response) => {
          if (response.headers['x-amz-meta-duration']) {
            duration = parseInt(response.headers['x-amz-meta-duration'], 10);
          } else {
            duration = Math.floor((parseInt(response.headers['content-length'], 10) * 8) /
              bitrate * 1000);
          }
        })
        .pipe(throttle)
        .on('error', cb)
        .on('data', (chunk) => {
          if (!firstChunkServed) {
            firstChunkServed = Date.now();
            user.addToLastPlayed(track);

            const event = new models.UserPlayEvent({
              user: user,
              trackName: track.displayName,
              trackId: track._id,
              trackType: track.constructor.modelName,
              client: 'stream'
            });

            event.save((err) => {
              if (err) {
                // TODO: logger
                console.error('Failed to save UserPlayEvent: \n', err.stack);
              }
            });
          }

          if (hasActiveClient()) {
            res.write(chunk);
          }
        })
        .on('end', () => {
          const msSpentServing = Date.now() - firstChunkServed;
          // console.log('Finished serving track. Spent %s seconds. Duration of track is %s.',
            // msSpentServing / 1000, duration / 1000);

          if (duration - msSpentServing < 10000) {
            cb(null);
          } else {
            setTimeout(() => cb(null), duration - msSpentServing - 10000);
          }
        });
    };

    loadMatchingUserSongs(user, { count: 1 })
      .then((tracks) => playTrack(tracks[0], cb))
      .catch(cb);
  };

  models.User.where({ station_id: stationId }).findOne()
    .exec((err, _user) => {
      if (err) {
        logger.error(err);
        res.status(500).send();
        return;
      }

      if (!_user) {
        res.status(404).json({ message: 'Station not found' });
        return;
      }

      user = _user;

      async.whilst(
        hasActiveClient,
        playContinuously,
        (err) => {
          if (err) {
            logger.error(`Station player (${stationId}): `, err);
            req.socket.destroy();
          }

          logger.info(`Station player (${stationId}): client has gone`);
        }
      );
    });
};

router.get('/:stationId', getStationStream);

module.exports = router;
