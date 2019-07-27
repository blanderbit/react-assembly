'use strict';

const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, '../', '.env');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const models = require('../server/models');
models.connect(process.env.MONGOLAB_URI);

(new models.SearchAlgorithmPreset).save()
  .then(() => {
    models.disconnect();
  });
