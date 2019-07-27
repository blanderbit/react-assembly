'use strict';

const moment = require('moment');

const authMiddleware = require('../../middleware/auth');

const anonymousSessionDurationSeconds = require('../../dicts/anonymous_session')
  .ANONYMOUS_SESSION_DURATION_SECONDS;

module.exports = [
  authMiddleware.registerAnonymousIfRequired,

  function postAnonUser(req, res) {
    const user = req.user.toView();
    const options = req.user.getOptions();

    const anonData = req.user.anonymous ?
      {
        session_end: moment(req.user.created).add(anonymousSessionDurationSeconds, 's').toDate()
      } : null;

    res.send(
      Object.assign(
        {},
        user,
        {
          options
        },
        anonData
      )
    );
  }
];
