'use strict';

const helper = require('../test_helper');
const expect = helper.expect;
const proxyquire = require('proxyquire').noPreserveCache();
const sinon = require('sinon');

const models = require('../../../server/models');

describe('Query builder', function() {
  let getRejectSubquery;

  const fakeArtistNames = ['any'];

  beforeEach(function() {
    sinon.mock(models.Track)
      .expects('find')
      .chain('select')
      .chain('lean')
      .chain('exec')
      .resolves(fakeArtistNames.map((name) => ({ artistName: name })));

    getRejectSubquery = proxyquire('../../../server/music_selection/get_reject_subquery', {
    });
  });

  afterEach(function() {
    models.Track.find.restore();
  });

  let user;

  beforeEach(function() {
    user = new models.User();
    this.sandbox.stub(user, 'lastPlayedIn');
  });

  it('returns default result for default user', () => {
    user.lastPlayedIn.onFirstCall().returns([]);
    user.lastPlayedIn.onSecondCall().returns([]);
    return expect(getRejectSubquery(user, [])).to.eventually.eql({ _id: { $nin: [] } });
  });

  it('rejects artistNames', () => {
    const sampleTrack1 = new models.Track();
    const sampleTrack2 = new models.Track();
    user.lastPlayedIn.onFirstCall().returns([sampleTrack1._id]);
    user.lastPlayedIn.onSecondCall().returns([sampleTrack2._id]);
    return expect(getRejectSubquery(user, [])).to.eventually.eql({
      _id: { $nin: [sampleTrack1._id] },
      artistName: { $nin: fakeArtistNames }
    });
  });
});
