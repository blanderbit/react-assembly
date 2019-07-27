'use strict';

var fs = require('fs')
var Promise = require('bluebird');
var path = require('path');
var p = path.join(__dirname, './', '.env');
var async = require('async');
var _ = require('lodash');
const moment = require('moment');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

var expect = require('chai').expect;

var models = require('./server/models');
var mongoose = require('mongoose');
models.connect(process.env.MONGOLAB_URI);

const START_DATE = new Date('2016-02-01T00:00:00+02:00');
const END_DATE = new Date('2016-04-01T00:00:00+02:00');

const dates = [];

const cur = moment(START_DATE);

while (cur < moment(END_DATE)) {
  dates.push(cur.format('MM-DD'));
  cur.add(1, 'day');
}

// console.log(dates)

async.mapSeries(
  dates,

  (dateStr, cb) => {
    models.UserPlayEvent
    .count({
      user: '5649faebf1909a0f000bc4cb',
      client: 'stream',
      date: {
        $lte: new Date(`2016-${dateStr}T23:59:59+02:00`),
        $gte: new Date(`2016-${dateStr}T00:00:00+02:00`)
      }
    })
    .exec(function(err, events) {
      if (err) throw err;
      return cb(null, events);
    });
  },

  (err, results) => {
    if (err) throw err;
    dates.forEach((date, i) => {
      console.log(`2016-${date}: ${results[i]}`);
    });

    console.log(`---------\nTotal: `, _.sum(results));
  }
);

// const formatDate = (day, month) => {

// };

// const getCount() => {

// }

