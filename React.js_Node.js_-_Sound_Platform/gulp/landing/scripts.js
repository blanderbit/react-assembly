'use strict';

module.exports = require('../scripts')(
  './landing/js/index.js',
  require('./dictLibs'),
  'main.js',
  './generated/landing/js'
);
