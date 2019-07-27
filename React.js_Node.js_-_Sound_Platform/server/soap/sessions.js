'use strict';

const logger = require('../logger').smapi;

let models = require('../models');

exports.getSessionId = function(args, _cb) {
  let cb = function(args) {
    logger.debug('getSessionId Result:', args);
    _cb.apply(null, arguments);
  };
  let loginInvalid = {
    Fault: {
      faultcode: 'Client.LoginInvalid',
      faultstring: 'Login invalid'
    }
  };
  const unknownError = {
    Fault: {
      faultcode: 'Server.ServiceUnknownError',
      faultstring: 'Internal Server Error'
    }
  };

  const userExpired = {
    Fault: {
      faultcode: 'Client.LoginUnauthorized',
      faultstring: 'Account has expired'
    }
  };

  logger.debug('getSessionId Request:', args);

  if (!(args.username && args.password)) {
    return cb(loginInvalid);
  }

  models.User.findByUsername(args.username)
    .exec(function(err, user) {
      if (err || !user) {
        return cb(loginInvalid);
      }

      user.authenticate(args.password, (err, authenticated) => {
        if (err) return cb(unknownError);
        if (!authenticated) return cb(loginInvalid);
        if (user.expired) return cb(userExpired);
        cb({
          getSessionIdResult: user.generateJwt()
        });
      });
    });
};
