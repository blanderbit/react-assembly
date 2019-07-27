'use strict';

const express = require('express');

const subscribe = require('../mailing/subscription');
const validator = require('validator');
const email = require('../email');

const router = new express.Router();

router.post('/subscribe', subscribeToMailingList);
router.post('/contact', sendContactEmail);

function subscribeToMailingList(req, res) {
  var email = req.body.email;
  if(!validator.isEmail(email)) {
    return res.status(400).send({ error: 'Invalid email format' });
  }
  return res.promise(subscribe.subscribeToLandingPageList(email));
}

function contactFormValid(req) {
  return validator.isEmail(req.body.authorEmail) && req.body.authorName  && req.body.message;
}

function sendContactEmail(req, res) {
  if(!contactFormValid(req)) {
    return res.status(400).send( { error: 'Please fill in contact form correctly '});
  }
  var options = {
    to: process.env.CONTACT_EMAIL || 'hello@soundsuit.fm',
    subject: req.body.subject || 'Contact from Soundsuit.fm',
    template: 'contact',
    message:req.body.message,
    author: {
      name: req.body.authorName,
      email: req.body.authorEmail
    }
  };

  email(options, function (er) {
    if (er) return res.status(500).send({ error: 'Could not send your message' });
    return res.status(200).end();
  });
}

module.exports = router;
