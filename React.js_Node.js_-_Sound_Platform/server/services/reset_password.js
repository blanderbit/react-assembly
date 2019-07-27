const Promise = require('bluebird');

const models = require('../models');
const logger = require('../logger').main;
const sendEmail = require('../email');

const HOST = process.env.HOSTNAME;
if (!HOST) {
  throw new Error('process.env.HOSTNAME is not defined');
}

class InternalError extends Error { }
class UserNotFoundError extends Error { }

function performPasswordReset(email, urlBase = HOST) {
  return new Promise((resolve, reject) => {
    models.User.findOne({ email }, (er, user) => {
      if (er) {
        logger.error(`Failed to find user ${email} in performPasswordReset:`, er);
        reject(new InternalError());
        return;
      }

      if (!user) {
        reject(new UserNotFoundError());
        return;
      }

      // reset the token
      user.updateToken();
      user.save((err) => {
        if (err) logger.error(`Failed to save user ${email} in performPasswordReset:`, err);
      });

      const options = {
        to: user.email,
        subject: `Reset your ${process.env.SITE_NAME} password`,
        template: 'forgot',
        account: user,
        urlbase: user.constructor.specialUserClass ? user.constructor.targetUrl : urlBase
      };

      sendEmail(options, (err) => {
        if (err) {
          logger.error(`Failed to send an email to ${email} in performPasswordReset:`, err);
          reject(new InternalError());
          return;
        }

        resolve();
      });
    });
  });
}
function setNewPasswordForUser(user, password) {
  return new Promise((resolve, reject) => {
    user.setPassword(password, (err, updatedUser) => {
      if (err) {
        logger.error(`Failed to set new password for ${user.id} in setNewPasswordForUser`, err);
        reject(new InternalError());
        return;
      }

      updatedUser.save((saveErr, savedUser) => {
        if (saveErr) {
          logger.error(`Failed to save ${user.id} in setNewPasswordForUser`, err);
          reject(new InternalError());
          return;
        }
        resolve(savedUser);
      });
    });
  });
}

function setNewPasswordByToken(token, password) {
  return models.User.findOne({ token })
    .catch((err) => {
      logger.error(`Failed to find user by token ${token} in setNewPasswordByToken:`, err);
      return Promise.reject(new InternalError());
    })
    .then((user) => {
      if (!user) {
        return Promise.reject(new UserNotFoundError());
      }

      user.verified = true;
      user.updateToken();

      return setNewPasswordForUser(user, password);
    });
}

exports.performPasswordReset = performPasswordReset;
exports.setNewPasswordByToken = setNewPasswordByToken;
exports.setNewPasswordForUser = setNewPasswordForUser;
exports.InternalError = InternalError;
exports.UserNotFoundError = UserNotFoundError;
