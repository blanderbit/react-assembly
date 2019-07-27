'use strict';

const helper = require('../test_helper');

const expect = helper.expect;
const _ = require('lodash');
const async = require('async');
const sinon = require('sinon');
const Promise = require('bluebird');
const proxyquire = require('proxyquire').noPreserveCache();

const ObjectId = require('mongoose').Types.ObjectId;


/* global describe, it, expect */

describe('Query builder', function() {
  let queryBuilder;
  let bpmCorridor;
  let findBpmCorridorMock;
  let fakeCorridor;
  let releaseDate;
  let rejectSubqueryStub;

  let models;
  let User;
  let MrssportyUser;

  beforeEach(function() {
    models = require('../../../server/models');
    User = models.User;
    MrssportyUser = models.MrssportyUser;

    bpmCorridor = require('../../../server/music_selection/bpm_corridor');

    rejectSubqueryStub = () => Promise.resolve({});

    queryBuilder = proxyquire('../../../server/music_selection/query_builder', {
      './get_reject_subquery': rejectSubqueryStub
    });

    fakeCorridor = { min: 1, max: 2 };
    findBpmCorridorMock = this.sandbox.stub(bpmCorridor, 'findBPMCorridor', () => (
      Promise.resolve(fakeCorridor)
    ));
  });

  describe('releaseYear', function() {
    it('should have appropriate releaseYear when toReleaseDateRange returns a result', function(done) {
      const user = new User();

      this.sandbox.stub(user, 'toReleaseDateRange', () => 1555);

      queryBuilder.buildQuery(user, {})
        .then(function(query) {
          expect(query.$and).to.deep.include.members([{
            $or: [
              { releaseYear: { $gte: 1555 } },
              { releaseYear: { $exists: false } }
            ]
          }]);
          done();
        })
        .catch(done);
    });
  });

  describe('tags subquery', () => {
    let user;

    beforeEach(() => {
      user = new User();
    });

    const TEST_CASES = [
      {
        music_flavors: [],
        expect: [
          { tags: 'classic_mix' }
        ]
      },
      {
        music_flavors: ['nyc', 'paris'],
        expect: [
          { tags: 'nyc' },
          { tags: 'classic_mix' },
          { tags: 'paris' }
        ]
      },
      {
        music_flavors: ['nyc', 'paris'],
        customer_age: '<70',
        expect: [
          { tags: 'nyc' },
          { tags: 'classic_mix' },
          { tags: 'paris' },
          { tags: 'oldies' }
        ]
      }
    ];

    TEST_CASES.forEach((testCase, i) => {
      it(`test case ${i}`, (done) => {
        user.music_flavors = testCase.music_flavors;
        if (testCase.customer_age) {
          user.customer_age = testCase.customer_age;
        }
        queryBuilder.buildQuery(user, {})
          .then((query) => {
            expect(query.$and).to.deep.include.members([{
              $or: testCase.expect
            }]);
            done(null);
          })
          .catch(done);
      });
    });
  });

  describe('sources', () => {
    let user;

    beforeEach(() => {
      user = new User();
    });

    it('sets sources to Song and SoundCloud song for regular case', (done) => {
      queryBuilder.buildQuery(user, {})
        .then((query) => {
          expect(query.$and).to.deep.include.members([{
            type: { $in: ['Song', 'SoundcloudSong'] }
          }]);
          done(null);
        })
        .catch(done);
    });

    it('sets sources to PitchedTrack for fitness_studio_max case', (done) => {
      user.business_type = 'fintess_studio_max';
      queryBuilder.buildQuery(user, {})
        .then((query) => {
          expect(query.$and).to.deep.include.members([{
            type: 'PitchedTrack'
          }]);
          done(null);
        })
        .catch(done);
    });
  });

  describe('sources for MrssportyUser', () => {
    let user;

    beforeEach(() => {
      user = new MrssportyUser();
    });

    it('sets sources to PitchedTrack', (done) => {
      queryBuilder.buildQuery(user, {})
        .then((query) => {
          expect(query.$and).to.deep.include.members([{
            type: 'PitchedTrack'
          }]);
          done(null);
        })
        .catch(done);
    });
  });

  describe('bpm', () => {
    let user;

    beforeEach(() => {
      user = new User();
    });

    it('resolves to 130 for fintess_studio_max', () => {
      user.business_type = 'fintess_studio_max';
      return queryBuilder.buildQuery(user, { targetDate: new Date() })
        .then((query) => {
          expect(query.$and).to.deep.include.members([{
            bpm: {
              $gte: 130,
              $lte: 130
            }
          }]);
        });
    });

    it('resolves to result of findBPMCorridor', () => {
      return queryBuilder.buildQuery(user, { targetDate: new Date() })
        .then((query) => {
          expect(query.$and).to.deep.include.members([{
            bpm: {
              $gte: fakeCorridor.min,
              $lte: fakeCorridor.max
            }
          }]);
        });
    });
  });

  describe('bpm for MrssportyUser', function() {
    let user;

    const N = 100500;

    beforeEach(function() {
      user = new MrssportyUser();
      this.sandbox.stub(user, 'toBpm', () => ({ $gte: N, $lte: N }));
    });

    afterEach(function() {
      this.sandbox.restore();
    });

    it('resolves to result of #toBpm', () => {
      return queryBuilder.buildQuery(user, { targetDate: new Date() })
        .then((query) => {
          expect(query.$and).to.deep.include.members([{
            bpm: { $gte: N, $lte: N }
          }]);
        });
    });
  });
});
