/**
 * Error for failed validation. Used mostly in use cases.
 * Sets internal property `statusCode` to 400 to use in HTTP response
 * @param {string} message message for this error
 * @constructor
 */
var ValidationError = function (message) {
  Error.captureStackTrace(this);
  this.statusCode = 400;
  this.message = message;
};
ValidationError.prototype = Object.create(Error.prototype);

module.exports = {
  ValidationError: ValidationError
};


