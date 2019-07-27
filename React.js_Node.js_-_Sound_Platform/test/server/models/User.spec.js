'use strict';

const helper = require('../test_helper');

const moment = require('moment');
const Promise = require('bluebird');

const expect = helper.expect;
const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');

const User = require('../../../server/models').User;

describe('User fields', function () {
  it('is not specialUserClass', () => {
    expect(User.specialUserClass).eql(undefined);
  });

  describe('paid periods', function () {
    it('user without paid periods is valid', function () {
      const user = new User();
      expect(user.validateSync()).be.undefined;
    });

    it('user with only period start is invalid', function () {
      const user = new User();
      user.paid_periods.push({
        start: new Date()
      });
      expect(user.validateSync()).exists;
    });

    it('user with both start and end is valid', function () {
      const user = new User();
      user.paid_periods.push({
        start: new Date(),
        end: new Date()
      });
      expect(user.validateSync()).be.undefined;
    });

    describe('paid_period#isCurrent', () => {
      const TEST_CASES = [
        {
          period: {
            start: moment().add(1, 'hour').toDate(),
            end: moment().add(2, 'hour').toDate()
          },
          expected: false
        },

        {
          period: {
            start: moment().subtract(1, 'hour').toDate(),
            end: moment().add(2, 'hour').toDate()
          },
          expected: true
        }
      ];

      TEST_CASES.forEach((testCase) => {
        it(`returns ${testCase.expected} for ${testCase.input}`, () => {
          const u = new User();
          const p = u.paid_periods.create(testCase.period);
          expect(p.isCurrent).to.eql(testCase.expected);
        });
      });
    });
  });

  describe('trialEnded', () => {
    const TEST_CASES = [
      {
        input: moment().add(1, 'hour').toDate(),
        expected: false
      },

      {
        input: moment().subtract(1, 'hour').toDate(),
        expected: true
      },

      {
        input: moment().toDate(),
        expected: true
      },

      {
        input: moment().add(1, 'second').toDate(),
        expected: false
      }
    ];

    TEST_CASES.forEach((testCase) => {
      it(`returns ${testCase.expected} for ${testCase.input}`, () => {
        const u = new User({ trial_end: testCase.input });
        expect(u.trialEnded).to.eql(testCase.expected);
      });
    });
  });

  describe('hasActivePaidPeriod', () => {
    const TEST_CASES = [
      {
        periods: [],
        expected: false
      },
      {
        periods: [
          {
            start: moment().add(1, 'hour').toDate(),
            end: moment().add(2, 'hour').toDate()
          }
        ],
        expected: false
      },
      {
        periods: [
          {
            start: moment().add(1, 'hour').toDate(),
            end: moment().add(2, 'hour').toDate()
          },
          {
            start: moment().subtract(1, 'hour').toDate(),
            end: moment().add(2, 'hour').toDate()
          }
        ],
        expected: true
      }
    ];

    TEST_CASES.forEach((testCase) => {
      it(`returns ${testCase.expected} for ${testCase.input}`, () => {
        const u = new User();
        testCase.periods.forEach((p) => {
          u.paid_periods.push(p);
        });

        expect(u.hasActivePaidPeriod).equal(testCase.expected);
      });
    });
  });

  describe('isAbleToPlay', () => {
    let user;

    beforeEach(() => {
      user = new User();
    });

    it('returns true if trial is not ended yet', () => {
      user.trial_end = moment().add(1, 'hour').toDate();
      expect(user.isAbleToPlay).equal(true);
    });

    it('returns false if trial already ended', () => {
      user.trial_end = moment().subtract(1, 'hour').toDate();
      expect(user.isAbleToPlay).equal(false);
    });

    it('returns true if there is active paid period', () => {
      user.trial_end = moment().subtract(1, 'hour').toDate();
      user.paid_periods.push({
        start: moment().subtract(1, 'hour').toDate(),
        end: moment().add(2, 'hour').toDate()
      });
      expect(user.isAbleToPlay).equal(true);
    });
  });
});

