const logger = require('../logger').main;

module.exports.ANONYMOUS_SESSION_DURATION_SECONDS = (function () {
  var current = process.env.ANONYMOUS_SESSION_DURATION_SECONDS;
  var final = current || 30 * 60;
  logger.info('Setting anonymous session timeout to %d minutes', final / 60);
  return final;
})();
