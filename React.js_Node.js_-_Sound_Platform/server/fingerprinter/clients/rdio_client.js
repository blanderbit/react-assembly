const Promise = require('bluebird');
const RateLimiter = require('limiter').RateLimiter;
const Rdio = require('rdio-node').Rdio;

const RdioClient = function (apiKey, apiSecret) {
  this.rdio = new Rdio({ consumerKey: apiKey, consumerSecret: apiSecret });
  this.limiter = new RateLimiter(5, 'second');
};


/**
 * Fetch multiple releases data from rdio
 * @param releasesIds rdio-specific releases ids
 * @returns promise
 */
RdioClient.prototype.releasesDetails = function (releasesIds) {
  const dfd = Promise.defer();
  this.limiter.removeTokens(1, () => {
    self.rdio.makeRequest('get', { keys: releasesIds.join(',') }, (err, response) => {
      if (err) {
        console.error('Error while fetching rdio data', err);
        return dfd.reject(err);
      }
      if (response.status !== 'ok') {
        console.error('Error while fetching rdio data (status !== ok)', response.status);
        return dfd.reject(new Error('Rdio responded with ' + response.status));
      }
      dfd.resolve(response.result);
    });
  });
  return dfd.promise;
};

module.exports = RdioClient;
