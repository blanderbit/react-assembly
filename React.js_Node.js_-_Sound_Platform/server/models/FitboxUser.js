'use strict';

const MrssportyUserSchema = require('./shared_schemas/MrssportyUserSchema');
const User = require('./User');
const makeToken = require('../lib/utils').makeToken;

const FitboxUserSchema = MrssportyUserSchema.clone();

const { WORKOUT_TYPES } = MrssportyUserSchema.statics;

FitboxUserSchema.add({
  workout_type: { type: String, enum: WORKOUT_TYPES, default: WORKOUT_TYPES[1] }
});

FitboxUserSchema.statics.playerMode = 'Fitbox';
FitboxUserSchema.statics.targetUrl = process.env.FITBOX_APP_URL;

FitboxUserSchema.statics.buildAnonymous = function () {
  return new this({
    anonymous: true,
    email: [makeToken(20), 'fitbox.soundsuit.fm'].join('@'),
    expires_from: new Date()
  });
};

const FitboxUser = User.discriminator('FitboxUser', FitboxUserSchema);

module.exports = FitboxUser;
