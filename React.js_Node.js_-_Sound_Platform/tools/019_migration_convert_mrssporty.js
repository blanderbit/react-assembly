'use strict';

const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '../', '.env');
const async = require('async');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

models.User.find()
  .exec((err, users) => {
    if (err) throw err;
    console.log(`found ${users.length} users`);

    async.each(users, (user, cb) => {
      if (models.User.isMrssportyEmail(user.email) && user.business_type === 'fintess_studio_max') {
        console.log(`${user.email}`);
        user = new models.MrssportyUser(user);
        user.save(cb);
      } else {
        cb(null);
      }
    }, (err) => {
      models.disconnect();
      if (err) throw err;
    });
  });
