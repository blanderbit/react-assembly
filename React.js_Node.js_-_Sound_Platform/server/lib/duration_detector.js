'use strict';

const execFile = require('child_process').execFile;
const _ = require('lodash');

const detectDuration = (filePath, cb) => {
  execFile('mp3info', ['-p', '"%S"', filePath], (err, stdout, stderr) => {
    if (err) return cb(err);
    const RE_DURATION = /(\d+)/;
    const detectedDuration = _([stdout, stderr])
      .map((out) => {
        const match = out.match(RE_DURATION);
        return match ? match[1] : null;
      })
      .filter((val) => !!val)
      .first();

    return cb(null, detectedDuration && parseInt(detectedDuration, 10) ?
      parseInt(detectedDuration, 10) : null);
  });
};

module.exports = detectDuration;
