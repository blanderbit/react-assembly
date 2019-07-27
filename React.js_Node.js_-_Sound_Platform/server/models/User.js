'use strict';

const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const Promise = require('bluebird');
const _ = require('lodash');

const defaultMusicFlavors = require('../dicts/music_flavor').DEFAULT_FLAVORS;

const logger = require('../logger').main;
const makeToken = require('../lib/utils').makeToken;

function detectMrssporty(email) {
  return /@(?:.+?\.)?mrssporty\./.test(email);
}

const MUSIC_STYLES = [
  'charts_independent',
  'charts',
  'independent'
];

const BUSINESS_TYPES = [
  'cafe',
  'restaurant',
  'hotel',
  'design_store',
  'hair_salon',
  'fashion_boutique',
  'bar',
  'event',
  'fintess_studio',
  'fintess_studio_max',
  'wellness_spa'
];

const MUSIC_FLAVORS = [
  'classic_mix',
  'nyc',
  'new_orleans',
  'paris',
  'stockholm',
  'berlin',
  'christmas',
  'miami',
  'tropical'
];

const LANGUAGES = [
  'en',
  'de',
  'fr'
];

const CUSTOMER_AGES = ['<20', '<30', '<50'];

const PaidPeriodSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date, required: true }
});

PaidPeriodSchema.virtual('isCurrent')
  .get(function() {
    const now = new Date();
    return this.end > now && this.start < now;
  });

const User = new mongoose.Schema(
  {
    created: { type: Date, default: Date.now },
    first_name: String,
    last_name: String,
    name: String,
    business_name: String,

    language: { type: String, enum: LANGUAGES },

    business_type: { type: String, enum: BUSINESS_TYPES, default: BUSINESS_TYPES[0] },
    music_style: { type: String, enum: MUSIC_STYLES, default: MUSIC_STYLES[0] },
    music_flavors: {
      type: [{ type: String, enum: MUSIC_FLAVORS }],
      default: MUSIC_FLAVORS[0]
    },
    customer_age: {
      type: [{ type: String, enum: CUSTOMER_AGES }],
      default: CUSTOMER_AGES[1]
    },

    admin: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    token: { type: String, default: makeToken },
    anonymous: { type: Boolean, default: false },
    expires_from: { type: Date, expires: '4d' },

    love: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    last_played: [{
      track: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Track' },
      time_played: Date,
      _id: false
    }],
    expired: Boolean,
    subscribe_events: [{
      date: { type: Date, default: Date.now },
      company: { type: String, required: true },
      street_house: { type: String, required: true },
      zip_city: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
      pending: { type: Boolean }
    }],
    paid_periods: [PaidPeriodSchema],
    trial_end: Date,
    company_name: { type: String },
    customer_number: { type: String },
    station_id: { type: String, unique: true, sparse: true },
    tos_accepted: { type: Date },
    receive_email_agreement: { type: Boolean, default: false },
    chargebee_id: String
  },
  {
    discriminatorKey: 'type',
    usePushEach: true
  }
);

User.methods.updateToken = function (len) {
  this.token = makeToken(len);
};

User.methods.likes = function (songId) {
  for (let i = 0, l = this.love.length; i < l; i++) {
    if (this.love[i].equals(songId)) {
      return true;
    }
  }

  return false;
};

User.methods.toView = function (admin) {
  let allowedFields = [
    'name', 'email', 'business_type', 'business_name',
    'admin', 'music_flavors',
    'customer_age', 'anonymous', 'music_style',
    'lastPlayedTrack', 'created', 'verified', '_id',
    'trial_end', 'isOnTrial', 'activePaidPeriod',
    'workout_type', 'type',
    'changing_voice', 'changing_voice_interval',
    'lastSubscription', 'company_name',
    'language', 'first_name', 'last_name',
    'schedule_start',
    'schedule_stop',
    'schedule_enabled'
  ];

  if (admin) {
    allowedFields = allowedFields.concat([
      'paid_periods',
      'trial_end',
      'trialEnded',
      'hasActivePaidPeriod',
      'customer_number',
      'company_name',
      'subscriptionState',
      'chargebee_id'
    ]);
  }
  const userView = {};
  const asObject = this.toObject({ getters: true });
  allowedFields.forEach((f) => {
    userView[f] = asObject[f];
  });

  userView.id = this.id;  // handle special as there is _id not id in Mongo
  return userView;
};

User.methods.toCommonView = function toCommonView() {
  const commonFields = [
    '_id',
    'email',
    'created',
    'name',
    'business_name',
    'admin',
    'verified',
    'token',
    'anonymous',
    'expires_from',
    'love',
    'last_played',
    'expired',
    'subscribe_events',
    'paid_periods',
    'trial_end',
    'company_name',
    'customer_number'
  ];

  return _.pick(this.toObject(), commonFields);
};

