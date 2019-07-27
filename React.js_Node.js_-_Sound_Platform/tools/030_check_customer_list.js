
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const _ = require('lodash');
const moment = require('moment');
const chargebee = require('chargebee');

const p = path.join(__dirname, '../', '.env');
if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

chargebee.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_KEY
});

const models = require('../server/models');

models.connect(process.env.MONGOLAB_URI);

const customers = fs.readFileSync('./customers.csv', 'utf8')
  .split('\n')
  .filter((row) => row)
  .map((row) => row.split(',')[0]);

(async () => {
  const usersWithNoChargebee = await models.User.find({
    chargebee_id: { $exists: false },
    email: { $in: customers }
  }).lean().exec();

  console.log(usersWithNoChargebee.map((u) => u.email));
  models.disconnect();
})();
