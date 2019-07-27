'use strict';

var genericStep = require('./generic_step');

const doEvaluate = (trackRecord) => {
  trackRecord.bpm = trackRecord.bpm || trackRecord.detectedBpm || trackRecord.providers.audio.tempo;
  return trackRecord;
};

const getFinalState = (trackRecord) => {
  if (trackRecord.file && trackRecord.bpm && trackRecord.artistName && trackRecord.title) {
    return 'complete';
  }
  return 'incomplete';
};

const buildWith = () => {
  var step = {
    name: 'Calculate ultimate track details',
    runWhen: ['complete', 'error'],
    updateTo: getFinalState,
    run: doEvaluate
  };

  genericStep.mixin.call(step);
  return step;
};

module.exports = {
  doEvaluate,
  getFinalState,
  buildWith
};
