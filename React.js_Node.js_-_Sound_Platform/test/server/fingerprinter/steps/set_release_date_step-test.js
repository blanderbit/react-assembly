var expect = require('chai').use(require("chai-as-promised")).use(require('chai-datetime')).expect;
var moment = require('moment');

var Song = require('../../../../server/models').Song;
var step = require('../../../../server/fingerprinter/steps/set_release_date_step');


describe('Set song release date step', function () {

  it('should choose and set the oldest date from all available release dates', function () {
    // given
    var earliest = 1990;
    var latest = 2000;
    var song = Song({
      providers: {
        releaseYears: [latest, earliest]
      }
    });

    // when
    song = step.buildWith().run(null, song);

    // then
    expect(song.releaseYear).to.equal(earliest);
  });

  it('should leave releaseDate not defined when no release dates available', function () {
     // given
    var song = Song({
      providers: {
        releaseYears: []
      }
    });

    // when
    song = step.buildWith().run(null, song);

    // then
    return expect(song.releaseYear).to.be.undefined;
  });

});