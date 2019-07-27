var winston = require('winston');
var path = require('path');

module.exports = {
  configure: function() {
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {'timestamp':true});
    winston.add(winston.transports.File, {
      filename: path.join(__dirname, './logs/fingerprint.log'),
      maxsize: 1024 * 1000 * 5,
      maxFiles: 3,
      json: false
    });
  },
  logger: winston
};
