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

(async () => {
  const existingSubscriptsions = [];
  let offset;
  const loadRecursively = async () =>
    new Promise((resolve, reject) => {
      chargebee.customer.list({
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

  try {
    await Promise.mapSeries(_.map(existingSubscriptsions, 'customer.id'), (id) =>
      new Promise((resolve, reject) => {
        console.log('removing', id);
        chargebee.customer.delete(id).request(
          (error, result) => {
            if (error) {
              if (error.api_error_code === 'resource_not_found') {
                console.log('resource_not_found')
                resolve();
                return;
              }
              reject(error);
              return;
            }

            resolve(result);
          });
      })
    );

    await models.User.updateMany({}, {
      $unset: {
        chargebee_id: 1,
        chargebee_subscription_ids: 1
      }
    }).exec();
  } catch (e) {
    console.log('error', e);
  }


  models.disconnect();
})();
