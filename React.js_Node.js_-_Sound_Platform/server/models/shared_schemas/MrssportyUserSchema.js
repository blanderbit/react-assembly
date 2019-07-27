'use strict';

const _ = require('lodash');
const mongoose = require('mongoose');

const User = require('../User');
const makeToken = require('../../lib/utils').makeToken;

const USER_TYPES = _.pick(User.schema.obj, [
  'customer_age',
  'music_flavors',
  'language'
]);

const WORKOUT_TYPES = [
  'fitness_max',
  'fitness_balance',
  'fitness_chillout'
];

const CUSTOMER_AGES = ['<20', '<30', '<50', '<70'];

const CHANGING_VOICES = [
  null,
  'german',
  'italian',
  'polish',
  'dutch'
];

const MrssportyUserSchema = new mongoose.Schema({
  // TODO: get rid of business_type field
  workout_type: { type: String, enum: WORKOUT_TYPES, default: WORKOUT_TYPES[0] },

  customer_age: {
    type: [{ type: String, enum: CUSTOMER_AGES }],
    default: '<50'
  },

  music_flavors: Object.assign({}, USER_TYPES.music_flavors, {
    default: _.last(User.MUSIC_FLAVORS)
  }),

  language: Object.assign({}, USER_TYPES.language, {
    default: 'de'
  }),

  changing_voice: { type: String, enum: CHANGING_VOICES, default: null },
  changing_voice_interval: { type: Number, default: 60 },

  schedule_start: { type: String, default: '58 5 * * * *' },
  schedule_stop: { type: String, default: '02 22 * * * *' },
  schedule_enabled: { type: Boolean, default: true }
}, { discriminatorKey: 'type' });

MrssportyUserSchema.methods.getOptions = function getOptions() {
  if (this.email === 'mrssporty.wilmersdorf@web.de') {
    return {};
  }
  return {
    schedule: {
      startPlaying: '58 5 * * * *',
      stopPlaying: '02 22 * * * *'
    },
    transition: 24
  };
};

// TODO: that mostly dupilcates toBpm (except `oldies`). Find a better solution
MrssportyUserSchema.methods.getTagsFromMusicFlavor = function getTagsFromMusicFlavor() {
  const workoutTypeToTag = {
    fitness_chillout: 'miami',
    fitness_balance: 'fitness_mid',
    fitness_max: 'fitness_max'
  };

  const tag = workoutTypeToTag[this.workout_type] || 'fitness_max';

  return [tag];
};

MrssportyUserSchema.methods.toBpm = function toBpm() {
  const workoutTypeToBpm = {
    fitness_chillout: 100,
    fitness_balance: 120,
    fitness_max: 130
  };

  const bpm = workoutTypeToBpm[this.workout_type] || 130;

  return { $gte: bpm, $lte: bpm };
};

MrssportyUserSchema.methods.toSettings = function () {
  const allowedFields = [
    'email',
    'workout_type',
    'customer_age'
  ];

  return _.pick(this.toObject(), allowedFields);
};

MrssportyUserSchema.statics.buildAnonymous = function () {
  return new this({
    anonymous: true,
    email: [makeToken(20), 'mrsporty.soundsuit.fm'].join('@'),
    expires_from: new Date()
  });
};

MrssportyUserSchema.statics.specialUserClass = true;
MrssportyUserSchema.statics.playerMode = 'Mrssporty';
MrssportyUserSchema.statics.targetUrl = process.env.MRSSPORTY_APP_URL;

Object.assign(MrssportyUserSchema.statics, {
  WORKOUT_TYPES,
  CHANGING_VOICES
});

module.exports = MrssportyUserSchema;
