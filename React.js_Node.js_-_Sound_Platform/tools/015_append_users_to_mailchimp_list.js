'use strict';

const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../', '.env');
const async = require('async');
const _ = require('lodash');
const tmp = require('tmp');
const Promise = require('bluebird');
const moment = require('moment');
const request = require('request');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const subscribeToRegisteredUsersList = require('../server/mailing/subscription').subscribeToRegisteredUsersList;

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

models.User.find({ verified: true })
  .exec((err, users) => {
    if (err) throw err;

    const eligibleUsers = users.filter((user) => {
      if (user.email.indexOf('sonos') !== -1) return false;
      if (user.created.getFullYear() !== 2016) return false;
      return true;
    });

    async.eachSeries(eligibleUsers, (user, cb) => {
      subscribeToRegisteredUsersList(user.email)
        .then((result) => {
          console.log('Subscribed: %s', user.email, result);
        })
        .catch((err) => {
          console.error('Failed to subscribe %s:', user.email, err);
        })
        .finally(() => {
          cb(null);
        });
    }, (err) => {
      if (err) throw err;
      models.disconnect();
    });
  });
