var expect = require('chai').use(require("chai-as-promised")).use(require('chai-datetime')).expect;
var Promise = require('bluebird');

var Song = require('../../../../server/models').Song;
var step = require('../../../../server/fingerprinter/steps/spotify_release_details_step');


describe('Spotify release details step', function () {

  it('should append dates and images to record', function () {
    // given
    var song = Song({
      providers: {
        releaseYears: [],
        images: []
      }
    });
    var spotifyClient = {};
    var spotifyData = {
      covers: ['image/one.png', 'image/two.png'],
      releaseDates: [new Date()]
    };
    spotifyClient.albumsDetails = function () {
      return Promise.resolve(spotifyData);
    };

    // when
    var ran = step.buildWith(spotifyClient).run(null, song);

    // then
    return ran.then(function (song) {
      expect(song.providers.releaseYears).to.have.length(1);
      expect(song.providers.releaseYears[0]).to.equal(spotifyData.releaseDates[0].getFullYear());
    });
  });

});
