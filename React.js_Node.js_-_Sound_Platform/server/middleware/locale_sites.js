const geoip = require('geoip-lite');

const detectCountry = (req, res, next) => {
  const geoIpResult = geoip.lookup(req.ip);
  if (geoIpResult) {
    req.country = geoIpResult.country.toLowerCase();
  }
  next(null);
};

const setLocale = (req, res, next) => {
  if (req.session.lang || req.country) {
    req.setLocale(req.session.lang || req.country);
  }
  next(null);
};

module.exports = {
  detectCountry,
  setLocale
};
