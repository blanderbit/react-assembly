'use strict';

const passport = require('passport');
const models = require('../models');

const logger = require('../logger').main;

const requireAuthJSON = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (!req.user.anonymous && !req.user.verified) {
      return res.status(400).json({
        success: false,
        message: 'You have not been verified. Please check your email for the verification link.'
      });
    }

    return next();
  }

  return res.status(401).json({
    success: false,
    message: 'Not authorized'
  });
};

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  let message = 'Login is required.';
  if (req.isAuthenticated()) {
    if (!req.user.anonymous && !req.user.verified) {
      message = 'You have not been verified. Please check your email for the verification link.';
    } else {
      return next();
    }
  }
  return res.message(message, 'error', `/login?requested=${encodeURIComponent(req.url)}`);
};

const requireAdmin = (req, res, next) => {
  const message = 'Admin is required';
  if (req.user.admin) {
    return next();
  }
  return res.message(message, 'error', '/login');
};

const registerAnonymousIfRequired = (req, res, next) => {
  if (!req.isAuthenticated()) {
    logger.info('Got unauthed request, creating ', req.expectedUserClass.modelName);
    req.expectedUserClass.register(
      req.expectedUserClass.buildAnonymous(),
      models.User.anonymousPassword,
      (err, account) => {
        if (err) {
          logger.error('Error while creating anonymous user', err);
          return next(err);
        }
        req.session.startDate = new Date();
        req.body = req.body || {};
        req.body.email = account.email;
        req.body.password = models.User.anonymousPassword;
        return passport.authenticate('local')(req, res, next);
      }
    );
  } else {
    return next();
  }
};

function authWithToken(req, res, next) {
  passport.authenticate(
    'jwt',
    { session: false },
    (err, user) => {
      if (err) {
        next(err);
        return;
      }

      if (user) req.user = user;
      next(null);
    }
  )(req, res, next);
}

function redirectUserByType(req, res, next) {
  if (req.expectedUserClass.modelName !== req.user.constructor.modelName) {
    const url = req.user.constructor.targetUrl;
    req.logout();
    res.redirect(`${url}/login`);
    return;
  }

  next();
}

module.exports = {
  requiredJSON: requireAuthJSON,
  adminRequired: [requireAuth, requireAdmin],
  adminRequiredJSON: [requireAuthJSON, requireAdmin],
  requireAuth,
  authWithToken,
  registerAnonymousIfRequired,
  redirectUserByType
};
