'use strict';

const models = require('../models');
const logger = require('../logger').main;
const tuneFn = require('./tune_fn');
const createTunerEvent = require('../services/event_reporters').createTunerEvent;

/**
 * Take query and count how many songs it returns
 * @param query
 * @return {*} promise resolved with count of matching songs
 */
function countMatchingSongs(query) {
  return models.Track.count(query).exec();
}

/**
 * Tune query to make it returning at least required number of songs
 * @param query base query to be fine tuned if necessary
 * @param requiredCount number of songs query needs to return
 * @return {*} query that, when executed, returns required number of songs
 */
function tuneQuery(query, requiredCount) {
  let i = 0;

  const interateWithRecurse = (q) => (
    countMatchingSongs(q)
      .then((count) => {
        createTunerEvent({
          fulfilled: count >= requiredCount,
          query: q,
          attempt: i,
          requiredCount,
          count
        });

        if (count >= requiredCount) {
          logger.debug(`QUERY TUNER: enough songs (${count})`);
          return q;
        }

        if (i === 3) {
          logger.debug('QUERY TUNER: Max finetuning count reached returning query');
          return q;
        }

        i++;
        logger.debug(`QUERY TUNER: not enough songs (${count}), fine tuning query`);
        return interateWithRecurse(tuneFn(q));
      })
  );

  return interateWithRecurse(query);
}

module.exports = tuneQuery;
