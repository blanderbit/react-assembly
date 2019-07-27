const Promise = require('bluebird');
const VError = require('verror').VError;

const models = require('../models');
const logger = require('../logger').main;
const email = require('../email');

class TosNotAcceptedError extends Error { }
class UserExistsError extends Error { }
class CreateUserError extends Error { }
class SendVerificationLinkError extends Error { }

const HOST = process.env.HOSTNAME;
if (!HOST) {
  throw new Error('process.env.HOSTNAME is not defined');
}

function performRegister(userEmail, firstName, lastName, password, companyName, acceptTos, acceptReceiveInfo,
  expectedUserClass, urlBase = HOST) {
  if (!acceptTos) {
    return Promise.reject(new TosNotAcceptedError());
  }

  const user = models.User.buildSelfRegister(
    companyName,
    userEmail,
    firstName,
    lastName,
    expectedUserClass.specialUserClass ?
      expectedUserClass :
      null,
    acceptReceiveInfo
  );

  return new Promise((resolve, reject) => {
    models.User.register(user, password, function (er, account) {
      if (er) {
        if (er.name === 'UserExistsError') {
          reject(new UserExistsError(er.message));
          return;
        }

        logger.error('Failed to register %s', userEmail, er);

        reject(new CreateUserError(er.message));
        return;
      }

      const emailOptions = {
        to: account.email,
        subject: `Verify your ${process.env.SITE_NAME} account`,
        template: 'register',
        urlbase: account.constructor.specialUserClass ? account.constructor.targetUrl : urlBase,
        account
      };

      email(emailOptions, function (err) {
        if (err) {
          logger.error(new VError(err, 'Failed to send confirmation email for %s:', account.email));
          reject(new SendVerificationLinkError(err.message));
          return;
        }

        resolve(account);
      });
    });
  });
}

exports.performRegister = performRegister;
exports.TosNotAcceptedError = TosNotAcceptedError;
exports.UserExistsError = UserExistsError;
exports.CreateUserError = CreateUserError;
exports.SendVerificationLinkError = SendVerificationLinkError;
