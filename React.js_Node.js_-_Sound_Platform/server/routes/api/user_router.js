const _ = require('lodash');
const moment = require('moment');
const express = require('express');
const logger = require('../../logger').main;
const email = require('../../email');
const { importSubscription } = require('../../lib/chargebee');

const subscribe = require('../../mailing/subscription');

const anonymousSessionDurationSeconds = require('../../dicts/anonymous_session')
  .ANONYMOUS_SESSION_DURATION_SECONDS;

const router = new express.Router();

// get user JSON
function getUser(req, res) {
  const user = req.user.toView();
  const options = req.user.getOptions();

  const anonData = req.user.anonymous ?
    {
      session_end: moment(req.user.created).add(anonymousSessionDurationSeconds, 's').toDate()
    } : null;

  res.send(
    Object.assign(
      {},
      user,
      {
        options
      },
      anonData
    )
  );
}

router.get('/', getUser);

router.get('/last_subscription', (req, res) => {
  const ls = req.user.lastSubscription;
  if (ls) {
    res.json(_.pick(ls.toObject(), ['company', 'street_house', 'zip_city', 'country', 'phone']));
  } else {
    res.json(null);
  }
});

router.post('/subscribe', async (req, res) => {
  const user = req.user;

  const event = _.pick(req.body.data, [
    'company',
    'street_house',
    'zip_city',
    'country',
    'phone'
  ]);

  event.pending = true;

  user.subscribe_events.push(event);

  try {
    await user.save();
  } catch (err) {
    if (err.name === 'ValidationError') {
      res.status(400).send('Please recheck the info you provided');
      return;
    }
    logger.error('Subscribe error', err);
    res.status(500).send('Something went wrong. Please try again later');
    return;
  }

  res.send('Thank you for subscribing! You will receive an invoice soon');

  if (process.env.NODE_ENV !== 'production') return;

  const options = {
    from: process.env.SUBSCRIBE_SENDER,
    to: process.env.CONTACT_EMAIL || 'hello@soundsuit.fm',
    subject: 'Subscribe from Soundsuit.fm',
    template: 'subscribe',
    author: {
      email: user.email
    },
    data: req.body.data
  };

  email(options, function (emailErr) {
    if (emailErr) {
      logger.error(`failed to send subscription email from ${user.email}`, emailErr);
      return;
    }
    logger.info('Send invoice request from %s', user.email);
  });

  try {
    await subscribe.subscribeToSubscribedUsersList(user, event);
  } catch (err) {
    logger.error(`failed to put user to subscribed mailchimp list ${user.email}: `, err);
  }

  try {
    await subscribe.removeFromRegisteredUsersList(user);
  } catch (err) {
    logger.error(`failed to remove user from registered mailchimp list ${user.email}: `, err);
  }

  try {
    importSubscription(user, _.last(user.subscribe_events));
  } catch (err) {
    logger.error(`failed to import subscription ${user.email}: `, err);
  }
});

module.exports = router;
