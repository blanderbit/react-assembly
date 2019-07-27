var expect = require('chai').use(require("chai-as-promised")).use(require('chai-datetime')).expect;
var Promise = require('bluebird');

var Song = require('../../../../server/models').Song;
var step = require('../../../../server/fingerprinter/steps/extract_filename_data_step');


describe('Extract filename data', function () {

  var filesToBpm = [
    { file: 'Dream Theater - Octavarium {120}.mp3', bpm: 120 },
    { file: 'Dream Theater - Octavarium {60}.mp3', bpm: 60 },
    { file: 'Dream Theater - Octavarium {060}.mp3', bpm: 60 },
    { file: 'Dream Theater - Octavarium{ 70}.mp3', bpm: 70 },
    { file: 'Dream Theater - Octavarium{60a}.mp3', bpm: 60},
    { file: 'Dream Theater - Octavarium{foo}.mp3', bpm: undefined },
    { file: 'Dream Theater - Octavarium{}.mp3', bpm: undefined },
    { file: 'Dream Theater - Octavarium.mp3', bpm: undefined }
  ];


  it('should add id3 BPM fetched from filename to track record', function () {
    filesToBpm.forEach(function (item) {
      // given
      var song = Song({ file: item.file });

      // when
      step.buildWith().run(null, song);

      // then
      expect(song.id3.bpm).to.equal(item.bpm);
    });
  });

});
