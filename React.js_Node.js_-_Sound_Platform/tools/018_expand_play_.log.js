'use strict';

const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '../', '.env');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

models.User.findOne({ email: 'club793@club.mrssporty.de' }).exec()
  .then((user) =>
    models.UserPlayEvent.find({
      user: user._id,
      date: {
        $lt: new Date(2017, 4, 25),
        $gt: new Date(2017, 4, 22)
      }
    }).populate('trackId').exec()
  )
  .then((events) => {
    debugger;
    events.forEach((event) => { console.log(event.trackId.tags) });
  })
  .finally(() => {
    models.disconnect();
  });
