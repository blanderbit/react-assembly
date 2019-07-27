'use strict';

const express = require('express');

const {
  performPasswordReset,
  setNewPasswordByToken,
  UserNotFoundError
} = require('../../services/reset_password');

const router = new express.Router();

router.post('/', (req, res) => {
  const { email } = req.body;

  performPasswordReset(email, process.env.REACT_APP_URL)
    .then(() => {
      res.send();
    })
    .catch((err) => {
      if (err instanceof UserNotFoundError) {
        res.status(400).json({
          code: 'E_USER_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        code: 'E_INTERNAL_ERROR'
      });
    });
});

router.post('/password', (req, res) => {
  const { token, password, password_confirmation } = req.body;
  if (password_confirmation !== password) {
    res.status(400).json({
      code: 'E_PASSWORD_NOT_MATCH'
    });
    return;
  }

  setNewPasswordByToken(token, password)
    .then(() => {
      res.send();
    })
    .catch((err) => {
      if (err instanceof UserNotFoundError) {
        res.status(400).json({
          code: 'E_USER_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        code: 'E_INTERNAL_ERROR'
      });
    });
});

module.exports = router;