describe('User methods', function () {
  afterEach(function() {
    this.sandbox.restore();
  });

  describe('#addToLastPlayed', function() {
    let user;

    const fakeSaveRes = new User();

    beforeEach(function() {
      user = new User();
      this.sandbox.stub(user, 'save', () => Promise.resolve(fakeSaveRes));
    });

    const toArr = (doc) => doc.toObject().map((el) => _.pick(el, 'track'));
    const toLastPlayed = (tracks) => tracks.map((track) => ({ track: track._id }));

    it('adds one track to an empty array', () => {
      const song = { _id: new ObjectId };
      user.addToLastPlayed(song);
      expect(toArr(user.last_played)).eql(toLastPlayed([song]));
    });

    it('adds a track to an non-empty array', () => {
      const existingTracks = [{ _id: new ObjectId() }, { _id: new ObjectId() }];
      user.last_played = toLastPlayed(existingTracks);

      const song = { _id: new ObjectId };
      user.addToLastPlayed(song);
      expect(toArr(user.last_played)).eql(_.concat(
        toLastPlayed([song]),
        toLastPlayed(existingTracks)
      ));
    });

    it('pushes set of tracks to a full array', () => {
      const existingTracks = [];
      for (let i = 0; i < 49; i++) {
        existingTracks.push({ _id: new ObjectId });
      }

      user.last_played = toLastPlayed(existingTracks);

      const songs = [{ _id: new ObjectId }, { _id: new ObjectId }];

      const result = user.addToLastPlayed(songs);
      expect(toArr(user.last_played)).eql(_.concat(
        toLastPlayed(songs),
        toLastPlayed(existingTracks).slice(0, 50 - songs.length)
      ));

      expect(result).eventually.equal(fakeSaveRes);
    });
  });

  it('should not send blacklisted properties to view', function () {
    // given
    const user = new User({});
    user.name = 'User';
    user.email = 'user@soundsuit.fm';
    user.password = 'secret';
    user.salt = '123salt123';

    // when
    const viewable = user.toView();

    // then
    expect(viewable).not.to.have.property('password');
    expect(viewable).not.to.have.property('salt');
    expect(viewable).to.have.property('email');
    expect(viewable).to.have.property('name');
  });

  describe('get lastPlayedTrack', () => {
    it('should return correct one', () => {
      const lastPlayed = [
        {
          track: new ObjectId('571020f896829b7005a16f1b'),
          time_played: new Date('2016-05-22T20:23:50.209Z'),
          soundcloud_id: 225314452
        },
        {
          track: new ObjectId('571566f70b13ca54671d4926'),
          time_played: new Date('2016-05-22T20:23:49.052Z'),
          soundcloud_id: 208411714
        },
        {
          track: new ObjectId('571ea177e8c3a9ff24895862'),
          time_played: new Date('2016-05-22T19:38:30.965Z'),
          soundcloud_id: 251632946
        }
      ];

      const user = new User();
      user.last_played = lastPlayed;

      expect(user.lastPlayedTrack.track.toString()).equal('571020f896829b7005a16f1b');
    });
  });

  describe('#getOptions', function() {
    it('returs empty object', () => {
      expect(new User().getOptions()).eql({});
    });
  });

  describe('#getTagsFromMusicFlavor', function() {
    const TEST_CASES = [
      {
        flavors: [],
        expected: ['classic_mix']
      },

      {
        flavors: ['classic_mix'],
        expected: ['classic_mix']
      },

      {
        flavors: ['nyc'],
        expected: ['nyc', 'classic_mix']
      },

      {
        flavors: ['paris'],
        expected: ['paris', 'classic_mix']
      },

      {
        flavors: ['miami'],
        expected: ['miami']
      },

      {
        flavors: ['christmas'],
        expected: ['christmas', 'classic_mix']
      },

      {
        flavors: ['christmas', 'miami'],
        expected: ['christmas', 'miami']
      }
    ];

    TEST_CASES.forEach((testCase) => {
      it(`results in ${testCase.expected} for ${testCase.flavors}`, () => {
        const user = new User({ music_flavors: testCase.flavors });
        expect(user.getTagsFromMusicFlavor()).eql(testCase.expected);
      });
    });
  });

  it('returns miami for fitness_studio_max business_type', () => {
    const user = new User({ business_type: 'fintess_studio_max' });
    expect(user.getTagsFromMusicFlavor()).eql(['miami', 'fitness_max']);
  });

  describe('#toReleaseDateRange', () => {
    const currentYear = (new Date()).getFullYear();

    const TEST_CASES = [
      {
        customer_age: ['<20'],
        expected: currentYear - 10
      },

      {
        customer_age: ['<30'],
        expected: currentYear - 25
      },

      {
        customer_age: ['<50'],
        expected: 1950
      },

      {
        customer_age: ['<70'],
        expected: 1950
      },

      {
        customer_age: ['<30', '<20'],
        expected: currentYear - 25
      },

      {
        customer_age: ['<30', '<20', '<50'],
        expected: 1950
      }
    ];

    TEST_CASES.forEach((testCase) => {
      it(`returns ${testCase.expect} for ${testCase.customer_age.join(', ')}`, () => {
        const user = new User({ customer_age: testCase.customer_age });
        expect(user.toReleaseDateRange()).eql(testCase.expected);
      });
    });
  });
});

