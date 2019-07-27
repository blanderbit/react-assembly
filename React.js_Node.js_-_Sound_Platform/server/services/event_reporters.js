'use strict';

const TunerEvent = require('../models').TunerEvent;
const logger = require('../logger').main;
const _ = require('lodash');

const MIN_COUNT_TO_SAVE_QUERY = 30;

const filterQuery = (query) => {
  if (!query) return query;
  try {
    return JSON.parse(JSON.stringify(query.$and).replace(/"\$/g, '"_'));
  } catch (e) {
    logger.warn('Failed to filter query for TunerEvent', query, e);
    return null;
  }
};

exports.createTunerEvent = (opts) => {
  _.defaults(opts, {
    count: 0
  });

  return TunerEvent.create(
    Object.assign({}, opts, {
      query: opts.count < MIN_COUNT_TO_SAVE_QUERY ? filterQuery(opts.query) : null
    }
  ))
  .catch((err) => {
    logger.warn('Failed to create TunerEvent', err);
  });
};
