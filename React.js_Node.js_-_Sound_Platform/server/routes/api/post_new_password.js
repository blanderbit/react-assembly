'use strict';

const _ = require('lodash');

module.exports = function postNewPassword(req, res) {
  if (!req.user) {
    res.status(401).send();
    return;
  }

  const newPassword = _.get(req.body, 'password');
  if (!newPassword) {
    res.status(400).send();
    return;
  }

  req.user.authenticate(
    _.get(req.body, 'oldPassword'),
    (err, auth, authError) => {
      if (!auth && authError) {
        res.status(400).send({ error: authError.message });
        return;
      }
      if (!auth) {
        res.status(400).send({ error: 'Something went wrong. Please try again later.' });
        return;
      }
      req.user.setPassword(newPassword, () => {
        req.user.save(() => {
          res.json({
            message: 'Password has been changed!'
          });
        });
      });
    }
  );
};
