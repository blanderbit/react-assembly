'use strict';

const _ = require('lodash');
const chargebee = require('chargebee');
const moment = require('moment');
const models = require('../models');

const logger = require('../logger').main;

const mapUserCountryToCode = (country) => {
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

const init = _.once(() => {
  chargebee.configure({
    site: process.env.CHARGEBEE_SITE,
    api_key: process.env.CHARGEBEE_KEY
  });
});

const getNewChargebeeId = async () => {
  try {
    const id = await models.User.getNextChargebeeId();
    if (!id) {
      logger.error('got unplausable chargebee id', id);
      return null;
    }
    return id;
  } catch (e) {
    logger.error('failed to get a new chargebee id', e);
    return null;
  }
};

exports.importSubscription = async (user, subscribeEvent) => {
  init();

  let customerId = {};

  if (!user.chargebee_id) {
    const newId = await getNewChargebeeId();
    if (newId) {
      customerId = { id: newId };
    }
  }

  const subscriptionStart = subscribeEvent.date;
  const subscriptionEnd = moment(subscriptionStart).add(1, 'year');
  const subscrTs = Math.ceil(subscriptionStart.getTime() / 1000);

  const payload = {
    auto_collection: 'off',
    plan_id: 'basic-yearly',
    plan_free_quantity: 0,
    status: 'active',
    currency_code: 'EUR',
    preferred_currency_code: 'EUR',
    activated_at: subscrTs,
    updated_at: subscrTs,

    next_billing_at: moment(subscriptionEnd).unix(),

    customer: {
      ...customerId,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: subscribeEvent.phone
    },
    billing_address: {
      first_name: user.first_name,
      last_name: user.last_name,
      line1: subscribeEvent.street_house,
      city: subscribeEvent.zip_city,
      country: mapUserCountryToCode(subscribeEvent.country)
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
  };

  let importResult;
  try {
    importResult = await new Promise((resolve, reject) => {
      (
        user.chargebee_id ?
          chargebee.subscription.create_for_customer(user.chargebee_id, payload) :
          chargebee.subscription.create(payload)
      )
      .request((error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  } catch (e) {
    logger.error(`failed to import subscription for ${user.email}:`, e);
    return Promise.reject(e);
  }

  const { customer } = importResult;
  user.chargebee_id = user.chargebee_id || customer.id;
  await user.save();

  return null;
};

exports.getSubscriptions = async (user) => {
  init();

  const { list } = await new Promise((resolve, reject) => {
    chargebee.subscription
      .list({
        'customer_id[is]': user.chargebee_id
      })
      .request((error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
  });

  return _.map(list, 'subscription');
};
