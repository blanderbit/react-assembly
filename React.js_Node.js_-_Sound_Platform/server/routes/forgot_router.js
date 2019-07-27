'use strict';

const express = require('express');

const router = new express.Router();

const models = require('../models');

const {
  performPasswordReset,
  UserNotFoundError
} = require('../services/reset_password');

const HOST = process.env.HOSTNAME;
if (!HOST) {
  throw new Error('process.env.HOSTNAME is not defined');
}

router.get('/', (req, res) => {
  res.render('forgot_email', { messages: req.flash() });
});

router.use('/:token', (req, res, next) => {
  models.User.findOne({ token: req.params.token }, (er, user) => {
    if (er) {
      return res.message(er.message, 'error', '/forgot');
    }
    req.user = user;
    next();
  });
});

router.get('/:token', (req, res) => {
  if (!req.user) {
    return res.message('Verification code not found, please try again.', 'error', '/forgot');
  }
  res.render('forgot_password', { token: req.params.token, messages: req.flash() });
});

router.post('/', (req, res) => {
  const { email } = req.body;

  performPasswordReset(email)
    .then(() => {
      res.message('Email sent. Go check your email for a link to update your password.',
        'success',
        '/forgot');
    })
    .catch((err) => {
      if (err instanceof UserNotFoundError) {
        res.message('You have not been found in our records, please try again.',
          'error',
          '/forgot');
        return;
      }

      res.message('Something went wrong. Please try again later or contact support for help',
      'error',
      '/forgot');
      return;
    });
});

router.post('/:token', (req, res) => {
  if (!req.user) {
    return res.message('Token not found, please try again.', 'error', '/forgot');
  }

  req.user.verified = true;
  req.user.updateToken();

  req.user.setPassword(req.body.password, function (er, user) {
    if (er) {
      return res.message(er.message, 'error', '/forgot');
    }

    user.save((er, user) => {
      if (er) {
        return res.message(er.message, 'error', '/forgot');
      }
      return res.message('Your password has been updated.', 'success', '/login');
    });
  });
});

module.exports = router;
