'use strict';

const mongoose = require('mongoose');

const logger = require('../logger').main;

mongoose.Promise = require('bluebird');

const connect = (mongoUrl, cb) => {
  if (!mongoUrl) {
    throw new Error('MongoDB URL not provided');
  }
  mongoose.connect(mongoUrl, {
    useMongoClient: true
  });
  mongoose.connection.on('error', function (e) {
    logger.error('Mongoose error:', e);
  });
  process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
  if (cb) {
    cb();
  }
};

function gracefulExit() {
  disconnect(function(err) {
    process.exit(0);
  });
}

function disconnect (fn) {
  mongoose.disconnect(function(err) {
    if(err) return logger.error('Could not disconnect mongoose:', err);
    logger.info('Mongoose disconnected');
    if(typeof fn === 'function') return fn();
  });
}

module.exports.connect = connect;
module.exports.disconnect = disconnect;

module.exports.Genre = require('./Genre');
module.exports.Preset = require('./Preset');
module.exports.Song = require('./Song');
module.exports.SoundcloudSong = require('./SoundcloudSong');
module.exports.Track = require('./Track');
module.exports.PitchedTrack = require('./PitchedTrack');
module.exports.UnrecognizedSong = require('./UnrecognizedSong');
module.exports.User = require('./User');
module.exports.FitboxUser = require('./FitboxUser');
module.exports.MrssportyUser = require('./MrssportyUser');
module.exports.UserPlayEvent = require('./UserPlayEvent');
module.exports.TunerEvent = require('./TunerEvent');
module.exports.SearchAlgorithmPreset = require('./SearchAlgorithmPreset');
module.exports.EmailLog = require('./email_logs/EmailLog');
module.exports.SubscriptionExpiringEmailLog = require('./email_logs/SubscriptionExpiringEmailLog');
