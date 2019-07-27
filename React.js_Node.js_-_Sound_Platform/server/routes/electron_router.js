'use strict';

const express = require('express');

const router = new express.Router();

const authMiddleware = require('../middleware/auth');
const browserDetection = require('../middleware/browserDetection');
const limitAnonymousSession = require('../middleware/limit_anonymous_session_time');

function allowElectronClientsOnly(req, res, next) {
  const ua = req.get('user-agent') || '';
  if (!/soundsuit-electron-/.test(ua)) {
    res.status(404).send();
    return;
  }
  next();
}

router.get(
  '/',
  browserDetection.ieCheck('info/ie'),
  browserDetection.mobileCheck('info/mobile'),
  allowElectronClientsOnly,
  authMiddleware.registerAnonymousIfRequired,
  authMiddleware.redirectUserByType,
  limitAnonymousSession(false),
  (req, res) => {
    res.render('electron-app', { user: req.user || {} });
  }
);

module.exports = router;
