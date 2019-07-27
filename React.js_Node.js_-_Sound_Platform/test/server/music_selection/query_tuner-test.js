'use strict';

const proxyquire = require('proxyquire').noPreserveCache();
const sinon = require('sinon');
const helper = require('../test_helper');

const expect = helper.expect;

const Track = require('../../../server/models').Track;

function fakeTunningFunction(query) {
  var clone = JSON.parse(JSON.stringify(query));  // clone it;
  clone.max += 2;
  return clone;
}

describe('Track selection query tuner', function () {
  let sandbox;
  let countStub;
  let queryTuner;
  let createTunerEventStub;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    countStub = sandbox.stub();
    createTunerEventStub = sandbox.spy();

    sandbox.stub(Track, 'count').returns({
      exec: countStub
    });

    queryTuner = proxyquire('../../../server/music_selection/query_tuner', {
      './tune_fn': fakeTunningFunction,
      '../services/event_reporters': {
        createTunerEvent: createTunerEventStub
      }
    });
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should not modify query when it already meets required criteria (returns required songs count)', function () {
     // given
    var query = { min: 10, max: 20 };

    countStub.resolves(10);

    // when
    var result = queryTuner(query, 10);

    // then
    return expect(result).to.eventually.equal(query);
  });

  it('should fine tune query to return required at least required songs count', function () {
    // given
    var query = { min: 10, max: 20 };

    countStub.onCall(0).resolves(10);
    countStub.onCall(1).resolves(20);

    // when
    var result = queryTuner(query, 15);

    // then
    var expectedQueryTuned = fakeTunningFunction(query);  // should be same as query tuned once
    return expect(result).to.eventually.eql(expectedQueryTuned);
  });

  it('should fine tune query up to three times to prevent from infinite loop', function () {
    // given
    var query = { min: 10, max: 20 };
    countStub.resolves(10);

    // when
    var result = queryTuner(query, 15);

    // then
    var expectedQueryTuned = { min: 10, max: 26 };
    return expect(result).to.eventually.eql(expectedQueryTuned);
  });

  it('should reject when something goes wrong', function () {
    // given
    var query = { min: 10, max: 20 };

    countStub.onCall(0).resolves(10);
    countStub.onCall(1).rejects(new Error('boom'));

    // when
    var result = queryTuner(query, 15);

    // then
    return expect(result).to.eventually.be.rejectedWith(Error, 'boom');
  });

  it('should create a tuner event for each iteration', function() {
    // given
    const query = { min: 10, max: 20 };
    countStub.resolves(10);

    // when
    return queryTuner(query, 15)
      .then(() => {
        expect(createTunerEventStub.firstCall.args).to.eql([{
          query,
          attempt: 0,
          requiredCount: 15,
          count: 10,
          fulfilled: false
        }]);

        expect(createTunerEventStub.secondCall.args).to.eql([{
          query: fakeTunningFunction(query),
          attempt: 1,
          requiredCount: 15,
          count: 10,
          fulfilled: false
        }]);

        expect(createTunerEventStub.callCount).to.equal(4);
      });
  });
});
