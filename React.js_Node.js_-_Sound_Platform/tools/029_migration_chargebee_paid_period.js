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

const getNewCustomerId = () => i++;

(async () => {
  const users = await models.User
    .find({
      $or: [
        { 'paid_periods.0': { $exists: true } },
        { 'subscribe_events.0': { $exists: true } }
      ],
      chargebee_id: { $exists: false }
    })
    .sort({ 'subscribe_events.date': 1 })
    .exec();

  console.log(`Found ${users.length} users`);

  const existingSubscriptsions = [];
  let offset;
  const loadRecursively = async () =>
    new Promise((resolve, reject) => {
      chargebee.subscription.list({
        limit: 100,
        ...(offset ?
          { offset } :
          {}
        )
      })
      .request((error, result) => {
        if (error) {
          console.log(error);
          reject(error);
          return null;
        }

        offset = result.next_offset;

        existingSubscriptsions.push(...((result && result.list) || []));

        if (result.list.length === 100) {
          return resolve(loadRecursively());
        }
        resolve();
        return null;
      });
    });

  try {
    await loadRecursively();
  } catch (e) {
    throw e;
  }

  console.log(`loaded ${existingSubscriptsions.length} existing`);

  try {
    await Promise.mapSeries(users, async (user) => {
      console.log(`\n-----${user.email}...`);
      console.log('Mrssporty:', user instanceof models.MrssportyUser);

      const existingSubscription = _.find(existingSubscriptsions,
        (subscr) => _.get(subscr, 'customer.email') === user.email);

      if (existingSubscription) {
        console.log('subscription already exists');
        user.chargebee_id = existingSubscription.customer.id;
        return user.save();
      }

      console.log('creating new...');

      const lastPaidPeriod = user.activePaidPeriod || _.last(user.paid_periods);
      const lastSubscription = user.lastSubscription;

      let subscriptionStart;
      let usePaidPeriod = false;
      if (lastPaidPeriod) {
        subscriptionStart = lastSubscription && lastSubscription.date > lastPaidPeriod.start ?
          lastSubscription.date : lastPaidPeriod.start;
        usePaidPeriod = !(lastSubscription && lastSubscription.date > lastPaidPeriod.start);
      } else {
        subscriptionStart = lastSubscription.date;
      }

      const subscrTs = Math.ceil(
        subscriptionStart.getTime() / 1000
      );

      const subscriptionEnd = usePaidPeriod ?
        lastPaidPeriod.end :
        moment(lastSubscription.date).add(1, 'year');

      if (moment(subscriptionEnd).isBefore()) {
        console.log('Subscription has already ended, skipping');
        return null;
      }

      const customerFromList = _.find(customers, { email: user.email });

      const customerId = customerFromList ?
        customerFromList.id :
        await getNewCustomerId();

      console.log(`customer ${customerFromList ? 'is in list' : 'is NOT in the list'} using `,
        customerId);

      const newSubscription = chargebee.subscription.import_subscription({
        auto_collection: 'off',
        plan_id: 'basic-yearly',
        plan_free_quantity: 0,
        currency_code: 'EUR',
        preferred_currency_code: 'EUR',
        created_at: subscrTs,
        activated_at: subscrTs,
        updated_at: subscrTs,

        next_billing_at: moment(subscriptionEnd).unix(),

        customer: {
          id: customerId,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          ...(lastSubscription ? {
            phone: lastSubscription.phone
          } : {})
        },
        billing_address: {
          first_name: user.first_name,
          last_name: user.last_name,
          ...(lastSubscription ? {
            line1: lastSubscription.street_house,
            city: lastSubscription.zip_city,
            country: mapCountryToCode(lastSubscription.country)
          } : {})
        },
        ...(user instanceof models.MrssportyUser ?
          { coupon_ids: ['15%DISCOUNTFORFRANCHISEPARTNER'] } :
          {}
        ),
        ...(
          moment(subscriptionStart).isAfter() ?
          {
            start_date: subscrTs,
            status: 'future'
          } :
          {
            status: 'active',
            started_at: subscrTs,
            current_term_start: subscrTs,
            current_term_end: moment(subscriptionEnd).unix()
          }
        )
      });
      const { customer } = await new Promise((resolve, reject) => {
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
