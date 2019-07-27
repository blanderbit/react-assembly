'use strict';

const winston = require('winston');
const moment = require('moment');

const mainLogger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      timestamp: () => moment().format('YYYY/MM/DD | HH:mm:ss.SSS'),
      handleExceptions: true,
      humanReadableUnhandledException: true,
      prettyPrint: true,
      stderrLevels: ['error', 'warn']
    })
  ]
});

const smapiLogger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      timestamp: () => moment().format('YYYY/MM/DD | HH:mm:ss.SSS') +
        ' | SMAPI:',
      level: 'info',
      prettyPrint: true,
      stderrLevels: ['error', 'warn']
    })
  ]
});

module.exports = {
  main: mainLogger,
  smapi: smapiLogger
};
