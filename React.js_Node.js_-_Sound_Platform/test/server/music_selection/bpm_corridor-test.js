var bpm = require('../../../server/music_selection/bpm_corridor');
var MOOD_CHANGE_STEP = require('../../../server/dicts/bpm').MOOD_CHANGE_STEP;

describe('Adjust BPM corridor by setting mood', function() {

  var NEUTRAL_MOOD = 0;
  var MOODS_TABLE = [-3, -2, -1, 0, 1, 2, 3];

  var findCorridorFn = bpm.findBPMCorridor.bind(bpm, 'bar', 12);
  var origCorridor = findCorridorFn(NEUTRAL_MOOD);

  it('should adjust BPM corridor when mood is set', function() {

    MOODS_TABLE.forEach(function(mood) {
      assertNewCorridorValid(findCorridorFn(mood), mood);
    })

  });

  function assertNewCorridorValid(newCorridor, mood) {
    newCorridor.min.should.equal(origCorridor.min + (mood * MOOD_CHANGE_STEP), "Incorrect min value for mood " + mood);
    newCorridor.max.should.equal(origCorridor.max + (mood * MOOD_CHANGE_STEP), "Incorrect max value for mood " + mood);
  }

});

