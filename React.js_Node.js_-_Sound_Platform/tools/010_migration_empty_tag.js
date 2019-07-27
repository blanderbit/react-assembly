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

models.Song.find({
  tags: []
})
.exec(function(err, songs) {
  if (err) throw err;
  console.log(songs.length);

  async.each(songs,
    (song, cb) => {
      song.tags = ['classic_mix'];
      song.save(cb);
    },

    (err) => {
      console.log(err ? err : 'completed');
      models.disconnect();
    });
});
