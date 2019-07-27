'use strict';

const SearchAlgorithmPreset = require('../models').SearchAlgorithmPreset;

module.exports = function loadSearchAlgorithmPreset() {
  return SearchAlgorithmPreset.getActual();
};
