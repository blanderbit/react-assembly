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

const END_DATE = new Date('2017-02-04T23:59:59+01:00');

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

models.User.find({ anonymous: false, trial_end: { $lt: END_DATE }, admin: { $ne: true } })
  .exec((err, users) => {
    if (err) throw err;
    console.log(`found ${users.length} users`);
    async.each(users, (user, cb) => {
      if (user.hasActivePaidPeriod) {
        cb(null);
        return;
      }
      user.trial_end = END_DATE;
      user.save(cb);
    }, (err) => {
      models.disconnect();
      if (err) throw err;
    });
  });
