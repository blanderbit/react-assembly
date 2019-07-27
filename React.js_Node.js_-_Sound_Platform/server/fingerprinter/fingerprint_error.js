'use strict';

function FingerprintError(trackRecordId, message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = 'FingerprintError';
  this.trackRecordId = trackRecordId;
  this.message = message || "Error during fingerprinting - details not specified. Track record id: " + trackRecordId;
}
require('util').inherits(FingerprintError, Error);

module.exports = FingerprintError;
