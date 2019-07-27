'use strict';

const ultimateDetailsStep = require('./steps/calculate_ultimate_track_details');
const detectBpmStep = require('./steps/detect_bpm').detectBpm;

const doFingerprint = (track, cb) => {
  detectBpmStep(track)
    .then(ultimateDetailsStep.doEvaluate)
    .then((track) => {
      const newState = ultimateDetailsStep.getFinalState(track);
      if (newState === 'complete') {
        track.state = newState;
        return track;
      }
      throw new Error('Incomplete');
    })
    .then((track) => cb(null, track))
    .catch(cb);
};

module.exports = doFingerprint;
