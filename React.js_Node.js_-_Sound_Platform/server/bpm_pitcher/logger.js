'use strict';

const winston = require('winston');
const path = require('path');
const moment = require('moment');

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: () => moment().format('YYYY/MM/DD | HH:mm:ss.SSS'),
      handleExceptions: true,
      humanReadableUnhandledException: true,
      prettyPrint: true,
      stderrLevels: ['error', 'warn']
    }),
    new winston.transports.File({
      filename: path.join(__dirname, './logs/pitcher.log'),
      maxsize: 1024 * 1000 * 5,
      maxFiles: 3,
      json: false
    })
  ]
});
