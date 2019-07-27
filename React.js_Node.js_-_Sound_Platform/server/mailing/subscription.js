const crypto = require('crypto');
const Mailchimp = require('mailchimp-api-v3');
const moment = require('moment');

const mailchimpConfig = {
  landingPageListId: process.env.MAILCHIMP_LANDING_PAGE_LIST_ID,
  registeredUsersListId: process.env.MAILCHIMP_REGISTERED_USERS_LIST_ID,
  subscribedUsersListId: process.env.MAILCHIMP_SUBSCRIBED_USERS_LIST_ID,
  apiKey: process.env.MAILCHIMP_API_KEY
};

if (!mailchimpConfig.apiKey) {
  throw new Error('Missing MAILCHIMP_API_KEY');
}

const getSubscriberHash = (email) => (
  crypto.createHash('md5').update(email.toLowerCase()).digest('hex')
);

function subscribe(mailchimp, listId, bodyParams, email) {
  const params = Object.assign({
    status: 'subscribed'
  }, bodyParams);

  return mailchimp.request({
    method: 'put',
    path: `/lists/${listId}/members/${getSubscriberHash(email)}`,
    path_params: {
      list_id: listId
    },
    body: params
  });
}

function removeFromList(mailchimp, listId, email) {
  return mailchimp.request({
    method: 'delete',
    path: `/lists/${listId}/members/${getSubscriberHash(email)}`
  });
}

const mailchimp = new Mailchimp(mailchimpConfig.apiKey);

module.exports = {
  subscribeToLandingPageList: (email) => (
    subscribe(
      mailchimp,
      mailchimpConfig.landingPageListId,
      { email_address: email },
      email
    )
  ),
  subscribeToRegisteredUsersList: (user, ip) => (
    subscribe(
      mailchimp,
      mailchimpConfig.registeredUsersListId,
      {
        email_address: user.email,
        merge_fields: {
          MMERGE3: user.company_name,
          FNAME: user.first_name,
          LNAME: user.last_name
        },
        ip_signup: ip,
        interests: {
          '41027164aa': user.type === 'MrssportyUser',
          '5a90ea8773': user.type === 'FitboxUser'
        }
      },
      user.email
    )
  ),
  removeFromRegisteredUsersList: (user) => removeFromList(
    mailchimp,
    mailchimpConfig.registeredUsersListId,
    user.email
  ),
  subscribeToSubscribedUsersList: (user, subscribeEvent) => (
    subscribe(
      mailchimp,
      mailchimpConfig.subscribedUsersListId, {
        email_address: user.email,
        merge_fields: {
          FNAME: user.first_name,
          LNAME: user.last_name,
          PHONE: subscribeEvent.phone,
          COUNTRY: subscribeEvent.country,
          COMPANY: subscribeEvent.company,
          STREET: subscribeEvent.street_house,
          ZIP_CITY: subscribeEvent.zip_city,
          S_DATE: moment(subscribeEvent.date).format('MM/DD/YYYY')
        }
      },
      user.email
    )
  )
};
