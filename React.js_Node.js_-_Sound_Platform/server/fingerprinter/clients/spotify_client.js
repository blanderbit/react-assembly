const Promise = require('bluebird');
const Spotify = require('spotify-web-api-node');
const RateLimiter = require('limiter').RateLimiter;
const _ = require('lodash');
const moment = require('moment');

/**
 * Create nonauthenticated spotify client
 * @param rateLimiter rate limiter instance or default (10 per minute)
 * @constructor
 */
const SpotifyClient = function (rateLimiter) {
  this.limiter = rateLimiter || new RateLimiter(3, 'second');
  this.spotify = new Spotify();
};


/**
 * Get details about albums provided by id
 * If albumsIds is not so small it breaks it into several smaller arrays (3 items each) and makes several requests
 * because Spotify doesn't allow too many ids per request
 * @param {Array} albumsIds
 * @returns {Promise} accumulated data for all albums (covers, release dates)
 */
SpotifyClient.prototype.albumsDetails = function (albumsIds) {
  const self = this;
  const batches = reshape(albumsIds, 3);
  const promises = batches.map((b) => processIdsBatch(self.limiter, self.spotify, b));
  return Promise.all(promises).then(joinBatchesResults);
};

SpotifyClient.prototype.searchTracks = function(searchTerm) {
  const dfd = Promise.defer();
  const self = this;

  self.limiter.removeTokens(1, () => {
    self.spotify.searchTracks(searchTerm)
      .then(
        (data) => {
          dfd.resolve(data);
        },
        (err) => dfd.reject(err)
      );
  });
  return dfd.promise;
};


function joinBatchesResults(results) {
  const data = {
    covers: [],
    releaseDates: []
  };
  results.forEach(function (r) {
    Array.prototype.push.apply(data.covers, r.covers || []);
    Array.prototype.push.apply(data.releaseDates, r.releaseDates || []);
  });
  return data;
}


function processIdsBatch(limiter, spotify, ids) {
  const dfd = Promise.defer();
  limiter.removeTokens(1, function () {
    spotify.getAlbums(ids).then(extractFromResponse).then(function (data) {
      return dfd.resolve(data);
    }).catch(function (err) {
      console.error('Error while fetching data from Spotify', err);
      dfd.reject(err);
    })
  });
  return dfd.promise;
}


function extractFromResponse(res) {
  const data = {
    covers: [],
    releaseDates: []
  };
  res.albums = res.albums || [];
  res.albums.forEach(function (a) {
    if(a.release_date) {
      const date = moment(a.release_date).toDate();
      data.releaseDates.push(date);
    }
    const biggestImage = _.maxBy(a.images || [], 'width');
    if(biggestImage && biggestImage.url) {
      data.covers.push(biggestImage.url);
    }
  });
  return data;
}


/**
 * Quick n dirty way to split huge array into several smaller
 * @param array
 * @param n
 * @returns {*}
 */
function reshape(array, n){
  return _.compact(array.map(function(el, i){
    if (i % n === 0) {
      return array.slice(i, i + n);
    }
  }))
}

module.exports = SpotifyClient;
