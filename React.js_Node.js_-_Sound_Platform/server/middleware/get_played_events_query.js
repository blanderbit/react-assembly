'use strict';

const moment = require('moment');
const _ = require('lodash');

const getPlayedEventsQuery = (req, res, next) => {
  const query = {};

  if (req.requestedUser) {
    query.user = req.requestedUser;
  }

  if (req.query.startDate && req.query.endDate) {
    const startMoment = moment(req.query.startDate);
    const endMoment = moment(req.query.endDate);

    if (startMoment.isValid() && endMoment.isValid() && endMoment.isAfter(startMoment)) {
      query.date = {
        $gte: startMoment.toDate(),
        $lte: endMoment.toDate()
      };
    }
  }

  if (!query.date) {
    res.status(400).json({ error: 'Date range is required' });
    return;
  }

  if (req.query.client) {
    query.client = _.isArray(req.query.client) ?
      { $in: req.query.client } :
      req.query.client;
  }

  req.playedEventsQuery = query;
  next(null);
};

module.exports = getPlayedEventsQuery;
