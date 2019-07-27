
// combines spa and wellness salon business types
var path = require('path');
var fs = require('fs');
var p = path.join(__dirname, '../', '.env');

if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

var models = require('../server/models');
var mongoose = require('mongoose');
models.connect(process.env.MONGOLAB_URI)

models.User.update({business_type: {$in: ['spa', 'wellness_salon']}},
  {business_type: 'wellness_spa'},
  {multi: true},
  function(err, numModified) {
    if (err) console.error(err);
    console.log('Modified %d documents', numModified);
    console.log('All done, exiting');
    mongoose.disconnect();
  }
);
