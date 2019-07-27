'use strict';

const helper = require('../test_helper');

const expect = helper.expect;

describe('MrssportyUser', () => {
  const Subject = require('../../../server/models').MrssportyUser;
  const User = require('../../../server/models').User;

  it('is instanceof User', () => {
    expect((new Subject()) instanceof User).eql(true);
  });

  it('User is not instanceof MrssportyUser', () => {
    expect((new User()) instanceof Subject).eql(false);
  });

  it('is specialUserClass', () => {
    expect(Subject.specialUserClass).eql(true);
  });

  describe('#getOptions', () => {
    it('returns correct data', () => {
      expect(new Subject().getOptions()).eql({
        schedule: {
          startPlaying: '58 5 * * * *',
          stopPlaying: '02 22 * * * *'
        },
        transition: 24
      });
    });
  });

  describe('#getTagsFromMusicFlavor', () => {
    const TEST_CASES = [
      {
        type: 'fitness_max',
        expect: ['fitness_max']
      },
      {
        expect: ['fitness_max']
      },
      {
        type: 'unknown',
        expect: ['fitness_max']
      },
      {
        type: 'fitness_balance',
        expect: ['fitness_mid']
      },
      {
        type: 'fitness_chillout',
        expect: ['miami']
      }
    ];

    TEST_CASES.forEach((testCase) => {
      it(`returns ${JSON.stringify(testCase.expect)} for ${testCase.type}`, () => {
        expect(new Subject({ workout_type: testCase.type }).getTagsFromMusicFlavor())
          .eql(testCase.expect);
      });
    });
  });

  describe('#toBpm', () => {
    const TEST_CASES = [
      {
        type: 'fitness_max',
        expect: { $gte: 130, $lte: 130 }
      },
      {
        expect: { $gte: 130, $lte: 130 }
      },
      {
        type: 'unknown',
        expect: { $gte: 130, $lte: 130 }
      },
      {
        type: 'fitness_balance',
        expect: { $gte: 120, $lte: 120 }
      },
      {
        type: 'fitness_chillout',
        expect: { $gte: 100, $lte: 100 }
      }
    ];

    TEST_CASES.forEach((testCase) => {
      it(`returns ${JSON.stringify(testCase.expect)} for ${testCase.type}`, () => {
        expect(new Subject({ workout_type: testCase.type }).toBpm()).eql(testCase.expect);
      });
    });
  });
});
