'use strict';

module.exports = require('../scripts')(
  './admin/js/app.js',
  require('./libs'),
  'admin.js',
  './generated/admin/js'
);
