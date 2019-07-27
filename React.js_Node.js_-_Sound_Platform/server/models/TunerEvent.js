'use strict';

const mongoose = require('mongoose');

const TunerEvent = new mongoose.Schema({
  query: [mongoose.Schema.Types.Mixed],
  attempt: Number,
  count: Number,
  requiredCount: Number,
  fulfilled: Boolean
}, {
  timestamps: true
});

module.exports = mongoose.model('TunerEvent', TunerEvent);