User.methods.toSettings = function() {
  const allowedFields = [
    'email',
    'business_type',
    'music_flavors',
    'customer_age',
    'music_style'
  ];

  return _.pick(this.toObject(), allowedFields);
};

User.methods.getOptions = function () {
  const schedule = detectMrssporty(this.email) ?
    {
      startPlaying: '58 5 * * * *',
      stopPlaying: '02 22 * * * *'
    } : undefined;
  return {
    schedule,
    transition: 24
  };
};

/**
 * Pushes song with given id to last played songs pool for user.
 * Last played songs is capped array - oldest items get removed while new are pushed
 * @param song, mongoose object
 */
User.methods.addToLastPlayed = function addToLastPlayed(songs) {
  const MAX_POOL_SIZE = 200;

  const now = new Date();

  const items = (_.isArray(songs) ? songs : [songs])
    .map((song) => ({
      track: song._id,
      time_played: now
    }))
    .reverse();

  return this.update({
    $push: {
      last_played: {
        $each: items,
        $position: 0,
        $slice: MAX_POOL_SIZE
      }
    }
  })
  .exec()
  .catch((err) => {
    logger.warn(`failed to save last played for user ${this.email}`, err);
  });
};

User.methods.lastPlayedIn = function lastPlayedIn(mins) {
  const now = moment();

  return _(this.last_played)
    .filter((lpItem) => now.diff(lpItem.time_played, 'minutes') < mins)
    .map('track')
    .value();
};

User.methods.generateJwt = function () {
  return jwt.sign({ u: this.id }, process.env.SESSION_SECRET, {
    // expiresIn: '30d' // expires in 30 days
    noTimestamp: true
  });
};

User.methods.getTagsFromMusicFlavor = function () {
  if (this.business_type === 'fintess_studio_max') {
    if (_.includes(['club666@club.mrssporty.de', 'club184@m-baas.de'], this.email)) {
      return ['miami'];
    }
    return ['miami', 'fitness_max'];
  }

  let userFlavors = this.music_flavors.slice();

  if (this.business_type === 'wellness_spa') {
    _.pullAll(userFlavors, [
      'berlin',
      'tropical',
      'miami',
      'christmas'
    ]);
  }

  const mapping = {
    nyc: ['nyc', 'classic_mix'],
    berlin: ['berlin', 'classic_mix'],
    classic_mix: ['classic_mix'],
    paris: ['paris', 'classic_mix'],
    stockholm: ['stockholm', 'classic_mix'],
    miami: ['miami'],
    new_orleans: ['new_orleans', 'classic_mix'],
    christmas: ['christmas'],
    tropical: ['st_barths', 'classic_mix']
  };

  const result = _.uniq(
    _.flatten(
      userFlavors
        .reduce((acc, flavor) => {
          acc.push(mapping[flavor]);
          return acc;
        }, [])
    )
  );

  if (result.length === 1 && _.first(result) === 'christmas') {
    result.push('classic_mix');
  }

  return result.length ? result : ['classic_mix'];
};

User.methods.resetPendingInvoice = async function resetPendingInvoice() {
  if (!this.lastSubscription) {
    logger.warn(`User ${this.email}: requested resetPendingInvoice while lastSubscription is missing`);
    return null;
  }

  this.lastSubscription.pending = false;

  return this.save();
};

User.methods.toReleaseDateRange = function toReleaseDateRange() {
  const currentYear = (new Date()).getFullYear();

  const AGE_TO_RELEASE_DATES = {
    '<20': currentYear - 10,
    '<30': currentYear - 25,
    '<50': 1950,
    '<70': 1950
  };

  return _(this.customer_age).map((ageSetting) => AGE_TO_RELEASE_DATES[ageSetting]).min() || null;
};

User.methods.convertTo = function (type) {
  let TargetClass;

  switch (type) {
    case 'MrssportyUser':
      TargetClass = mongoose.models.MrssportyUser;
      break;
    case 'User':
      TargetClass = mongoose.models.User;
      break;
    case 'FitboxUser':
      TargetClass = mongoose.models.FitboxUser;
      break;
    default:
      return Promise.reject(new Error('Uknown type to convert to: ', type));
  }

  const convertedInstanceObj = new TargetClass(_.omit(this.toObject(), 'customer_age')).toObject();
  if (type === 'User') {
    Object.assign(convertedInstanceObj, {
      $unset: { type: 1 }
    });
  }
  return this.update(convertedInstanceObj, { strict: false }).exec();
};

