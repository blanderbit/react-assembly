'use strict';

const mongoose = require('mongoose');
const Promise = require('bluebird');

const EmailLog = new mongoose.Schema({
}, {
  timestamps: true
});

EmailLog.methods.send = function () {
  const email = require('../../email');

  return new Promise((resolve, reject) => {
    email(this.toEmail(), (err) => {
      if (err) return reject(err);
      resolve(null);
    });
  });
};

module.exports = mongoose.model('EmailLog', EmailLog);
