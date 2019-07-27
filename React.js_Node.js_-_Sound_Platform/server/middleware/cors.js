const cors = require('cors');

const whitelistedOrigin = process.env.REACT_APP_URL;

module.exports = cors({
  origin(origin, cb) {
    cb(null, whitelistedOrigin && whitelistedOrigin === origin);
  },
  credentials: true
});