// this model provides mongoose passport authentication
User.plugin(passportLocalMongoose, {
  usernameField: 'email',
  usernameLowerCase: true,
  digestAlgorithm: 'sha1'
});


/**
 * Build anonymous user instance with randomized email address
 * and some defaults settings
 */
User.statics.buildAnonymous = function () {
  return new this({
    music_flavors: defaultMusicFlavors,
    name: 'Guest',
    anonymous: true,
    email: [makeToken(20), 'soundsuit.fm'].join('@'),
    expires_from: new Date()
  });
};

User.statics.build = function build(params, ForcedUserType) {
  if (ForcedUserType) return new ForcedUserType(params);
  return new (this.userSubclass(params.email))(params);
};

User.statics.userSubclass = function userSubclass(email) {
  if (this.isMrssportyEmail(email)) return mongoose.models.MrssportyUser;
  if (/@(?:.+?\.)?fitbox\./.test(email)) return mongoose.models.FitboxUser;
  return this;
};

User.statics.buildSelfRegister = function buildSelfRegister(company, userEmail, firstName,
  lastName, forcedUserType, acceptReceiveInfo) {
  const params = {
    company_name: company,
    email: userEmail,
    first_name: firstName,
    last_name: lastName,
    trial_end: moment().endOf('day').add(1, 'month').toDate(),
    tos_accepted: new Date(),
    receive_email_agreement: acceptReceiveInfo
  };

  return this.build(params, forcedUserType);
};

User.statics.buildByAdmin = function buildByAdmin(params) {
  const sanitizedParams = _.pick(params || {}, 'email', 'verified', 'paid_periods', 'trial_end');
  const expandedParams = Object.assign({
    trial_end: moment().endOf('day').add(1, 'month').toDate()
  }, sanitizedParams);

  return this.build(expandedParams);
};

User.statics.getByJwt = function (token, cb) {
  jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
    if (err) return cb(err);
    this.findById(decoded.u, cb);
  });
};

User.statics.anonymousPassword = makeToken(20);

User.statics.getNextChargebeeId = async function () {
  return (
    parseInt((await this.aggregate([{ $group: { _id: null, max: { $max: '$chargebee_id' } } }]))[0]
      .max, 10) + 1
  );
};

User.virtual('lastPlayedTrack')
  .get(function getLastPlayedTrack() {
    const last = _.first(this.last_played);
    return last ? last.toObject() : null;
  });

User.virtual('lastSubscription')
  .get(function getLastSubscription() {
    const last = _.last(this.subscribe_events);
    return last || null;
  });

User.virtual('trialEnded')
  .get(function getTrialEnded() {
    return this.trial_end && moment(this.trial_end).isBefore();
  });

User.virtual('activePaidPeriod')
  .get(function getActivePaidPeriod() {
    return _.find(this.paid_periods, 'isCurrent');
  });

User.virtual('lastSubscriptionDate')
  .get(function getLastSubscriptionDate() {
    const lastSubscrDate = _.get(this, 'activePaidPeriod.end');
    return lastSubscrDate ?
      moment(lastSubscrDate).add(1, 'day').format('DD/MM/YYYY') :
      null;
  });

User.virtual('hasActivePaidPeriod')
  .get(function getHasActivePaidPeriod() {
    return !!this.activePaidPeriod;
  });

User.virtual('isAbleToPlay')
  .get(function getIsAbleToPlay() {
    return !!(!this.trialEnded || this.hasActivePaidPeriod ||
      (this.lastSubscription && this.lastSubscription.pending));
  });

User.virtual('isOnTrial')
  .get(function isOnTrial() {
    return !!(this.trial_end && !this.trialEnded && !this.hasActivePaidPeriod &&
      !(this.lastSubscription && this.lastSubscription.pending));
  });

User.virtual('subscriptionState')
  .get(function subscriptionState() {
    if (this.anonymous) {
      return 'ANONYMOUS';
    }
    if (this.isOnTrial) {
      return 'TRIAL';
    }
    if (this.lastSubscription && this.lastSubscription.pending) {
      return 'PENDING_SUBSCRIPTION';
    }
    if (this.hasActivePaidPeriod) {
      return 'PAID';
    }
  });

User.statics.isMrssportyEmail = detectMrssporty;

User.statics.targetUrl = process.env.REGULAR_APP_URL;

Object.assign(User.statics, {
  BUSINESS_TYPES,
  MUSIC_FLAVORS,
  MUSIC_STYLES,
  CUSTOMER_AGES
});

module.exports = mongoose.model('User', User);
