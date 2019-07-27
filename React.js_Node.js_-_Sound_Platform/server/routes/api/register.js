'use strict';

const express = require('express');

const registerService = require('../../services/register');

const models = require('../../models');
const subscribe = require('../../mailing/subscription');
const logger = require('../../logger').main;

const { performRegister,
  TosNotAcceptedError,
  UserExistsError,
  CreateUserError,
  SendVerificationLinkError } = registerService;

const router = new express.Router();

router.post('/', (req, res) => {
  const userEmail = (req.body.email || '').toLowerCase();
  const password = req.body.password;
  const company = req.body.company_name;
  const acceptTos = req.body.accept_tos;
  const acceptReceiveInfo = req.body.accept_receive_info;
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;

  performRegister(userEmail, firstName, lastName, password, company, acceptTos, acceptReceiveInfo, req.expectedUserClass,
    process.env.REACT_APP_URL)
    .then(() => {
      res.send();
    })
    .catch((err) => {
      if (err instanceof TosNotAcceptedError) {
        res.status(400).json({
          code: 'E_TOS_NOT_ACCEPTED'
        });
        return;
      }

      if (err instanceof UserExistsError) {
        res.status(400).json({
          code: 'E_USER_EXIST'
        });
        return;
      }

      if (err instanceof CreateUserError) {
        res.status(500).json({
          code: 'E_CREATE_USER'
        });
        return;
      }

      if (err instanceof SendVerificationLinkError) {
        res.status(500).json({
          code: 'E_SEND_EMAIL'
        });
        return;
      }

      res.status(500).json({
        code: 'E_CREATE_USER'
      });
    });
});

router.post('/verify_token/:token', (req, res) => {
  models.User.findOneAndUpdate(
    { token: req.params.token },
    { verified: true },
    (er, user) => {
      if (er) {
        res.status(500).json({
          code: 'E_INTERNAL_ERROR'
        });
        return;
      }

      if (!user) {
        res.status(400).json({
          code: 'E_USER_NOT_FOUND'
        });
        return;
      }

      if (process.env.NODE_ENV === 'production') {
        subscribe.subscribeToRegisteredUsersList(user, req.ip);
      }

      user.updateToken();
      user.save((err) => {
        if (err) logger.error(`Failed to save user ${user.email} after token update:`, err);
      });

      res.send();
    }
  );
});

module.exports = router;
