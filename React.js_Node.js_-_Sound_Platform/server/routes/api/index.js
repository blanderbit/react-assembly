'use strict';

const AWS = require('aws-sdk');
const moment = require('moment');
const VError = require('verror').VError;
const express = require('express');
const passport = require('passport');
const _ = require('lodash');

const logger = require('../../logger').main;
const models = require('../../models');
const authMiddleware = require('../../middleware/auth');
const ensureCanPlay = require('../../middleware/allowed_to_play');
const loadMatchingUserSongs = require('../../music_selection');
const limitAnonymousSession = require('../../middleware/limit_anonymous_session_time');

const anonymousSessionDurationSeconds = require('../../dicts/anonymous_session')
  .ANONYMOUS_SESSION_DURATION_SECONDS;

const router = new express.Router();

if (!process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_MP3_BUCKET) {
  throw new Error('You need to to set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, & AWS_MP3_BUCKET.');
}

// pre-configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

function getSongById(req, res, next) {
  models.Track
    .findById(req.body.songId)
    .exec()
    .then((track) => {
      if (!track) {
        throw new VError(`getSongById: track ${req.body.songId} not found`);
      }
      req.track = track;
      next();
    })
    .catch((err) => {
      logger.error(VError.fullStack(err));
      res.status(500).send();
    });
}

function postMood(req, res) {
  req.session.mood = req.body.mood;
  res.status(200).send();
}

function getClientDate(req, res, next) {
  const format = 'DD-MM-YYYY HH:mm';

  const parsed = moment(req.query.now, format, true);

  if (!parsed.isValid()) {
    logger.error('Invalid date provided: ', req.query.now);
    res.status(400).json({ error: `Invalid date provided. Expected format is ${format}` });
    return;
  }

  req.clientDate = parsed.toDate();
  next();
}

function getMood(req, res, next) {
  const parsed = parseInt(req.query.mood, 10);

  if (Number.isNaN(parsed)) {
    res.status(400).send({ error: `Invalid mood provided (must be integer): ${req.query.mood}` });
    return;
  }

  req.mood = parsed;
  next();
}

function loadMatchingTracks(req, res) {
  const opts = {
    targetDate: req.clientDate,
    mood: parseInt(req.mood || 0, 10),
    count: parseInt(req.query.count || 5, 10),
    mostRecent: req.query.mostRecent === 'true' || false,
    reject: []
  };

  if (_.isArray(req.query.reject)) {
    opts.reject = req.query.reject;
  } else if (_.isString(req.query.reject)) {
    opts.reject = [req.query.reject];
  }

  loadMatchingUserSongs(req.user, opts)
    .then((tracks) => {
      res.json(
        tracks.map((t) => (
          Object.assign(t.serializeWithUrl(), {
            isLiked: req.user.likes(t._id)
          })
        ))
      );
    })
    .catch((err) => {
      logger.error(VError.fullStack(new VError(err, 'could not load songs to play')));
      res.status(500).json({ error: 'Could not load songs to play' });
    });
}

function addSongToLastPlayedEndpoint(req, res) {
  const song = req.track;

  const event = new models.UserPlayEvent({
    user: req.user,
    trackName: song.displayName,
    trackId: song._id,
    trackType: song.constructor.modelName,
    client: 'web'
  });

  event.save((err) => {
    if (err) {
      logger.error('Failed to save UserPlayEvent: ', err);
    }
  });

  req.user.addToLastPlayed(song)
    .finally(() => {
      res.send();
    });
}

/**
 * POST /api/like
 * @param {String} songId _id of the song
 */
function addSongToLoved(req, res) {
  req.user.love.addToSet(req.track._id);

  req.user.save()
    .catch((err) => {
      throw new VError(err, 'failed to save user');
    })
    .then(() => {
      res.send();
    })
    .catch((err) => {
      logger.error(VError.fullStack(
        new VError(err, `could not add ${req.body.songId} as loved for ${req.user.id}`)
      ));
      res.tatus(500).send();
    });
}

/**
 * POST /api/unlike
 * @param {String} songId _id of the song
 */
function removeSongFromLoved(req, res) {
  req.user.love.pull(req.track._id);

  req.user.save()
    .catch((err) => {
      throw new VError(err, 'failed to save user');
    })
    .then(() => {
      res.send();
    })
    .catch((err) => {
      logger.error(VError.fullStack(
        new VError(err, `could not remove ${req.body.songId} as loved for ${req.user.id}`)
      ));
      res.tatus(500).send();
    });
}

router.use('/register', require('./register'));
router.use('/reset_password', require('./reset_password'));

router.use(authMiddleware.authWithToken);
router.use(authMiddleware.requiredJSON);

router.post('/mood', postMood);

router.get('/next', limitAnonymousSession(true), ensureCanPlay, getClientDate, getMood, loadMatchingTracks);

router.post('/last_played', getSongById, addSongToLastPlayedEndpoint);

router.post('/like', ensureCanPlay, getSongById, addSongToLoved);

router.post('/unlike', ensureCanPlay, getSongById, removeSongFromLoved);

router.use('/user', limitAnonymousSession(true), require('./user_router'));

router.post('/set-password', require('./post_new_password'));

router.post('/user/settings', (req, res) => {
  const whitelisted = [
    'business_type',
    'music_style',
    'music_flavors',
    'customer_age',
    'changing_voice',
    'changing_voice_interval',
    'workout_type',
    'language',
    'schedule_start',
    'schedule_stop',
    'schedule_enabled'
  ];

  Object.assign(req.user, _.pick(req.body, whitelisted));

  if (req.user.isModified()) {
    req.user.save()
      .then(() => {
        res.send();
      })
      .catch(() => {
        res.status(400).send();
      });
  } else {
    res.send();
  }
});

router.post('/logout',
  (req, res, next) => { req.logout(); next(); },
  authMiddleware.registerAnonymousIfRequired,
  (req, res) => {
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
);

router.post('/login', passport.authenticate('local'), (req, res) => {
  if (!req.user.verified) {
    req.logout();
    res.status(403);
    res.json({
      code: 'E_USER_NOT_VERIFIED'
    });
    return;
  }

  if (req.user.expired) {
    req.logout();
    res.status(403);
    res.json({
      code: 'E_USER_EXPIRED'
    });
    return;
  }

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
});

module.exports = router;
