'use strict';

const async = require('async');

const models = require('../models');
const logger = require('../logger').main;

function initDb(cb) {
  models.connect(process.env.MONGOLAB_URI, cb);
}

const tasks = [
  { name: 'send_alarm_subscription_expiring', fn: require('./send_alarm_subscription_expiring') }
];

module.exports = function () {
  initDb((err) => {
    if (err) throw err;
    async.mapSeries(
      tasks,
      (task, cb) => {
        logger.info(`Starting task ${task.name}`);

        task.fn(models, (err) => {
          if (err) {
            logger.error(`Task ${task.name} failed:`, err);
          }
          cb(null);
        });
      },
      (err) => {
        if (err) {
          logger.error(`Worker failed:`, err);
        } else {
          logger.info('Worker finished');
        }
        models.disconnect();
      }
    );
  });
};
