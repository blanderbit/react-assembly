var useragent = require('express-useragent');
var MobileDetect = require('mobile-detect');

/**
 * Middleware to detect user-agent and redirect to address provided if IE found
 * @return {*}
 * @param targetView view name to render when IE found
 */
module.exports.ieCheck = function(targetView) {
  return check(isIE, targetView)
};

/**
 * Middleware to detect user-agent and redirect to address provided if mobile found
 * @return {*}
 * @param targetView view name to render when mobile browser found
 */
module.exports.mobileCheck = function(targetView) {
  return check(isMobile, targetView)
};

module.exports.setMobileFlag = function(req, res, next) {
  req.isMobile = isMobile(req);
  next();
};

function check(checkFn, targetView) {
  return function(req, res, next) {
    if(typeof checkFn === 'function' && checkFn(req)) {
      return res.render(targetView);
    }
    return next();
  }
}

function isIE(req) {
  if (!req.headers['user-agent']) return false;

  var ua = useragent.parse(req.headers['user-agent']);
  return ua && ua.isIE;
}

function isMobile(req) {
  if (!req.headers['user-agent']) return false;

  var md = new MobileDetect(req.headers['user-agent']);
  return md.mobile();
}
