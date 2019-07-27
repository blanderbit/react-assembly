/**
 * Transform promise to valid response
 * Call `res.promise` with promise returned from application logic.
 * It will send 200 with promise result when promise is fulfilled, and will send `statusCode` defined in error when promise is rejected
 * If none found it will return 500 with generic message
 * @param req
 * @param res
 * @param next
 */
function extendResponseWithPromise(req, res, next) {
  res.promise = function(promise) {
    promise.then(function(result) {
      res.status(200).send(result);
    }).fail(function(err) {
      if (err.statusCode) {
        res.status(err.statusCode)
          .json({ error: err.message });
      } else {
        res.status(500).send({ error: err.message || 'Unexpected error' });
      }
    }).done()
  };
  next();
}

module.exports = function () {
  return extendResponseWithPromise;
};
