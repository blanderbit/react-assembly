'use strict';

const exec = require('child_process').exec;
const Promise = require('bluebird');

const pitch = (filePath) => (
  new Promise((resolve, reject) => {
    exec(`mp3gain -s s -s r -r -c ${filePath}`, (err) => {
      if (err) return reject(err);
      resolve(filePath);
    });
  })
);

module.exports = pitch;
