'use strict';

const mongoose = require('mongoose');

const Preset = new mongoose.Schema({
  business_type: { type: String, unique: true },
  bpmCorridor: [{
    base: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true }
  }]
});

module.exports = mongoose.model('Preset', Preset);
