const Promise = require('bluebird');
const RateLimiter = require('limiter').RateLimiter;
const request = require('request');
const moment = require('moment');

function singleItemRequest(limiter, baseUrl, releaseId, key, defaultValue) {
  return new Promise((resolve, reject) => {
    const opts = {
      method: 'get',
      uri: [baseUrl, releaseId].join('/'),
      headers: {
        'User-Agent': 'Soundsuit/beta hello@soundsuit.fm'
      },
      json: true
    };
    limiter.removeTokens(1, () => {
      request(opts, (err, response, body) => {
        if (err) {
          console.error('Error while fetching musicbrainz data', err);
          return reject(err);
        }
        if (response.statusCode === 200) {
          return resolve(response.body[key] || defaultValue);
        }
        if (response.statusCode === 404) {
          return resolve(defaultValue);
        }
        console.error('Error while fetching musicbrainz data (HTTP != 200)', body);
        return reject(body);
      });
    });
  });
}

const MusicbrainzClient = function () {
  this.coversBaseUrl = 'http://coverartarchive.org/release';
  this.detailsBaseUrl = 'http://musicbrainz.org/ws/2/release';
  this.limiter = new RateLimiter(1, 'second');
};

/**
 * Fetch single release data from Musicbrainz
 * @param releaseId musicbrainz-specific ID of release
 * @returns promise
 */
MusicbrainzClient.prototype.releaseCoverImage = function (releaseId) {
  return singleItemRequest(this.limiter, this.coversBaseUrl, releaseId, 'images', []);
};


/**
 * Fetch cover images for multiple releases
 * @param {Array} releaseIds array of release ids for musicbrainz
 * @returns {Promise} promise with array of release image objects
 */
MusicbrainzClient.prototype.coverImages = function (releaseIds) {
  const promises = releaseIds.map(this.releaseCoverImage.bind(this));
  return Promise.all(promises);
};

/**
 * Return release date for single release id
 * @param releaseId release id for musicbrainz
 * @returns {Promise} promise with release date as Date object
 */
MusicbrainzClient.prototype.releaseDate = function (releaseId) {
  return singleItemRequest(this.limiter, this.detailsBaseUrl, releaseId, 'date');
};

function stringToDate(dateStr) {
  return moment(dateStr).toDate();
}

/**
 * Fetch release dates for multiple releases
 * @param {Array} releasesIds array of releases ids
 * @returns {Promise} promise containing array of release dates as Date objects
 */
MusicbrainzClient.prototype.releasesDates = function (releasesIds) {
  const singleReleaseDate = singleItemRequest.bind(this, this.limiter, this.detailsBaseUrl);
  const promises = releasesIds.map((releaseId) => singleReleaseDate(releaseId, 'date'));
  return Promise.all(promises).then((results) => results.map(stringToDate));
};

module.exports = MusicbrainzClient;