describe('::isMrssportyEmail', () => {
  const TEST_CASES = [
    { email: '', expect: false },
    { email: 'club793@aasdasdf.mrssporty.com', expect: true },
    { email: 'club793@aasdasdf.mrssporty.de', expect: true },
    { email: 'club793@mrssporty.de', expect: true }
  ];

  TEST_CASES.forEach((testCase) => {
    it(`returns ${testCase.expect} for ${testCase.email}`, () => {
      expect(User.isMrssportyEmail(testCase.email)).equal(testCase.expect);
    });
  });
});

describe('::build', function() {
  describe('when email is mrssporty-like', function() {
    let MrssportyUser;

    beforeEach(function() {
      MrssportyUser = require('../../../server/models').MrssportyUser;
    });

    it('returns an instance of MrssportyUser', () => {
      const user = User.build({ email: 'any@mrssporty.de' });

      expect(user).be.instanceOf(MrssportyUser);
      expect(user.type).equal('MrssportyUser');
    });
  });

  describe('when email is fitbox-like', function () {
    let FitboxUser;

    beforeEach(function () {
      FitboxUser = require('../../../server/models').FitboxUser;
    });

    it('returns an instance of FitboxUser', () => {
      const user = User.build({ email: 'any@fitbox.de' });

      expect(user).be.instanceOf(FitboxUser);
      expect(user.type).equal('FitboxUser');
    });
  });

  describe('when email is regular', function() {
    it('returns an instance of MrssportyUser', () => {
      const user = User.build({ email: 'any@any.de' });

      expect(user).be.instanceOf(User);
      expect(user.type).be.undefined;
    });
  });
});

describe('::buildSelfRegister', function() {
  afterEach(function() {
    this.sandbox.restore();
  });

  beforeEach(function() {
    this.sandbox.spy(User, 'build');
  });

  it('calls ::build with specified email and trial ending in one month', () => {
    const email = 'any@email.com';
    const now = new Date();
    const user = User.buildSelfRegister('sny', email);

    expect(User.build.calledOnce).be.true;

    const args = User.build.getCall(0).args[0];

    expect(args).have.keys(['email', 'trial_end', 'company_name']);

    expect(args.email).equal(email);
    const trialDays = moment(args.trial_end).diff(now, 'days');

    expect(trialDays).gte(27);
    expect(trialDays).lte(32);
  });
});

describe('::buildByAdmin', function() {
  afterEach(function() {
    this.sandbox.restore();
  });

  beforeEach(function() {
    this.sandbox.spy(User, 'build');
  });

  const action = (params) => User.buildByAdmin(params);

  function respects(fieldName, val) {
    action({
      [fieldName]: val
    });

    const args = User.build.getCall(0).args[0];

    expect(args[fieldName]).equal(val);
  }

  it('respects email', () => {
    respects('email', 'any@email.com');
  });

  it('respects verifired', () => {
    respects('verified', true);
  });

  it('respects trial_end', () => {
    respects('trial_end', new Date(2017, 9, 9));
  });

  it('respects paid_periods', () => {
    const start = new Date(2017, 9, 9);
    const end = new Date(2017, 10, 9);

    respects('paid_periods', [{ start, end }]);
  });

  it('sets trial_end in 1 month if not specified', () => {
    const now = new Date();

    action();

    const args = User.build.getCall(0).args[0];

    const trialDays = moment(args.trial_end).diff(now, 'days');
    expect(trialDays).gte(27);
    expect(trialDays).lte(32);
  });
});
