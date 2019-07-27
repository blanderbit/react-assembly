const express = require('express');

const browserDetection = require('../middleware/browserDetection');
const registerService = require('../services/register');

const { performRegister,
  TosNotAcceptedError,
  UserExistsError,
  CreateUserError,
  SendVerificationLinkError } = registerService;

const router = new express.Router();

const HOST = process.env.HOSTNAME;
if (!HOST) {
  throw new Error('process.env.HOSTNAME is not defined');
}

// GET /register - register form
function getRegister(req, res) {
  if (req.anonymousSessionLimitReached()) {
    req.flash('error', 'Guest session timed out, please register.');
  }
  res.render('register', {
    messages: req.flash()
  });
}

// POST /register - process form, return form
function postRegister(req, res) {
  const userEmail = (req.body.email || '').toLowerCase();
  const password = req.body.password;
  const company = req.body.company_name;
  const acceptTos = req.body.accept_tos;
  const acceptReceiveInfo = req.body.accept_receive_info;
  const firstName = req.body.first_name;
  const lastName = req.body.last_name;

  performRegister(userEmail, firstName, lastName, password, company, acceptTos, acceptReceiveInfo, req.expectedUserClass)
    .then(() => {
      res.message('You have been registered. Go check your email for email-verification link.', 'success');
    })
    .catch((err) => {
      if (err instanceof TosNotAcceptedError) {
        res.message('Terms & Conditions must be accepted', 'error', '/register');
        return;
      }

      if (err instanceof UserExistsError) {
        res.message(err.message, 'error', '/register');
        return;
      }

      if (err instanceof CreateUserError) {
        res.message(err.message, 'error', '/register');
        return;
      }

      if (err instanceof SendVerificationLinkError) {
        res.message('Failed to send an email confirmation link. Please contact support for help',
          'error',
          '/register');
        return;
      }

      res.message('Failed to create an account. Please contact support for help',
        'error',
        '/register');
    });
}

router.get('/', [
  browserDetection.ieCheck('info/ie')
], getRegister);

router.post('/', postRegister);

router.get('/confirmation', (req, res) => {
  res.render('register_confirmation');
});

module.exports = router;
