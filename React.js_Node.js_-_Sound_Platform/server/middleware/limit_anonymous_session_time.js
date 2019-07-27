module.exports = (xhr) => (req, res, next) => {
  if(req.anonymousSessionLimitReached()) {
    console.log('Anonymous session expired');
    if(xhr) {
      return res.status(499).send();
    } else {
      req.flash('error'); // clear flash error messages
      return res.redirect('/register');
    }
  }
  return next();
};
