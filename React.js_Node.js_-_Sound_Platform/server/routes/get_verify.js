'use strict';

const models = require('../models');
const subscribe = require('../mailing/subscription');

// GET /verify/:token - check token from email
module.exports = function getVerify(req, res) {
  models.User.findOneAndUpdate(
    { token: req.params.token },
    { verified: true },
    (er, user) => {
      if (er) {
        res.message(er.message, 'error', '/login');
        return;
      }
      if (!user) {
        res.message('Verification code not found.', 'error', '/login');
        return;
      }

      subscribe.subscribeToRegisteredUsersList(user, req.ip);

      res.message('You have been verified. Please login.', 'success', '/login');
    }
  );
};
