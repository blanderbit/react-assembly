/**
 * https://bitbucket.org/jseberg/soundsuitnow2/issues/187/mailchimp-automatically-populate-via-api
 *
 */

const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');

const p = path.join(__dirname, '../', '.env');
if (fs.existsSync(p)) {
  require('node-env-file')(p);
}

const {
  removeFromRegisteredUsersList,
  subscribeToSubscribedUsersList
} = require('../server/mailing/subscription');
const models = require('../server/models');

models.connect(process.env.MONGOLAB_URI);

(async () => {
  const users = await models.User
    .find({ 'subscribe_events.0': { $exists: true } })
    .sort({ _id: -1 })
    .exec();

  console.log(`Found ${users.length} users`);

  await Promise.mapSeries(users, async (user) => {
    console.log(`Saving ${user.email} to the list...`);
    await subscribeToSubscribedUsersList(
      user,
      user.subscribe_events[user.subscribe_events.length - 1]
    );
    try {
      await removeFromRegisteredUsersList(user);
    } catch (err) {
      console.log(`Failed to remove ${user.email} from registered list`);
    }
    return;
  });

  models.disconnect();
})();
