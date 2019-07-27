'use strict';

const logger = require('../logger').main;

function isAllowedToPlay(req, res, next) {
  if (req.user.isAbleToPlay) {
    next();
    return;
  }

  logger.info(`TRIAL_EXPIRED: ${req.user.email}`);
  res.status(498).send();
}

module.exports = isAllowedToPlay;
