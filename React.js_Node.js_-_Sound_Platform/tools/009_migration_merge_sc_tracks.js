'use strict';
var fs = require('fs')
var Promise = require('bluebird');
var path = require('path');
var p = path.join(__dirname, '../', '.env');
var async = require('async');
var _ = require('lodash');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

var expect = require('chai').expect;

var models = require('../server/models');
var mongoose = require('mongoose');
models.connect(process.env.MONGOLAB_URI);

models.SoundcloudSong.find()
.exec(function(err, songs) {
  if (err) throw err;
  console.log(songs.length);

  var grouped = _.groupBy(songs, 'soundcloud_id');

  const ids = Object.keys(grouped);

  async.each(ids,
    (soundcloudId, cb) => {
      let bulk = _.sortBy(grouped[soundcloudId], (track) => -track.__v + 100 *
        (track.state === 'error' ? 1 : 0));

      if (bulk.length === 0) {
        cb(new Error(`empty bulk ${soundcloudId}`));
        return;
      }

      const ref = _.first(bulk);

      const tags = _.pluck(bulk, 'tags').map((tags) => _.isEmpty(tags) ? ['classic_mix'] : tags);
      ref.tags = _.flattenDeep(tags);

      const rest = _.slice(bulk, 1);

      async.each(rest,
        (track, cb) => {
          track.remove(cb);
        },

        (err) => {
          if (err) return cb(err);
          ref.save(cb);
        });
    },

    (err) => {
      console.log(err ? err: 'completed');
      models.disconnect();
    });
});
