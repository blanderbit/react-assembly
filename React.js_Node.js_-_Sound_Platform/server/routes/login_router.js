'use strict';

const express = require('express');
const passport = require('passport');

const browserDetection = require('../middleware/browserDetection');

const router = new express.Router();

// GET /login - login form
function getLogin(req, res) {
  if (req.isRegularUserSession()) {
    return res.redirect('/play');
  }
  return res.render('login', { messages: req.flash() });
}

// POST /login - process form, return form or redirect to /
function postLogin(req, res) {
  if (!req.user.verified) {
    req.logout();
    res.message(
      'You have not been verified. Please check your email for the verification link.',
      'error',
      '/login'
    );
    return;
  }
  if (req.user.expired) {
    req.logout();
    res.message('You account has expired.', 'error', '/login');
    return;
  }
  res.message('Logged in.', 'success', '/');
}

// setup routes
router.get('/', [
  browserDetection.ieCheck('info/ie')
],
  getLogin
);

router.post('/', passport.authenticate('local'), postLogin);

module.exports = router;
