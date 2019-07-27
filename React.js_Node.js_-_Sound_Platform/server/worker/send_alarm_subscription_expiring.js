'use strict';

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');

const logger = require('../logger').main;

module.exports = function (models, cb) {
  const checkIfAlreadySent = (user) => (
    models.SubscriptionExpiringEmailLog
      .findOne({
        user_id: user._id,
        paid_period_id: user.activePaidPeriod._id
      })
      .exec()
      .then((logEntry) => !!logEntry)
  );

  models.User
    .find({
      anonymous: { $ne: true },
      'paid_periods.0': { $exists: true }
    })
    .exec()
    .then((users) => {
      logger.info(`Found ${users.length} having paid periods`);
      return _.filter(users, 'hasActivePaidPeriod');
    })
    .then((users) => {
      logger.info(`Found ${users.length} having active paid periods`);
      return _.filter(users, (user) =>
        moment(user.activePaidPeriod.end).diff(moment(), 'days') < 30 &&
        user.activePaidPeriod === _.last(user.paid_periods)
      );
    })
    .then((users) => {
      return Promise.all(
        users.map((user) => (
          checkIfAlreadySent(user)
            .then((alreadySent) => {
              if (alreadySent) {
                logger.info(`${user.email}: email already sent`);
                return null;
              }
              const entry = new models.SubscriptionExpiringEmailLog({
                user_id: user._id,
                user_email: user.email,
                paid_period_id: user.activePaidPeriod._id,
                expiration_date: user.activePaidPeriod.end
              });

              logger.info(`Sending email about ${user.email} expiration`);

              return entry.send()
                .then(() => {
                  return entry.save();
                });
            })
        ))
      );
    })
    .then(() => {
      cb(null);
    })
    .catch((err) => {
      cb(err);
    });
};
