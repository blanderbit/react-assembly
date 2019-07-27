'use strict';

const fs = require('fs');
const path = require('path');

const _ = require('lodash');

const p = path.join(__dirname, '../', '.env');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

models.PitchedTrack
  .find({})
  .populate('original')
  .exec()
  .then((tracks) => {
    const grouped = _(tracks)
      .groupBy((track) => {
        if (!track.original) {
          return null;
        }
        return track.original._id.toString()
      })
      .pickBy((v) => v.length > 1)
      .value();
    _.each(grouped, (value, key) => {
      if (key === 'null') return
      console.log('\n-------')
      const pitched = _.find(_.first(value).original.pitched, { bpm: 130 }).track.toString();
      console.log(`${value.length} for ${key}, pitched is ${pitched}`);
      _.each(value, (track) => {
        if (track._id.toString() !== pitched) {
          track.remove((err) => {
            if (err) throw err;
          });
        }
        console.log(track._id.toString(), track._id.getTimestamp(), track._id.toString() === pitched ? 'this one' : '')
      });
    });
  });
