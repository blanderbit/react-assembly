'use strict';

const _ = require('lodash');
const randy = require('randy');

const models = require('../models');
const queryBuilder = require('./query_builder');
const queryTuner = require('./query_tuner');
const loadSaPreset = require('../services/load_sa_preset');

const logger = require('../logger').main;

/**
 * Load songs using query provided
 * @param query query (previously fine tuned if required)
 * @return {promise} promise with songs
 */
function loadSongsUsingQuery(query) {
  return models.Track
    .find(query)
    .sort('-_id')
    .exec();
}

function runQueryBuilderRound(user, opts, saPreset) {
  return queryBuilder.buildQuery(user, opts, saPreset)
    .then((query) => (
      queryTuner(query, opts.count)
    ))
    .then((query) => loadSongsUsingQuery(query));
}


module.exports = function getMatchingSongsForUser(user, options) {
  const opts = Object.assign({
    count: 5,
    targetDate: new Date(),
    mood: 0,
    mostRecent: false,
    reject: []
  }, options || {});

  return loadSaPreset()
    .then((preset) => {
      return runQueryBuilderRound(user, opts, preset)
        .then((tracks) => {
          let result = [];

          let count = opts.count;

          if (opts.mostRecent) {
            const numMostRecent = Math.min(Math.floor(count / 2), tracks.length);
            const newTracks = tracks.slice(0, Math.min(tracks.length, numMostRecent * 10));
            result = randy.sample(newTracks, numMostRecent);
            count -= result.length;
          }

          randy.shuffleInplace(tracks);

          while (count > 0 && tracks.length) {
            result = result.concat(tracks.splice(0, count));
            result = _.uniqBy(result, 'artistName');
            count = opts.count - result.length;
          }

          if (count === 0) {
            return result;
          }

          return runQueryBuilderRound(
            user,
            Object.assign({}, opts, {
              reject: opts.reject.concat(result.map((track) => track.id)),
              count
            }),
            preset
          )
          .then((moreTracks) => {
            if (moreTracks.length) {
              return result.concat(randy.sample(moreTracks, Math.min(count, moreTracks.length)));
            }
            return result;
          })
          .then((list) => {
            if (list.length < opts.count) {
              logger.warn(`Got ${result.length} tracks instead of ${opts.count} requested`, {
                user: user.email
              });
            }

            return list;
          });
        });
    });
};
