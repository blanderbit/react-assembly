/**
 * https://bitbucket.org/jseberg/soundsuitnow2/issues/241/chargebee-import-from-db-customers-who
 *
 */

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

const mapCountryToCode = (country) => {
  const known = {
    Germany: 'DE',
    Deutschland: 'DE',
    Austria: 'AU',
    Köln: 'DE',
    Österreich: 'AU',
    DEUTSCHLANd: 'DE',
    DE: 'DE',
    Bonn: 'DE',
    Bayern: 'DE',
    austria: 'AU',
    München: 'DE',
    Schweiz: 'CH'
  };

  return known[country];
};

const customers = fs.readFileSync('./customers.csv', 'utf8')
  .split('\n')
  .filter((row) => row)
  .map((row) => {
    const arr = row.split(',');
    return {
      email: arr[0],
      id: parseInt(arr[1], 10)
    };
  });

let i = 60120;

const getNewCustomerId = () => {
  return i++;
};

(async () => {
  const users = await models.User
    .find({
      'subscribe_events.0': { $exists: true },
      chargebee_id: { $exists: false }
    })
    .sort({ 'subscribe_events.date': 1 })
    .exec();

  console.log(`Found ${users.length} users`);

  // const existingSubscriptsions = await new Promise((resolve, reject) => {
  //   chargebee.subscription.list({
  //     limit: 200
  //   })
  //   .request((error, result) => {
  //     if (error) {
  //       reject(error);
  //       return;
  //     }

  //     resolve((result && result.list) || []);
  //   });
  // });

  const existingSubscriptsions = []

  try {
    await Promise.mapSeries(users, async (user) => {
      const lastSubscription = user.subscribe_events[user.subscribe_events.length - 1];
      console.log(`-----
        ${user.email}...`);
      const existingSubscription = _.find(existingSubscriptsions,
        (subscr) => _.get(subscr, 'customer.email') === user.email);

      if (existingSubscription) {
        console.log('subscription already exists');
        user.chargebee_id = existingSubscription.customer.id;
        return user.save();
      }

      console.log('creating new...');

      const subscrTs = Math.ceil(lastSubscription.date.getTime() / 1000);

      if (moment(lastSubscription.date).add(1, 'year').isBefore()) {
        console.log('Subscription has already ended, skipping');
        return;
      }

      const customerFromList = _.find(customers, { email: user.email });

      const customerId = customerFromList ?
      customerFromList.id :
        getNewCustomerId();

      console.log(`customer ${customerFromList ? 'is in list' : 'is NOT in the list'} using `, customerId);

      const newSubscription = chargebee.subscription.import_subscription({
        auto_collection: 'off',
        plan_id: 'basic-yearly',
        plan_free_quantity: 0,
        status: 'active',
        currency_code: 'EUR',
        preferred_currency_code: 'EUR',
        current_term_start: subscrTs,
        created_at: subscrTs,
        started_at: subscrTs,
        activated_at: subscrTs,
        updated_at: subscrTs,

        current_term_end: moment(lastSubscription.date).add(1, 'year').unix(),
        next_billing_at: moment(lastSubscription.date).add(1, 'year').unix(),

        customer: {
          id: customerId,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: lastSubscription.phone
        },
        billing_address: {
          first_name: user.first_name,
          last_name: user.last_name,
          line1: lastSubscription.street_house,
          city: lastSubscription.zip_city,
          country: mapCountryToCode(lastSubscription.country)
        }
      });
      const { subscription, customer } = await new Promise((resolve, reject) => {
        newSubscription.request((error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(result);
        });
      });
      user.chargebee_id = customer.id;
      await user.save();
    });
  } catch (e) {
    console.error(e);
  }

  models.disconnect();
})();
