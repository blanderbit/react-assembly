'use strict';

module.exports = require('../scripts')(
  ['./front/js/app.js', './generated/play/js/templates.js'],
  require('./libs'),
  'play.js',
  './generated/play/js'
);
