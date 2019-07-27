var Promise = require('bluebird');
var Song = require('../../models/index').Song;
var FingerprintError = require('../fingerprint_error');
var logger = require('../logging').logger;


module.exports.mixin = function() {

  this.runStep = function(trackInfo) {
    var thisStep = this;
    return loadRecord(trackInfo).then(function(record) {
      var eligible = shouldRun(thisStep, trackInfo, record);
      if(eligible) {
        console.log("Running:", thisStep.name, thisStep.disabled ? 'DISABLED' : '');
        return Promise.resolve(record)
          .then(function (trackRecord) {
            if(thisStep.disabled) {
              return trackRecord;
            }
            return thisStep.run(trackInfo, trackRecord)
          })
          .then(updateStatus.bind(null, thisStep))
          .then(saveRecord)
          .catch(saveSongErrorStatus)
          .catch(logError.bind(null, thisStep, trackInfo))
      }
    })
  };

  /**
   * Forces given step to run. Doesn't check statuses whether it should be run or not
   * Also doesn't update status in DB. It's just to update record data without changing its state
   * @param trackInfo
   * @returns {Promise}
   */
  this.forceRunStep = function(trackInfo) {
    var thisStep = this;
    console.warn("This is force step run, beware!");
    return loadRecord(trackInfo).then(function(record) {
      return Promise.resolve(record)
        .then(function (trackRecord) {
          if(thisStep.disabled) {
            return trackRecord;
          }
          return thisStep.run(trackInfo, trackRecord)
        })
        .then(saveRecord)
        .catch(saveSongErrorStatus)
        .catch(logError.bind(null, thisStep, trackInfo))
    });
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

  function saveSongErrorStatus(err) {
    if(err instanceof FingerprintError) {
      logger.error('Fingerprinting error occured. Saving...', err.message);
      Song.findByIdAndUpdate(err.trackRecordId, { state: 'error', providers: { errorMessage: err.message } }, function(err) {
        if(err) return logger.error('Could not save error status', err);
      });
      return;
    }
    return Promise.reject(err);
  }

  function saveRecord(record) {
    var dfd = Promise.defer();
    record.save(function(err) {
      if(err) return dfd.reject(err);
      dfd.resolve();
    });
    return dfd.promise;
  }

  function logError(thisStep, trackInfo, err) {
    logger.error('Error while executing step %s on file %s', thisStep.name, trackInfo.file, err.stack);
  }

};
