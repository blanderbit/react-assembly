'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const bpmCorridor = require('./bpm_corridor');
const getRejectSubquery = require('./get_reject_subquery');
const logger = require('../logger').main;
const models = require('../models');

function getBpmSubquery(businessType, targetDate, mood) {
  return bpmCorridor
    .findBPMCorridor(businessType, targetDate, mood)
    .then((corridor) => (
      corridor ? { bpm: { $gte: corridor.min, $lte: corridor.max } } : null
    ))
    .catch((err) => {
      logger.error('Failed to get BPM subquery:', err);
      return null;
    });
}

function buildQuery(user, opts, saPreset) {
  const onlyPitched = user.business_type === 'fintess_studio_max' ||
    user.constructor.specialUserClass;

  const conditions = [
    { state: 'complete' },
    { type: onlyPitched ? 'PitchedTrack' : { $in: ['Song', 'SoundcloudSong'] } }
  ];

  const isFsm = user.business_type === 'fintess_studio_max';

  let bpmPromise;

  if (user.constructor.specialUserClass) {
    bpmPromise = Promise.resolve({ bpm: user.toBpm() });
  } else if (isFsm) {
    bpmPromise = Promise.resolve({ bpm: { $gte: 130, $lte: 130 } });
  } else if (opts.targetDate) {
    bpmPromise = getBpmSubquery(user.business_type, opts.targetDate, opts.mood);
  }

  const releaseDatesRange = user.toReleaseDateRange();
  if (releaseDatesRange) {
    conditions.push({
      $or: [
        { releaseYear: { $gte: releaseDatesRange } },
        { releaseYear: { $exists: false } }
      ]
    });
  }

  const tags = user.getTagsFromMusicFlavor();

  if (_.includes(user.customer_age, '<70')) {
    tags.push('oldies');
  }

  const tagsSubquery = {};
  tagsSubquery.$or = tags.map((t) => ({ tags: t }));
  conditions.push(tagsSubquery);

  if (!user.constructor.specialUserClass) {
    switch (user.music_style) {
      case 'charts':
        conditions.push({ tags: 'mainstream' });
        break;
      case 'independent':
        conditions.push({ tags: 'indie' });
        break;
      default:
        // don't care about tag
        break;
    }
  }

  return Promise.all([
    bpmPromise,
    getRejectSubquery(user, opts.reject, saPreset)
  ])
  .then((args) => {
    _(args).filter((subquery) => !_.isNil(subquery))
      .each((subquery) => {
        conditions.push(subquery);
      });
    return { $and: conditions };
  });
}

module.exports.buildQuery = buildQuery;
