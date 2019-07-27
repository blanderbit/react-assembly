'use strict';

const express = require('express');

const router = new express.Router();

const authMiddleware = require('../middleware/auth');
const browserDetection = require('../middleware/browserDetection');
const limitAnonymousSession = require('../middleware/limit_anonymous_session_time');

router.get(
  '/',
  browserDetection.ieCheck('info/ie'),
  browserDetection.setMobileFlag,
  authMiddleware.registerAnonymousIfRequired,
  authMiddleware.redirectUserByType,
  limitAnonymousSession(false),
  (req, res) => {
    res.render('play', {
      user: req.user || {},
      isMobile: req.isMobile
    });
  }
);

module.exports = router;
