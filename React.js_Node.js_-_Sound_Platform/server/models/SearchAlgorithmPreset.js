'use strict';

const mongoose = require('mongoose');
const _ = require('lodash');

const SearchAlgorithmPreset = new mongoose.Schema({
  track_norepeat: { type: Number, required: true, default: 180 },
  artist_norepeat: { type: Number, required: true, default: 120 }
}, {
  timestamps: true
});

SearchAlgorithmPreset.methods.toJson = function toJson() {
  return _.pick(this.toObject(), ['artist_norepeat', 'track_norepeat']);
};

SearchAlgorithmPreset.statics.getActual = function() {
  return this.find()
    .sort('-_id')
    .limit(1)
    .exec()
    .then((recs) => {
      const res = recs[0];
      if (!res) throw new Error('SearchAlgorithmPreset#getActual not found');
      return res;
    });
};

module.exports = mongoose.model('SearchAlgorithmPreset', SearchAlgorithmPreset);
