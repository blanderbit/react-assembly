'use strict';

const FitboxUser = require('../models').FitboxUser;
const MrssportyUser = require('../models').MrssportyUser;
const User = require('../models').User;

module.exports = function detectAppVersion(req, res, next) {
  if (/mrssporty/i.test(req.hostname)) {
    req.expectedUserClass = MrssportyUser;
  } else if (/fitbox/i.test(req.hostname)) {
    req.expectedUserClass = FitboxUser;
  } else {
    req.expectedUserClass = User;
  }
  next();
};
