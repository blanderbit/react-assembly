var expect = require('chai').use(require("chai-as-promised")).use(require('chai-datetime')).expect;
var Promise = require('bluebird');

var Song = require('../../../../server/models').Song;
var step = require('../../../../server/fingerprinter/steps/rdio_release_details_step');


describe('Rdio release details step', function () {

  var earliestDateStr = '1998-12-12';
  var rdioReturnedReleases = {
    'release_1': { releaseDate: '2001-01-01' },
    'release_2': { releaseDate: '2014-04-04' },
    'release_3': { releaseDate: earliestDateStr },
    'release_4': { releaseDate: 'invalidDate'}
  };

  it('should add only valid release dates found to record release dates', function () {
    // given
    var song = Song({});
    var rdioClient = {};
    rdioClient.releasesDetails = function () {
      return Promise.resolve(rdioReturnedReleases);
    };

    // when
    var ran = step.buildWith(rdioClient).run(null, song);

    // then
    return ran.then(function (song) {
      expect(song.providers.releaseYears).to.have.length(3);
    });
  });

  it('should add dates to existing ones', function () {
    // given
    var earliestDateEver = 1960;
    var song = Song({
      providers: {
        releaseYears: [earliestDateEver]
      }
    });
    var rdioClient = {};
    rdioClient.releasesDetails = function () {
      return Promise.resolve(rdioReturnedReleases);
    };

    // when
    var ran = step.buildWith(rdioClient).run(null, song);

    // then
    return ran.then(function (song) {
      expect(song.providers.releaseYears).to.have.length(4);
    });
  })

});
