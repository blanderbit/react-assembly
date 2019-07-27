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
      user.name = 'test';
      user.save()
        .catch((err) => {
          console.log('Failed for ', user.id);
        })
        .finally(cb);
    }, (err) => {
      models.disconnect();
      if (err) throw err;
    });
  });
