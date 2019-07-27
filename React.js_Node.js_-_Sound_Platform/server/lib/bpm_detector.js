'use strict';

const execFile = require('child_process').execFile;
const _ = require('lodash');

const detectBpm = (filePath, cb) => {
  execFile('bpm-tag', ['-n', '-f', filePath], (err, stdout, stderr) => {
    if (err) return cb(err);
    const RE_BPM = /(\d+.\d*)? BPM/;
    const detectedBpm = _([stdout, stderr])
      .map((out) => {
        const match = out.match(RE_BPM);
        return match ? match[1] : null;
      })
      .filter((val) => !!val)
      .first();

    return cb(null, detectedBpm && parseFloat(detectedBpm) ?
      parseFloat(detectedBpm) : null);
  });
};

module.exports = detectBpm;
