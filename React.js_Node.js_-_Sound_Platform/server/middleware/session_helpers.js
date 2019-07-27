const moment = require('moment');
const anonymousSessionDurationSeconds = require('../dicts/anonymous_session').ANONYMOUS_SESSION_DURATION_SECONDS;
const logger = require('../logger').main;

module.exports = function sessionHelpers(req, res, next) {
  req.isRegularUserSession = function () {
    return req.isAuthenticated() && req.user && !req.user.anonymous;
  };

  req.isAnonymousUserSession = function () {
    return req.isAuthenticated() && req.user && req.user.anonymous;
  };

  req.anonymousSessionLimitReached = function () {
    if (req.isAnonymousUserSession()) {
      const startDate = moment(req.user.created);
      startDate.add(anonymousSessionDurationSeconds, 's');
      const currentDate = moment();
      return currentDate.isAfter(startDate);
    }

    return false;
  };

  return next();
};
