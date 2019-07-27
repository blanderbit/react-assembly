'use strict';

module.exports = require('../scripts')(
  './landing/js/libs.js',
  [],
  'vendor.js',
  './generated/landing/js',
  require('./dictLibs')
);
