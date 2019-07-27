var Promise = require('bluebird');
var Song = require('../../../models/index').SoundcloudSong;
var logger = require('../../logging').logger;
var FingerprintError = require('../../fingerprint_error');

module.exports.mixin = function() {

  this.runStep = function(track) {
    var thisStep = this;

    logger.info("Running:", thisStep.name, thisStep.disabled ? 'DISABLED' : '');
    return Promise.resolve(track)
      .then(function(track) {
        if (thisStep.disabled) {
          return trackRecord;
        }
        return thisStep.run(track)
      })
      .then(updateStatus.bind(null, thisStep))
      .then(saveRecord)
      .catch(saveSongErrorStatus.bind(null, track))
      .catch(logError.bind(null, thisStep, track));
  };

  function shouldRun(thisStep, trackInfo, record) {
    var newSongAndFirstStep = (trackInfo.isNew && !record && runWhenIs(thisStep.runWhen, null));
    var existingSongAndSubsequentStep = (!trackInfo.isNew && record && runWhenIs(thisStep.runWhen, record.state));
    return newSongAndFirstStep || existingSongAndSubsequentStep;
  }

  function runWhenIs(runWhen, target) {
    if(Array.isArray(runWhen)) {
      return runWhen.indexOf(target) > -1;
    }
    return runWhen === target;
  }


  function loadRecord(trackInfo) {
    var dfd = Promise.defer();
    Song.findByFilename(trackInfo.file, function(err, found) {
      if(err) return dfd.reject(err);
      return dfd.resolve(found);
    });
    return dfd.promise;
  }

  function updateStatus(thisStep, record) {
    var targetState;
    if(typeof thisStep.updateTo === 'function') {
      targetState = thisStep.updateTo(record);
    } else {
      targetState = thisStep.updateTo;
    }
    if(targetState) {
      record.state = targetState;
    }
    return record;
  }

  function saveSongErrorStatus(track, err) {
    var dfd = Promise.defer();

    if (err instanceof FingerprintError) {
      track.state = 'error';
      track.providers.errorMessage = err.message;
      track.save(function() {
        console.log('----saved song with error status');
        dfd.reject(err);
      });
    } else {
      dfd.reject(err);
    }

    return dfd.promise;
  }

  function saveRecord(record) {
    var dfd = Promise.defer();
    record.save(function(err) {
      if(err) return dfd.reject(err);
      dfd.resolve();
    });
    return dfd.promise;
  }

  function logError(thisStep, track, err) {
    logger.error('Error while executing step %s on file %s, error:\n%s', thisStep.name, track.title, err.stack);
    throw err;
  }

};
