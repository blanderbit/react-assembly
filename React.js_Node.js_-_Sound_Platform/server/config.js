'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');
const morgan = require('morgan');
const moment = require('moment');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const livereload = require('connect-livereload');
const passport = require('passport');
const express = require('express');
const i18n = require('i18n');

const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const responseAsPromise = require('./middleware/response_as_promise');
const sessionHelpers = require('./middleware/session_helpers');
const models = require('./models');

module.exports = function applyConfig(app) {
  process.env.SITE_NAME = process.env.SITE_NAME || 'Soundsuit';
  app.locals.site_name = process.env.SITE_NAME;

  app.disable('x-powered-by');

  const revision = fs.existsSync('./REVISION') ? fs.readFileSync('./REVISION', 'utf8').trim() : '';
  app.locals.revision = revision;
  app.locals.env = process.env.NODE_ENV;
  app.locals.tracksJsToken = process.env.TRACKJS_TOKEN;

  morgan.token('user', (req) => _.get(req, 'user.email'));
  morgan.token('reqDate', () => moment().format('YYYY/MM/DD | HH:mm:ss.SSS'));

  app.use(['/api', '/login', '/logout', '/forgot', '/register', '/verify'],
    morgan(':reqDate HTTP REQ :method :url :status :response-time (:user)'));

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.use(cookieParser());
  app.use(responseAsPromise());

  require('./templates')(app);

  // configure session
  app.use(session({
    cookie: {
      maxAge: 52 * 7 * 24 * 60 * 60 * 1000
    },
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }),
    saveUninitialized: true,
    resave: false
  }));

  app.set('trust proxy', 'loopback');

  require('./flash')(app);

  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'stage') {
    app.use(livereload({
      port: 35301
    }));
  }

  // init passport
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(models.User.createStrategy());

  passport.use(
    new JwtStrategy(
      {
        secretOrKey: process.env.SESSION_SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeader()
      },

      function (jwtPayload, done) {
        models.User.findById(jwtPayload.u, function(err, user) {
          if (err) {
            return done(err, false);
          }

          done(null, user || false);
        });
      }
    )
  );

  passport.serializeUser(models.User.serializeUser());
  passport.deserializeUser(models.User.deserializeUser());

  // add user to template-accessible vars
  app.use(function check(req, res, next) {
    if (req.user) {
      res.locals.user = req.user;
    }
    next();
  });

  app.use(sessionHelpers);

  express.response.respondWithJsonError = function respondWithJsonError (data, status = 400) {
    this.status(status).json(data);
  };

  i18n.configure({
    locales: ['en', 'de'],
    directory: path.join(__dirname, '..', 'locales'),
    defaultLocale: 'en',
    autoReload: process.env.NODE_ENV !== 'production',
    updateFiles: process.env.NODE_ENV !== 'production',
    syncFiles: process.env.NODE_ENV !== 'production'
  });

  app.use(i18n.init);
};
