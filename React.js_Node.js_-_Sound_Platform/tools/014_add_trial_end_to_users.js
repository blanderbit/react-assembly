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

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

models.User.find({ anonymous: false, trial_end: { $exists: false }, admin: { $ne: true } })
  .exec((err, users) => {
    if (err) throw err;
    console.log(`found ${users.length} users`);
    async.each(users, (user, cb) => {
      const created = user.created || new Date();
      user.trial_end = moment(created).add(1, 'month').toDate();
      user.save(cb)
    }, (err) => {
      if (err) throw err;
      models.disconnect();
    });
  });
