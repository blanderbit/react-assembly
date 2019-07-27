'use strict';

const exec = require('child_process').exec;
const tmp = require('tmp');
const Promise = require('bluebird');

const pitch = (filePath, ratio) => (
  new Promise((resolve, reject) => {
    tmp.file({ postfix: '.mp3' }, (err, path) => {
      if (err) return reject(err);

      exec(`sox ${filePath} -t wav - tempo ${ratio} | lame -V 0 - ${path}`, (err) => {
        if (err) return reject(err);
        resolve(path);
      });
    });
  })
);

module.exports = pitch;
