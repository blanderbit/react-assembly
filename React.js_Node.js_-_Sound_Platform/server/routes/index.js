'use strict';

const express = require('express');
const _ = require('lodash');

const router = new express.Router();

const localized = require('../middleware/locale_sites');
const authMiddleware = require('../middleware/auth');
const detectAppVersion = require('../middleware/detect_app_version');
const cors = require('../middleware/cors');

router.use(detectAppVersion);
router.use(localized.detectCountry);
router.use(localized.setLocale);

router.use('/api', cors);
router.post('/api/start_session', require('./api/post_start_session'));

router.use('/', require('./landing'));

router.use('/api', require('./api'));
router.use('/api', require('./music_id'));

router.use('/stations', require('./stations'));
router.use('/sonnenbank-test', require('./sonnenbank_test'));

// TODO: move non-specific middleware to the router itself
router.use('/admin/api', authMiddleware.adminRequiredJSON, require('./admin'));
router.use('/forgot', require('./forgot_router'));
router.use('/login', require('./login_router'));
router.use('/register', require('./register_router'));
router.use('/logout', require('./logout_router'));
router.use('/', require('./mailing_router'));
router.use('/play', require('./play_router'));
router.use('/electron-app', require('./electron_router'));

router.get('/ie', (req, res) => {
  res.render('info/ie');
});

router.get('/mobile', (req, res) => {
  res.render('info/mobile');
});

router.get('/admin', authMiddleware.adminRequired, (req, res) => {
  res.render('admin');
});

router.get('/verify/:token', require('./get_verify'));

router.get('/subscribe', authMiddleware.requireAuth, (req, res) => {
  res.render('subscribe', {
    price: req.user.constructor.specialUserClass ? 25 : 29,
    entity: req.user.constructor.specialUserClass ? 'club' : 'store'
  });
});

router.get('/renew', authMiddleware.requireAuth, (req, res) => {
  res.render('renew', {
    lastSubscriptionDate: req.user.lastSubscriptionDate,
    price: req.user.constructor.specialUserClass ? 25 : 29,
    entity: req.user.constructor.specialUserClass ? 'club' : 'store'
  });
});

module.exports = router;
