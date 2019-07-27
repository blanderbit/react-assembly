'use strict';

let _ = require('lodash');
let Promise = require('bluebird');

let logger = require('../logger').smapi;

let models = require('../models');
let loadMatchingUserSongs = require('../music_selection');

const INVALID_SESSION = {
  Fault: {
    faultcode: 'Client.SessionIdInvalid',
    faultstring: 'SessionId is invalid'
  }
};

const TRIAL_EXPIRED = {
  Fault: {
    faultcode: 'Client.LoginUnauthorized',
    faultstring: 'Trial period has expired'
  }
};

const PROGRAM_ID = 'Soundsuit';

const NUM_TRACKS_PER_REQ = 5;

let trackToMetadata = function(track) {
  return {
    id: track.id,
    mimeType: 'audio/mp3',
    title: track.displayName,
    itemType: 'track',
    trackMetadata: {
      artist: track.artistName || 'Not yet defined',
      duration: track.duration,
      canPlay: true,
      canSkip: true,
      albumArtURI: encodeURI('http:' + track.coverImage)
    }
  };
};

let getSongById = function(songId) {
  var collections = ['Song', 'SoundcloudSong', 'PitchedTrack'];

  var promises = collections.map((collection) => (
    new Promise((resolve, reject) => {
      models[collection]
        .findById(songId)
        .exec((err, song) => {
          if (err) {
            return reject(err);
          }

          resolve(song);
        });
    })
  ));

  return Promise.all(promises)
    .then(function(songs) {
      return _.first(_.compact(songs)) || null;
    });
};

let authenticate = function(headers, cb) {
  let sessionId = _.get(headers, 'credentials.sessionId');

  if (!sessionId) {
    return cb(new Error('Invalid session id'));
  }

  models.User.getByJwt(sessionId, function(err, user) {
    if (err) {
      logger.error(err);
      return cb(err);
    }

    if (!user) {
      logger.warn('authentication: no user found for', sessionId);
    } else {
      logger.debug(`authenticated request for: email=${user.email} id=${user.id}`);
    }

    cb(null, user);
  });
};

exports.getMetadata = function(args, _cb, headers) {
  let cb = function(args) {
    logger.debug('getMetadata Result:', args);
    _cb.apply(null, arguments);
  };

  logger.debug('getMetadata Request:', args);

  const ROOT_METADATA = {
    index: 0,
    count: 1,
    total: 1,
    mediaCollection: [{
      id: PROGRAM_ID,
      itemType: 'program',
      displayType: 'List',
      title: 'Soundsuit channel',
      canPlay: true,
      canEnumerate: true,
      canSkip: true
    }]
  };

  authenticate(headers, function(err, user) {
    if (err || !user) {
      return cb(INVALID_SESSION);
    }

    if (!user.isAbleToPlay) {
      logger.info(`TRIAL_EXPIRED: ${user.email}`);
      return cb(TRIAL_EXPIRED);
    }

    if (args.id === 'root') {
      return cb({
        getMetadataResult: ROOT_METADATA
      });
    }

    if (args.id === PROGRAM_ID) {
      loadMatchingUserSongs(user, {count: NUM_TRACKS_PER_REQ})
        .then(function(tracks) {
          user.addToLastPlayed(tracks);

          cb({
            getMetadataResult: {
              index: 0,
              count: tracks.length,
              total: tracks.length,
              mediaMetadata: tracks.map(trackToMetadata)
            }
          });
        })
        .catch((err) => {
          logger.error('getMetadata failed: ', err);
          cb({
            Fault: {
              faultcode: 'Server.ServiceUnknownError',
              faultstring: 'Failed to load songs to play'
            }
          });
        });
    }
  });
};

exports.getMediaMetadata = function(args, _cb, headers) {
  let cb = function(args) {
    logger.debug('getMediaMetadata Result:', args);
    _cb.apply(null, arguments);
  };

  logger.debug('getMediaMetadata Request:', args);

  authenticate(headers, function(err, user) {
    if (err || !user) {
      return cb(INVALID_SESSION);
    }

    if (!user.isAbleToPlay) {
      logger.info(`TRIAL_EXPIRED: ${user.email}`);
      return cb(TRIAL_EXPIRED);
    }

    getSongById(args.id)
      .then((track) => {
        if (!track) {
          return cb({
            Fault: {
              faultcode: 'Server.ServiceUnknownError',
              faultstring: `Failed to query songs with id ${args.id}`
            }
          });
        }

        cb({
          getMediaMetadataResult: trackToMetadata(track)
        });
      });
  });

};

exports.getExtendedMetadata = function(args, _cb, headers) {
  let cb = function(args) {
    logger.debug('getExtendedMetadata Result:', args);
    _cb.apply(null, arguments);
  };

  logger.debug('getExtendedMetadata Request:', args);

  authenticate(headers, function(err, user) {
    if (err || !user) {
      return cb(INVALID_SESSION);
    }

    if (!user.isAbleToPlay) {
      logger.info(`TRIAL_EXPIRED: ${user.email}`);
      return cb(TRIAL_EXPIRED);
    }

    getSongById(args.id)
      .then((track) => {
        if (!track) {
          return cb({
            Fault: {
              faultcode: 'Server.ServiceUnknownError',
              faultstring: `Failed to query songs with id ${args.id}`
            }
          });
        }

        cb({
          getExtendedMetadataResult: {
            mediaMetadata: trackToMetadata(track)
          }
        });
      });
  });

};

exports.getMediaURI = function(args, _cb, headers) {
  let cb = function(args) {
    logger.debug('getMediaURI Result:', args);
    _cb.apply(null, arguments);
  };

  logger.debug('getMediaURI Request:', args);

  authenticate(headers, function(err, user) {
    if (err || !user) {
      return cb(INVALID_SESSION);
    }

    if (!user.isAbleToPlay) {
      logger.info(`TRIAL_EXPIRED: ${user.email}`);
      return cb(TRIAL_EXPIRED);
    }

    getSongById(args.id)
      .then((song) => {
        if (!song) {
          return cb({
            Fault: {
              faultcode: 'Server.ServiceUnknownError',
              faultstring: `Failed to query songs with id ${args.id}`
            }
          });
        }

        const playEvent = new models.UserPlayEvent({
          user: user._id,
          trackName: song.displayName,
          trackId: song._id,
          trackType: song.constructor.modelName,
          client: 'sonos'
        });

        playEvent.save((err) => {
          if (err) {
            logger.error(`Failed to save UserPlayEvent for ${user.id}:`, err);
          }
        });

        cb({
          getMediaURIResult: song.getUrl()
        });
      })
      .catch((err) => {
        logger.err(`getMediaURI failed for ${user.id}:`, err);
        return cb({
          Fault: {
            faultcode: 'Server.ServiceUnknownError',
            faultstring: `Failed to query song with id ${args.id}`
          }
        });
      });
  });
};

exports.getLastUpdate = function(args, _cb, headers) {
  let cb = function(args) {
    logger.debug('getLastUpdate Result:', args);
    _cb.apply(null, arguments);
  };

  logger.debug('getLastUpdate Request:', args);

  authenticate(headers, function(err, user) {
    if (err || !user) {
      return cb(INVALID_SESSION);
    }

    if (!user.isAbleToPlay) {
      logger.info(`TRIAL_EXPIRED: ${user.email}`);
      return cb(TRIAL_EXPIRED);
    }

    cb({
      getLastUpdateResult: {
        favorites: 0,
        catalog: 0,
        pollInterval: 86400
      }
    });
  });
};
